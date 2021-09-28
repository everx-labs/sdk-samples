const { internalQueryTransactionsWithTransfers } = require("./transactions");

const emptyResult = {
    transactions: [],
    last: {},
};

/**
 * Query portion of the account transactions.
 *
 * To query first portion omit `after` option and specify the `startTime`.
 * To query next portion specify `after` option equals to the `last` field
 * of the previous result.
 *
 * Note that the most recent API data can be present in an inconsistent
 * state. Usually this data relates to the last minute. The older
 * API data is always in consistent state.
 *
 * Therefore, not to miss any data while reading you can specify the `endTime`
 * option in corresponding methods.
 * Two minutes before now is enough not to miss anything.
 */
async function queryAccountTransactions(
    client,
    accountAddress,
    options,
) {
    const { startTime, after } = options;
    let filter;
    if (after && !after.lt) {
        return emptyResult;
    }
    if (!after) {
        const first = await queryFirstTransactionSince(client, accountAddress, startTime);
        if (!first) {
            return emptyResult;
        }
        filter = {
            account_addr: { eq: accountAddress },
            lt: { ge: first.lt },
        };
    } else {
        filter = {
            account_addr: { eq: accountAddress },
            lt: { gt: after.lt },
        };
    }

    return await internalQueryTransactionsWithTransfers(
        client,
        filter,
        "account_addr lt",
        options.endTime,
    );
}

async function queryFirstTransactionSince(client, accountAddress, startTime) {
    return (await client.net.query_collection({
        collection: "transactions",
        filter: {
            account_addr: { eq: accountAddress },
            now: { ge: startTime },
        },
        order: [
            { path: "now", direction: "ASC" },
            { path: "lt", direction: "ASC" },
        ],
        result: "lt",
        limit: 1,
    })).result[0];
}

module.exports = {
    queryAccountTransactions,
};
