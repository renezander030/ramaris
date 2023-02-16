import getRandomInt from '../utils/getRandomInt'
const fetch = require('node-fetch');
const api_endpoint = `https://rpc.ankr.com/multichain`;
import logger from '../components/logger'
const tokens250 = require('./tokens1.json');
const tokens500 = require('./tokens2.json');
let tokens = tokens250.concat(tokens500);

// https://www.ankr.com/docs/build-blockchain/products/advanced-apis/token-api/#ankr_getaccountbalances
async function getBalanceAnkr(address: string) {
    let body = {
        "jsonrpc": "2.0",
        "method": "ankr_getAccountBalances",
        "params": {
            "blockchain": "polygon",
            "walletAddress": address,
        },
        "id": getRandomInt(10000, 100000)
    };
    const response = await fetch(api_endpoint, {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': process.env.ANKR_API_KEY
        }
    });

    if (!response.ok) {
        const statusText: string = await response.text()
        logger.error(new Error(`E Get HTTP error: ${response.status} ${statusText}`));
        throw new Error(`Get HTTP error!: ${response.status} ${statusText}`);
    }

    const data: any = await response.json();

    if (data.error.code) {
        logger.warn(new Error(`E error getBalance() error code ${data.error.code} message ${data.error.message}`));
        return;
    }

    // logger.log('debug',`data ${JSON.stringify(data)}`);

    let assets = data.result.assets;
    // ankr_getAccountBalances does NOT return the WMATIC token yet
    let walletAssets = assets.map((asset: { tokenSymbol: any; balanceUsd: string; balance: string; contractAddress: any; }) => {
        return {
            tokenSymbol: asset.tokenSymbol,
            balanceUsd: parseFloat(asset.balanceUsd),
            balance: parseFloat(asset.balance), // balance --> tokenprice can later be calculated, does not need to be saved into the DB
            contractAddress: asset.contractAddress
        };
    });

    let tokenSymbols = tokens.map((token: { symbol: string; }) => token.symbol);

    // tokenSymbol --> in top 500 tokens
    // https://www.coingecko.com/en/api/documentation
    // start small with top 250, https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1
    // top 500 on page 2, https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=2
    // add up property balanceUsd - build real total only using selected tokens (mcap rank 1-500)
    const walletAssetsSelected = walletAssets.reduce((allAssets: { totalBalanceUsd: number; push: (arg0: any) => void; holderAddress: string; }, asset: { tokenSymbol: string; balanceUsd: number; }) => {
        allAssets.totalBalanceUsd = allAssets.totalBalanceUsd || 0;
        if (tokenSymbols.find((token: string) => token == asset.tokenSymbol.toLowerCase())) {
            allAssets.push(asset);
            allAssets.totalBalanceUsd = parseFloat((allAssets.totalBalanceUsd + asset.balanceUsd).toFixed(2));
            allAssets.holderAddress = address;
        }
        return allAssets;
    }, []);
    // later, replace float number with currency formatting
    // allAssets.totalBalanceUsd = new Intl.NumberFormat('en-US', {
    //   style: 'currency',
    //   currency: 'USD'
    // }).format(allAssets.totalBalanceUsd);
    return walletAssetsSelected;
}
export default getBalanceAnkr;