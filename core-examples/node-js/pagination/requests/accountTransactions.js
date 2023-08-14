/*
 * Paginate all account transactions starting from now
 * and moving BACKWARD, for example, to show wallet transaction history.
 * archive:true flag is used to ensure historical data is retrieved.
 */
const { print, sleep } = require('../utils')

const TITLE = 'Account transactions'

const query = `query MyQuery($address: String!, $cursor: String, $count: Int) {
    blockchain {
        account(address: $address){
            transactions(
                last: $count
                before: $cursor
                archive: true
            ){
                edges{
                    node{ now hash }
                }
                pageInfo{
                     startCursor
                     hasPreviousPage
                 }
            }
        }
    }
}`

async function accountTransactions(client, { address, itemsPerPage, pagesLimit }) {
    const variables = {
        address,
        count: itemsPerPage,
        cursor: null,
    }

    for (let pageNum = 1; ; pageNum++) {
        const response = await client.net.query({ query, variables })
        const { transactions } = response.result.data.blockchain.account

        const results = transactions.edges.map((edge) => edge.node)

        if (results.length) {
            print(TITLE, pageNum, results)
        }

        if (transactions.pageInfo.hasPreviousPage === false) {
            console.log('These are all transactions for now')
            break
        }
        if (pageNum === pagesLimit) {
            console.log('Page limit reached')
            break
        }

        // Move cursor
        variables.cursor = transactions.pageInfo.startCursor

        // Don't send API requests too aggressively
        await sleep(200)
    }
}

module.exports = accountTransactions
