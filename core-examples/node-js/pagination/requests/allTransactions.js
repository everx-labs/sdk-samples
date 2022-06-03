const { print, sleep } = require('../utils')
const { getLastMasterBlockSeqNoByTime } = require('./getLastMasterBlockSeqNoByTime')

const TITLE = 'All transactions'

// This API has additional consistency checks to ensure consistent pagination, which can lead to additional delay
const query = `query MyQuery($cursor: String, $count: Int, $seq_no: Int) {
    blockchain {
        transactions(
            master_seq_no_range: {
                start: $seq_no
            }
            first: $count
            after: $cursor
        ){
            edges{
                node{
                    account_addr
                    now
                }
            }
            pageInfo{
                endCursor
                hasNextPage
            }
        }
    }
}`

// Is it ok that transactions remain unsorted ?

async function allTransactions(client, { from, itemsPerPage, pagesLimit }) {
    // The last master block seq_no will be used as a starting point for the pagination.
    const lastSeqNo = await getLastMasterBlockSeqNoByTime(client, from)

    const variables = {
        seq_no: lastSeqNo,
        count: itemsPerPage,
        cursor: null,
    }

    for (let pageNum = 1; ; pageNum++) {
        const response = await client.net.query({ query, variables })

        const transactions = response.result.data.blockchain.transactions

        const results = transactions.edges.map((edge) => edge.node)

        if (results.length) {
            print(TITLE, pageNum, results)
        }
        if (transactions.pageInfo.hasNextPage === false) {
            console.log('These are all transactions for now')
            break
        }
        if (pageNum === pagesLimit) {
            console.log('Page limit reached')
            break
        }

        // Move cursor
        variables.cursor = transactions.pageInfo.endCursor

        // Don't send API requests too aggressively
        await sleep(200)
    }
}

module.exports = allTransactions
