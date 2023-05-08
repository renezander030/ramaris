import logger from './logger';
import { Transaction } from '@ankr.com/ankr.js/dist/types';
import { prisma } from '../services/prisma';

export async function addWalletSnapshot(
    SenderAccountBalance: {
        tokens: any;
        totalBalanceUsd: number;
        holderAddress: string;
    },
    transactionHashDetails: Transaction,
    transfer: {
        from?: string;
        to?: string;
        value?: any;
        data: any;
    }) {

    logger.log('debug', `💾 Adding New Wallet Snapshot to Database`);
    let tokens = new Array();
    if (SenderAccountBalance.tokens)
        tokens = SenderAccountBalance.tokens;

    if (!SenderAccountBalance.holderAddress) {
        logger.error(`E error wallet address not defined. aborting`);
        return;
    }

    const snapshot = await prisma.walletSnapshot.create({
        data: {
            totalBalanceUsd: SenderAccountBalance.totalBalanceUsd,
            ProfitLossPercentage: 0,
            tokens: {
                connectOrCreate: tokens.map((token: { contractAddress: string; balance: number; balanceUsd: number; tokenSymbol: string; decimals: number; }) => {
                    return {
                        where: { contractAddress: token.contractAddress?.toLowerCase() },
                        create: {
                            contractAddress: token.contractAddress?.toLowerCase(),
                            contract: {
                                connectOrCreate: {
                                    where: {
                                        contractAddress: token.contractAddress?.toLowerCase()
                                    },
                                    create: {
                                        contractAddress: token.contractAddress?.toLowerCase(),
                                        name: "name",
                                        symbol: token.tokenSymbol,
                                        decimals: token.decimals,
                                        image: "",
                                        mcap: 0,
                                        chain: "polygon"
                                    }
                                }
                            },
                            balance: token.balance,
                            balanceUsd: token.balanceUsd
                        }
                    };
                })
            },
            discoveredOnBlockNumber: transfer.data.blockNumber,
            discoveredOnTx: transfer.data.transactionHash,
            timestamp: transactionHashDetails.timestamp,
            chain: "polygon",
            Wallet: {
                connectOrCreate: {
                    where: {
                        walletAddress: SenderAccountBalance.holderAddress
                    },
                    create: {
                        walletAddress: SenderAccountBalance.holderAddress
                    }
                }
            }
        }
    });

    let txRecipient: string = "";
    if (transactionHashDetails.to)
        txRecipient = transactionHashDetails.to.toLowerCase();

    // create contract the wallet interacted with in the tx hash, separately
    const contract = prisma.contract.upsert({
        where: {
            contractAddress: txRecipient
        },
        update: {
            contractAddress: txRecipient
        },
        create: {
            contractAddress: txRecipient
        }
    });
    console.log(snapshot, contract);
}
