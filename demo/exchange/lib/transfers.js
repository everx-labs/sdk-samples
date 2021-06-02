const { BlockIterator, BlockFilter, BLOCK_TRANSACTIONS_FIELDS, queryByIds } = require("./blocks");
const { getTransfersFromTransaction } = require("./transactions");

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
 * @typedef {{
 *     shard: Shard,
 *     startBlockTime: number,
 *     endBlockTime?: number,
 * }} TransferFilter
 */


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
     * @param {TransferFilter} filter
     * @param {string[]} accountFilter
     * @return {Promise<TransferIterator>}
     */
    static async start(
        client,
        filter,
        accountFilter,
    ) {
        const blocks = await BlockIterator.start(
            client,
            new BlockFilter(
                filter.shard,
                filter.startBlockTime,
                filter.endBlockTime,
                BLOCK_TRANSACTIONS_FIELDS,
            ),
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
        /** @type {Transaction[]} */
        const transactions = await queryByIds(
            client,
            "transactions",
            transactionIds,
            `
            id
            account_addr
            now
            balance_delta(format:DEC)
            in_message { 
                id
                value(format:DEC)
                msg_type
                src
            } 
            out_messages {
                id
                value(format:DEC)
                msg_type
                dst
            }
        `,
        );
        transactions.forEach(x => getTransfersFromTransaction(x).forEach(x => transfers.push(x)));
        return transfers;
    }

    eof() {
        return this._blocks.eof() && (this._portion.length === 0);
    }

    async _nextPortion() {
        if (this._blocks.eof()) {
            this._portion = [];
            this._nextIndex = 0;
        }
        /** @type {string[]} */
        const transactionIds = [];
        const blocks = this._blocks.clone();

        while (transactionIds.length === 0) {
            let block = await blocks.next();
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
        this._blocks = blocks;
    }

}


module.exports = {
    TransferIterator,
};
