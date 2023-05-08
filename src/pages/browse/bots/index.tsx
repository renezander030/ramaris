import React, { useState, useEffect } from 'react';
import SubMenu from '../../../components/SubMenu';
import { trpc } from '../../../utils/trpc';
import Bot from '../../../components/Bot';
import type { listBotSchema } from '../../../schema/bot.schema';

export default function BrowseBots() {

  // sub menu items
  const menuItems = [
    {
      route: "/browse/wallets",
      label: "Wallets"
    },
    {
      route: "/browse/bots",
      label: "Bots"
    },
  ];

  let {
    data,
    isSuccess,
    isLoading,
    isError
  }: {
    data: {
      isUserSignedIn: boolean,
      bots: listBotSchema[] | undefined
    } | undefined,
    isSuccess: boolean,
    isLoading: boolean,
    isError: boolean
  } = trpc.bot.listAll.useQuery();


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
        {/* sub menu */}
        <SubMenu items={menuItems} />

        {/* content */}
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
          <table className="table-fixed w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <tbody>
              {data?.bots?.map((bot: listBotSchema) => (
                <tr key={bot.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <Bot bot={bot} isUserSignedIn={data?.isUserSignedIn} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
}