import React, { useState, useEffect } from 'react';
import SubMenu from '../../components/SubMenu';
import { trpc } from '../../utils/trpc';
import Position from '../../components/Position';
import moment from 'moment';
import Link from 'next/link';
import { formatCurrencyNoPrefix } from '../../utils/formatter'
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function TradesAll() {

  // sub menu items
  const menuItems = [
    {
      route: "/trades/all",
      label: "All"
    },
    {
      route: "/trades/mybots",
      label: "My Bots"
    },
    {
      route: "/trades/favorites",
      label: "Favorites"
    },
  ];

  const positions = trpc.position.list.useQuery();
  // const positions = trpc.position.list.useQuery(undefined,{
  //   staleTime: 1000 * 5, //30min
  //   cacheTime: 1000 * 5
  // });

  if (positions.isLoading) {
    return <span>Loading...</span>
  }

  if (positions.isError) {
    // return <span>Error: {error.message}</span>
    return <span>Error</span>
  }

  return (
    <>
      {/* sub menu */}
      <SubMenu items={menuItems} />

      {/* content */}
      <div className="mt-6 overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="table-fixed w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <tbody>
            {positions.data.map((position) => (
              <tr key={position.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td scope="row" className="w-1/4 py-4 lg:px-6 px-2 font-medium whitespace-nowrap">
                  <Link href={`/bots/${position.bot?.id}`}>
                    <div className="cursor-pointer inline-flex overflow-hidden relative justify-center items-center w-16 h-16 bg-gray-200 rounded-full dark:bg-gray-600">
                      <span className="font-medium text-gray-1200 dark:text-gray-300"></span>
                    </div>
                  </Link>
                </td>
                <td className="w-3/4 py-4 px-6">

                  {/* Line 1 */}
                  <div className='text-lg h-6 mb-4'>
                    <div className='flex flex-row'>
                      <div className='bg-slate-200 rounded p-1'>
                        {position.actionType}
                      </div>
                      <div className='p-1'>
                        {position.amountOutMin.toFixed(0)} {position.sentTokenContract.symbol}
                      </div>
                      <div className='p-2'>
                        <ArrowRightIcon className='h-5 w-5' />
                      </div>
                      <div className='p-1'>
                        {formatCurrencyNoPrefix.format(position.amountIn)} {position.receivedTokenContract.symbol}
                      </div>
                    </div>
                  </div>

                  {/* Line 2 */}
                  <div className='flex flex-row'>
                    <div className='pr-1'>
                      opened by
                    </div>
                    <div className='pr-1'>
                      <Link href={`/bots/${position.bot?.id}`}>
                        {position.bot?.name}
                      </Link>
                    </div>
                    <div>
                      {moment(position.createdAt).fromNow()}
                    </div>
                  </div>

                  <div className='flex flex-row'>
                    <div className='pr-1'>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}