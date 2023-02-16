import React from "react";
import { trpc } from '../utils/trpc';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { shortenName } from "../utils/shortenAddress";
import moment from "moment";
import { StarIcon, UsersIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react';
import { listBotSchema } from "../schema/bot.schema";

export default function Bot({ bot, isUserSignedIn }: { bot: listBotSchema, isUserSignedIn: boolean | undefined }) {


    // update database
    const utils = trpc.useContext();
    const followBot = trpc.bot.follow.useMutation({
        onError: ((error) => {
            console.log(`ERROR ${error}`)
        }),
        onSuccess: ((data) => {
            setFollowState(true)
            setStarBot(follows => follows + 1)
        })
    })
    const unfollowBot = trpc.bot.unfollow.useMutation({
        onError: ((error) => {
            console.log(`ERROR ${error}`)
        }),
        onSuccess: ((data) => {
            setFollowState(false);
            setStarBot(follows => follows - 1)
        })
    })

    // track follow state, amount of follows per bot
    const [followState, setFollowState] = useState<Boolean>(false)
    const [starBot, setStarBot] = useState<number>(bot?._count?.StarBot)

    // update bot follow state when the page is first loaded
    useEffect(() => {

        if (bot?.StarBot && bot?.StarBot?.length >= 1) setFollowState(true)
        setStarBot((follows) => follows = bot?._count?.StarBot)
    }, [bot?.StarBot?.length, bot?._count?.StarBot])


    function handleFollow() {
        followBot.mutate(bot)
    }

    function handleUnfollow() {
        unfollowBot.mutate(bot)
    }

    const creatorUrl = `/${bot.creator?.name}`;
    const detailsUrl = `/bots/${bot.id}`;

    return (
        <>
            <td scope="row" className="w-1/4 py-4 lg:px-6 px-2 font-medium whitespace-nowrap">
                <Link href={detailsUrl}>
                    <div className="cursor-pointer inline-flex overflow-hidden relative justify-center items-center w-16 h-16 bg-gray-200 rounded-full dark:bg-gray-600">
                        <span className="font-medium text-gray-1200 dark:text-gray-300"></span>
                    </div>
                </Link>
            </td>
            <td className="w-1/2 py-4 px-6">

                {/* Created by <Link className="underline" href={creatorUrl}>{bot.creator?.name}</Link> */}

                <div>
                    {/* line 1 */}
                    <div className="flex mb-4 font-bold lg:text-lg sm:text-sm">
                        <Link href={detailsUrl}>
                            <div className="h-3 cursor-pointer">
                                {shortenName(bot.name)}
                            </div>
                        </Link>
                    </div>

                    {/* line 2 */}
                    {/* trades - only show if trades exist (hasTrades count prop to minimize db queries) */}
                    <div>
                        {bot?.positions?.map((position: { createdAt: Date; id: React.Key | null | undefined; }) => (
                            <div key={position.id}>
                                last trade {moment(position.createdAt).fromNow()}
                            </div>
                        ))}
                    </div>
                </div>
            </td>

            <td className="w-1/4 py-4 lg:px-6 px-2">

                {/* depending on signed in state show follow feature or alt icon */}
                {isUserSignedIn ? (
                    <div className="flex flex-row">
                        <div className="text-lg pr-1">
                            {starBot}
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
                        <div className="text-lg pr-1">
                            {starBot}
                        </div>
                        <div>
                            <UsersIcon className="h-6 w-6 text-gray-500" />
                        </div>
                    </div>
                )}
            </td>
            {/* <td className="w-1/4 py-4 px-6">
                <Link className="underline" href={detailsUrl}>Details</Link>
            </td> */}
            {/* <td> */}
            {/* bot follow state */}
            {/* {bot.StarBot?.length ? (
                    <button className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out" onClick={handleUnfollow}>Unfollow</button>
                ) :
                    (
                        <button className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out" onClick={handleFollow}>Follow</button>
                    )
                } */}
            {/* </td> */}
        </>
    );
};