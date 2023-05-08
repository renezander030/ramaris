import z from 'zod'
import { createTokenContractSchema } from './tokencontract.schema'

export const createTokenSchema = z.object({
  contract: z.object({createTokenContractSchema}),
  balance: z.number(),
  balanceUsd: z.number(),
})

export type CreateTokenInput = z.TypeOf<typeof createTokenSchema>

export const getSingleTokenSchema = z.object({
  tokenId: z.string().cuid(),
})