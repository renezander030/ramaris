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
import { addresses } from './constants';
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
import { forEach } from 'lodash';
import { error } from 'console';
const fetch = require('node-fetch');
const UNISWAP = require("@uniswap/sdk")
const { getAddress } = require("ethers/lib/utils");
const { ChainId, SupportedChainId, nearestUsableTick, TickMath, FullMath, Pool, Position, Trade, FeeAmount, encodeRouteToPath, Route } = require('@uniswap/v3-sdk')
const { abi: IUniswapV3PoolABI } = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json")
const { abi: IUniswapV3FactoryABI } = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json")
const { abi: INonfungiblePositionManagerABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/INonfungiblePositionManager.sol/INonfungiblePositionManager.json')
const Quoter = require('@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json')
const QuoterAbi = require('./abis/QuoterAbi.json')
const RouterAbi = require('./abis/QuickSwapRouter.json')
const { TokenAmount, WETH, Pair } = require("@uniswap/sdk");
const { Currency, Token, CurrencyAmount, Percent, TradeType, Fetcher } = require('@uniswap/sdk-core')
const ERC20ABI = require('./abis/ERC20.json')
import { getOutputQuote, getTokenTransferApproval } from './utils/uniswap/trading'
import { CurrentConfig } from './utils/uniswap/config'


const { NonceManager } = require('@ethersproject/experimental');

const TELEGRAM_BASE_URL = `https://api.telegram.org/bot`;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_HTTP_ENDPOINT = `${TELEGRAM_BASE_URL}${TELEGRAM_BOT_TOKEN}`

import { FACTORY_ADDRESS, INIT_CODE_HASH, JSBI } from '@uniswap/sdk'
import { pack, keccak256 } from '@ethersproject/solidity'
import { getCreate2Address } from '@ethersproject/address'
import { parseEther } from 'ethers/lib/utils';
import { fromReadableAmount } from './utils/uniswap/utils';
import { SwapOptions, SwapRouter } from '@uniswap/v3-sdk';
import { ERC20_ABI, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, QUOTER_CONTRACT_ADDRESS, SWAP_ROUTER_ADDRESS, TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER } from './utils/uniswap/constants';

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
    DATABASE_URL: any;
    ANKR_URL_POLYGON_MAINNET_WEBSOCKET: string;
    ANKR_URL_POLYGON_MAINNET: string;
    NODE_ENV: string;
    MIN_TRANSFER_VALUE_USD: number;
    POLYGON_MAINNET_TOKEN_CONTRACT_TETHER: string;
    TELEGRAM_BOT_TOKEN: string;
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
    logger.debug(`connection ethers open`)
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



// after positions have been inserted trigger opening positions
async function openPositions(positionToCreate: any, provider: any) {

  // filters out all positions but where token contract is tether
  // positions where USDT is not involved are not included yet
  if (positionToCreate?.sentTokenContract?.contractAddress != process.env.POLYGON_MAINNET_TOKEN_CONTRACT_TETHER) positionToCreate = null;

  // creates transactions for the users
  // ***
  // gets all relations showing users who do follow the bot that generated this position
  const starredBots = positionToCreate?.bot?.StarBot.map((starBot: any) => { return starBot });

  starredBots?.every(async (starBot: { user: any; copyIsEnabled: any; positionSizePercentage: number; userId: any; botId: any; }) => {

    const user = starBot.user;

    logger.info(`checking user is copying this bot - user ${user.email}`)

    // user where copy for this bot is disabled but follow: just notify
    if (!starBot.copyIsEnabled) {

      logger.info(`user is not copying only follow ${user.email}`)

      // notify user
      const Message = {
        chat_id: positionToCreate?.bot?.StarBot.at(0)?.user.telegram_chatid,
        text: `Bot ${positionToCreate?.bot?.name}: New Position Opened ${positionToCreate?.amountOutMin} USDT for ${positionToCreate?.amountIn} ${positionToCreate?.receivedTokenContract.symbol}`
      }
      const response = await fetch(`${TELEGRAM_HTTP_ENDPOINT}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Message)
      });
      const data = await response.json();

      return false
    };

    const tradingaccount = user.TradingAccount.find((tradingaccount: any) => { return tradingaccount });

    // skip user without trading accounts
    if (!tradingaccount) return false;

    logger.info(`user is copying, has trading account ${user.email}`)

    // check limits on trading account might have been hit already
    // get all trades in the last 24 hours
    const tradesOnTradingAccount = await prisma.tradingAccount.findUnique({
      where: {
        id: tradingaccount?.id
      },
      select: {
        trades: {
          where: {
            createdAt: {
              gte: new Date(new Date().getTime() - (24 * 60 * 60 * 1000))
            }
          },
          select: {
            Position: {
              select: {
                receivedTokenContract: {
                  select: {
                    contractAddress: true
                  }
                },
                botId: true
              }
            }
          }
        }
      }
    })

    logger.info(`processing rule book..`)

    // skip user where limit for max trades has been hit
    // const amountOfTradesPerBotToday = tradesOnTradingAccount?.trades.filter(trade => { return trade.Position?.botId == positionToCreate?.bot?.id }).length
    // if (amountOfTradesPerBotToday && tradingaccount.maxPositionsPerBotPerDay && amountOfTradesPerBotToday <= tradingaccount?.maxPositionsPerBotPerDay) return false;

    // const amountOfTradesPerTokenToday = tradesOnTradingAccount?.trades.filter(trade => { return trade.Position?.receivedTokenContract.contractAddress == positionToCreate?.receivedTokenContract.contractAddress }).length
    // if (amountOfTradesPerTokenToday && tradingaccount.maxPositionsPerTokenPerDay && amountOfTradesPerTokenToday <= tradingaccount.maxPositionsPerTokenPerDay) return false;


    // skip user when amounts sent is missing
    if (!positionToCreate?.amountOutMin) return false;

    // calculate position size, default to 0.1 USDT
    const decimalsUsdt = 6;
    const positionSize = ethers.utils.parseUnits('0.1', decimalsUsdt);

    logger.info(`tradingaccount positionSizePercentage ${tradingaccount?.positionSizePercentage}`)

    // take percentage from tradingaccount, calculate with sent amounts
    // if (tradingaccount?.positionSizePercentage) positionSize = (positionToCreate?.amountOutMin / 100) * tradingaccount?.positionSizePercentage;
    // logger.info(`positionSize tradingaccount positionSizePercentage ${positionSize}`)


    // // override pos size if set on bot level
    // if (starBot.positionSizePercentage) positionSize = (positionToCreate.amountOutMin / 100) * starBot.positionSizePercentage;
    // logger.info(`positionSize starBot positionSizePercentage ${positionSize}`)


    const private_key = tradingaccount?.private_key;

    // creates wallet instances from private keys
    const wallet = new ethers.Wallet(private_key, provider);

    logger.info(`connecting to polygon mainnet..`)

    try {

      const router = new ethers.Contract(
        addresses.QuickSwapRouter,
        RouterAbi,
        wallet
      );

      const sentToken = positionToCreate.sentTokenContract.contractAddress
      const receivedToken = positionToCreate.receivedTokenContract.contractAddress
      const gasLimit = 200000
      const gasPrice = provider.getGasPrice()
      const deadline = Date.now() + 1000 * 60 * 10 //10 minutes
      const amounts = await router.getAmountsOut(positionSize, [sentToken, receivedToken]);
      const amountOutMin = amounts[1].sub(amounts[1].div(10));

      logger.debug(`sending transaction..`)
      const transaction = await router.swapExactTokensForTokens(
        positionSize,
        amountOutMin,
        [sentToken, receivedToken],
        wallet.address,
        deadline,
        {
          gasLimit: gasLimit,
          gasPrice: gasPrice
        }
      );
      const receipt = await transaction.wait();

      const hashUrl = `https://polygonscan.com/tx/${receipt.transactionHash}`
      logger.debug(`Transaction Complete: ${hashUrl}`);

      logger.info(`documenting trade in trades table..`)

      await prisma.trades.create({
        data: {
          Position: {
            connect: {
              id: positionToCreate?.id
            }
          },
          TradingAccount: {
            connect: {
              id: tradingaccount?.id
            }
          },
          state: "Completed",
          tradeSizePercentage: parseInt(ethers.utils.formatUnits(positionSize, decimalsUsdt))
        }
      })

      // notifies user
      logger.info(`notifying user..`)
      const Message = {
        chat_id: positionToCreate?.bot?.StarBot.at(0)?.user.telegram_chatid,
        text: `New Trade Opened ${positionToCreate?.amountOutMin} USDT for ${positionToCreate?.amountIn} ${positionToCreate?.receivedTokenContract.symbol} - ${hashUrl}`
      }
      const response = await fetch(`${TELEGRAM_HTTP_ENDPOINT}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Message)
      });
      const data = await response.json();

      process.exit(0)
    }
    catch (error) {

      logger.error(`error sending ethers transaction - position ID ${positionToCreate?.id} - ${error}`);

      logger.info(`documenting failed trade..`)
      // documents failed trade attempt
      await prisma.trades.create({
        data: {
          Position: {
            connect: {
              id: positionToCreate?.id
            }
          },
          TradingAccount: {
            connect: {
              id: tradingaccount?.id
            }
          },
          state: "Failed",
          errorDetail: `${error}`
        }
      })

      // disables copy of affected bot
      logger.info(`disabling copy for this bot - user ${starBot.userId} bot ${starBot.botId}`)
      const disableCopy = await prisma.starBot.update({
        where: {
          userId_botId: {
            botId: starBot.botId,
            userId: starBot.userId
          }
        },
        data: {
          copyIsEnabled: false
        }
      })

      // notifies user
      // tx failed, copy was disabled for bot (disableCopy.botId)
      logger.info(`notifying user about failed trade..`)
      const Message = {
        chat_id: positionToCreate?.bot?.StarBot.at(0)?.user.telegram_chatid,
        text: `Trade Failed ${positionToCreate?.amountOutMin} USDT for ${positionToCreate?.amountIn} ${positionToCreate?.receivedTokenContract.symbol} - Copy for Bot temporarily disabled ${disableCopy.botId} - full error ${error}`
      }
      const response = await fetch(`${TELEGRAM_HTTP_ENDPOINT}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Message)
      });
      const data = await response.json();
    }
  })
}

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
              //   wallets: {
              //     some: {
              //       walletId: positionFromSwap.walletId
              //     }
              //   }
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

              const positionId = parseFloat(`${positionFromSwap.id}${bot.id}`);

              const newPosition = await createPosition.position.create({
                data: {
                  id: positionId,
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
                },
                select: {
                  id: true,
                  receivedTokenContract: {
                    select: {
                      contractAddress: true,
                      symbol: true
                    }
                  },
                  sentTokenContract: {
                    select: {
                      contractAddress: true
                    }
                  },
                  interactedContract: {
                    select: {
                      contractAddress: true
                    }
                  },
                  amountOutMin: true,
                  amountIn: true,
                  bot: {
                    select: {
                      StarBot: {
                        select: {
                          user: {
                            select: {
                              gateio_api_key: true,
                              gateio_api_secret: true,
                              telegram_chatid: true,
                              email: true,
                              TradingAccount: {
                                select: {
                                  private_key: true,
                                  ethereum_address: true,
                                  id: true,
                                  maxPositionsPerBotPerDay: true,
                                  maxPositionsPerTokenPerDay: true,
                                  positionSizePercentage: true
                                }
                              }
                            }
                          },
                          copyIsEnabled: true,
                          positionSizePercentage: true,
                          botId: true,
                          userId: true
                        }
                      },
                      id: true,
                      name: true
                    }
                  }
                }
              })


              return await openPositions(newPosition, provider)
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
            botsFollowingBotIdInThisPosition.forEach(async (position) => {

              if (position) {

                // pos size % can be null so here it is defined
                const positionSizePercentage = position.bot?.positionSizePercentage as number;
                const positionId = parseFloat(`${position.bot?.id}${positionFromPosition.botId}`);

                const newPosition = await createPosition.position.create({
                  data: {
                    id: positionId,
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
                    takeprofitPercentage: position.bot?.takeprofitPercentage,
                    stoplossPercentage: position.bot?.stoplossPercentage,
                    interactedContract: {
                      connect: {
                        contractAddress: positionFromPosition.TokenContract.contractAddress
                      }
                    },
                    bot: {
                      connect: {
                        id: position.bot?.id
                      }
                    },
                  },
                  select: {
                    id: true,
                    receivedTokenContract: {
                      select: {
                        contractAddress: true,
                        symbol: true
                      }
                    },
                    sentTokenContract: {
                      select: {
                        contractAddress: true
                      }
                    },
                    interactedContract: {
                      select: {
                        contractAddress: true
                      }
                    },
                    amountOutMin: true,
                    amountIn: true,
                    bot: {
                      select: {
                        StarBot: {
                          select: {
                            user: {
                              select: {
                                gateio_api_key: true,
                                gateio_api_secret: true,
                                telegram_chatid: true,
                                email: true,
                                TradingAccount: {
                                  select: {
                                    private_key: true,
                                    ethereum_address: true,
                                    id: true,
                                    maxPositionsPerBotPerDay: true,
                                    maxPositionsPerTokenPerDay: true,
                                    positionSizePercentage: true
                                  }
                                }
                              }
                            },
                            copyIsEnabled: true,
                            positionSizePercentage: true,
                            botId: true,
                            userId: true
                          }
                        },
                        id: true,
                        name: true
                      }
                    }
                  }
                })
                return await openPositions(newPosition, provider)
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