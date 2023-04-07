import { libNode } from '@eversdk/lib-node'
import { TonClient, ResultOfQuery } from '@eversdk/core'
import assert from 'node:assert/strict';

TonClient.useBinaryLibrary(libNode)

const endpoint = process.env.ENDPOINT
assert.ok(endpoint,
    "An endpoint is required. You can find it when creating a project at https://dashboard.evercloud.dev"
)
const client = new TonClient({ network: { endpoints: [endpoint] } })

async function main(client: TonClient) {
    // In this example, we want the query to return 2 items per page.
    const itemsPerPage = 25

    // Pagination connection pattern requires a cursor, which will be set latter
    let cursor: string = undefined

    // The idiomatic way to send a request is to specify 
    // query and variables as separate properties.
    const transactionsQuery = `
        query listTransactions($cursor: String, $count: Int) {
            blockchain {
                transactions(
                    workchain: 0
                    first: $count
                    after: $cursor
                 ) {
                    edges {
                        node { id }
                    }
                    pageInfo { hasNextPage endCursor }
                }
            }
        }`

    for (; ;) {
        const queryResult: ResultOfQuery = await client.net.query({
            query: transactionsQuery,
            variables: {
                count: itemsPerPage,
                cursor
            }
        });
        const transactions = queryResult.result.data.blockchain.transactions;

        for (const edge of transactions.edges) {
            console.log("Transaction id:", edge.node.id);
        }
        if (transactions.pageInfo.hasNextPage === false) {
            break;
        }
        // To read next page we initialize the cursor:
        cursor = transactions.pageInfo.endCursor;
        // TODO: rate limiting
        await sleep(1000);
    }

}
console.log("Getting all transactions in workchain 0 from the beginning/")
console.log("Most likely this process will never end, so press CTRL+C to interrupt it")
main(client)
    .then(() => {
        process.exit(0)
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    })



// This helper function is used for limiting request rate
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }


