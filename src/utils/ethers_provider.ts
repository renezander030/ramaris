const ethers = require('ethers');
const { Contract } =  require('ethers');
import logger from './logger'

declare global {
  var provider: any | Promise<any>
}

declare var process: {
  exit(arg0: number): unknown;
  env: {
    ANKR_URL_POLYGON_MAINNET_WEBSOCKET: string;
    NODE_ENV: string;
  }
}

// handles web socket reconnects : https://github.com/ethers-io/ethers.js/issues/1053
const EXPECTED_PONG_BACK: number = 15000
const KEEP_ALIVE_CHECK_INTERVAL: number = 7500
export const startConnection = async () => {

  let provider = new ethers.providers.WebSocketProvider(process.env.ANKR_URL_POLYGON_MAINNET_WEBSOCKET)

  let pingTimeout: string | number | NodeJS.Timeout | undefined
  let keepAliveInterval: string | number | NodeJS.Timeout | undefined

  provider._websocket.on('open', () => {
    keepAliveInterval = setInterval(() => {
      // logger.debug('Checking if the connection is alive, sending a ping')
      console.log('Checking if the connection is alive, sending a ping')

      provider._websocket.ping()

      // Use `WebSocket#terminate()`, which immediately destroys the connection,
      // instead of `WebSocket#close()`, which waits for the close timer.
      // Delay should be equal to the interval at which your server
      // sends out pings plus a conservative assumption of the latency.
      pingTimeout = setTimeout(() => {
        provider._websocket.terminate()
      }, EXPECTED_PONG_BACK)
    }, KEEP_ALIVE_CHECK_INTERVAL)

    // TODO: handle contract listeners setup + indexing
  })

  provider._websocket.on('close', () => {
    // logger.error('The websocket connection was closed')
    console.log('The websocket connection was closed')
    clearInterval(keepAliveInterval)
    clearTimeout(pingTimeout)
    startConnection()
  })

  provider._websocket.on('pong', async () => {
    // logger.debug('Received pong, so connection is alive, clearing the timeout')
    console.log('Received pong, so connection is alive, clearing the timeout')
    // logger.info(`Current Block No ${await provider.getBlockNumber()}`);

    clearInterval(pingTimeout)
  })
  
  const abi_usdt = await fetch('../blockchain/abis/usdt.json')
  const tokenContract = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
  const contract = new Contract(tokenContract, abi_usdt, provider)
  return {
    provider: provider,
    contract: contract,
    getTokenBalance: async (walletAddress: string) => {
      // const balance = contract.balanceOf(walletAddress)
      // const balanceFormatted = await ethers.utils.formatUnits(balance, 6)
      return null
    }
  };
}
export const provider = global.provider || startConnection()

if (process.env.NODE_ENV !== 'production') {
  global.provider = provider
}
