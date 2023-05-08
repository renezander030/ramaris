import React from 'react'
import { trpc } from '../../../utils/trpc'
import Bot from '../../../components/Bot'


export default function BotsAuthored() {

    // session needed

    const { data, isLoading, isError, isSuccess } = trpc.bot.listAuthored.useQuery()

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

        return (
            <>
                <div className="overflow-x-auto relative shadow-md sm:rounded-lg">

                    {(!data?.bots?.length) ? (
                        <div>Please follow some bot *IMAGE*</div>
                    ) : (
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <tbody>
                                {data?.bots?.map((bot: any) => (
                                    <tr key={bot.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <Bot bot={bot} isUserSignedIn={data.isUserSignedIn} />
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                </div>
            </>
        )
    }
}
BotsAuthored.auth = true