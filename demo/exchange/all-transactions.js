const { internalQueryTransactionsWithTransfers } = require("./transactions");

/**
 * Query portion of the account transactions.
 *
 * To query first portion omit `after` option and specify the `startTime`.
 * To query next portion specify `after` option equals to the `last` field
 * of the previous result.
 *
 * Note that the most fresh data in database can be presented in inconsistent
 * state. Usually it is data related to the last minute. The older
 * data in database is always in consistent state.
 *
 * To avoid inconsistent data you can specify the `endTime` option.
 * The two minutes before now is enough.
 *
 * @param {TonClient} client
 * @param {QueryTransactionsOptions} options Consistency lag in seconds
 * @returns {Promise<QueryTransactionsResult>}
 */
async function queryAllTransactions(
    client,
    options,
) {
    const { startTime, after } = options;
    if (after && !after.lt) {
        return {
            transactions: [],
            last: {},
        };
    }

    const filter = !after
        ? { now: { ge: startTime } }
        : {
            now: { gt: after.now },
            OR: {
                now: { eq: after.now },
                account_addr: { gt: after.account_addr },
                OR: {
                    now: { eq: after.now },
                    account_addr: { eq: after.account_addr },
                    lt: { gt: after.lt },
                },
            },
        };

    return await internalQueryTransactionsWithTransfers(
        client,
        filter,
        "now account_addr lt",
        options.endTime,
    );
}

module.exports = {
    queryAllTransactions,
};
