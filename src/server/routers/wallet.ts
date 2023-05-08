// import * as trpc from '@trpc/server'
import {
    followWalletSchema,
    getSingleWalletSchema,
    getSingleWalletByAddressSchema,
    WalletListSchema
} from '../../schema/wallet.schema'
import { router, publicProcedure } from '../trpc';
import * as trpc from '@trpc/server'
import { Prisma } from '@prisma/client';

interface ramarisUser {
    id?: string | Prisma.StringFilter;
}
interface ramarisUserStarWallet {
    id?: string | undefined;
}
interface ramarisUserStarWalletDelete {
    id: string;
}

export const walletRouter = router({

    getSingleWallet: publicProcedure
        .input(getSingleWalletSchema)
        .query(({ ctx, input }) => {
            const wallet = ctx.prisma.wallet.findUnique({
                where: {
                    id: input.id
                },
                include: {
                    WalletSnapshots: {
                        take: 1,
                        orderBy: {
                            id: 'desc'
                        }
                    },
                    swaps: {
                        select: {
                            contract: {
                                select: {
                                    contractAddress: true,
                                }
                            },
                            amountIn: true,
                            amountOutMin: true,
                            createdAt: true,
                            cumulativeGasUsed: true,
                            gas: true,
                            id: true,
                            SentTokenContract: {
                                select: {
                                    TokenContract: {
                                        select: {
                                            contractAddress: true,
                                            symbol: true
                                        }
                                    }
                                }
                            },
                            ReceivedTokenContract: {
                                select: {
                                    TokenContract: {
                                        select: {
                                            contractAddress: true,
                                            symbol: true,
                                            image: true
                                        }
                                    }
                                }
                            },
                            receivedTokenContractAddress: true,
                            sentTokenContractAddress: true,
                            timestamp: true,
                            transactionHash: true
                        }
                    },
                    _count: {
                        select: {
                            StarWallet: true,
                            bots: true
                        }
                    },
                }
            }) as unknown as WalletListSchema
            return wallet;
        }),
    getWalletIdForAddress: publicProcedure
        .input(getSingleWalletByAddressSchema)
        .query(({ ctx, input }) => {
            const wallet = ctx.prisma.wallet.findMany({
                where: {
                    walletAddress: {
                        contains: input.walletAddress
                    }
                },
                take: 3
            })
            return wallet;
        }),
    list: publicProcedure.query(async ({ ctx }) => {

        const user = ctx.session?.user as ramarisUser
        let wallets = [] as WalletListSchema[]

        if (ctx.session?.user) {
            // user is signed in
            wallets = await ctx.prisma.wallet.findMany({
                include: {
                    WalletSnapshots: {
                        take: 1,
                        orderBy: {
                            id: 'desc'
                        }
                    },
                    // show only those wallets the user himself is following
                    // as StarWallet property
                    StarWallet: {
                        where: {
                            user: {
                                id: user.id
                            }
                        },
                        select: {
                            walletId: true
                        }
                    },
                    _count: {
                        select: {
                            StarWallet: true
                        }
                    }
                },
                where: {
                    swaps: {
                        some: {
                            amountIn: {
                                gte: 1
                            }
                        }
                    }
                },
                take: 20
            }) as unknown as WalletListSchema[]
            return {
                userIsSignedIn: true,
                wallets: wallets,
            };
        }
        else {
            // user is not signed in
            wallets = await ctx.prisma.wallet.findMany({
                include: {
                    WalletSnapshots: {
                        take: 1,
                        orderBy: {
                            id: 'desc'
                        }
                    },
                    StarWallet: false,
                    _count: {
                        select: {
                            swaps: true,
                            StarWallet: true
                        }
                    }
                },
                where: {
                    swaps: {
                        some: {
                            amountIn: {
                                gte: 1
                            }
                        }
                    }
                },
                // take: 20
            }) as unknown as WalletListSchema[]
            return {
                userIsSignedIn: false,
                wallets: wallets,
            };
        }
    }),
    listFavorites: publicProcedure.query(({ ctx }) => {

        const user = ctx.session?.user as ramarisUser
        let wallets: WalletListSchema[] = [];

        if(user){
            // user is signed in
            wallets = ctx.prisma.wallet.findMany({
                include: {
                    WalletSnapshots: {
                        take: 1,
                        orderBy: {
                            id: 'desc'
                        }
                    },
                    // show only those wallets the user himself is following
                    // as StarWallet property
                    StarWallet: {
                        where: {
                            user: {
                                id: user.id
                            }
                        }
                    }
                },
                where: {
                    StarWallet: {
                        some: {
                            user: {
                                id: user.id
                            }
                        }
                    }
                }
            }) as unknown as WalletListSchema[]
            return {
                userIsSignedIn: true,
                wallets: wallets
            };
        }
        else {
            // user is NOT signed in
            return {
                userIsSignedIn: false,
                wallets: []
            };
        }
    }),
    follow: publicProcedure
        .input(followWalletSchema)
        .mutation(async ({ ctx, input }) => {

            if (!ctx.session?.user) {
                new trpc.TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Cannot follow wallets while logged out',
                })
            }

            const user = ctx.session?.user as ramarisUserStarWallet
            const createFollowUserWallet = await ctx.prisma.starWallet.create({
                data: {
                    user: {
                        connect: {
                            id: user.id
                        }
                    },
                    wallet: {
                        connect: {
                            id: input.id
                        }
                    }
                }
            })

            return createFollowUserWallet
        }),
    unfollow: publicProcedure
        .input(followWalletSchema)
        .mutation(async ({ ctx, input }) => {

            if (!ctx.session?.user) {
                new trpc.TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Cannot unfollow wallets while logged out',
                })
            }

            const user = ctx.session?.user as ramarisUserStarWalletDelete
            const deleteFollowUserWallet = await ctx.prisma.starWallet.delete({
                where: {
                    userId_walletId: {
                        userId: user.id,
                        walletId: input.id
                    }
                }
            })

            return deleteFollowUserWallet
        })
    ,
});