import z from 'zod'
import { walletDetailsSwapSchema } from './swap.schema'

export const WalletListSchema = z.object({
  walletAddress: z.string().optional(),
  WalletSnapshots: z.object({

  }).array().optional(),
  StarWallet: z.object({}).array().optional(),
  swaps: walletDetailsSwapSchema.array(),
  _count: z.object({
    StarWallet: z.number(),
    bots: z.number()
  })
})

export const createWalletSchema = z.object({
  snapshots: z.object({}).array()
})

export const followWalletSchema = z.object({
  id: z.number()
})


export const getSingleWalletSchema = z.object({
  id: z.number(),
})

export const getSingleWalletByAddressSchema = z.object({
  walletAddress: z.string(),
})

export type CreateWalletInput = z.TypeOf<typeof createWalletSchema>

export type FollowWalletInput = z.TypeOf<typeof followWalletSchema>

export type WalletListSchema = z.TypeOf<typeof WalletListSchema>
