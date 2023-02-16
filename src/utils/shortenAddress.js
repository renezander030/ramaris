export const shortenAddress = (address) => {
    if (address) {
        return `${address.slice(0, 5)}...${address.slice(address.length - 4)}`;
    } else {
        return address;
    }
};
export const shortenWalletAddress = (address) => {
    if (address) {
        return `${address.slice(address.length - 4)}`;
    } else {
        return address;
    }
};

export const shortenTransactionHash = (hash) => {
    if (hash) {
        return `0x..${hash.slice(hash.length - 12)}`;
    } else {
        return hash;
    }
};

export const shortenName = (name) => {
    const maxLength=14;
    if (name) {
        if(name.length>maxLength) return `${name.slice(0, maxLength)}...`;
        else return `${name.slice(0, maxLength)}`;
    } else {
        return name;
    }
};

export const shortenAmount = (amount) => {
    const maxLength=14;
    if (amount) {
        if(amount.length>maxLength) return `${amount.slice(0, maxLength)}...`;
        else return `${amount.slice(0, maxLength)}`;
    } else {
        return amount;
    }
};