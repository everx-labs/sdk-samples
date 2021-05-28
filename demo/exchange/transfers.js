const { BlockIterator, BLOCK_TRANSACTIONS_FIELDS } = require("./blocks");

/**
 *  @typedef {{
 *      id: string,
 *      now: number,
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
 *  @typedef {{
 *      transaction: string,
 *      account: string,
 *      isDeposit: boolean,
 *      value: string,
 *      counterparty: string,
 *  }} Transfer
 */

/**
 * @typedef {{
 *      blocks: BlockIteratorState,
 *      portion: string[],
 *      nextIndex: number,
 * }} TransferIteratorState
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

 * @property {BlockIterator} _blocks
 * @property {Transfer[]} _portion
 * @property {number} _nextIndex
 */
class TransferIterator {

    /**
     *
     * @param {BlockIterator} blocks
     * @param {Set.<string>} accountFilter
     * @param {Transfer[]} portion
     * @param {number} nextIndex
     */
    constructor(
        accountFilter,
        blocks,
        portion,
        nextIndex,
    ) {
        this.client = blocks.client;
        this.accountFilter = accountFilter;
        this._blocks = blocks;
        this._portion = portion;
        this._nextIndex = nextIndex;
    }

    /**
     *
     * @param {TonClient} client
     * @param {number} afterBlockTime
     * @param {ShardIdent} shardFilter
     * @param {string[]} accountFilter
     * @return {Promise<TransferIterator>}
     */
    static async start(
        client,
        afterBlockTime,
        shardFilter,
        accountFilter,
    ) {
        const blocks = await BlockIterator.start(
            client,
            afterBlockTime,
            shardFilter,
            BLOCK_TRANSACTIONS_FIELDS,
        );
        return new TransferIterator(
            new Set(accountFilter),
            blocks,
            [], 0,
        );
    }

    /**
     * @param {TonClient} client
     * @param {TransferIteratorState} suspended
     * @param {string[]} accountFilter
     * @return {Promise<TransferIterator>}
     */
    static async resume(
        client,
        accountFilter,
        suspended,
    ) {
        const blocks = await BlockIterator.resume(client, suspended.blocks);
        const portion = await TransferIterator._queryTransfers(
            client,
            suspended.portion,
        );
        return new TransferIterator(
            new Set(accountFilter),
            blocks,
            portion,
            suspended.nextIndex,
        );
    }

    /**
     *
     * @return {Promise<?Transfer>}
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
     * @return {TransferIteratorState}
     */
    suspend() {
        return {
            blocks: this._blocks.suspend(),
            portion: this._portion.map(x => x.transaction),
            nextIndex: this._nextIndex,
        };
    }

    /**
     * @param {TonClient} client
     * @param {string[]} transactionIds
     * @return {Transfer[]}
     */
    static async _queryTransfers(client, transactionIds) {
        /** @type {Transfer[]} **/
        const transfers = [];
        const transactionIdIterator = [...transactionIds];
        while (transactionIdIterator.length > 0) {
            const portion = transactionIdIterator.splice(0, 20);
            /** @type {Transaction[]} */
            const transactions = (await client.net.query_collection({
                collection: "transactions",
                filter: { id: { in: portion } },
                result: `
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
            `,
            })).result;
            transactions.forEach((tr) => {
                const inbound = tr.in_message;
                if (inbound && Number(inbound.value) > 0) {
                    transfers.push({
                        account: tr.account_addr,
                        transaction: tr.id,
                        isDeposit: true,
                        counterparty: inbound.src,
                        value: inbound.value,
                        time: tr.now,
                    });
                }
                for (const outbound of tr.out_messages) {
                    if (Number(outbound.value) > 0) {
                        transfers.push({
                            account: tr.account_addr,
                            transaction: tr.id,
                            isDeposit: false,
                            counterparty: outbound.dst,
                            value: outbound.value,
                            time: tr.now,
                        });
                    }
                }
            });
        }
        return transfers;
    }

    async _nextPortion() {
        /** @type {string[]} */
        const transactionIds = [];
        while (transactionIds.length < 50) {
            let block = await this._blocks.next();
            if (!block) {
                break;
            }
            if (block.account_blocks) {
                for (const accountBlock of block.account_blocks) {
                    if (wanted(accountBlock.account_addr, this.accountFilter)) {
                        for (const tr of accountBlock.transactions) {
                            transactionIds.push(tr.transaction_id);
                        }
                    }
                }
            }
        }
        this._portion = await TransferIterator._queryTransfers(this.client, transactionIds);
        this._nextIndex = 0;
        this._blocks = this._blocks.clone();
    }

}


module.exports = { TransferIterator };
