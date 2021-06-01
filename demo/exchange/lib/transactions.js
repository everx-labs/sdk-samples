const { SortDirection } = require("@tonclient/core");
const { queryByIds } = require("./blocks");

/**
 *  @typedef {{
 *      id: string,
 *      now: number,
 *      lt: number,
 *      account_addr: string,
 *      balance_delta: string,
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
 *      account: string,
 *      isDeposit: boolean,
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
 * @property {TonClient} client
 * @property {Set.<string>} accountFilter
 * @property {string} requiredFields

 * @property {number} _startTime
 * @property {Transaction[]} _portion
 * @property {number} _nextIndex
 */
class TransactionIterator {

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
     * @return {Promise<TransactionIterator>}
     */
    static async start(
        client,
        startTime,
        accountFilter,
        requiredFields,
    ) {
        return new TransactionIterator(
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
     * @return {Promise<TransactionIterator>}
     */
    static async resume(
        client,
        accountFilter,
        requiredFields,
        suspended,
    ) {
        const portion = await TransactionIterator._queryPortion(
            client,
            suspended.portion,
            requiredFields,
        );
        return new TransactionIterator(
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
     *
     * @param {Transaction} transaction
     * @return {Transfer[]}
     */
    static getTransfers(transaction) {
        const transfers = [];
        const inbound = transaction.in_message;
        if (inbound && Number(inbound.value) > 0) {
            transfers.push({
                account: transaction.account_addr,
                transaction: transaction.id,
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
                    isDeposit: false,
                    counterparty: outbound.dst,
                    value: outbound.value,
                    time: transaction.now,
                });
            }
        }
        return transfers;

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

    /**
     * @param {TonClient} client
     * @param {string[]} transactionIds
     * @param {string} requiredFields
     * @return {Transfer[]}
     */
    static async _queryPortion(client, transactionIds, requiredFields) {
        queryByIds();
        /** @type {Transaction[]} **/
        const portion = [];
        const transactionIdIterator = [...transactionIds];
        while (transactionIdIterator.length > 0) {
            const idPortion = transactionIdIterator.splice(0, 20);
            /** @type {Transaction[]} */
            const transactions = (await client.net.query_collection({
                collection: "transactions",
                filter: { id: { in: idPortion } },
                result: TransactionIterator.resultFields(requiredFields),
            })).result;
            transactions.forEach((tr) => {
                if (wanted(tr.account_addr, this.accountFilter)) {
                    portion.push(tr);
                }
            });
        }
        return portion;
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
                result: TransactionIterator.resultFields(this.requiredFields),
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


module.exports = { TransactionIterator };
