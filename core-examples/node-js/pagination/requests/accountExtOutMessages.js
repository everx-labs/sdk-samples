/*
 * Paginate all external outgoing messages of an account starting
 * from 10 minutes ago and moving FORWARD until now.
 */
const { getLastMasterBlockSeqNoByTime } = require('./getLastMasterBlockSeqNoByTime')
const { print, sleep } = require('../utils')

const TITLE = "Account's ExtOut messages"

const query = `query MyQuery($address: String!, $cursor: String, $count: Int, $seq_no: Int) {
    blockchain {
        account(address: $address){
            messages(
                master_seq_no_range: { start: $seq_no }
                first: $count,
                msg_type: ExtOut,
                after: $cursor
            ) {
                edges {
                    node { id, created_at }
                }
                pageInfo {
                    endCursor
                    hasNextPage
                }
            }
        }
    }
}`

async function accountExtOutMessages(client, { address, from, itemsPerPage, pagesLimit }) {
    // The last master block seq_no will be used as a starting point for the pagination.
    const lastSeqNo = await getLastMasterBlockSeqNoByTime(client, from)

    const variables = {
        address,
        seq_no: lastSeqNo,
        count: itemsPerPage,
        cursor: null,
    }

    for (let pageNum = 1; ; pageNum++) {
        const response = await client.net.query({ query, variables })

        const { messages } = response.result.data.blockchain.account

        const results = messages.edges.map((edge) => edge.node)

        if (results.length) {
            print(TITLE, pageNum, results)
        }

        if (messages.pageInfo.hasNextPage === false) {
            console.log('These are all messages for now')
            break
        }
        if (pageNum === pagesLimit) {
            console.log('Page limit reached')
            break
        }

        // Move cursor
        variables.cursor = messages.pageInfo.endCursor

        // Don't send API requests too aggressively
        await sleep(200)
    }
}

module.exports = accountExtOutMessages
