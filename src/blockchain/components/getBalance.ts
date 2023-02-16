const ALCHEMY_BASE_URL_POLYGON_MAINNET = process.env.ALCHEMY_BASE_URL_POLYGON_MAINNET;
const fetch = require('node-fetch');
import { Token, TokenMeta } from '../types/token';
import getRandomInt from '../utils/getRandomInt';
const polygon_token_list = require("../polygon-token-list.json");
const coingecko_coins_list = require("../coingecko-coins-list.json");

async function getBalance(address: string) {
    const response = await fetch(ALCHEMY_BASE_URL_POLYGON_MAINNET, {
        method: 'POST',
        body: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "alchemy_getTokenBalances",
            "headers": {
                "Content-Type": "application/json"
            },
            "params": [
                `${address}`,
                "erc20",
            ],
            "id": getRandomInt(10000, 100000)
        }),
        redirect: 'follow'
    });

    const data: any = await response.json();
    const balances = data.result;


    // Removes tokens with zero balance
    const nonZeroBalances =
        balances.tokenBalances.filter((token: Token) => {

            // gets decimals, symbol
            const tokenMeta = polygon_token_list.find((tokenMeta: TokenMeta) => tokenMeta.address == token.contractAddress);
            if (tokenMeta && token.tokenBalance) {
                token.balance = token.tokenBalance / Math.pow(10, tokenMeta.decimals);
                token.balance = parseFloat(token.balance.toFixed(2));
                token.tokenSymbol = tokenMeta.symbol;
                token.decimals = tokenMeta.decimals;
            } else {
                token.balance = 0;
            }

            delete token.tokenBalance;

            // manual fix
            // WMATIC token contract
            if (token.contractAddress == "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270") {
                token.tokenSymbol = "WMATIC";
            }

            // coingecko coins list ids for all polygon token list tokens symbols
            token.coingeckoCoinsListId = coingecko_coins_list.find((record: { symbol: string; }) => {
                const match = record.symbol.toUpperCase() == token.tokenSymbol;
                return match;
            });
            if (token.coingeckoCoinsListId) token.coingeckoCoinsListId = token.coingeckoCoinsListId.id;

            return token.balance !== 0;
            // return token;
        });

    // wallet is empty
    if (!nonZeroBalances) return;

    // gets usd price for all tokens in one call
    let tokenSymbolsIds = nonZeroBalances.map((token: Token) => token.coingeckoCoinsListId);

    // ignore stable coins tracking of price
    // splice them out

    tokenSymbolsIds = tokenSymbolsIds.join(",");
    // logger.log('debug',`tokenSymbolsIds ${tokenSymbolsIds}`);

    // only request coingecko data if token symbol could be mapped on the json file , coingecko tokens list
    if (tokenSymbolsIds) {
        const coingeckoBaseUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenSymbolsIds}&vs_currencies=usd`;
        const coingeckoResponse = await fetch(coingeckoBaseUrl);
        const coingeckoData: any = await coingeckoResponse.json();

        // logger.log('debug',`coingeckoData ${JSON.stringify(coingeckoData)}`);

        // map price to original token object
        nonZeroBalances.map((token: { coingeckoCoinsListId: string; balanceUsd: number; balance: number; coingeckoData: string; }) => {

            if (coingeckoData[token.coingeckoCoinsListId]) {
                token.balanceUsd = parseFloat((coingeckoData[token.coingeckoCoinsListId.toLowerCase()].usd * token.balance).toFixed(2));
            } else {
                token.coingeckoData = "no match for coingeckoCoinsListId";
                token.balanceUsd = 0;
            }
            return token;
        });
    } else {
        // just return 0 for further calculations down the road
        nonZeroBalances.map((token: { balanceUsd: number; }) => {
            token.balanceUsd = 0;
            return token;
        });
    }


    const walletAssetsSelected = nonZeroBalances.reduce((allAssets: { totalBalanceUsd: number; tokens: any[]; holderAddress: string; }, asset: { balanceUsd: any; }) => {
        allAssets.totalBalanceUsd = allAssets.totalBalanceUsd || 0;
        allAssets.tokens = allAssets.tokens || [];
        // if (tokenSymbols.find(token => token == asset.tokenSymbol.toLowerCase())) {
        allAssets.tokens.push(asset);
        allAssets.totalBalanceUsd = parseFloat((allAssets.totalBalanceUsd + asset.balanceUsd).toFixed(2));
        allAssets.holderAddress = address;
        // }
        return allAssets;
    }, []);

    return walletAssetsSelected;
}
export default getBalance;