import logger from './logger';
const fetch = require('node-fetch');
import getRandomInt from '../utils/getRandomInt';
import { api_endpoint } from '../app';


async function getTransactionAlchemy(hash: string) {
    /*
        required outputs
    
            method
            -method.name.match swap
            -method inputs valuedecoded = sent token contract, rec token contr., amountIn, amountOutMin
            from
            ---save a query to ethers: ask local db for decimals on token contract if already stored
    */

    let body = {
        "id": getRandomInt(10000, 100000),
        "jsonrpc": "2.0",
        "method": "ankr_getTransactionsByHash",
        "params": {
            "blockchain": [
                "polygon"
            ],
            "decodeLogs": true,
            "decodeTxData": true,
            "includeLogs": false,
            "transactionHash": hash
        }
    };
    const response: any = await fetch(api_endpoint, {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': process.env.ANKR_API_KEY
        }
    });

    const data: any = await response.json();

    if (!data.result) {
        logger.log('debug', `W getTransaction() no data.result: ${JSON.stringify(data)}`);
    }

    return data.result.transactions;
}
