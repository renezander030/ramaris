import SubMenu from '../../components/SubMenu';
import { trpc } from '../../utils/trpc';
import Bot from '../../components/Bot';


export default function FavBots() {

  // sub menu items
  const menuItems = [
    {
      route: "/favorites/wallets",
      label: "Wallets"
    },
    {
      route: "/favorites/bots",
      label: "Bots"
    },
  ];

  const { data, isLoading, isError, isSuccess } = trpc.bot.listFavorites.useQuery();


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

          {(!data?.bots?.length) ? (
            <div>Please follow some bot *IMAGE*</div>
          ) : (

            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <tbody>
                {data?.bots?.map((bot: any, i: any) => (
                  <tr key={i} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <Bot bot={bot} isUserSignedIn={data.isUserSignedIn} />
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  }
}
FavBots.auth = true