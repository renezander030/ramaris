import { prisma } from '../services/prisma'
import logger from './logger';

const tokens500 = require('../polygon-token-list.json');


export async function createSwap(
    transaction: any,
    transactionHashDetails: any,
    transfer: any,
    SenderAccountBalance: {
        tokens: [{
            contractAddress: string
        }]
    }) {

    // with creating swap token contracts are created. token contracts are in the swap
    // (fields sent token contract, rec tok contract)

    // derived from values out of SenderAccountBalance
    // what the sender has tokens should include tokens he is sending
    // receiving token might not be here
    // in case we will with bogus data (for now)

    type TokenContract = {
        contractAddress: string;
        name: string;
        symbol: string;
        image: string;
        mcap: number;
        chain: string;
        decimals: number
    }

    // when swap is inserted this is how token contracts (yet unknown) are found
    // 
    // use json files to get symbol 
    // 

    type Token = {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        logoURI: string;
    }

    let sentToken: Token = tokens500.find((token: Token) => token.address == transaction.sentTokenContractAddress.toLowerCase())
    let receivedToken: Token = tokens500.find((token: Token) => token.address == transaction.receivedTokenContractAddress.toLowerCase())

if(!sentToken) {
    logger.warn(`sentToken not defined. using bogus data`)
    sentToken = {
        address: transaction.sentTokenContractAddress.toLowerCase(),
        name: "TBD",
        symbol: "TBD",
        decimals: 18,
        logoURI: ""
    }
}
if(!receivedToken) {
    logger.warn(`receivedToken not defined. using bogus data`)
    receivedToken = {
        address: transaction.receivedTokenContractAddress.toLowerCase(),
        name: "TBD",
        symbol: "TBD",
        decimals: 18,
        logoURI: ""
    }
}

    // approach from website prisma
    // transactions
    return await prisma.$transaction(async (swapInsert) => {

        // in token contract table tokenaddress is unique. however, pgsql is case-sensitive here so this fixes this.

        // 1. create both token contracts (sent/rec)
        const sentTokenContract = await swapInsert.tokenContract.upsert({
            where: {
                contractAddress: transaction.sentTokenContractAddress.toLowerCase()
            },
            update: {
                contractAddress: transaction.sentTokenContractAddress.toLowerCase(),
                name: sentToken.name,
                symbol: sentToken.symbol,
                decimals: sentToken.decimals,
                image: sentToken.logoURI,
                mcap: 0,
                chain: "polygon"
            },
            create: {
                contractAddress: transaction.sentTokenContractAddress.toLowerCase(),
                name: sentToken.name,
                symbol: sentToken.symbol,
                decimals: sentToken.decimals,
                image: sentToken.logoURI,
                mcap: 0,
                chain: "polygon"
            }
        });
        const receivedTokenContract = await swapInsert.tokenContract.upsert({
            where: {
                contractAddress: transaction.receivedTokenContractAddress.toLowerCase()
            },
            update: {
                contractAddress: transaction.receivedTokenContractAddress.toLowerCase(),
                name: receivedToken.name,
                symbol: receivedToken.symbol,
                decimals: receivedToken.decimals,
                image: receivedToken.logoURI,
                mcap: 0,
                chain: "polygon"
            },
            create: {
                contractAddress: transaction.receivedTokenContractAddress.toLowerCase(),
                name: receivedToken.name,
                symbol: receivedToken.symbol,
                decimals: receivedToken.decimals,
                image: receivedToken.logoURI,
                mcap: 0,
                chain: "polygon"
            }
        })

        // 2. create swap/relation to created token contracts - re-use token contracts ids in swap/m:n relation created between swap and token contracts
        return await swapInsert.swap.create({
            data: {
                amountIn: transaction.amountIn,
                sentTokenContractAddress: transaction.sentTokenContractAddress,
                SentTokenContract: {
                    create: {
                        contractId: sentTokenContract.id
                    }
                },
                ReceivedTokenContract: {
                    create: {
                        contractId: receivedTokenContract.id
                    }
                },
                amountOutMin: transaction.amountOutMin,
                receivedTokenContractAddress: transaction.receivedTokenContractAddress,
                timestamp: transactionHashDetails.timestamp,
                transactionHash: transfer.data.transactionHash,
                methodName: transactionHashDetails.method.name,
                methodVerified: transactionHashDetails.method.verified,
                blockNumber: transactionHashDetails.blockNumber,
                gas: `${transactionHashDetails.gas}`,
                gasUsed: "",
                cumulativeGasUsed: `${transactionHashDetails.cumulativeGasUsed}`,
                gasPrice: "",
                Wallet: {
                    connect: {
                        walletAddress: transaction.from
                    }
                },
                contract: {
                    connectOrCreate: {
                        where: {
                            contractAddress: transactionHashDetails.to
                        },
                        create: {
                            contractAddress: `${transactionHashDetails.to}`,
                            name: "",
                            chain: "polygon"
                        }
                    }
                },
                contractAddress: transactionHashDetails.to
            }
        })
    }).catch<void>((error: unknown) => {
            logger.error(`Error Transaction ${JSON.stringify(error)}`)
        })
}