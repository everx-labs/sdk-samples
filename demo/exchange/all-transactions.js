const { internalQueryTransactions } = require("./transactions");

/**
 * Query all blockchain transactions by using cursor-based pagination.
 */
async function *queryAllTransactions(
    client,
    options,
) {
    const variables = {
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
    queryAllTransactions,
};
