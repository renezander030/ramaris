// This file stores web3 related constants such as addresses, token definitions, ETH currency references and ABI's

import { SupportedChainId, Token } from '@uniswap/sdk-core'
import { addresses } from '../../constants';


const chainId = 137 // Polygon Mainnet


// Addresses

// https://docs.quickswap.exchange/reference/smart-contracts/v3/01-factory
export const POOL_FACTORY_CONTRACT_ADDRESS =
  '0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28'

  // https://docs.quickswap.exchange/reference/smart-contracts/v3/04-quoter
export const QUOTER_CONTRACT_ADDRESS =
  '0xa15F0D7377B2A0C0c10db057f641beD21028FC89'

  // https://docs.quickswap.exchange/reference/smart-contracts/v2/router02
export const SWAP_ROUTER_ADDRESS = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'

export const WMATIC_CONTRACT_ADDRESS =
  '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'

// Currencies and Tokens

// export const WETH_TOKEN = new Token(
//   SupportedChainId.MAINNET,
//   '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//   18,
//   'WETH',
//   'Wrapped Ether'
// )

// export const USDC_TOKEN = new Token(
//   SupportedChainId.MAINNET,
//   '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
//   6,
//   'USDC',
//   'USD//C'
// )


// token sent
const SentTokenContract = {
  contractAddress: addresses.USDT,
  decimals: 6,
  symbol: 'USDT',
  name: 'USD Tether'
}
export const SentToken = new Token(
  chainId,
  SentTokenContract.contractAddress,
  SentTokenContract.decimals,
)

// token received
const ReceivedTokenContract = {
  contractAddress: addresses.WMATIC,
  decimals: 18,
  symbol: 'WMATIC',
  name: 'Wrapped MATIC'
}
export const ReceivedToken = new Token(
  chainId,
  ReceivedTokenContract.contractAddress,
  ReceivedTokenContract.decimals,
)


// ABI's

export const ERC20_ABI = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (bool)',
  'function approve(address _spender, uint256 _value) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint amount)',
]

export const WETH_ABI = [
  // Wrap ETH
  'function deposit() payable',

  // Unwrap ETH
  'function withdraw(uint wad) public',
]

// Transactions

export const MAX_FEE_PER_GAS = 100000000000
export const MAX_PRIORITY_FEE_PER_GAS = 100000000000
export const TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER = 2000