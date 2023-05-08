import React from 'react'
import { trpc } from '../../utils/trpc'
import { useRouter } from 'next/router';
import { shortenTransactionHash, shortenWalletAddress } from '../../utils/shortenAddress';
import { UsersIcon, AcademicCapIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { walletDetailsSnapshotSchema } from '../../schema/walletsnapshot.schema';
import { formatCurrency } from '../../utils/formatter';
import Link from 'next/link';
import { walletDetailsSwapSchema } from '../../schema/swap.schema';
import moment from 'moment';
import Image from 'next/image';
import Swaps from '../../components/Swaps';

export default function WalletDetailsPage() {

    const router = useRouter()

    const walletId = router.query.id?.toString();

    if (!walletId) return (
        <>
            no wallet id provided
        </>
    )

    const { data, isLoading, isError, isSuccess } = trpc.wallet.getSingleWallet.useQuery({ id: parseInt(walletId) })


    if (isLoading) {
        return (
            <>
                Loading...
            </>
        )
    }

    if (isError) {
        return (
            <>
                Error during data fetch
            </>
        )
    }

    if (isSuccess) {

        // latest wallet snapshot
        const latestSnapshot: walletDetailsSnapshotSchema = data?.WalletSnapshots?.at(0) as unknown as walletDetailsSnapshotSchema
        const txHash = latestSnapshot?.discoveredOnTx.toString();

        return (
            <>
                {/* two col layout */}
                <div className='flex flex-row'>

                    {/* left col */}
                    <div className='w-1/3'>
                        <div className="mb-6 inline-flex overflow-hidden relative justify-center items-center w-32 h-32 bg-gray-200 rounded-full dark:bg-gray-600">
                            <span className="text-2xl font-medium text-gray-1200 dark:text-gray-300">
                                0x..{shortenWalletAddress(data?.walletAddress)}
                            </span>
                        </div>

                        {/* core data */}
                        <div className='flex flex-row'>
                            <div className='text-sm flex flex-row pr-1'>
                                <div className='pr-1'>
                                    <UsersIcon className='h-4 w-4 text-gray-500' />
                                </div>
                                <div>
                                    <span className='font-bold'>{data?._count?.StarWallet}</span> following ·
                                </div>
                            </div>
                            <div className='text-sm flex flex-row'>
                                <div className='pr-1'>
                                    <AcademicCapIcon className='h-4 w-4 text-gray-500' title='bots' />
                                </div>
                                <div>
                                    <span className='font-bold'>{data?._count?.bots}</span> following
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* right col */}
                    <div className='w-2/3 flex-wrap'>

                        {/* line 1 */}
                        <div className='mb-1 text-3xl flex flex-row'>
                            <div className='pr-16'>
                                <div className='flex flex-row'>
                                    <div className=''>
                                        <ArrowUpIcon className='h-7 w-7' />
                                    </div>
                                    <div>
                                        {latestSnapshot?.ProfitLossPercentage}%
                                    </div>
                                </div>
                            </div>
                            <div>
                                {/* <div>{latestSnapshot?.totalBalanceTokensUsd}</div> */}
                                {/* <div>{latestSnapshot?.coinBalanceUsd}</div> */}
                                <div>{formatCurrency.format(latestSnapshot?.totalBalanceUsd)}</div>
                            </div>
                        </div>


                        {/* line 2 */}
                        <div className='mb-2 text-lg'>
                            <Link href={`https://polygonscan.com/address/${data?.walletAddress}`}>
                                {data?.walletAddress}
                            </Link>
                        </div>

                        {/* line 3 */}
                        {/*  */}
                        <div className='mb-16 flex flex-row'>
                            <div className='pr-16'>
                                last trade {moment.unix(parseInt(latestSnapshot?.timestamp)).fromNow()}
                            </div>
                            <div>
                                <Link href={`https://polygonscan.com/tx/${latestSnapshot?.discoveredOnTx}`}>
                                    transaction
                                </Link>
                            </div>
                        </div>

                        {/* table tokens */}


                        {/* table swaps */}
                        {/* wallet swaps */}
                        <Swaps swaps={data?.swaps as unknown as walletDetailsSwapSchema[]}/>
                    </div>
                </div>
            </>
        )

    }
}