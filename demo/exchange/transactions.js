/**
 *  @typedef {{
 *      id: string,
 *      now: number,
 *      lt: number,
 *      account_addr: string,
 *      balance_delta: string,
 *      bounce: {
 *          bounce_type: number,
 *      },
 *      in_message: ?Message,
 *      out_messages: Message[],
 *      transfers: Transfer[],
 *  }} Transaction
 */

/**
 *  @typedef {{
 *      id: string,
 *      value: string,
 *      msg_type: number,
 *      src: string,
 *      dst: string,
 *      dst_transaction: Transaction,
 *  }} Message
 */


/**
 *  @typedef {{
 *      transaction: string,
 *      message: string,
 *      account: string,
 *      isDeposit: boolean,
 *      isBounced: boolean,
 *      value: string,
 *      counterparty: string,
 *      time: number,
 *  }} Transfer
 */

const TRANSACTION_FIELDS = `
    id
    account_addr
    now
    lt
    balance_delta(format:DEC)
    bounce { bounce_type }
    in_message { 
        value(format:DEC)
        msg_type
        src
    } 
    out_messages {
        value(format:DEC)
        msg_type
        dst
    }
`;

/**
 *
 * @param {Transaction} transaction
 * @return {Transfer[]}
 */
function getTransfersFromTransaction(transaction) {
    const transfers = [];
    const isBounced = transaction.bounce && transaction.bounce.bounce_type === BounceType.Ok;
    const inbound = transaction.in_message;
    if (inbound && Number(inbound.value) > 0) {
        transfers.push({
            account: transaction.account_addr,
            transaction: transaction.id,
            message: inbound.id,
            isBounced,
            isDeposit: true,
            counterparty: inbound.src,
            value: inbound.value,
            time: transaction.now,
        });
    }
    for (const outbound of transaction.out_messages) {
        if (Number(outbound.value) > 0) {
            transfers.push({
                account: transaction.account_addr,
                transaction: transaction.id,
                message: outbound.id,
                isBounced,
                isDeposit: false,
                counterparty: outbound.dst,
                value: outbound.value,
                time: transaction.now,
            });
        }
    }
    return transfers;

}

const BounceType = {
    NegFunds: 0,
    NoFunds: 1,
    Ok: 2,
};

/**
 * Internal function user in query_first_transactions
 * and query_next_transactions
 *
 * @param {TonClient} client
 * @param {object} filter
 * @param {string} order
 * @returns {Promise<Transaction[]>}
 */
async function internal_query_transactions_with_transfers(
    client,
    filter,
    order,
) {
    const transactions = (await client.net.query_collection({
        collection: "transactions",
        result: TRANSACTION_FIELDS,
        filter,
        order: order.split(" ").map(x => ({ path: x, direction: "ASC" })),
    })).result;
    transactions.forEach(x => x.transfers = getTransfersFromTransaction(x));
    return transactions;
}

/**
 * @typedef {{
 *      time: number,
 *      address: string,
 *      lt: number,
 * } | {}} QueryTransactionsCursor
 */

/**
 * @typedef {{
 *     accountAddress?: string,
 *     startTime?: number,
 *     avoidInconsistentTime?: number,
 *     after?: QueryTransactionsCursor,
 * }} QueryTransactionsOptions
 */

/**
 * @typedef {{
 *     transactions: Transaction[],
 *     last: QueryTransactionsCursor,
 * }} QueryTransactionsResult
 */

/**
 * Query first portion of the transactions since startTime.
 *
 * Note that the most fresh data in database can be presented in inconsistent
 * state. Usually it is data related to the last minute. The older
 * data in database always in consistent state.
 *
 * To avoid inconsistent data you can specify the inconsistentTimeRange in seconds.
 * The two minutes is enough.
 *
 * Optionally you can specify an account address to query
 * only this account transactions.
 *
 * If you omit accountAddress then transactions for all
 * accounts are returned.
 *
 * @param {TonClient} client
 * @param {QueryTransactionsOptions} options Consistency lag in seconds
 * @returns {Promise<QueryTransactionsResult>}
 */
async function query_transactions(
    client,
    options,
) {
    const { accountAddress, startTime, after } = options;
    let params;
    if (after && !after.lt) {
        params = undefined;
    } else if (accountAddress && !after) {
        params = firstByAccount(accountAddress, startTime);
    } else if (accountAddress && after) {
        params = nextByAccount(accountAddress, after);
    } else if (!accountAddress && !after) {
        params = firstAllAccounts(startTime);
    } else {
        params = nextAllAccounts(after);
    }

    if (!params) {
        return {
            transactions: [],
            last: {},
        }
    }

    if (options.avoidInconsistentTime) {
        if (filter.now) {
            filter.now.le = options.avoidInconsistentTime;
        } else {
            filter.now = { le: options.avoidInconsistentTime };
        }
    }

    const transactions = await internal_query_transactions_with_transfers(
        client,
        params.filter,
        params.orderBy,
    );

    const last = transactions.length > 0 ? transactions[transactions.length - 1] : undefined;
    return {
        transactions,
        last: last
            ? {
                time: last.now,
                address: last.account_addr,
                lt: last.lt,
            }
            : {}
    };
}

async function firstByAccount(accountAddress, startTime) {
    const first = (await client.net.query_collection({
        collection: "transactions",
        filter: {
            account_addr: { eq: accountAddress },
            now: { ge: startTime },
        },
        order: [
            { path: "now", direction: "ASC" },
            { path: "account_addr", direction: "ASC" },
            { path: "lt", direction: "ASC" },
        ],
        result: "lt",
        limit: 1,
    })).result[0];
    if (!first) {
        return undefined;
    }
    return {
        filter: {
            account_addr: { eq: accountAddress },
            lt: { ge: first.lt },
        },
        orderBy: "account_addr now",
    };
}

function nextByAccount(accountAddress, after) {
    return {
        filter: {
            account_addr: { eq: accountAddress },
            lt: { gt: after.lt },
        },
        orderBy: "account_addr lt now"
    };

}

function firstAllAccounts(startTime) {
    return {
        filter: { now: { ge: startTime } },
        orderBy: "now account_addr lt",
    };
}

function nextAllAccounts(after) {
    return {
        filter: {
            now: { gt: after.time },
            OR: {
                now: { eq: after.time },
                account_addr: { gt: after.address },
                OR: {
                    now: { eq: after.time },
                    account_addr: { eq: after.account_addr },
                    lt: { gt: after.lt },
                },
            },
        },
        orderBy: "now account_addr lt",
    };

}

module.exports = {
    query_transactions
};
