import { prisma } from './services/prisma';

let contract = {
    // in token contract table tokenaddress is unique. however, pgsql is case-sensitive here so this fixes this.
    contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8G'.toLowerCase(),
    name: 'name',
    symbol: 'USDT',
    decimals: 6,
    image: '',
    mcap: 0,
    chain: 'polygon'
}

type Contract = {
    contractAddress: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
    mcap: number;
    chain: string;
}

async function createTokenContract(contract: Contract) {
    return await prisma.$transaction(async (swapInsert) => {

        // 1. create both token contracts (sent/rec)
        const sentTokenContract = await swapInsert.tokenContract.upsert({
            where: {
                contractAddress: contract.contractAddress
            },
            update: contract,
            create: contract
        });

        // in both cases - insert or "update" we should return with ids
        console.log(JSON.stringify(sentTokenContract))
        
        // result: in both cases we get the same ID (inserted new, or already existing)
        // {"id":27,"contractAddress":"0xc2132d05d31c914a87c6611c10748aeb04b58e8g","name":"name","symbol":"USDT","decimals":6,"image":"","mcap":0,"chain":"polygon","createdAt":"2023-01-08T10:01:00.798Z"}

    });
};

createTokenContract(contract).then(async () => {
    prisma.$disconnect
})