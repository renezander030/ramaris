import { prisma } from '../services/prisma';
import Enumerable from 'linq'
import logger from './logger';


function isFloat(n: unknown) {
  return Number(n) === n && n % 1 !== 0;
}

// process last added snapshot, update one wallet only
async function calculateProfitLoss() {

  // read all snapshots
  const snapshots = await prisma.walletSnapshot.findMany()

  // calculate PL
  // calculate PL from collections wallets_snapshots
  // Profit % = Profit / Cost Price * 100
  // Loss % = Loss / Cost price * 100
  var linq = Enumerable.from(snapshots);

  // todo:should be done in pure sql lang, could use a stored procedure
  var grouped_Wallets =
    linq.groupBy(function (x: any) { // group wallets by holderAddress
      return x.walletId;
    })
      .select(function (x: any) {
        let ProfitLoss = 0;
        let StartBalance = x.getSource()[0].totalBalanceUsd; // take first record
        let EndBalance = x.getSource()[x.getSource().length - 1].totalBalanceUsd; // take last record

        let snapshotIdLastRecord = x.getSource()[x.getSource().length - 1].id;

        if (StartBalance >= EndBalance) { ProfitLoss = (StartBalance - EndBalance) * -1 } else { ProfitLoss = EndBalance - StartBalance };
        let ProfitLossPercentage = parseFloat((ProfitLoss / StartBalance * 100).toFixed(2));

        return {
          walletId: x.key(),
          data: x.getSource(),
          snapshotIdLastRecord: snapshotIdLastRecord,
          totalBalanceUsdStart: StartBalance,
          totalBalanceUsdEnd: EndBalance,
          ProfitLossPercentage: ProfitLossPercentage
        };
      })
      .toArray();

  // update the last wallet snapshot for each group found (one group = one wallet)
  // raw execution attempt to optimize performance, prisma.$executeRaw()
  const updatedSnapshots = await Promise.all(
    grouped_Wallets.map(async (wallet: any) => {
      try {

        // checks if value is a float
        if (!isFloat(wallet.ProfitLossPercentage)) {
          return false
        }

        await prisma.walletSnapshot.update({
          where: {
            id: wallet.snapshotIdLastRecord
          },
          data: {
            ProfitLossPercentage: wallet.ProfitLossPercentage
          }
        })
      }
      catch (error) {
        logger.error(`error walletSnapshot update ${error}`)
      }
    })
  )
  return updatedSnapshots
}
export default calculateProfitLoss;