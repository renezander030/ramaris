import z from 'zod'

export const createTokenContractSchema = z.object({
  contractAddress: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  image: z.string().url(),
  mcap: z.number(),
  chain: z.string(),
})

export type CreateTokenSchemaInput = z.TypeOf<typeof createTokenContractSchema>

export const getSingleTokenSchemaSchema = z.object({
  tokenContractId: z.string().cuid(),
})