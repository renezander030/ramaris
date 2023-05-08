import { router, publicProcedure } from '../trpc';

export const actionRouter = router({

    list: publicProcedure.query(({ ctx }) => {
        const actions = ctx.prisma.action.findMany({
            select: {
                id: true,
                name: true
            }
        })

        return actions;
    }),
});