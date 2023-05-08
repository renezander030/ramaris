import { router, publicProcedure } from '../trpc';
import { getSingleUserSchema, updateSingleUserSchema, createTradingAccountSchema, updateTradingAccountSchema, deleteTradingAccountSchema, importTradingAccountSchema } from '../../schema/user.schema'
import { User } from '@prisma/client';
import * as trpc from '@trpc/server'
import { createWalletSchema } from '../../schema/wallet.schema';
import { truncate } from 'lodash';
import { ethers } from 'ethers';
var EthUtil = require('ethereumjs-util');
import Wallet from 'ethereumjs-wallet'
import { DefaultSession } from 'next-auth/core/types';

export const userRouter = router({
  getSingleUser: publicProcedure
    .input(getSingleUserSchema)
    .query(async ({ ctx, input }) => {

      const userEmail = ctx.session?.user?.email?.toString()

      interface SessionUser extends DefaultSession {
        username: string,
        email: string,
      }

      const sessionUser = ctx?.session?.user as SessionUser;


      if (sessionUser?.username == input.username) {
        // the session user is equal to the user that was found by prisma
        let data = await ctx.prisma.user.findFirst({
          where: {
            username: input.username
          },
          select: {
            Bot: {
              select: {
                id: true,
                name: true
              }
            },
            gateio_api_key: true,
            gateio_api_secret: true,
            telegram_chatid: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            TradingAccount: {
              where: {
                User: {
                  email: userEmail
                }
              },
              select: {
                public_key: true,
                private_key: true,
                mnemonic_phrase: true,
                mnemonic_entropy: true,
                ethereum_address: true,
                maxPositionsPerBotPerDay: true,
                maxPositionsPerTokenPerDay: true,
                positionSizePercentage: true,
                trades: {
                  select: {
                    Position: {
                      select: {
                        actionType: true,
                        amountIn: true,
                        amountOutMin: true,
                        sentTokenContract: {
                          select: {
                            image: true,
                            symbol: true
                          }
                        },
                        receivedTokenContract: {
                          select: {
                            image: true,
                            symbol: true
                          }
                        },
                        bot: {
                          select: {
                            name: true,
                            id: true
                          }
                        },
                        positionSizePercentage: true
                      }
                    },
                    createdAt: true,
                    tradeSizePercentage: true,
                    state: true,
                    errorDetail: true,
                    id: true,
                  }
                }
              }
            }
          }
        })
        return {
          user: data,
          author: true
        }
      }
      else {
        // select only public information
        let data = await ctx.prisma.user.findFirst({
          where: {
            username: input.username
          },
          select: {
            Bot: {
              select: {
                id: true,
                name: true
              }
            },
            name: true,
            username: true,
            createdAt: true,
            updatedAt: false,
            TradingAccount: false,
          }
        })
        return {
          user: data,
          author: false
        }
      }
    }),
  update: publicProcedure
    .input(
      updateSingleUserSchema
    )
    .mutation(async ({ ctx, input }) => {

      if (!ctx.session?.user) {
        new trpc.TRPCError({
          code: 'FORBIDDEN',
          message: 'Can not update while logged out',
        })
      }

      const userEmail = ctx.session?.user?.email?.toString()

      const update = ctx.prisma.user.update({
        where: {
          email: userEmail
        },
        data: {
          ...input,
          gateio_api_key: input.gateio_api_key,
          gateio_api_secret: input.gateio_api_secret,
          telegram_chatid: input.telegram_chatid
        }
      })

      return update;
    }),
  createTradingAccount: publicProcedure
    .input(
      createTradingAccountSchema
    )
    .mutation(async ({ ctx, input }) => {

      if (!ctx.session?.user) {
        new trpc.TRPCError({
          code: 'FORBIDDEN',
          message: 'Can not create trading account while logged out'
        })
      }

      const userEmail = ctx.session?.user?.email?.toString()

      const create = ctx.prisma.user.update({
        where: {
          email: userEmail
        },
        data: {
          TradingAccount: {
            create: {
              public_key: input.public_key,
              private_key: input.private_key,
              mnemonic_entropy: input.mnemonic_entropy,
              mnemonic_phrase: input.mnemonic_phrase,
              ethereum_address: input.ethereum_address,
            }
          }
        }
      })

      return create;

    }),
  importTradingAccount: publicProcedure
    .input(importTradingAccountSchema)
    .mutation(async ({ ctx, input }) => {

      if (!ctx.session?.user) {
        new trpc.TRPCError({
          code: 'FORBIDDEN',
          message: 'Can not import trading account while logged out'
        })
      }

      const userEmail = ctx.session?.user?.email?.toString()

      const defaultWallet = ethers.Wallet.fromMnemonic(input.mnemonic_phrase)
      const privateKeyBuffer = EthUtil.toBuffer(defaultWallet.privateKey);
      const wallet = Wallet.fromPrivateKey(privateKeyBuffer);
      const publicKey = wallet.getPublicKeyString();
      const ethereum_address = wallet.getAddressString();

      const update = ctx.prisma.user.update({
        where: {
          email: userEmail
        },
        data: {
          TradingAccount: {
            create: {
              mnemonic_phrase: input.mnemonic_phrase,
              ethereum_address: ethereum_address,
              mnemonic_entropy: defaultWallet.mnemonic?.path || "",
              private_key: defaultWallet.privateKey,
              public_key: publicKey,
            }
          }
        }
      })

      return update;
    }),
  updateTradingAccount: publicProcedure
    .input(updateTradingAccountSchema)
    .mutation(async ({ ctx, input }) => {

      if (!ctx.session?.user) {
        new trpc.TRPCError({
          code: 'FORBIDDEN',
          message: 'Can not update trading account while logged out'
        })
      }

      const userEmail = ctx.session?.user?.email?.toString()

      const user = await ctx.prisma?.user.findUnique({
        where: {
          email: ctx.session?.user?.email as unknown as string
        },
        select: {
          id: true
        }
      });

      const update = ctx.prisma.user.update({
        where: {
          email: userEmail
        },
        data: {
          TradingAccount: {
            updateMany: {
              where: {
                userId: user?.id
              },
              data: {
                positionSizePercentage: input.positionSizePercentage,
                maxPositionsPerBotPerDay: input.maxPositionsPerBotPerDay,
                maxPositionsPerTokenPerDay: input.maxPositionsPerTokenPerDay
              }
            }
          }
        }
      })

      return update;
    }),
  deleteTradingAccount: publicProcedure
    .input(deleteTradingAccountSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        new trpc.TRPCError({
          code: 'FORBIDDEN',
          message: 'Can not delete trading account while logged out'
        })
      }

      const userEmail = ctx?.session?.user?.email?.toString()
      const user = await ctx.prisma?.user.findUnique({
        where: {
          email: ctx.session?.user?.email as unknown as string
        },
        select: {
          id: true
        }
      });

      const remove = ctx.prisma.user.update({
        where: {
          email: userEmail
        },
        data: {
          TradingAccount: {
            deleteMany: {
              public_key: input.public_key
            }
          }
        }
      })
      return remove;
    })
});