import React from 'react';
import { trpc } from '../../utils/trpc';
import SubMenu from '../../components/SubMenu';
import Wallet from '../../components/Wallet';


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


export default function BrowseWallets() {

  let { data, isSuccess, isLoading, isError } = trpc.wallet.list.useQuery();


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
              {data?.wallets?.map((wallet: any, i: any) => (
                <tr key={i} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <Wallet wallet={wallet} userIsSignedIn={data?.userIsSignedIn} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
}