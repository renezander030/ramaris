import SubMenu from '../../components/SubMenu';
import { trpc } from '../../utils/trpc';
import Wallet from '../../components/Wallet';


export default function FavWallets() {

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

  const { data, isLoading, isError, isSuccess } = trpc.wallet.listFavorites.useQuery();


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
        <div className="site-card-wrapper">
          {(!data?.wallets?.length) ? (
            <div>Please follow some wallet *IMAGE*</div>
          ) : (
            <div>
              {data?.wallets.map((wallet: any, i: any) => (
                <Wallet key={wallet.id} wallet={wallet} userIsSignedIn={data.userIsSignedIn} />
              ))}
            </div>
  
          )}
        </div>
  
      </>
    );

  }

}
FavWallets.auth = true