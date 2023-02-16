import z from 'zod'

export const createSwapSchema = z.object({
  amountIn: z.number(),
  sentTokenContractAddress: z.string(),
  amountOutMin: z.number(),
  receivedTokenContractAddress: z.string(),
  timestamp: z.number(),
  methodName: z.string(),
  methodVerified: z.boolean(),
  blockNumber: z.string(),
  gas: z.string(),
  gasPrice: z.string(),
  cumulativeGasUsed: z.string(),
  gasUsed: z.string(),
  walletId: z.number(),
})

export const walletDetailsSwapSchema = z.object({
  id: z.number(),
  transactionHash: z.string().nullable(),
  amountIn: z.number(),
  amountOutMin: z.number(),
  contract: z.object({
    contractAddress: z.string()
  }).nullable(),
  cumulativeGasUsed: z.string(),
  gas: z.string(),
  SentTokenContract: z.object({
    TokenContract: z.object({
      contractAddress: z.string(),
      symbol: z.string(),
      image: z.string()
    })
  }).array(),
  ReceivedTokenContract: z.object({
    TokenContract: z.object({
      contractAddress: z.string(),
      symbol: z.string(),
      image: z.string()
    })
  }).array(),
  receivedTokenContractAddress: z.string(),
  sentTokenContractAddress: z.string(),
  timestamp: z.string(),
})

export type CreateSwapInput = z.TypeOf<typeof createSwapSchema>
export type walletDetailsSwapSchema = z.TypeOf<typeof walletDetailsSwapSchema>

export const getSingleSwapSchema = z.object({
  swapId: z.string().cuid(),
})