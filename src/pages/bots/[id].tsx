import React, { useEffect, useState } from 'react'
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
import { CopyClipboard } from '../../components/copyToClipboard';
import { valueContainerCSS } from 'react-select/dist/declarations/src/components/containers';
import { boolean, number } from 'zod';
import ActionSearch from '../../components/ActionSearch';
import { ErrorMessage } from '@hookform/error-message';

export default function BotDetailsPage() {

  const [copyIsEnabled, setCopyIsEnabled] = useState(false);

  const methods = useForm({
    mode: 'onChange',
    resolver: zodResolver(updateBotSchema)
  });
  const { control, register, handleSubmit, formState: { errors }, reset, setValue } = methods;

  const router = useRouter()
  const botId = router.query.id?.toString() as string;


  const { data, isError, isLoading, isSuccess } = trpc.bot.getSingleBot.useQuery({ id: parseInt(botId) })

  useEffect(() => {
    if (data?.bot?.StarBot.at(0)?.copyIsEnabled) {
      setCopyIsEnabled(data?.bot?.StarBot.at(0)?.copyIsEnabled as boolean)
    }

    const selectedWallets = data?.bot?.wallets.map((selectedWallet: { Wallet: { walletAddress: any; }; walletId: any; }) => {
      return {
        walletAddress: selectedWallet.Wallet?.walletAddress,
        id: selectedWallet.walletId
      }
    })
    setValue("wallets", selectedWallets)
    setValue("id", data?.bot?.id)
  }, [data?.bot?.StarBot, data?.bot?.id, setValue, data?.bot?.wallets])

  const deleteBot = trpc.bot.delete.useMutation({
    onSuccess() {
      router.push(`/browse/bots/authored`)
    },
  })

  const updateBot = trpc.bot.update.useMutation()

  const updateStarredBots = trpc.bot.updateStarredBots.useMutation({
    onSuccess() {
      console.log('OK')
    }
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
    if (id) {
      deleteBot.mutate({ id: id })
    }
  }
  const onError = (errors: any) => {
    console.log('ERRORS:', errors);
  };

  const onSubmit = (data: any) => {
    // console.log('DATA:', data);

    updateBot.mutate(data)
  };

  // updater function for boolean
  function toggle(value: any) {
    return !value;
  }

  const handleToggleCopyEnabled = (data: any) => {
    setCopyIsEnabled(toggle)
    console.log(data)
    updateStarredBots.mutate(
      {
        botId: parseInt(botId),
        positionSizePercentage: 0,
        copyIsEnabled: data?.target?.checked
      })
  }

  // useEffect(() => {
  //   setTimeout(() => {
  //     setValue("wallets", [{
  //       value: 2,
  //       label: "2"
  //     }], { shouldValidate: true });
  //   }, 1000);
  // }, [setValue]);

  if (isSuccess) {

    const { bot, user, botIsAuthoredByThisUser } = data;
    const creatorUrl = `/${bot?.creator?.name}`;

    return (
      <>
        {/* section only visible to the author of this bot */}
        {botIsAuthoredByThisUser ? (
          <>
            <div className="block p-6 mb-8 rounded-lg shadow-lg bg-white max-w-sm">
              <div className='text-xl'>
                Author settings
              </div>
              <div>
                You are the author if this bot.
              </div>
              <button
                type="submit"
                className="inline-block mt-4 mb-4 px-6 py-2.5 bg-red-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg transition duration-150 ease-in-out"
                onClick={() => handleDelete(bot?.id)}
                disabled={deleteBot.isLoading}
              >
                Delete Bot
              </button>

              {/* form is for WalletSearch, BotSearch */}
              <FormProvider {...methods} >
                <form
                  onSubmit={handleSubmit(onSubmit, onError)}
                >

                  <input {...register("id")} type="hidden" name="id" id="id" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />


                  <WalletSearch />
                  <div className='mb-4'></div>

                  <BotSearch />
                  <div className='mb-4'></div>

                  {/* form submit button */}
                  {/* button */}
                  <div className="mb-6">
                    <button type="submit" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">Update</button>
                  </div>


                </form>
              </FormProvider>


            </div>
          </>
        ) : (
          <div></div>
        )}


        {/* data RW for the owner, RO for other users */}
        <div className="block p-6 rounded-lg shadow-lg bg-white max-w-sm">

          <div className='text-xl'>
            Bot settings
          </div>

          <div className='mb-4'></div>

          {/* owner has edit option to change the name */}
          <div className="flex flex-col mb-4">
            <label>
              Name: {bot?.name}
            </label>
            <div className="text-base">
              <span>Author: </span>
              <a href={creatorUrl}>{bot?.creator?.name}</a>
            </div>
          </div>

          {/* share id */}
          <div className="relative z-0 mb-6 w-full group">
            <input disabled type="text" value={bot?.shareId} name="shareId" id="shareId" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " />
            <CopyClipboard content={bot?.shareId} />
            <label htmlFor="shareId" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Share ID</label>
          </div>
          <div>{bot?.blacklistProtocols}</div>
          <div>{bot?.blacklistTokens}</div>
          <div>{bot?.gasValue}</div>
          <div>{bot?.hours}</div>
          <div>{bot?.positionSizePercentage}</div>
          <div>{bot?.state}</div>
          <div>{bot?.stoplossPercentage}</div>
          <div>{bot?.takeprofitPercentage}</div>
          <div>{bot?.transactionValue}</div>
          <div>{bot?.weekdays}</div>
          <div>{bot?.whitelistTokens}</div>


          {/* actions */}
          <div className="pt-2 pb-8 flex flex-col mb-6">
            <div>
              <h1 className="inline text-1xl font-semibold leading-none">Actions</h1>
            </div>
            <div>
              {bot?.actions?.map((action: any) => (
                <div key={action?.Action?.id}>
                  <div>{action.Action?.name}</div>
                </div>
              ))}

            </div>
          </div>
          {/* RW for all users */}
          {/* COPY is enabled */}
        </div>

        <div className='pt-6'>

        </div>

        <div className="block p-6 mb-8 rounded-lg shadow-lg bg-white max-w-sm">
          <div className='text-xl'>
            Follow settings
          </div>
          <div className='pt-6 pb-6'>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" onChange={handleToggleCopyEnabled} checked={copyIsEnabled} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">copy positions to my trading account</span>
            </label>
          </div>

          {/* actions to take */}
          {/* select + data feed */}
          {/* <div className="mb-6">
                            <ActionSearch />
                        </div>
                        <ErrorMessage errors={errors} name="actions" message="This is required" /> */}


        </div>

        {/* just counts */}
        {/* <div>{bot?._count.wallets}</div>
                        <div>{bot?._count.botsFollowedBy}</div>
                        <div>{bot?._count.botsFollowing}</div>
                    <div>{bot?._count.StarBot}</div> */}



        {/* positions */}
        <h1 className="inline text-xl leading-none">Positions</h1>
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
              {bot?.positions?.map((position: any) => (
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
      </>
    )
  }


}