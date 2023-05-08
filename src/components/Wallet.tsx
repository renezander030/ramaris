// import React from "react";
import { trpc } from '../utils/trpc';
import 'react-toastify/dist/ReactToastify.css';
import { shortenWalletAddress } from '../utils/shortenAddress';
import Link from 'next/link';
import moment from 'moment'
import { formatCurrency } from '../utils/formatter'
import { StarIcon, UsersIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react';

export default function Wallet({ wallet, userIsSignedIn }: { wallet: any, userIsSignedIn: Boolean | undefined }) {


    // update database
    const utils = trpc.useContext();
    const followWallet = trpc.wallet.follow.useMutation({
        onError: ((error) => {
            console.log(`error updating the follow state`)
        }),
        onSuccess: ((data) => {
            setFollowState(true)
            setStarWallet(follows => follows + 1)
        })
    })
    const unfollowWallet = trpc.wallet.unfollow.useMutation({
        onError: ((error) => {
            console.log(`error updating the follow state`)
        }),
        onSuccess: ((data) => {
            setFollowState(false)
            setStarWallet(follows => follows - 1)
        })
    })

    // track follow state, amount of follows per wallet for live update
    const [followState, setFollowState] = useState<Boolean>(false)
    const [starWallet, setStarWallet] = useState<number>(wallet._count?.StarWallet)

    // update wallet follow state when the page is first loaded
    useEffect(() => {
        if (wallet.StarWallet?.length >= 1) setFollowState(true)
        setStarWallet((follows) => follows = wallet._count?.StarWallet)
    }, [wallet.StarWallet?.length, wallet._count?.StarWallet])

    function handleFollow() {
        followWallet.mutate(wallet)
    }

    function handleUnfollow() {
        unfollowWallet.mutate(wallet)
    }

    const walletDetailsUrl = `/wallets/${wallet.id}`


    // show different when user is signed in
    // show wallet follow feature
    return (
        <>
            {/* {JSON.stringify(wallet)} */}
            <td scope="row" className="w-1/4 lg:py-3 lg:px-6 px-2 font-medium whitespace-nowrap">
                <Link href={walletDetailsUrl}>
                    <div className="cursor-pointer inline-flex overflow-hidden relative justify-center items-center w-16 h-16 bg-gray-200 rounded-full dark:bg-gray-600">
                        <span className="text-sm text-gray-1200 dark:text-gray-300">0x..{shortenWalletAddress(wallet.walletAddress)}</span>
                    </div>
                </Link>
            </td>
            <td className="w-1/2 py-4 px-6">
                {/* latest wallet snapshot details */}
                {wallet.WalletSnapshots?.map((snapshot: any, i: any) => (
                    <div key={i}>

                        {/* line 1 */}
                        <div className="flex mb-4 lg:text-lg sm:text-sm">
                            <div className="w-1/12 h-3 pr-20 sm:pr-24">
                                <div className="flex flex-row">
                                    <div className="w-12">
                                        {snapshot?.ProfitLossPercentage >= 0 ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                                                <path d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                                                <path d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="w-12 min-w-0">
                                        {snapshot?.ProfitLossPercentage}%

                                    </div>
                                </div>
                            </div>
                            <div className="w-1/4 h-3">
                                {formatCurrency.format(snapshot?.totalBalanceUsd)}
                            </div>
                        </div>

                        {/* line 2 */}
                        {/* trades - only show if trades exist (hasTrades count prop to minimize db queries) */}
                        <div>
                            last swap {moment(snapshot.createdAt).fromNow()}
                        </div>
                    </div>
                ))}
            </td>
            <td className="w-1/4 py-4 px-6">

                {/* depend on sign in state show diff icon/follow feature */}
                {userIsSignedIn ? (
                    <div className="flex flex-row">
                        <div className="pr-1 text-lg">
                            {starWallet}
                        </div>
                        <div>
                            {/* wallet follow state */}
                            {followState ? (
                                <StarIconSolid className="cursor-pointer h-6 w-6 text-gray-500" onClick={handleUnfollow} />
                            ) :
                                (
                                    <StarIcon className="cursor-pointer h-6 w-6 text-gray-500" onClick={handleFollow} />
                                )
                            }
                        </div>
                    </div>
                ) : (

                    <div className="flex flex-row">
                        <div className="pr-1 text-lg">
                            {starWallet}
                        </div>
                        <div>
                            <UsersIcon className="h-6 w-6 text-gray-500" />
                        </div>
                    </div>
                )}
            </td>
        </>
    )
};
