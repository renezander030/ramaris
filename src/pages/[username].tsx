import React from 'react'
import { trpc } from '../utils/trpc'
import { useRouter } from 'next/router';
import Image from 'next/image';
import { getSingleUserInput } from '../schema/user.schema';
import moment from 'moment'
import Link from 'next/link';

function UserProfile() {

    const router = useRouter()
    const queryName = router.query.username?.toString()


    if (!queryName) return (
        <>
            no username provided
        </>
    )

    const { data, isSuccess, isError } = trpc.user.getSingleUser.useQuery({
        name: queryName,
        image: ''
    })

    if (isSuccess) {

        const user = data as getSingleUserInput;

        // let userImage = data?.image

        // place holder
        // if (!userImage) userImage = ""



        return (
            <>

                {user?.image ? (
                    <Image
                        src={user?.image}
                        height="144"
                        width="144"
                        className="w-36 h-36 rounded-full"
                        alt="Default avatar"
                    />

                ) : (
                    <div className="inline-flex overflow-hidden relative justify-center items-center w-36 h-36 bg-gray-100 rounded-full dark:bg-gray-600">
                        <span className="font-medium text-gray-1200 dark:text-gray-300"></span>
                    </div>

                )}
                <div className='text-xl'>{data?.name}</div>

                <div>
                    created {moment(data?.createdAt).fromNow()}
                </div>
                {/* <div>bybit api key {data?.bybitApiKey}</div> */}
                {/* <div>eth addr {data?.ethereumAddress}</div> */}
                {/* <div>{data.}</div> */}
                <div className='text-lg'>
                    Bots
                </div>
                <div className='flex flex-row'>
                    {(data?.Bot?.map((bot, index) => (
                        <div key={bot.id} className='flex'>
                            <Link href={`/bots/${bot.id}`}>
                                <div
                                    className='cursor-pointer p-2 m-4 bg-slate-200'
                                    key={index}>{bot.name}</div>
                            </Link>
                        </div>
                    )))}
                </div>
            </>
        )
    }
    if (isError) {
        return (
            <>
                error getting data
            </>
        )
    }
}

export default UserProfile