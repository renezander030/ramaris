import React, { useEffect, useState } from 'react'
import { trpc } from '../utils/trpc'
import { useRouter } from 'next/router';
import Image from 'next/image';
import { getSingleUserInput, updateSingleUserSchema } from '../schema/user.schema';
import moment from 'moment'
import Link from 'next/link';
import { useForm, Controller, useWatch, useController, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorMessage } from '@hookform/error-message';
import { ethers, Contract } from 'ethers';
import Wallet from 'ethereumjs-wallet'
import { setLogger } from 'next-auth/utils/logger';
var EthUtil = require('ethereumjs-util');
import { CopyClipboard } from '../components/copyToClipboard';
import QRCode from "react-qr-code";
import { useSession, signIn, signOut, SessionContext } from "next-auth/react"
import { formatCurrencyNoPrefix } from '../utils/formatter';
import { provider } from '../utils/ethers_provider'
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { createServerSideHelpers } from '@trpc/react-query/server';
import superjson from 'superjson';
import { prisma } from '../utils/prisma'
import { getSession } from 'next-auth/react';
import { appRouter } from '../server/routers/_app';

export async function getServerSideProps(context: GetServerSidePropsContext<{ username: string }>) {

  // prefetch to get wallet address, balance
  const session = await getSession({ req: context.req });
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: {
      session: session,
      prisma: prisma
    },
    transformer: superjson, // optional - adds superjson serialization
  });
  const username = context.params?.username?.toString() as string;

  await helpers.user.getSingleUser.prefetch({
    name: username,
    image: ''
  })

  // default balance -.-
  let balanceFormatted = '0.0'

  if (helpers.dehydrate().json.queries[0].state.data && helpers.dehydrate().json.queries[0].state.data.TradingAccount[0]) {
    const walletAddress = helpers.dehydrate().json.queries[0].state.data.TradingAccount[0].ethereum_address

    // get account balance from ethers
    const local_provider = (await provider).provider;
    const local_contract = (await provider).contract;
    const abi_usdt = require('../blockchain/abis/usdt.json')
    const tokenContract = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
    let balance = 0;
    if ((await local_contract).balanceOf(walletAddress)) balance = (await local_contract).balanceOf(walletAddress)
    balanceFormatted = ethers.utils.formatUnits((await balance), 6)
  }

  const data = {
    balance: formatCurrencyNoPrefix.format(parseFloat(balanceFormatted))
  }

  return {
    props: {
      data,
      trpcState: helpers.dehydrate()
    }
  }
}

function UserProfile(props: InferGetServerSidePropsType<typeof getServerSideProps>) {

  let balance: String = ``
  if (props?.data?.balance) balance = `${props?.data?.balance} USDT`

  const [importAccountDialogVisible, setImportAccountDialogVisible] = useState(false)
  const [importMnemonicPhrase, setImportMnemonicPhrase] = useState("")

  const defaultValues = {
    gateio_api_key: "",
    gateio_api_secret: "",
    telegram_chatid: ""
  };
  const methods = useForm({
    mode: 'onChange',
    resolver: zodResolver(updateSingleUserSchema),
    defaultValues
  });

  const handleImportAccount = async (data: any) => {
    importTradingAccount.mutate({
      mnemonic_phrase: importMnemonicPhrase
    })
  }

  const onChangeHandler = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setImportMnemonicPhrase(event.target.value);
  };

  const handleTelegramTest = async (chat_id: string, message: string) => {

    const data = {
      chat_id: chat_id,
      message: message
    }
    const response = await fetch('/api/telegram_sendMessage', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    const json = response.json()
    return json;
  }


  const { data: session } = useSession();

  const generatewallet = trpc.user.createTradingAccount.useMutation({
    onSuccess: (data: any) => {
      refetch()
    }
  })

  const importTradingAccount = trpc.user.importTradingAccount.useMutation({
    onSuccess: (data: any) => {
      refetch()
    }
  })

  const updateTradingAccount = trpc.user.updateTradingAccount.useMutation()
  const deleteTradingAccount = trpc.user.deleteTradingAccount.useMutation({
    onSuccess: (data: any) => {
      refetch()
    }
  })

  const [posSizeLimit, setPosSizeLimit] = useState(1);
  const [maxPositionsPerBotPerDay, setMaxPositionsPerBotPerDay] = useState(3);
  const [maxPositionsPerTokenPerDay, setMaxPositionsPerTokenPerDay] = useState(3);

  const handleAccountDelete = (public_key: string) => {
    console.log("clicked")
    deleteTradingAccount.mutate({ public_key: public_key })
  }

  const handlePosSizeLimitChange = (event: any) => {

    const value = event.target.value;

    setPosSizeLimit(value)
    updateTradingAccount.mutate({
      positionSizePercentage: parseInt(value)
    })
  }

  const handleMaxPositionsPerBotPerDayChange = (event: any) => {

    const value = event.target.value;

    setMaxPositionsPerBotPerDay(value)
    updateTradingAccount.mutate({
      maxPositionsPerBotPerDay: parseInt(value),
    })
  }

  const handleMaxPositionsPerTokenPerDayChange = (event: any) => {

    const value = event.target.value;

    setMaxPositionsPerTokenPerDay(value)
    updateTradingAccount.mutate({
      maxPositionsPerTokenPerDay: parseInt(value)
    })
  }

  const router = useRouter()


  const queryName = router.query.username?.toString() as string


  const { data, isSuccess, isError, refetch } = trpc.user.getSingleUser.useQuery({
    username: queryName
  }, {
    enabled: false
  })

  useEffect(() => {


    const tradingaccount = data?.user?.TradingAccount.at(0)
    if (tradingaccount) {
      if (tradingaccount.positionSizePercentage) {
        setPosSizeLimit(tradingaccount.positionSizePercentage)

      }
      if (tradingaccount.maxPositionsPerBotPerDay) {
        setMaxPositionsPerBotPerDay(tradingaccount.maxPositionsPerBotPerDay)
      }
      if (tradingaccount.maxPositionsPerTokenPerDay) {
        setMaxPositionsPerTokenPerDay(tradingaccount.maxPositionsPerTokenPerDay)
      }
    }

  }, [data?.user?.TradingAccount])

  const onGenerateWallet = async () => {

    // generates wallet using ethersjs
    const defaultWallet = ethers.Wallet.createRandom();

    // derive ethereum address using ethereumjs-wallet and ethereumjs-util
    const privateKeyBuffer = EthUtil.toBuffer(defaultWallet.privateKey);
    const wallet = Wallet.fromPrivateKey(privateKeyBuffer);
    const publicKey = wallet.getPublicKeyString();
    const ethereum_address = wallet.getAddressString();

    const tradingAccount = {
      public_key: publicKey,
      private_key: defaultWallet.privateKey,
      mnemonic_entropy: defaultWallet.mnemonic.path,
      mnemonic_phrase: defaultWallet.mnemonic?.phrase,
      ethereum_address: ethereum_address,
    }

    generatewallet.mutate({
      public_key: tradingAccount.public_key,
      private_key: tradingAccount.private_key,
      mnemonic_phrase: tradingAccount.mnemonic_phrase || "",
      mnemonic_entropy: tradingAccount.mnemonic_entropy || "",
      ethereum_address: tradingAccount.ethereum_address,
    });

  }

  const { mutate, error } = trpc.user.update.useMutation({
    onSuccess: (data: any) => {
      // router.push(`/bots/${data.id}`);

      // show toast: update successful
    },
  });

  const { control, register, handleSubmit, formState: { errors }, reset } = methods;

  const onSubmit = (data: any) => {
    mutate(data)
  };

  const onError = (errors: any) => {
    console.log('ERRORS:', errors);
  };


  useEffect(() => {

    // you can do async server request and fill up form
    reset({
      gateio_api_key: data?.user?.gateio_api_key || "",
      gateio_api_secret: data?.user?.gateio_api_secret || "",
      telegram_chatid: data?.user?.telegram_chatid || ""
    });

  }, [reset, data?.user]);

  // first fetch
  useEffect(() => {
    refetch()
  }, [])


  if (isSuccess) {

    const user = data?.user;

    // let userImage = user?.image

    // place holder
    // if (!userImage) userImage = ""

    if (!user) {
      return (
        <div>user not found</div>
      )
    }


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
        <div className='text-xl'>{user?.name}</div>

        <div>
          created {moment(user?.createdAt).fromNow()}
        </div>
        {/* <div>bybit api key {user?.bybitApiKey}</div> */}


        {/* on-chain trading */}
        {user.name == session?.user?.name && user?.TradingAccount && user?.TradingAccount.length == 0 ? (
          <div className='flex'>
            <div className='mt-6 mb-6 pr-2'>
              <button type="button" className="inline-block px-3 py-2 bg-blue-600 text-white font-medium text-sm leading-tight rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out" onClick={() => { onGenerateWallet() }}>Create Trading Account</button>
            </div>
            <div className='mt-6 mb-6'>
              <button type="button" className="inline-block px-3 py-2 bg-green-600 text-white font-medium text-sm leading-tight rounded shadow-md hover:bg-green-700 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg transition duration-150 ease-in-out" onClick={() => { setImportAccountDialogVisible(true) }}>Import Trading Account</button>
            </div>
          </div>
        ) : (
          <div></div>
        )}

        {
          importAccountDialogVisible ? (
            <div className="block mt-8 mb-8 p-6 rounded-lg shadow-lg bg-white max-w-sm">

              <div className="relative z-0 mb-6 w-full group">
                <input type="text" value={importMnemonicPhrase} onChange={onChangeHandler} name="import_mnemonic" id="import_mnemonic" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                <label htmlFor="import_mnemonic" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Mnemonic Phrase</label>
              </div>

              <div className="mb-6">
                <button type="button" onClick={handleImportAccount} className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">Import</button>
              </div>
            </div>
          ) :
            (
              <div></div>
            )
        }

        {session && user?.TradingAccount?.map((tradingaccount: { public_key: React.Key | null | undefined; ethereum_address: string | number | readonly string[] | undefined; private_key: string | number | readonly string[] | undefined; mnemonic_phrase: string | number | readonly string[] | undefined; trades: any[]; }) => (
          <div key={tradingaccount.public_key}>

            <div className="block p-6 mt-8 mb-8 rounded-lg shadow-lg bg-white max-w-xl">

              <div className='relative z-0 mb-6 w-full group'>
                <button
                  type="button"
                  className="inline-block px-6 py-2.5 bg-red-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg transition duration-150 ease-in-out"
                  onClick={() => { handleAccountDelete(tradingaccount.public_key as string) }}
                >
                  Delete
                </button>
              </div>

              <div className='text-3xl mb-8'>
                {balance}
              </div>

              <div className="relative z-0 mb-6 w-full group">
                <input readOnly value={tradingaccount.ethereum_address} type="text" name="ethereum_address" id="ethereum_address" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                <CopyClipboard content={tradingaccount.ethereum_address} />
                <label htmlFor="ethereum_address" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Ethereum Address</label>
              </div>
              <div className='pb-8'>
                <QRCode className='h-32 w-32' value={tradingaccount.ethereum_address as string} />
              </div>
              <div className="relative z-0 mb-6 w-full group">
                <input readOnly value={tradingaccount.private_key} type="text" name="private_key" id="private_key" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                <CopyClipboard content={tradingaccount.private_key} />
                <label htmlFor="private_key" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Private Key</label>
              </div>
              <div className="relative z-0 mb-6 w-full group">
                <textarea readOnly value={tradingaccount.mnemonic_phrase} name="mnemonic_phrase" id="mnemonic_phrase" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                <label htmlFor="mnemonic_phrase" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Mnemonic Phrase</label>
              </div>
              <div className='pb-8'>
                <QRCode className='h-32 w-32' value={tradingaccount.mnemonic_phrase as string} />
              </div>



              {/* pos size percentage */}
              <div>
                <label
                  htmlFor="posSizeLimit"
                  className="mb-2 inline-block text-neutral-700 dark:text-neutral-200"
                >Position Size Limit %</label
                >
                <input
                  type="range"
                  className="transparent h-1.5 w-full cursor-pointer appearance-none rounded-lg border-transparent bg-neutral-200"
                  min="1"
                  max="100"
                  step="1"
                  value={posSizeLimit}
                  onChange={handlePosSizeLimitChange}
                  id="posSizeLimit" />
                <div className=''>
                  {posSizeLimit}
                </div>
              </div>

              {/* max per bot per day */}
              <div>
                <label
                  htmlFor="maxPositionsPerBotPerDay"
                  className="mb-2 inline-block text-neutral-700 dark:text-neutral-200"
                >Max Positions Per Bot Per Day</label
                >
                <input
                  type="range"
                  className="transparent h-1.5 w-full cursor-pointer appearance-none rounded-lg border-transparent bg-neutral-200"
                  min="1"
                  max="30"
                  step="1"
                  value={maxPositionsPerBotPerDay}
                  onChange={handleMaxPositionsPerBotPerDayChange}
                  id="maxPositionsPerBotPerDay" />
                <div className=''>
                  {maxPositionsPerBotPerDay}
                </div>
              </div>


              {/* max per token per day */}
              <div>
                <label
                  htmlFor="maxPositionsPerTokenPerDay"
                  className="mb-2 inline-block text-neutral-700 dark:text-neutral-200"
                >Max Positions Per Token Per Day</label
                >
                <input
                  type="range"
                  className="transparent h-1.5 w-full cursor-pointer appearance-none rounded-lg border-transparent bg-neutral-200"
                  min="1"
                  max="30"
                  step="1"
                  value={maxPositionsPerTokenPerDay}
                  onChange={handleMaxPositionsPerTokenPerDayChange}
                  id="maxPositionsPerTokenPerDay" />
                <div className=''>
                  {maxPositionsPerTokenPerDay}
                </div>
              </div>


            </div>


            <div>

              {/* trades */}
              <h1 className="inline text-xl font-semibold leading-none">Trades</h1>
              <div className="p-2 mb-8 overflow-x-auto relative shadow-md sm:rounded-lg">
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
                        amount out
                      </th>
                      <th>
                        amount in
                      </th>
                      <th>
                        bot
                      </th>
                      <th>
                        state/error
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradingaccount?.trades?.map((trade) => (
                      <tr key={trade.id}>
                        <td className='lg:py-3 lg:px-1 px-0 font-medium whitespace-nowrap'>
                          {trade?.Position?.actionType}
                        </td>
                        <td className='lg:py-3 lg:px-1 px-2 font-medium whitespace-nowrap'>
                          {moment(trade?.createdAt).fromNow()}
                        </td>
                        {/* calculated position size on bot. calculated from original size * multiplier specified in bot */}
                        <td className='lg:py-3 lg:px-1 px-2 font-medium whitespace-nowrap'>
                          {trade?.Position?.amountOutMin && trade?.tradeSizePercentage && formatCurrencyNoPrefix.format((trade?.Position?.amountOutMin / 100) * trade?.tradeSizePercentage)}
                        </td>
                        <td className='lg:py-3 lg:px-1 px-2 font-medium whitespace-nowrap'>
                          <div className='flex flex-row'>
                            <div className='pr-1'>
                              {trade?.Position?.amountOutMin && formatCurrencyNoPrefix.format(trade?.Position?.amountOutMin)}
                            </div>
                            <div>
                              {trade?.Position?.sentTokenContract.image && trade?.Position?.sentTokenContract?.image != "" ? (
                                <Image
                                  src={trade?.Position?.sentTokenContract?.image}
                                  height="18"
                                  width="18"
                                  className="w-16 h-16 rounded-full"
                                  alt={trade?.Position?.sentTokenContract?.symbol}
                                />
                              ) : (
                                <span>{trade?.Position?.sentTokenContract?.image}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className='min-w-min'>
                          <div className='flex flex-row'>
                            <div className='pr-1'>
                              {trade?.Position?.amountIn}
                            </div>
                            <div>
                              {trade?.Position?.receivedTokenContract.image && trade?.Position?.sentTokenContract?.image != "" ? (
                                <Image
                                  src={trade?.Position?.receivedTokenContract?.image}
                                  height="18"
                                  width="18"
                                  className="w-16 h-16 rounded-full"
                                  alt={trade?.Position?.receivedTokenContract?.symbol}
                                />
                              ) : (
                                <span>{trade?.Position?.receivedTokenContract?.image}</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
        )}

        {/* CEX trading */}
        {/* gate io api key, secret */}

        <FormProvider {...methods} >
          <form
            onSubmit={handleSubmit(onSubmit, onError)}
          >

            {data?.author ? (
              <>
              <div className="block mt-8 mb-8 p-6 rounded-lg shadow-lg bg-white max-w-sm">

                <div className="relative z-0 mb-6 w-full group">
                  <input {...register("gateio_api_key")} type="text" name="gateio_api_key" id="gateio_api_key" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                  <label htmlFor="gateio_api_key" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Gate IO API Key</label>
                </div>
                <div className="relative z-0 mb-6 w-full group">
                  <input {...register("gateio_api_secret")} type="text" name="gateio_api_secret" id="gateio_api_secret" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                  <label htmlFor="gateio_api_secret" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Gate IO API Secret</label>
                </div>

                <div className="mb-6">
                  <button type="submit" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">Update</button>
                </div>

              </div>
              <div className="block mt-8 mb-8 p-6 rounded-lg shadow-lg bg-white max-w-sm">

                <div className="relative z-0 mb-6 w-full group">
                  <input {...register("telegram_chatid")} type="text" name="telegram_chatid" id="telegram_chatid" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
                  <label htmlFor="telegram_chatid" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Telegram Chat ID</label>
                </div>

                <div className="mb-6">
                  <button type="submit" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">Update</button>
                </div>
                <div className="mb-6">
                  <button type="button" onClick={() => { user?.telegram_chatid && handleTelegramTest(user?.telegram_chatid, 'OK') }} className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">Test Connection</button>
                </div>
              </div>
              </>
            ) : (
              <div></div>
            )}

          </form>

        </FormProvider>

        {/* <div>eth addr {user?.ethereumAddress}</div> */}
        {/* <div>{user.}</div> */}
        <div className='text-lg'>
          Bots
        </div>
        <div className='flex flex-row'>
          {(user?.Bot?.map((bot: { id: React.Key | null | undefined; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined; }, index: React.Key | null | undefined) => (
            <div key={bot.id} className='flex'>
              <Link href={`/bots/${bot.id}`}>
                <div
                  className='cursor-pointer p-2 m-4 bg-slate-200'
                  key={index}>{bot.name}</div>
              </Link>
            </div>
          )))}
        </div>

        {user.name == session?.user?.name && session ? (
          <button type="button" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out" onClick={() => signOut()}>Sign out</button>
        ) : (
          <div></div>
        )}

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