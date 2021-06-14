const { SortDirection } = require("@tonclient/core");
const { queryByIds } = require("./blocks");

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
 * @typedef {{
 *      startTime: number,
 *      last: ?Transaction,
 *      portion: string[],
 *      nextIndex: number,
 * }} TransactionIteratorState
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
 *
 * @param {string} account
 * @param {Set.<string>} accountFilter
 * @return {boolean}
 */
function wanted(account, accountFilter) {
    return accountFilter.size === 0 || accountFilter.has(account);
}

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
 * @property {TonClient} client
 * @property {Set.<string>} accountFilter
 * @property {string} requiredFields

 * @property {number} _startTime
 * @property {Transaction[]} _portion
 * @property {number} _nextIndex
 */
class InconsistentTransactionIterator {

    /**
     * @param {TonClient} client
     * @param {Set.<string>} accountFilter
     * @param {string} requiredFields
     * @param {number} startTime
     * @param {?Transaction} last
     * @param {Transaction[]} portion
     * @param {number} nextIndex
     */
    constructor(
        client,
        accountFilter,
        requiredFields,
        startTime,
        last,
        portion,
        nextIndex,
    ) {
        this.client = client;
        this.accountFilter = accountFilter;
        this.requiredFields = requiredFields;
        this._startTime = startTime;
        this._last = last;
        this._portion = portion;
        this._nextIndex = nextIndex;
    }

    /**
     *
     * @param {TonClient} client
     * @param {number} startTime
     * @param {string[]} accountFilter
     * @param {string} requiredFields
     * @return {Promise<InconsistentTransactionIterator>}
     */
    static async start(
        client,
        startTime,
        accountFilter,
        requiredFields,
    ) {
        return new InconsistentTransactionIterator(
            client,
            new Set(accountFilter),
            requiredFields,
            startTime,
            null,
            [], 0,
        );
    }

    /**
     * @param {TonClient} client
     * @param {TransactionIteratorState} suspended
     * @param {string[]} accountFilter
     * @param {string} requiredFields
     * @return {Promise<InconsistentTransactionIterator>}
     */
    static async resume(
        client,
        accountFilter,
        requiredFields,
        suspended,
    ) {
        const portion = await queryByIds(
            client,
            "transactions",
            suspended.portion,
            InconsistentTransactionIterator.resultFields(requiredFields),
        );
        return new InconsistentTransactionIterator(
            client,
            new Set(accountFilter),
            requiredFields,
            suspended.startTime,
            suspended.last,
            portion,
            suspended.nextIndex,
        );
    }

    /**
     *
     * @return {Promise<?Transaction>}
     */
    async next() {
        if (this._nextIndex >= this._portion.length) {
            await this._nextPortion();
        }
        if (this._nextIndex >= this._portion.length) {
            return null;
        }
        this._nextIndex += 1;
        return this._portion[this._nextIndex - 1];
    }

    /**
     * @return {TransactionIteratorState}
     */
    suspend() {
        return {
            startTime: this._startTime,
            last: this._last,
            portion: this._portion.map(x => x.id),
            nextIndex: this._nextIndex,
        };
    }

    /**
     * @param {string} additionalFields
     * @return {string}
     */
    static resultFields(additionalFields) {
        return `
            id
            account_addr
            now
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
            ${additionalFields}
        `;
    }

    async _nextPortion() {
        /** @type {Transaction[]} */
        const portion = [];
        while (portion.length < 50) {
            const filter = this._last
                ? {
                    now: { gt: this._last.now },
                    OR: {
                        now: { eq: this._last.now },
                        account_addr: { gt: this._last.account_addr },
                        OR: {
                            now: { eq: this._last.now },
                            account_addr: { eq: this._last.account_addr },
                            lt: { gt: this._last.lt },
                        },
                    },
                }
                : {
                    now: { ge: this._startTime },
                };
            /** @type {Transaction[]} */
            const transactions = (await client.net.query_collection({
                collection: "transactions",
                filter,
                result: InconsistentTransactionIterator.resultFields(this.requiredFields),
                order: [
                    { path: "now", direction: SortDirection.ASC },
                    { path: "account_addr", direction: SortDirection.ASC },
                    { path: "lt", direction: SortDirection.ASC },
                ],
            })).result;
            if (transactions.length === 0) {
                break;
            }
            transactions.forEach((tr) => {
                if (wanted(tr.account_addr, this.accountFilter)) {
                    portion.push(tr);
                }
            });
        }
        this._portion = portion;
        this._nextIndex = 0;
        if (portion.length > 0) {
            this._last = portion[portion.length - 1];
        }
    }

}


module.exports = {
    InconsistentTransactionIterator,
    getTransfersFromTransaction,
    BounceType,
};
