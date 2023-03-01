/*
    process steps. checks steps are working

    talks to blockchain
        listen for USDT transfers
            filter for high value USD
        get tx
            verify sender/initiator of the swap
        get balance for initiator
            get token balance in usd
            TBD: get coin balance in usd

    database insert logic
        look up wallet from address
        found
            add snapshot. token. tokencontract.
            calc pl.
            add swap
        not found
            new address. add snapshot. calculate pl.

*/

// external imports
import { config } from 'dotenv';

// import ethers from 'ethers';
const { ethers } = require("ethers");

// app imports
import { prisma } from './services/prisma';
import logger from './components/logger'
import addresses from './constants';
import getBalance from './components/getBalance';
import getTransaction from './components/getTransaction'
import delay from './utils/delay'
import calculateProfitLoss from './components/calculateProfitLoss'
import { addWalletSnapshot } from './components/addWalletSnapshot';
import type { transactionData } from './types/transactionData'
import { createSwap } from './components/createSwap';
import { shortenTransactionHash } from './utils/shortenAddress';
import { postgresClient } from './services/pglisten';
import { Notification } from 'pg';
import z from 'zod'
import type { BotIdSchema, CreateBotSchema, CreatePositionSchema } from './schema/position.schema'

// talks to ankr using AnkrJS
// takes address. gives balances for assets
// NOT USED
// DEPRECATED BY ANKR, looks like succeeded by this func ankr_getAccountBalance
// import getAnkrBalance from './components/getBalanceAnkr'

// NOT USED
// import getTransactionAlchemy from './components/getTransactionAlchemy'


// json files imports
const usdtABI = require("./abis/usdt.json");
const wmaticusdtABI = require("./abis/wmaticusdt.json");
const tokens250 = require('./tokens1.json');
const tokens500 = require('./tokens2.json');

declare var process: {
  exit(arg0: number): unknown;
  env: {
    ANKR_URL_POLYGON_MAINNET_WEBSOCKET: string;
    NODE_ENV: string;
    MIN_TRANSFER_VALUE_USD: number;
  }
}
// initial config
config({ path: '.env' })

// const provider = new ethers.providers.WebSocketProvider(process.env.ANKR_URL_POLYGON_MAINNET_WEBSOCKET);

// handles web socket reconnects : https://github.com/ethers-io/ethers.js/issues/1053
const EXPECTED_PONG_BACK: number = 15000
const KEEP_ALIVE_CHECK_INTERVAL: number = 7500

export const startConnection = async () => {
  let provider = new ethers.providers.WebSocketProvider(process.env.ANKR_URL_POLYGON_MAINNET_WEBSOCKET)

  let pingTimeout: string | number | NodeJS.Timeout | undefined
  let keepAliveInterval: string | number | NodeJS.Timeout | undefined

  provider._websocket.on('open', () => {
    keepAliveInterval = setInterval(() => {
      logger.debug('Checking if the connection is alive, sending a ping')

      provider._websocket.ping()

      // Use `WebSocket#terminate()`, which immediately destroys the connection,
      // instead of `WebSocket#close()`, which waits for the close timer.
      // Delay should be equal to the interval at which your server
      // sends out pings plus a conservative assumption of the latency.
      pingTimeout = setTimeout(() => {
        provider._websocket.terminate()
      }, EXPECTED_PONG_BACK)
    }, KEEP_ALIVE_CHECK_INTERVAL)

    // TODO: handle contract listeners setup + indexing
  })

  provider._websocket.on('close', () => {
    logger.error('The websocket connection was closed')
    clearInterval(keepAliveInterval)
    clearTimeout(pingTimeout)
    startConnection()
  })

  provider._websocket.on('pong', () => {
    logger.debug('Received pong, so connection is alive, clearing the timeout')
    clearInterval(pingTimeout)
  })

  return provider;
}




export const api_endpoint = `https://rpc.ankr.com/multichain`;
let tokens = tokens250.concat(tokens500);
const manualTokenList = [{ symbol: "wmatic" }, { symbol: "weth" },]
tokens = tokens.concat(manualTokenList);
const minimumSwapValueUsd = 1; // require minimum swap value, 1000 USD
const minimumTransferValueUsd = process.env.MIN_TRANSFER_VALUE_USD; // require minimum transfer value, 1000 USD
// const minimumTransferValueUsd = 500; // require minimum transfer value, 1000 USD
const delayBeforeTxRequestMs = 5000;
let cachedTransactionRequests: string[] = new Array();


logger.info(`running app in mode ${process.env.NODE_ENV}`)
logger.info(`settings loaded`)
logger.info(`${JSON.stringify({
  minimumTransferValueUsd: minimumTransferValueUsd,
})}`)


async function main() {

  await postgresClient.connect();
  logger.info(`connected to postgres`);

  // connects to web socket server Ankr
  const provider = await startConnection()


  // Listen for notifications on the 'core_db_event' channel
  postgresClient.on('notification', async (msg: Notification) => {
    if (msg.channel === 'core_db_event') {

      try {
        let parsedEvent: Notification & { record: unknown, identity: string } = JSON.parse(msg.payload as unknown as string);
        console.log(parsedEvent)


        // parsed event is from Swap table
        if (parsedEvent.identity == 'Swap') {
          // insert position
          /*
              insert type 1 - from a swap
 
                  take data from swap object
                      provided props
                          swap id
                          amountsin
                          amountsminout
                          senttokencontract
                          receivedtokencontract
                          createdAt
                          contractId
                          transactionHash
                          walletId
                  bot id
                  create position
          */
          const positionFromSwap: CreatePositionSchema & {
            sentTokenContractAddress: string
            receivedTokenContractAddress: string
          } = parsedEvent.record as CreatePositionSchema & {
            sentTokenContractAddress: string
            receivedTokenContractAddress: string
          }

          await prisma.$transaction(async (createPosition) => {

            const botsFollowingWalletInThisSwap = await createPosition.bot.findMany({
              // where: {
              //     wallets: {
              //         some: {
              //             walletId: positionFromSwap.walletId
              //         }
              //     }
              // },
              select: {
                id: true,
                positionSizePercentage: true,
                takeprofitPercentage: true,
                stoplossPercentage: true,
                name: true
              }
            });

            await Promise.all(botsFollowingWalletInThisSwap.map(async (bot) => {

              return await createPosition.position.create({
                data: {
                  id: parseFloat(`${positionFromSwap.id}${bot.id}`),
                  amountIn: positionFromSwap.amountIn,
                  amountOutMin: positionFromSwap.amountOutMin,
                  sentTokenContract: {
                    connect: {
                      contractAddress: positionFromSwap.sentTokenContractAddress.toLowerCase()
                    }
                  },
                  receivedTokenContract: {
                    connect: {
                      contractAddress: positionFromSwap.receivedTokenContractAddress.toLowerCase()
                    }
                  },
                  positionSizePercentage: bot.positionSizePercentage,
                  takeprofitPercentage: bot.takeprofitPercentage,
                  stoplossPercentage: bot.stoplossPercentage,
                  interactedContract: {
                    connect: {
                      contractAddress: positionFromSwap.contractAddress.toLowerCase()
                    }
                  },
                  bot: {
                    connect: {
                      id: bot.id
                    }
                  },
                  actionType: "long" // for now all positions are created as long positions only
                }
              })

            }))

          })
        }
        // parsed event is from Position table
        else if (parsedEvent.identity == 'Position') {
          /*
          insert type 2 - from an existing position
          take from position
          */
          const positionFromPosition: CreatePositionSchema = parsedEvent.record as CreatePositionSchema

          await prisma.$transaction(async (createPosition) => {

            // bots following bot id in this position
            const botsFollowingBotIdInThisPosition = await prisma.position.findMany({
              where: {
                bot: {
                  botsFollowing: {
                    some: {
                      id: positionFromPosition.botId
                    }
                  }
                }
              },
              select: {
                bot: {
                  select: {
                    name: true,
                    id: true,
                    positionSizePercentage: true,
                    takeprofitPercentage: true,
                    stoplossPercentage: true
                  }
                }
              }
            })

            // create positions
            botsFollowingBotIdInThisPosition.forEach(async (bot) => {

              if (bot) {

                // pos size % can be null so here it is defined
                const positionSizePercentage = bot.bot?.positionSizePercentage as number;

                await createPosition.position.create({
                  data: {
                    id: parseFloat(`${bot.bot?.id}${positionFromPosition.botId}`),
                    actionType: "long",
                    amountIn: positionFromPosition.amountIn,
                    amountOutMin: positionFromPosition.amountOutMin,
                    sentTokenContract: {
                      connect: {
                        contractAddress: positionFromPosition.sentTokenContract.contractAddress
                      }
                    },
                    receivedTokenContract: {
                      connect: {
                        contractAddress: positionFromPosition.receivedTokenContract.contractAddress
                      }
                    },
                    positionSizePercentage: positionSizePercentage,
                    takeprofitPercentage: bot.bot?.takeprofitPercentage,
                    stoplossPercentage: bot.bot?.stoplossPercentage,
                    interactedContract: {
                      connect: {
                        contractAddress: positionFromPosition.TokenContract.contractAddress
                      }
                    },
                    bot: {
                      connect: {
                        id: bot.bot?.id
                      }
                    },
                  }
                })
              }
            })
          })
        }
      }
      catch (error) {
        logger.error(`error parsing event ${error}`)
      }
    }
  });


  // Start listening for notifications
  await postgresClient.query('LISTEN core_db_event');
  logger.info(`listening for db events on channel core_db_event`);

  logger.info(`Current Block No ${await provider.getBlockNumber()}`);

  // const contractPairContractWMATICUSDT = new ethers.Contract(addresses.PairContractWMATICUSDT, wmaticusdtABI, provider);
  const tokenContractUSDT = new ethers.Contract(addresses.USDT, usdtABI, provider);

  tokenContractUSDT.on("Transfer", async (from: string, to: string, value: number, event: any) => {
    let transfer = {
      from: from,
      to: to,
      value: ethers.utils.formatUnits(value, 6) as unknown as number,
      data: event,
    };

    // console.log(`transfer`),
    //     console.table({
    //         from: transfer.from,
    //         to: transfer.to,
    //         value: transfer.value.toString()
    //     })
    // console.log(Object.keys(transfer.data).length)

    // require minimum transfer value OR match in existing wallets snapshots

    // transfer logging prefix
    const transferLoggingPrefix = `[TX][${shortenTransactionHash(transfer.data.transactionHash)}]`;

    if (transfer.value <= minimumTransferValueUsd) return;


    // retrieve details for tx
    await delay(delayBeforeTxRequestMs);


    // cache control
    // logger.debug(`D debug hash ${hash}`)
    // logger.debug(`D debug cachedTransactionRequests ${cachedTransactionRequests}`)

    // add request to queue, skip if already run
    if (cachedTransactionRequests.find(cachedRecord => cachedRecord == transfer.data.transactionHash)) {
      // todo:convert to logger.log debug
      // logger.warn(`I hash ${hash} already run. skipping`)
      return;
    }
    else {
      cachedTransactionRequests.push(transfer.data.transactionHash);
    }

    try {
      // removes oldest request
      if (cachedTransactionRequests.length > 9) cachedTransactionRequests.shift()
    }
    catch (error) {
      logger.error(`E error shifting request cache - hashes ${error}`)
    }

    logger.info(`${transferLoggingPrefix}💲 New Transfer ${transfer.value} USDT. Requesting TX..`);


    let transactionHashDetails = await getTransaction(transfer.data.transactionHash);

    // if (transactionHashDetails.length > 1) {
    //     logger.log('debug', `W Transfer() multiple tx received`);
    //     return;
    // }

    // // there is only one transaction
    // transactionHashDetails = transactionHashDetails[0]

    // logger.info(`${transferLoggingPrefix} TX Details Received - Block No ${transactionHashDetails?.blockNumber}`)

    if (!transactionHashDetails) {
      logger.error(`${transferLoggingPrefix} No TX Details Received.`);
      return;
    }

    // tx details
    // transaction.method gives path.path has token in token out
    // - transaction.method gives amountOut. amountOut matches amount on swap event 
    if (!transactionHashDetails.method) {
      // logger.error(`${transferLoggingPrefix} No Method Property on TX found.`)
      // logger.error(`${transferLoggingPrefix} ${JSON.stringify(transactionHashDetails)}`)
      return;
    }

    // require tx method name swapExactTokensForTokensSupportingFeeOnTransferTokens
    // logger.log('debug',`we only care about swaps. filtering out everything but swaps here.`);
    if (!transactionHashDetails.method.name.match("swap")) {
      // logger.log('debug', `W Transfer() tx method does not match expected method swap ${transactionHashDetails.method.name}`);
      return;
    }

    // destruct involved contracts addresses
    try {
      transactionHashDetails.method.inputs[2].valueDecoded.replace("[", "").replace("]", "").split(" ")
    } catch (error) {
      logger.error(`fail to destruct involved contracts addresses`);
      return;
    }
    let involvedContractsAddresses = transactionHashDetails.method.inputs[2].valueDecoded.replace("[", "").replace("]", "").split(" ")
    let sentTokenContractAddress = involvedContractsAddresses[0]
    let receivedTokenContractAddress = involvedContractsAddresses[involvedContractsAddresses.length - 1]

    let decimalsSentToken;
    let decimalsReceivedToken;

    // assign correct decimals, token contracts to amounts
    try {
      const tokenContractSentToken = new ethers.Contract(sentTokenContractAddress, ['function decimals() external view returns (uint8)'], provider);
      decimalsSentToken = await tokenContractSentToken.decimals(); // 18 or 6 or whatever

      const tokenContractReceivedToken = new ethers.Contract(receivedTokenContractAddress, ['function decimals() external view returns (uint8)'], provider);
      decimalsReceivedToken = await tokenContractReceivedToken.decimals(); // 18 or 6 or whatever
    } catch (error) {
      logger.error(`error requesting token decimals: ${error}`);
    }

    if (!decimalsSentToken || !decimalsReceivedToken) {
      return;
    }

    let transaction: transactionData = {
      from: transactionHashDetails.from,
      amountIn: parseFloat(ethers.utils.formatUnits(transactionHashDetails.method.inputs[0].valueDecoded, decimalsSentToken)),
      amountOutMin: parseFloat(ethers.utils.formatUnits(transactionHashDetails.method.inputs[1].valueDecoded, decimalsReceivedToken)),
      sentTokenContractAddress: sentTokenContractAddress,
      receivedTokenContractAddress: receivedTokenContractAddress
    }

    // request account balance, all tokens
    logger.info(`[Wallet] Requesting Balance for ${transaction.from}`);

    let SenderAccountBalance;

    try {
      SenderAccountBalance = await getBalance(transaction.from);
      logger.log('debug', SenderAccountBalance);
    }
    catch {
      logger.error(`[Wallet] Error Defining SenderAccountBalance`);
    }

    // require balances
    if (!SenderAccountBalance) {
      logger.error(`[Wallet] No SenderAccountBalance. Returning.`)
      return;
    }


    try {
      // looking in wallet table if walletAddress processed here already exists
      // if wallet address exists do everything as if it would be new but also add a record to the swaps table
      const lookupWalletAddress = await prisma.wallet.findFirst({
        where: {
          walletAddress: transactionHashDetails.from
        }
      })
      if (!lookupWalletAddress) {
        // this wallet address is new
        addWalletSnapshot(SenderAccountBalance, transactionHashDetails, transfer);
        // calculate profit loss, update last wallet snapshot for each wallet
        calculateProfitLoss();
      }
      else {
        // wallet address already exists
        // add usual data, snapshot, token, tokencontract
        addWalletSnapshot(SenderAccountBalance, transactionHashDetails, transfer);
        calculateProfitLoss();

        // add swap, connect wallet and connect contract
        logger.info(`[Swap]💾💵 Adding New Swap to Database`);
        createSwap(transaction, transactionHashDetails, transfer, SenderAccountBalance)
      }
    } catch (error) {
      logger.error(`[Database] error on insert: ${error}`);
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    logger.error(`Error on main function ${error}`);
    await prisma.$disconnect()
    logger.error(`Error: Prisma disconnect called`)
    process.exit(1)
  })