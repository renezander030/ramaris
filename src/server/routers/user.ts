import { router, publicProcedure } from '../trpc';
import { getSingleUserSchema } from '../../schema/user.schema'

export const userRouter = router({

    getSingleUser: publicProcedure
        .input(getSingleUserSchema)
        .query(({ ctx, input }) => {
            const user = ctx.prisma.user.findFirst({
                where: {
                    name: input.name
                },
                include: {
                    Bot: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            })
            return user;
        }),
});