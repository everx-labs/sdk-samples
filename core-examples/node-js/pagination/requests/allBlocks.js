/*
 * Paginate all blocks starting from 2 minutes ago and moving FORWARD.
 */
const { print, sleep } = require('../utils')
const { getLastMasterBlockSeqNoByTime } = require('./getLastMasterBlockSeqNoByTime')

const TITLE = 'All blocks'

const query = `query MyQuery($cursor: String, $count: Int, $seq_no: Int) {
    blockchain {
        blocks(
            master_seq_no_range: { start: $seq_no }
            first: $count
            after: $cursor
        ) {
            edges {
                node {
                hash
                }
            }
            pageInfo {
                endCursor
                hasNextPage
            }
        }
    }
}`

async function allBlocks(client, { from, itemsPerPage, pagesLimit }) {
    // The last master block seq_no will be used as a starting point for the pagination.
    const lastSeqNo = await getLastMasterBlockSeqNoByTime(client, from)

    const variables = {
        seq_no: lastSeqNo,
        count: itemsPerPage,
        cursor: null,
    }

    for (let pageNum = 1; ; pageNum++) {
        const response = await client.net.query({ query, variables })
        const blocks = response.result.data.blockchain.blocks

        const results = blocks.edges.map((edge) => edge.node.hash)

        if (results.length) {
            print(TITLE, pageNum, results)
        }
        if (blocks.pageInfo.hasNextPage === false) {
            console.log('These are all blocks for now')
            break
        }
        if (pageNum === pagesLimit) {
            console.log('Page limit reached')
            break
        }

        // Move cursor
        variables.cursor = blocks.pageInfo.endCursor

        // Don't send API requests too aggressively
        await sleep(200)
    }
}

module.exports = allBlocks
