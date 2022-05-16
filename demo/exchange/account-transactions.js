const { internalQueryTransactions } = require("./transactions");

/**
 * Query account transactions by using cursor-based pagination.
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
    let hasNextPage = true;
    while (hasNextPage) {
        const transactions = await internalQueryTransactions(client, variables);
        yield transactions.edges.map(_ => _.node);
        variables.cursor = transactions.pageInfo.endCursor;
        hasNextPage = transactions.pageInfo.hasNextPage;
    }
}


module.exports = {
    queryAccountTransactions,
};
