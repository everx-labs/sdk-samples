const { internalQueryTransactions } = require("./transactions");
const { sleep, consoleClear, consoleWrite } = require("./utils");

/**
 * Iterator to query ALL blockchain transactions by using cursor-based pagination.
 */
async function *queryAllTransactions(
    client,
    options,
) {
    const variables = {
        cursor: null,
        ...options,
    }
    while (true) { // <-- !WARNING! Infinity loop, you need to implement condition to exit from iterator
        consoleWrite(`Requesting transactions...`)
        const transactions = await internalQueryTransactions(client, variables);
        consoleClear()
        yield transactions.edges.map(_ => _.node);
        variables.cursor = transactions.pageInfo.endCursor || variables.cursor;
        await sleep(200); // don't spam API
    }
}


module.exports = {
    queryAllTransactions,
};
