/*
 * Paginate all messages between two accounts starting from now and moving BACKWARD.
 */
const { print, sleep } = require('../utils')

const TITLE = 'Messages between two accounts'

const query = `query MyQuery($address1: String!, $address2: String!, $cursor: String, $count: Int) {
    blockchain {
        account(
            address: $address1
        ) {
            messages(
                counterparties: [$address2]
                last: $count
                before: $cursor
            ) {
                edges {
                    node {
                        created_at
                        src
                        dst
                        value
                    }
                }
                pageInfo {
                    startCursor
,                    hasPreviousPage
                }
            }
        } 
    }
}`

async function messagesBetweenAccounts(client, { address1, address2, itemsPerPage, pagesLimit }) {
    const variables = {
        address1: [address1, address2].sort()[1],
        address2: [address1, address2].sort()[0],
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

        if (messages.pageInfo.hasPreviousPage === false) {
            console.log('These are all messages for now')
            break
        }
        if (pageNum === pagesLimit) {
            console.log('Page limit reached')
            break
        }
        // Move cursor
        variables.cursor = messages.pageInfo.startCursor
        await sleep(200) // Don't send API requests too aggressively
    }
}

module.exports = messagesBetweenAccounts
