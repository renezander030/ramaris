import React from 'react'
import { walletDetailsSwapSchema } from '../schema/swap.schema'
import Image from 'next/image'
import Link from 'next/link'

export default function Swaps({ swaps }: { swaps: walletDetailsSwapSchema[] }) {

    return (
        <div className="mt-6 overflow-x-auto relative shadow-md sm:rounded-lg">
            <table className="table-fixed w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <tbody>
                    <tr>
                        <th>
                            sent
                        </th>
                        <th>
                            received
                        </th>
                        <th>
                            tx link
                        </th>
                    </tr>
                    {swaps?.map((swap) => (
                        <tr key={swap.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <td>
                                {/* one swap can have multiple tokens being sent, right now only first token is considered */}
                                <div>{swap.amountIn.toFixed(0)}
                                    {swap.SentTokenContract?.map((sentTokenContract) => (
                                        <div key={sentTokenContract.TokenContract.contractAddress}>
                                            {sentTokenContract.TokenContract?.symbol}
                                        </div>
                                    ))}
                                </div>
                            </td>
                            <td>
                                {/* one swap can have multiple tokens being sent, right now only first token is considered */}
                                <div className='flex flex-row'>
                                    <div className='pr-1'>
                                        {swap.amountOutMin.toFixed(0)}
                                    </div>
                                    {swap.ReceivedTokenContract?.map((receivedTokenContract) => (
                                        <div key={receivedTokenContract.TokenContract.contractAddress}>
                                            <div className='pr-1'>
                                                {receivedTokenContract.TokenContract?.symbol}
                                            </div>
                                            <div className=''>

                                            </div>
                                            {receivedTokenContract.TokenContract?.image != "" ? (
                                                <Image src={receivedTokenContract.TokenContract?.image}
                                                    height="16"
                                                    width="16"
                                                    className="w-36 h-36 rounded-full"
                                                    alt="Default avatar"
                                                />
                                            ) : (
                                                <div></div>
                                            )}
                                        </div>
                                    ))}

                                </div>
                            </td>
                            <td>
                                <Link href={`https://polygonscan.com/tx/${swap.transactionHash}`}>Transaction</Link>
                            </td>
                            {/* <td>
                                    <div>{swap.contract?.contractAddress}</div>
                                </td>
                                <td>
                                    <div>{swap.cumulativeGasUsed} {swap.gas}</div>
                                </td>
                                <td>
                                    <div>{swap.timestamp}</div>
                                </td>
                                <td>
                                    <div>{swap.transactionHash}</div>
                                </td> */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}