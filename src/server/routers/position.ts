import { router, publicProcedure } from '../trpc';

export const positionRouter = router({

    list: publicProcedure.query(({ ctx }) => {

        // const rawQuery = ctx.prisma.$queryRaw`
        //     SELECT p.*,tc."symbol" from "Position" p
        //     JOIN "TokenContract" tc
        //     ON lower(p."tokenAddress")=lower(tc."contractAddress")
        // `
        // return rawQuery;

        const positions = ctx.prisma.position.findMany({
            select: {
                bot: {
                    select: {
                        name: true,
                        id: true
                    }
                },
                sentTokenContract: {
                    select: {
                        name: true,
                        symbol: true,
                    }
                },
                receivedTokenContract: {
                    select: {
                        name: true,
                        symbol: true,
                    }
                },
                actionType: true,
                amountIn: true,
                amountOutMin: true,
                createdAt: true,
                positionSizePercentage: true,
                id: true
            },
            take: 20,
            orderBy: {
                createdAt: 'desc'
            }
        })
        return positions;
    }),
});