import { create } from 'lodash'
import z from 'zod'

export const getSingleUserSchema = z.object({
  username: z.string(),
  image: z.string().optional()
})

export const updateSingleUserSchema = z.object({
  gateio_api_key: z.string().optional(),
  gateio_api_secret: z.string().optional(),
  telegram_chatid: z.string().optional()
})

export const createTradingAccountSchema = z.object({
  public_key: z.string(),
  private_key: z.string(),
  mnemonic_phrase: z.string(),
  mnemonic_entropy: z.string(),
  ethereum_address: z.string(),
})

export const updateTradingAccountSchema = z.object({
  positionSizePercentage: z.number().optional(),
  maxPositionsPerBotPerDay: z.number().optional(),
  maxPositionsPerTokenPerDay: z.number().optional()
})

export const importTradingAccountSchema = z.object({
  mnemonic_phrase: z.string()
})

export const deleteTradingAccountSchema = z.object({
  public_key: z.string()
})

export type getSingleUserInput = z.TypeOf<typeof getSingleUserSchema>
export type updateSingleUserInput = z.TypeOf<typeof updateSingleUserSchema>
export type createTradingAccountInput = z.TypeOf<typeof createTradingAccountSchema>