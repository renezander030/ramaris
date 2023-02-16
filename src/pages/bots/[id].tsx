import React from 'react'
import { trpc } from '../../utils/trpc'
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm, Controller, useWatch, useController, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import WalletSearch from '../../components/WalletSearch';
import BotSearch from '../../components/BotSearch';
import { updateBotSchema } from '../../schema/bot.schema';
import moment from 'moment';
import Image from 'next/image';
import { formatCurrencyNoPrefix } from '../../utils/formatter';

export default function BotDetailsPage() {

    const methods = useForm({
        mode: 'onChange',
        resolver: zodResolver(updateBotSchema)
    });
    const { control, register, handleSubmit, formState: { errors } } = methods;

    const router = useRouter()
    const botId = router.query.id?.toString();

    if (!botId) return (
        <>
            no bot id provided
        </>
    )

    const { data, isError, isLoading, isSuccess } = trpc.bot.getSingleBot.useQuery({ id: parseInt(botId) })
    const deleteBot = trpc.bot.delete.useMutation({
        onSuccess() {
            router.push(`/browse/bots/authored`)
        },
    })


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

    function handleDelete(id: number | undefined) {
        if(id) {
            deleteBot.mutate({ id: id })
        }
    }
    const onError = (errors: any) => {
        console.log('ERRORS:', errors);
    };

    const onSubmit = (data: any) => {
        console.log('DATA:', data);
    };
    

    if (isSuccess) {

        const { bot, user, botIsAuthoredByThisUser } = data;

        const creatorUrl = `/${bot?.creator?.name}`;

        return (
            <>
                <FormProvider {...methods} >
                    <form
                        onSubmit={handleSubmit(onSubmit, onError)}
                    >

                        <h1>Bot Details</h1>
                        {/* {JSON.stringify(bot)} */}

                        {botIsAuthoredByThisUser ? (
                            <button
                                type="submit"
                                className="inline-block px-6 py-2.5 bg-red-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg transition duration-150 ease-in-out"
                                onClick={() => handleDelete(bot?.id)}
                                disabled={deleteBot.isLoading}
                            >
                                Delete
                            </button>
                        ) : (
                            <div></div>
                        )}

                        <div>id {bot?.id}</div>

                        {/* core data */}
                        <div>{bot?.name}</div>
                        <div>{bot?.blacklistProtocols}</div>
                        <div>{bot?.blacklistTokens}</div>
                        <div>{bot?.gasValue}</div>
                        <div>{bot?.hours}</div>
                        <div>{bot?.positionSizePercentage}</div>
                        <div>{bot?.shareId}</div>
                        <div>{bot?.state}</div>
                        <div>{bot?.stoplossPercentage}</div>
                        <div>{bot?.takeprofitPercentage}</div>
                        <div>{bot?.transactionValue}</div>
                        <div>{bot?.weekdays}</div>
                        <div>{bot?.whitelistTokens}</div>

                        {/* just counts */}
                        {/* <div>{bot?._count.wallets}</div>
                        <div>{bot?._count.botsFollowedBy}</div>
                        <div>{bot?._count.botsFollowing}</div>
                        <div>{bot?._count.StarBot}</div> */}

                        {/* actions */}
                        {bot?.actions?.map((action) => (
                            <div key={action?.Action?.id}>
                                <div>{action.Action?.name}</div>
                            </div>
                        ))}

                        {/* creator */}
                        <a className="underline" href={creatorUrl}>{bot?.creator?.name}</a>

                        {/* wallets this bot follows */}
                        <div className="mb-6">
                            <label>followed wallets:</label>
                            {bot?.wallets?.map((wallet) => (
                                <div key={wallet.walletId}>
                                    <Link href={`/wallets/${wallet.walletId}`}>
                                        {wallet.Wallet?.walletAddress}
                                    </Link>
                                </div>
                            ))}
                        </div>
                        {botIsAuthoredByThisUser ? (
                            <WalletSearch />
                        ) : (
                            <div></div>
                        )}

                        {/* bots this bot follows */}
                        <div className='mb-6'>
                            <label>followed bots:</label>
                            {bot?.botsFollowing?.map((botFollowing) => (
                                <div key={botFollowing.id}>
                                    <Link href={`/bots/${botFollowing.id}`}>
                                        {botFollowing.name}
                                    </Link>
                                </div>

                            ))}
                        </div>
                        {botIsAuthoredByThisUser ? (
                            <BotSearch />
                        ):(
                            <div></div>
                        )}

                        {/* positions */}
                        <h1>Positions</h1>
                        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
                            <table className="table-fixed w-full text-tiny text-left text-gray-500 dark:text-gray-400">
                                <thead>
                                    <tr>
                                        <th>
                                            type
                                        </th>
                                        <th>
                                            created at
                                        </th>
                                        <th>
                                            position size
                                        </th>
                                        <th>
                                            takeprofit
                                        </th>
                                        <th>
                                            stoploss
                                        </th>
                                        <th>
                                            amount out
                                        </th>
                                        <th>
                                            amount in
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bot?.positions?.map((position) => (
                                        <tr key={position.id}>
                                            <td className='lg:py-3 lg:px-1 px-0 font-medium whitespace-nowrap'>
                                                {position.actionType}
                                            </td>
                                            <td className='lg:py-3 lg:px-1 px-2 font-medium whitespace-nowrap'>
                                                {moment(position.createdAt).fromNow()}
                                            </td>
                                            {/* calculated position size on bot. calculated from original size * multiplier specified in bot */}
                                            <td className='lg:py-3 lg:px-1 px-2 font-medium whitespace-nowrap'>
                                                {formatCurrencyNoPrefix.format((position.amountOutMin / 100) * position.positionSizePercentage)}
                                            </td>
                                            <td>
                                                {position.takeprofitPercentage}
                                            </td>
                                            <td className='lg:py-3 lg:px-1 px-2 font-medium whitespace-nowrap'>
                                                {position.stoplossPercentage}
                                            </td>
                                            <td className='lg:py-3 lg:px-1 px-2 font-medium whitespace-nowrap'>
                                                <div className='flex flex-row'>
                                                    <div className='pr-1'>
                                                        {formatCurrencyNoPrefix.format(position.amountOutMin)}
                                                    </div>
                                                    <div>
                                                        {position.sentTokenContract?.image != "" ? (
                                                            <Image
                                                                src={position.sentTokenContract?.image}
                                                                height="18"
                                                                width="18"
                                                                className="w-16 h-16 rounded-full"
                                                                alt={position.sentTokenContract?.symbol}
                                                            />
                                                        ) : (
                                                            <span>{position.sentTokenContract?.image}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='min-w-min'>
                                                <div className='flex flex-row'>
                                                    <div className='pr-1'>
                                                        {position.amountIn}
                                                    </div>
                                                    <div>
                                                        {position.sentTokenContract?.image != "" ? (
                                                            <Image
                                                                src={position.receivedTokenContract?.image}
                                                                height="18"
                                                                width="18"
                                                                className="w-16 h-16 rounded-full"
                                                                alt={position.receivedTokenContract?.symbol}
                                                            />
                                                        ) : (
                                                            <span>{position.receivedTokenContract?.image}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </form>
                </FormProvider>
            </>
        )
    }


}