const { internalQueryTransactions } = require("./transactions");
const { consoleClear, consoleWrite } = require("./utils");

/**
 * Iterator to query ALL blockchain transactions in backward way by using cursor-based pagination.
 */
async function *queryAllTransactions(
    client,
    options,
) {
    const variables = {
        cursor: null,
        ...options,
    }
    let hasPreviousPage = true;
    while (hasPreviousPage) {
        consoleWrite(`Requesting transactions...`)
        const transactions = await internalQueryTransactions(client, variables);
        consoleClear()
        yield transactions.edges.map(_ => _.node);
        variables.cursor = transactions.pageInfo.startCursor;
        hasPreviousPage = transactions.pageInfo.hasPreviousPage;
    }
}


module.exports = {
    queryAllTransactions,
};
