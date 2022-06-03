const { TonClient } = require('@eversdk/core')
const { libNode } = require('@eversdk/lib-node')
const {
    allBlocks,
    allTransactions,
    accountTransactions,
    accountExtOutMessages,
    messagesBetweenAccounts,
    allAccounts,
} = require('./requests')

TonClient.useBinaryLibrary(libNode)

/*
 * To configure Ton Client, it needs to pass API endpoints as parameters.
 *
 * The public EVER OS API endpoints see here:
 * https://docs.everos.dev/ever-sdk/reference/ever-os-api/networks
 *
 * To use DApp Server, specify its URL here the same way.
 *
 * This sample uses the Developer Network:
 */
const client = new TonClient({
    network: {
        endpoints: ['eri01.net.everos.dev', 'rbx01.net.everos.dev', 'gra01.net.everos.dev'],
    },
})

async function main() {
    /*
     * CASE: Paginate all blocks starting from 2 minutes ago and moving FORWARD.
     *
     * If there are thousands of transactions in the account, or new ones are added very quickly,
     * there is a chance that this test will not catch up with them at all or will take too long.
     *
     * For such cases, we will limit the output to no more than `pagesLimit` pages.
     */
    await allBlocks(client, {
        from: Math.round(Date.now() / 1000) - 120,
        itemsPerPage: 50,
        pagesLimit: 20,
    })

    /*
     * CASE: Paginate all transactions starting from 2 minutes ago and moving FORWARD.
     */
    await allTransactions(client, {
        from: Math.round(Date.now() / 1000) - 120,
        itemsPerPage: 50,
        pagesLimit: 20,
    })

    /*
     * CASE: Paginate all account transactions starting from now
     * and moving BACKWARD, for example, to show wallet transaction history.
     */
    await accountTransactions(client, {
        address: '-1:3333333333333333333333333333333333333333333333333333333333333333',
        // address: "0:583ae346ce7bd45f6b628e16204a6550d3783a149c3eb4d0c680a9af85d1df64",
        itemsPerPage: 25,
        pagesLimit: 20,
    })

    /*
     * CASE: Paginate all external outgoing messages of an account starting
     * from 10 minutes ago and moving FORWARD until now.
     */
    await accountExtOutMessages(client, {
        address: '-1:4911e4e34e91a39c6005eed46c3a0ebe9644bd1528b770ecf48f7dd29b907ae2',
        from: Math.round(Date.now() / 1000) - 600,
        itemsPerPage: 3,
        pagesLimit: 20,
    })

    /*
     * CASE: Paginate all messages between two accounts starting from now and moving BACKWARD.
     */
    await messagesBetweenAccounts(client, {
        address1: '-1:0000000000000000000000000000000000000000000000000000000000000000',
        address2: '-1:3333333333333333333333333333333333333333333333333333333333333333',
        itemsPerPage: 3,
        pagesLimit: 10,
    })

    /*
     * Pagination of all accounts with a positive balance (PAGINATION WITHOUT CURSOR)
     *
     * Note: Objects in the `accounts` collection are mutable, and there is no support
     * for cursor-based pagination yet.
     * Despite this, iteration based on the account.id property is possible.
     *
     */
    await allAccounts(client, { itemsPerPage: 20, pagesLimit: 10 })
}

;(async () => {
    try {
        await main()
        process.exit(0)
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
})()
