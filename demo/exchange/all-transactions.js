const { internalQueryTransactionsWithTransfers } = require("./transactions");

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
 * Two minutes before now is enough to not miss anything.
 *
 * We are currently working on a new feature to allow reliable recent data reading,
 * as soon as it is ready, there will be an announcement and this sample will be updated.
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

    // transactions are sorted by [time of creation, account, logical time of account(lt)]
    // so, to paginate, we need to use this filter:
    const filter = !after
        ? { now: { ge: startTime } }
        : {
            now: { gt: after.now },
            OR: { // if we have many transactions with the same `now` time
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
