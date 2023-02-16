import z from 'zod'

export const createBotSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  shareId: z.string(),
  state: z.boolean().optional(),
  wallets: z.object({
    id: z.number(),
    walletAddress: z.string()
  }).array().optional(),
  weekdays: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  botsFollowing: z.object({
    id: z.number(),
    name: z.string()
  }).array().optional(),
  hours: z.number().array(),
  whitelistTokens: z.string().array(),
  blacklistTokens: z.string().array(),
  blacklistProtocols: z.string().array(),
  transactionValue: z.number().array(),
  gasValue: z.number().array(),
  actions: z.object({
    id: z.number(),
    name: z.string()
  }).array().min(1),
  positionSizePercentage: z.number(),
  takeprofitPercentage: z.number().optional(),
  stoplossPercentage: z.number().optional()
})

export const updateBotSchema = z.object({
  id: z.number(),
  name: z.string(),
  shareId: z.string(),
  state: z.boolean(),
  wallets: z.string().array(),
  weekdays: z.object({
    min: z.number(),
    max: z.number()
  }),
  hours: z.number().array(),
  whitelistTokens: z.string().array(),
  blacklistTokens: z.string().array(),
  blacklistProtocols: z.string().array(),
  transactionValue: z.number().array(),
  gasValue: z.number().array(),
  actions: z.string().array(),
  positionSizePercentage: z.number(),
  takeprofitPercentage: z.number().optional(),
  stoplossPercentage: z.number().optional()
})

export const followBotSchema = z.object({
  id: z.number()
})

export const listBotSchema = z.object({
  id: z.number(),
  blacklistProtocols: z.object({}).array(),
  blacklistTokens: z.object({}).array(),
  createdAt: z.date(),
  creator: z.object({
    name: z.string().nullable()
  }).nullable(),
  gasValue: z.number().array(),
  hours: z.number().array(),
  name: z.string(),
  positionSizePercentage: z.number(),
  positions: z.object({
    createdAt: z.date(),
    id: z.number()
  }).array().optional(),
  shareId: z.string(),
  state: z.boolean(),
  stoplossPercentage: z.number().nullable(),
  takeprofitPercentage: z.number().nullable(),
  transactionValue: z.number().array(),
  weekdays: z.number().array(),
  whitelistTokens: z.object({}).array(),
  _count: z.object({
    StarBot: z.number()
  }),
  StarBot: z.object({
    botId: z.number()
  }).array().optional()
})

export type CreateBotInput = z.TypeOf<typeof createBotSchema>
export type UpdateBotInput = z.TypeOf<typeof updateBotSchema>
export type FollowBotInput = z.TypeOf<typeof followBotSchema>
export type listBotSchema = z.TypeOf<typeof listBotSchema>

export const getSingleBotSchema = z.object({
  id: z.number(),
})

export const getSingleBotByNameSchema = z.object({
  name: z.string(),
})