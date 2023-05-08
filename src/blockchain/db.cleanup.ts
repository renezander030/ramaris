import { prisma } from './services/prisma';


async function cleanupDatabase() {

    // tokencontracts
    // WORKS BY BY ITSELF/no further deletions needed
    // wallets/swaps will stay - only showing contract addresses
    // with re-adding addresses information should be come back for existing swaps
    // info: by deleting tokencontracts these will also be cleaned up:
    // swaps related
    // tokens in walletsnapshots (tokencontracts on tokens are optional - records should stay - tokens)
    return await prisma.$transaction([
        prisma.tokenContract.deleteMany()
    ])


    // clean up wallets

    // first delete relations

    // wallets
    // walletsnapshots
    // swaps

};

cleanupDatabase().then(async () => {
    prisma.$disconnect
}).catch((error) => {
    console.log(`error ${error}`)
})