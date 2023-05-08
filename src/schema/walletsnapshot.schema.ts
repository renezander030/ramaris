import z from 'zod'
import { createTokenSchema } from './token.schema';

export const createWalletSnapshotSchema = z.object({
  walletAddress: z.string(),
  totalBalanceUsd: z.number(),
  ProfitLossPercentage: z.number(),
  tokens: z.object({ createTokenSchema }).array(),
  discoveredOnBlockNumber: z.string(),
  discoveredOnTx: z.string(),
  timestamp: z.number(),
  walletId: z.number(),
})

export const walletDetailsSnapshotSchema = z.object({
  id: z.number(),
  totalBalanceUsd: z.number(),
  coinBalanceUsd: z.number().nullable(),
  totalBalanceTokensUsd: z.number().nullable(),
  ProfitLossPercentage: z.number().nullable(),
  discoveredOnBlockNumber: z.number(),
  discoveredOnTx: z.string(),
  timestamp: z.string(),
  chain: z.string(),
})


export type CreateWalletSnapshotInput = z.TypeOf<typeof createWalletSnapshotSchema>
export type walletDetailsSnapshotSchema = z.TypeOf<typeof walletDetailsSnapshotSchema>

export const getSingleWalletSnapshotSchema = z.object({
  walletSnapshotId: z.string().cuid(),
})