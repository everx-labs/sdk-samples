/**
 *  @typedef {{
 *      id: string,
 *      now: number,
 *      lt: number,
 *      account_addr: string,
 *      balance_delta: string,
 *      orig_status: number,
 *      end_status: number,
 *      aborted: boolean,
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
 *      bounce: boolean,
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

/**
 * @typedef {{
 *      now: number,
 *      account_addr: string,
 *      lt: number,
 * } | {}} QueryTransactionsCursor
 */

/**
 * @typedef {{
 *     startTime?: number,
 *     endTime?: number,
 *     after?: QueryTransactionsCursor,
 * }} QueryTransactionsOptions
 */

/**
 * @typedef {{
 *     transactions: Transaction[],
 *     last: QueryTransactionsCursor,
 * }} QueryTransactionsResult
 */

const TRANSACTION_FIELDS = `
    id
    account_addr
    now
    lt
    balance_delta(format:DEC)
    bounce { bounce_type }
    orig_status
    end_status
    aborted
    in_message { 
        value(format:DEC)
        msg_type
        bounce
        src
    } 
    out_messages {
        value(format:DEC)
        msg_type
        bounce
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

function seconds(ms) {
    return Math.round(ms / 1000);
}

/**
 * Internal function user in query_first_transactions
 * and query_next_transactions
 *
 * @param {TonClient} client
 * @param {object} filter
 * @param {string} order
 * @param {number} [endTime]
 * @returns {Promise<QueryTransactionsResult>}
 */
async function internalQueryTransactionsWithTransfers(
    client,
    filter,
    order,
    endTime,
) {
    let transactions = (await client.net.query_collection({
        collection: "transactions",
        result: TRANSACTION_FIELDS,
        filter,
        order: order.split(" ").map(x => ({ path: x, direction: "ASC" })),
    })).result;
    if (endTime) {
        transactions = transactions.filter(x => x.now < endTime);
    }
    transactions.forEach(x => x.transfers = getTransfersFromTransaction(x));
    const last = transactions.length > 0 ? transactions[transactions.length - 1] : undefined;
    return {
        transactions,
        last: last
            ? {
                now: last.now,
                account_addr: last.account_addr,
                lt: last.lt,
            }
            : {},
    };
}


module.exports = {
    seconds,
    internalQueryTransactionsWithTransfers,
};
