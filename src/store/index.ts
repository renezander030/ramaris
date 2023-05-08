import create from 'zustand';
import type { FollowWalletInput } from '../schema/wallet.schema'
import type { FollowBotInput } from '../schema/bot.schema'

interface Store {
    bots: FollowBotInput[];
    AllBots: object[];
    wallets: FollowWalletInput[];
    updateBot: (bots: any) => void;
    updateAllBots: (bots: any) => void;
    updateWallets: (wallets: any) => void;
    followWallet: (id: number) => void;
    unfollowWallet: (id: number) => void;
    followBot: (id: number) => void;
    unFollowBot: (id: number) => void;
    pageLoading: boolean;
    setPageLoading: (isLoading: boolean) => void;
};

const useStore = create<Store>()((set) => ({
    bots: [],
    AllBots: [],
    wallets: [],
    updateBot: (bots: any) =>
        set((state) => ({
            ...state,
            bots
        })),
    updateAllBots: (allBots: any) =>
        set((state) => ({
            ...state,
            allBots
        })),
    updateWallets: (wallets: any) =>
        set((state) => ({
            ...state,
            wallets
        })),
    followWallet: (id: number) =>
        set((state) => ({
            wallets: state.wallets.map((wallet) =>
                wallet.id === id ?
                    ({ ...wallet, StarWallet: [0] })
                    : wallet
            ),
        })),
    unfollowWallet: (id: number) => {
        set((state) => ({
            wallets: state.wallets.map((wallet) =>
                wallet.id === id ?
                    ({ ...wallet, StarWallet: [] })
                    : wallet
            ),
        }));
    },
    followBot: (id: number) => {
        set((state) => ({
            bots: state.bots.map((bot) =>
                bot.id === id ?
                    ({ ...bot, StarBot: [0] })
                    : bot
            ),
        }));
    },
    unFollowBot: (id: number) => {
        set((state) => ({
            bots: state.bots.map((bot) =>
                bot.id === id ?
                    ({ ...bot, StarBot: [] })
                    : bot
            ),
        }));
    },
    pageLoading: false,
    setPageLoading: (isLoading) =>
        set((state) => ({ ...state, pageLoading: isLoading })),
}));

export default useStore;