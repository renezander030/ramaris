export const shortenTransactionHash = (hash: string) => {
    if (hash) {
        return `0x..${hash.slice(hash.length - 4)}`;
    } else {
        return hash;
    }
};