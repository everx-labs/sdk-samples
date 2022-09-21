const { queryAccount } = require("./transactions");
const { sleep } = require("./utils");

/**
 * Iterator to query account transactions by using cursor-based pagination.
 */
async function *queryAccountTransactions(
    client,
    address,
    options,
) {
    const variables = {
        address,
        cursor: null,
        ...options,
    }
    for (;;) { // <-- !WARNING! Infinity loop, you need to implement condition to exit from iterator
        const { result } = await client.net.query({query: queryAccount, variables});
        const { transactions } = result.data.blockchain.account;

        yield transactions.edges.map(_ => _.node);
        variables.cursor = transactions.pageInfo.endCursor || variables.cursor;
        await sleep(200); // don't spam API
    }
}

module.exports = {
    queryAccountTransactions,
};
