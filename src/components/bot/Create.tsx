import React, { useState, useRef, useReducer, useEffect } from 'react';
import { trpc } from '../../utils/trpc';
import WalletSearch from '../WalletSearch';
import BotSearch from '../BotSearch';
import { useForm, Controller, useWatch, useController, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateBotInput, createBotSchema } from '../../schema/bot.schema'
import MultiRangeSlider from '../RangeSlider';
import RangeSlider from '../rangeslider2';
import dynamic from "next/dynamic"
import { CopyClipboard } from '../copyToClipboard';
import ActionSearch from '../ActionSearch';
import { ErrorMessage } from '@hookform/error-message';
import { useRouter } from 'next/router'

export default function Create() {

    const router = useRouter();

    function getRandomArbitrary(min: any, max: any) {
        return (Math.random() * (max - min) + min).toFixed(0);
    }

    let [shareId, setShareId] = useState(getRandomArbitrary(1000, 10000));
    const [hours, setHours] = useState([8, 17]);

    const defaultValues = {
        name: "My Bot",
        shareId: shareId,
        // state: true,
        wallets: [],
        // botsFollowing: [],
        blacklistProtocols: [],
        blacklistTokens: [],
        whitelistTokens: [],
        hours: hours,
        transactionValue: [1, 2],
        // weekdays: [0, 4],
        gasValue: [0, 1, 2],
        actions: [
            { id: 1, name: "Telegram Notification" }
        ],
        positionSizePercentage: 1
    };

    // function handleChangeHours(value: unknown) {
    //     console.log(`new hours ${value.target.value}`)
    // }

    const methods = useForm({
        mode: 'onChange',
        resolver: zodResolver(createBotSchema),
        defaultValues
    });
    const { control, register, handleSubmit, formState: { errors } } = methods;

    const onSubmit = (data: any) => {
        mutate(data)
        setShareId(getRandomArbitrary(1000, 10000));
    };

    const onError = (errors: any) => {
        console.log('ERRORS:', errors);
    };

    const { mutate, error } = trpc.bot.create.useMutation({
        onSuccess: (data) => {
            router.push(`/bots/${data.id}`);
        },
    });

    return (
        <>
            <div className="block p-6 rounded-lg shadow-lg bg-white max-w-sm">

                <FormProvider {...methods} >
                    <form
                        onSubmit={handleSubmit(onSubmit, onError)}
                    >
                        {/* triggers */}
                        {/* ====================== */}
                        <div className="flex mb-6">
                            <h1 className="inline text-1xl font-semibold leading-none">Triggers</h1>
                        </div>
                        {/* bot name */}
                        {/* input */}
                        <div className="relative z-0 mb-6 w-full group">
                            <input {...register("name")} type="text" name="name" id="name" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                            <label htmlFor="name" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Bot Name</label>
                        </div>

                        {/* share id */}
                        {/* input */}
                        <div className="relative z-0 mb-6 w-full group">
                            <input disabled {...register("shareId")} type="text" name="shareId" id="shareId" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                            <CopyClipboard content={shareId} />
                            <label htmlFor="shareId" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Share ID</label>
                        </div>

                        {/* <div className="mb-6 relative">
                            <input type="search" id="search" class="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Copy" required />
                            <CopyClipboard content={shareId} />
                        </div> */}

                        {/* follow wallets */}
                        {/* select + data feed fulltext search */}
                        <div className="mb-6">
                            <WalletSearch />
                        </div>

                        {/* follow bots */}
                        {/* select + data feed fulltext search */}
                        <div className="mb-6">
                            <BotSearch />
                        </div>


                        {/* all advanced settings disabled for v0.1 */}
                        {/* <div className="mb-6">
                            FROM HERE ALL ADVANCED SETTINGS, Click More To See..
                        </div> */}

                        {/* week days */}
                        {/* slider */}
                        {/* <label htmlFor="steps-range" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Week days</label>
                        <div className="mb-16">
                            <Controller
                                control={control}
                                name="weekdays"
                                render={({
                                    field: { onChange, onBlur, value, name, ref },
                                    fieldState: { invalid, isTouched, isDirty, error },
                                    formState
                                }) => <MultiRangeSlider min={1} max={7} onChange={onChange} />}
                            />
                        </div> */}



                        {/* hours */}
                        {/* slider */}
                        {/* <RangeSlider /> */}


                        {/* <h4>marks & step</h4>
                        <Slider marks={marks} step={10} defaultValue={37} /> */}

                        {/* <div className="mb-6">
                            <label htmlFor="steps-range" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Hours</label>
                            <input
                                id="steps-range"
                                type="range"
                                min="0"
                                max="5"
                                defaultValue={"2.5"}
                                onChange={handleChangeHours}
                                step="0.5"
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                        </div> */}

                        {/* tokens whitelist/blacklist */}
                        {/* select + data feed fulltext search */}

                        {/* protocols whitelist/blacklist */}
                        {/* select + data feed fulltext search */}

                        {/* tx value */}
                        {/* slider */}
                        {/* <div className="mb-6">
                            <label htmlFor="steps-range" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">TX value</label>
                            <input id="steps-range" type="range" min="0" max="5" value="2.5" step="0.5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                        </div> */}

                        {/* gas value */}
                        {/* slider */}
                        {/* <label htmlFor="steps-range" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Gas Price</label>
                        <input id="steps-range" type="range" min="0" max="5" value="2.5" step="0.5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" /> */}

                        {/* actions */}
                        {/* ====================== */}
                        <div className="mb-6">
                            <h1 className="inline text-1xl font-semibold leading-none">Actions</h1>
                        </div>
                        {/* pos size */}
                        {/* slider */}
                        {/* <div className="mb-6">
                            <label htmlFor="steps-range" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Position Size</label>
                            <input id="steps-range" type="range" min="0" max="5" value="2.5" step="0.5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                        </div> */}

                        {/* take profit */}
                        {/* buttons with % 5-75 + input */}

                        {/* <div className="mb-6">
                            <label htmlFor="steps-range" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Take Profit</label>
                            <ul className="grid gap-4 w-full md:grid-cols-2">
                                <li>
                                    <input type="radio" id="tp25" name="tp25" value="tp25" className="hidden peer" />
                                    <label htmlFor="tp25" className="inline-flex justify-between items-center p-3 w-full text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                                        <div className="block">
                                            <div className="w-full">25%</div>
                                        </div>
                                    </label>
                                </li>
                                <li>
                                    <input type="radio" id="tp50" name="tp50" value="tp50" className="hidden peer" />
                                    <label htmlFor="tp50" className="inline-flex justify-between items-center p-3 w-full text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                                        <div className="block">
                                            <div className="w-full">50%</div>
                                        </div>
                                    </label>
                                </li>
                                <li>
                                    <input type="radio" id="tp75" name="tp75" value="tp75" className="hidden peer" />
                                    <label htmlFor="tp75" className="inline-flex justify-between items-center p-3 w-full text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                                        <div className="block">
                                            <div className="w-full">75%</div>
                                        </div>
                                    </label>
                                </li>
                                <li>
                                    <input type="radio" id="tp100" name="tp100" value="tp100" className="hidden peer" />
                                    <label htmlFor="tp100" className="inline-flex justify-between items-center p-3 w-full text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                                        <div className="block">
                                            <div className="w-full">100%</div>
                                        </div>
                                    </label>
                                </li>
                            </ul>
                        </div> */}

                        {/* stoploss */}
                        {/* buttons with % 5-75 + input */}
                        {/* <label htmlFor="steps-range" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Stoploss</label>
                        <ul className="grid gap-4 w-full md:grid-cols-2">
                            <li>
                                <input type="radio" id="sl25" name="sl25" value="sl25" className="hidden peer" />
                                <label htmlFor="sl25" className="inline-flex justify-between items-center p-3 w-full text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                                    <div className="block">
                                        <div className="w-full">25%</div>
                                    </div>
                                </label>
                            </li>
                            <li>
                                <input type="radio" id="sl50" name="sl50" value="sl50" className="hidden peer" />
                                <label htmlFor="sl50" className="inline-flex justify-between items-center p-3 w-full text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                                    <div className="block">
                                        <div className="w-full">50%</div>
                                    </div>
                                </label>
                            </li>
                            <li>
                                <input type="radio" id="sl75" name="sl75" value="sl75" className="hidden peer" />
                                <label htmlFor="sl75" className="inline-flex justify-between items-center p-3 w-full text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                                    <div className="block">
                                        <div className="w-full">75%</div>
                                    </div>
                                </label>
                            </li>
                            <li>
                                <input type="radio" id="sl100" name="sl100" value="sl100" className="hidden peer" />
                                <label htmlFor="sl100" className="inline-flex justify-between items-center p-3 w-full text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
                                    <div className="block">
                                        <div className="w-full">100%</div>
                                    </div>
                                </label>
                            </li>
                        </ul> */}

                        {/* actions to take */}
                        {/* select + data feed */}
                        <div className="mb-6">
                            <ActionSearch />

                        </div>
                        <ErrorMessage errors={errors} name="actions" message="This is required" />

                        {/* form submit button */}
                        {/* button */}
                        {/* <button type="submit" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">Create</button> */}
                        <div className="mb-6">
                            <button type="submit" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">Create</button>
                        </div>
                    </form>
                </FormProvider>
            </div>
        </>
    )
}