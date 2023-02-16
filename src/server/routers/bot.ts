import {
  createBotSchema,
  updateBotSchema,
  getSingleBotSchema,
  followBotSchema,
  getSingleBotByNameSchema,
  listBotSchema
} from '../../schema/bot.schema'
import { router, publicProcedure } from '../trpc';
import * as trpc from '@trpc/server'
import { Prisma } from '@prisma/client';
import { createRouteLoader } from 'next/dist/client/route-loader';
import type { DefaultSession } from 'next-auth';

interface ramarisUser {
  id?: string | Prisma.StringFilter;
  email: string;
}

interface ramarisUserStarBot {
  id: string;
}

export const botRouter = router({
  getBotIdForName: publicProcedure
    .input(getSingleBotByNameSchema)
    .query(({ ctx, input }) => {
      const bot = ctx.prisma.bot.findMany({
        where: {
          name: {
            contains: input.name
          }
        },
        take: 3
      })
      return bot;
    }),
  create: publicProcedure
    .input(
      createBotSchema
    )
    .mutation(async ({ ctx, input }) => {

      if (!ctx.session?.user) {
        new trpc.TRPCError({
          code: 'FORBIDDEN',
          message: 'Can not create a bot while logged out',
        })
      }

      const userEmail = ctx.session?.user?.email?.toString()

      const createBot = ctx.prisma.bot.create({
        data: {
          ...input,
          creator: {
            connect: {
              email: userEmail
            },
          },
          wallets: {
            createMany: {
              data: input.wallets?.map((wallet) => {
                return {
                  walletId: wallet.id
                }
              }) as Prisma.WalletsOnBotsCreateManyBotInput[]
            }
          },
          actions: {
            createMany: {
              data: input.actions.map((action) => {
                return {
                  actionId: action.id
                }
              }) as Prisma.ActionsOnBotsCreateManyInput[]
            }
          },
          botsFollowing: {
            connect: input.botsFollowing?.map((botFollowing) => {
              return {
                id: botFollowing.id
              }
            })
          }
        } as Prisma.BotCreateInput,
      })

      return createBot;
    }),
  delete: publicProcedure
    .input(getSingleBotSchema)
    .mutation(async ({ ctx, input }) => {

      if (!ctx.session?.user) {
        new trpc.TRPCError({
          code: 'FORBIDDEN',
          message: 'Can not delete a bot while logged out',
        })
      }

      const deleteBot = await ctx.prisma.bot.delete({
        where: {
          id: input.id
        },
        include: {
          actions: {
            where: {
              botId: input.id
            }
          }
        }
      })
      return deleteBot
    }),
  update: publicProcedure
    .input(updateBotSchema)
    .mutation(async ({ ctx, input }) => {

      if (!ctx.session?.user) {
        new trpc.TRPCError({
          code: 'FORBIDDEN',
          message: 'Can not delete a bot while logged out',
        })
      }

      console.log(JSON.stringify(input))

      const updateBot = await ctx.prisma.bot.updateMany({
        where: {
          creator: { email: ctx.session?.user?.email },
          id: input.id
        },
        data: input as Prisma.BotUpdateManyMutationInput
      })

      return updateBot
    })
  ,
  list: publicProcedure.query(({ ctx }) => {

    const userEmail = ctx.session?.user?.email?.toString()

    const bots = ctx.prisma.user.findUnique({
      where: {
        email: userEmail
      }
    }).Bot()

    return bots;
  }),
  listAll: publicProcedure.query(async ({ ctx }) => {

    const user = ctx.session?.user as ramarisUser

    if (!ctx.session?.user) {
      // user is NOT signed in
      const bots = await ctx.prisma.bot.findMany({
        include: {
          creator: {
            select: {
              name: true
            }
          },
          StarBot: false,
          positions: {
            select: {
              createdAt: true,
              id: true
            },
            take: 1,
            orderBy: {
              id: 'desc'
            }
          },
          _count: {
            select: {
              StarBot: true
            }
          }
        },
        take: 20
      })
      return {
        isUserSignedIn: false,
        bots: bots
      } as unknown;
    }
    else {
      // user is signed in
      const bots = await ctx.prisma.bot.findMany({
        include: {
          creator: {
            select: {
              name: true
            }
          },
          positions: {
            select: {
              createdAt: true,
              id: true
            },
            take: 1,
            orderBy: {
              id: 'desc'
            }
          },
          StarBot: {
            where: {
              user: {
                id: user.id
              }
            },
            select: {
              botId: true
            }
          },
          _count: {
            select: {
              StarBot: true
            }
          }
        },
      })
      return {
        isUserSignedIn: true,
        bots: bots
      };
    }
  }),
  listAuthored: publicProcedure.query(async ({ ctx }) => {

    const user = ctx.session?.user as ramarisUser
    let bots: listBotSchema[] = []

    if(user) {
      // user is signed in
      bots = await ctx.prisma.bot.findMany({
        where: {
          creator: {
            id: user.id
          }
        },
        include: {
          creator: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              StarBot: true
            }
          }
        }
      })

      return {
        isUserSignedIn: true,
        bots: bots
      };
    }
    else {
      // user is NOT signed in
    }
    return {
      isUserSignedIn: false,
      bots: bots
    };
  }),
  listFavorites: publicProcedure.query(async ({ ctx }) => {

    const user = ctx.session?.user as ramarisUser
    let bots: listBotSchema[] = [];

    if(user){
      // user is signed in
      bots = await ctx.prisma.bot.findMany({
        include: {
          // show only those bots the user himself is following
          // as StarWallet property
          StarBot: {
            where: {
              user: {
                id: user.id
              }
            }
          },
          creator: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              StarBot: true
            }
          }
        },
        where: {
          StarBot: {
            some: {
              user: {
                id: user.id
              }
            }
          }
        }
      })
      return {
        isUserSignedIn: true,
        bots: bots
      };
    }
    else {
      // user is NOT signed in
      return {
        isUserSignedIn: false,
        bots: bots
      };
    }
  }),
  follow: publicProcedure
    .input(followBotSchema)
    .mutation(async ({ ctx, input }) => {

      if (!ctx.session?.user) {
        new trpc.TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot follow bots while logged out',
        })
      }

      const user = ctx.session?.user as ramarisUserStarBot
      const createFollowUserBot = await ctx.prisma.starBot.create({
        data: {
          user: {
            connect: {
              id: user.id
            }
          },
          bot: {
            connect: {
              id: input.id
            }
          }
        }
      })

      return createFollowUserBot
    }),
  unfollow: publicProcedure
    .input(followBotSchema)
    .mutation(async ({ ctx, input }) => {

      if (!ctx.session?.user) {
        new trpc.TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot unfollow bots while logged out',
        })
      }

      const user = ctx.session?.user as ramarisUserStarBot
      const deleteFollowUserBot = await ctx.prisma.starBot.delete({
        where: {
          userId_botId: {
            userId: user.id,
            botId: input.id
          }
        }
      })

      return deleteFollowUserBot
    }),
  getSingleBot: publicProcedure
    .input(getSingleBotSchema)
    .query(async ({ ctx, input }) => {

      const user = ctx.session?.user as ramarisUser
      const bot = await ctx.prisma.bot.findUnique({
        where: {
          id: input.id
        },
        include: {
          _count: {
            select: {
              wallets: true,
              botsFollowedBy: true,
              botsFollowing: true,
              StarBot: true
            }
          },
          actions: {
            select: {
              Action: {
                select: {
                  name: true,
                  id: true
                }
              }
            }
          },
          creator: {
            select: {
              name: true,
              email: true
            }
          },
          positions: {
            select: {
              id: true,
              actionType: true,
              amountIn: true,
              amountOutMin: true,
              createdAt: true,
              interactedContract: {
                select: {
                  contractAddress: true
                }
              },
              positionSizePercentage: true,
              takeprofitPercentage: true,
              stoplossPercentage: true,
              sentTokenContract: {
                select: {
                  symbol: true,
                  image: true
                }
              },
              receivedTokenContract: {
                select: {
                  symbol: true,
                  image: true
                }
              },
            }
          },
          StarBot: false,
          wallets: {
            select: {
              walletId: true,
              Wallet: {
                select: {
                  walletAddress: true
                }
              }
            }
          },
          botsFollowing: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      let botIsAuthoredByThisUser = false;
      if (bot?.creator?.email == user.email) botIsAuthoredByThisUser = true;
      return {
        user: user,
        bot: bot,
        botIsAuthoredByThisUser: botIsAuthoredByThisUser
      };
    }),
  getSingleBotSignedIn: publicProcedure
    .input(getSingleBotSchema)
    .query(({ ctx, input }) => {

      const user = ctx.session?.user as ramarisUser
      const bot = ctx.prisma.bot.findUnique({
        where: {
          id: input.id
        },
        include: {
          _count: {
            select: {
              wallets: true,
              botsFollowedBy: true,
              botsFollowing: true,
              StarBot: true
            }
          },
          actions: {
            select: {
              Action: {
                select: {
                  name: true,
                  id: true
                }
              }
            }
          },
          creator: {
            select: {
              name: true
            }
          },
          positions: true,
          StarBot: {
            where: {
              user: {
                id: user.id
              }
            }
          },
          wallets: {
            select: {
              walletId: true,
              Wallet: {
                select: {
                  walletAddress: true
                }
              }
            }
          },
          botsFollowing: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
      return bot;
    }),
});