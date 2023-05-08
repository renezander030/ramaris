import { router } from '../trpc';
import { botRouter } from './bot'
import { walletRouter } from './wallet'
import { positionRouter } from './position'
import { userRouter } from './user'
import { actionRouter } from './action'

export const appRouter = router({
  bot: botRouter,
  wallet: walletRouter,
  position: positionRouter,
  user: userRouter,
  action: actionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;