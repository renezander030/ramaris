export type Token = {
    decimals: number;
    contractAddress: string;
    balance: number;
    tokenBalance?: number;
    tokenSymbol: string;
    coingeckoCoinsListId: { id: any; };
}

export type TokenMeta = {
    address: string;
}
