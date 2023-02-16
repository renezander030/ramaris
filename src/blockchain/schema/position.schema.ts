import z from 'zod'


export const createTokenContractSchema = z.object({
  contractAddress: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  image: z.string(),
  mcap: z.number(),
  chain: z.string(),
  createdAt: z.date(),
})

export const createContractSchema = z.object({
  contractAddress: z.string(),
  name: z.string().optional(),
  chain: z.string(),
  createdAt: z.date(),
})

export const createBotSchema = z.object({
  name: z.string(),
  shareId: z.string(),
  state: z.boolean(),
  actions: z.object({
    name: z.string()
  })
})

export const createPositionSchema = z.object({
  id: z.number(), // swap: combined from swap id and bot id, position: combined from bot id and bot follows id
  walletId: z.number(),
  botId: z.number(),
  timestamp: z.string(),
  createdAt: z.date(),
  tokenAddress: z.string(),
  amountIn: z.number(),
  amountOutMin: z.number(),
  positionType: z.number(),
  actionType: z.string(),
  // not to be used from a relation: bot parameters - point in time values
  positionSizePercentage: z.number(),
  takeprofitPercentage: z.number(),
  stoplossPercentage: z.number(),
  sentTokenContract: createTokenContractSchema,
  receivedTokenContract: createTokenContractSchema,
  bot: createBotSchema,
  TokenContract: createContractSchema, // contract that was interacted with
  contractAddress: z.string()
})

export const botIdSchema = z.object({
  id: z.number()
})


export type CreatePositionSchema = z.TypeOf<typeof createPositionSchema>
export type CreateBotSchema = z.TypeOf<typeof createBotSchema>
export type BotIdSchema = z.TypeOf<typeof botIdSchema>
export type createContractSchema = z.TypeOf<typeof createContractSchema>