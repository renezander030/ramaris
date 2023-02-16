import getRandomInt from '../utils/getRandomInt'
import logger from '../components/logger'
import AnkrProvider from '@ankr.com/ankr.js';
const providerAnkrJS = new AnkrProvider(process.env.ANKR_API_KEY);

// https://www.ankr.com/docs/build-blockchain/products/advanced-apis/query-api/#ankr_gettransactionsbyhash
async function getTransaction(hash: string) {

    let body = {
        "id": getRandomInt(100000, 1000000),
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

    const transactions = async () => {
        try {
            return await providerAnkrJS.getTransactionsByHash({
                transactionHash:
                    hash,
                decodeTxData: true,
            });
        }
        catch (error) {
            logger.error(`E error getting tx details for hash`);
            return;
        }
    };
    const data = await transactions()

    if (!data) {
        logger.log('debug', `W getTransaction() no data.result: ${JSON.stringify(data)}`);
    }

    if (!data?.transactions) {
        logger.log('debug', `W getTransaction() no tx data received ${JSON.stringify(data)}`)
        return;
    }

    return data?.transactions[0];
}

export default getTransaction;