import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'

import { ReceivedToken, SentToken } from './constants'

// Sets if the example should run locally or on chain
export enum Environment {
  LOCAL,
  MAINNET,
  WALLET_EXTENSION,
}

// Inputs that configure this example to run
export interface ExampleConfig {
  env: Environment
  rpc: {
    local: string
    mainnet: string
  }
  wallet: {
    address: string
    privateKey: string
  }
  tokens: {
    in: Token
    amountIn: number
    out: Token
    poolFee: number
  }
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  env: Environment.LOCAL,
  rpc: {
    local: 'http://localhost:8545',
    mainnet: process.env.ANKR_URL_POLYGON_MAINNET_WEBSOCKET as string,
  },
  wallet: {
    address: '',
    privateKey:
      '',
  },
  tokens: {
    in: SentToken,
    amountIn: .1,
    out: ReceivedToken,
    poolFee: FeeAmount.MEDIUM,
  },
}