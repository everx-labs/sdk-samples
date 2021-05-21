/**
 * @typedef Transaction
 * @property {string} id
 * @property {string} balance_delta
 * @property {?Message} in_message
 * @property {Message[]} out_messages
 */

/**
 * @typedef Message
 * @property {string} id
 * @property {string} value
 * @property {number} msg_type
 * @property {string} src
 * @property {string} dst
 * @property {Transaction} dst_transaction
 */

/**
 * @typedef Block
 * @property {string} id
 * @property {string} workchain_id
 * @property {string} shard
 * @property {boolean} after_split
 * @property {BlockAccountBlock[]} account_blocks
 */

/**
 * @typedef BlockAccountBlock
 * @property {string} account_addr
 * @property {BlockAccountBlockTransaction[]} transactions
 */

/**
 * @typedef BlockAccountBlockTransaction
 * @property {string} transaction_id
 */

/**
 * @typedef Transfer
 * @property {boolean} isDeposit
 * @property {string} value
 * @property {string} address
 */

/**
 * @callback TransferCallback
 * @param {Transfer} transfer
 * @return {boolean|Promise<boolean>|void|Promise<void>}
 */

/** @callback ErrorCallback
 * @param {Error} error
 */

const BLOCK_FIELDS = `
    id
    workchain_id
    shard
    after_split
    account_blocks {
      account_addr
      transactions {
        transaction_id
      }
    }
`;

/**
 *
 * @param {Account} account
 * @param {?string} transactionId
 * @return {Promise<?Block>}
 */
async function fetchFirstBlock(account, transactionId) {
    const net = account.client.net;
    const transactionFilter = transactionId
        ? { id: { eq: transactionId } }
        : { account_addr: { eq: await account.getAddress() } };
    const transactionOrder = transactionId
        ? []
        : [{ path: "lt", direction: "ASC" }];
    const transaction = (await net.query_collection({
        collection: "transactions",
        filter: transactionFilter,
        order: transactionOrder,
        limit: 1,
        result: "block_id"
    })).result[0];
    return (transaction && (await net.query_collection({
        collection: "blocks",
        filter: { id: { eq: transaction.block_id } },
        limit: 1,
        result: BLOCK_FIELDS,
    })).result[0]) ?? null;
}

/**
 *
 * @param {Block} block
 * @param {string} address
 * @return {boolean}
 */
function shardMatch(block, address) {
    const shard = Number.parseInt(block.shard, 16);
}

/**
 *
 * @param {Account} account
 * @param {Block} prevBlock
 * @return {Promise<?Block>}
 */
async function fetchNextBlock(account, prevBlock) {
    try {
        /** @type {Block} */
        const next = (await account.client.net.wait_for_collection({
            collection: "blocks",
            filter: {
                prev_ref: {
                    root_hash: { eq: prevBlock.id }
                },
                OR: {
                    prev_alt_ref: {
                        root_hash: { eq: prevBlock.id }
                    }
                }
            },
            result: BLOCK_FIELDS,
        })).result;
        if (next.after_split && !shardMatch(next.shard, await account.getAddress())) {
            return (await account.client.net.wait_for_collection({
                collection: "blocks",
                filter: {
                    id: { ne: next.id },
                    prev_ref: {
                        root_hash: { eq: prevBlock.id }
                    }
                },
                result: BLOCK_FIELDS,
            })).result;
        }
    } catch {
    }
    return null;
}

/**
 *
 * @param {Account} account
 * @param {?string} afterTransaction
 * @param {Block} block
 * @return {Promise<Transfer[]>}
 */
async function fetchTransfers(account, afterTransaction, block) {
    const net = account.client.net;
    const address = await account.getAddress();
    const transactionIds = [];
    for (const accountBlock of block.account_blocks) {
        if (accountBlock.account_addr === address) {
            for (const tr of accountBlock.transactions) {
                transactionIds.push(tr.transaction_id);
            }
        }
    }
    /** @type {Transfer[]} */
    const transfers = [];
    while (transactionIds.length > 0) {
        /** @type {Transaction[]} */
        const transactions = (await net.query_collection({
            collection: "transactions",
            filter: { id: { in: transactionIds } },
            result: `
                id
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
        transactions.map((tr) => {
            const inbound = tr.in_message;
            if (inbound && Number(inbound.value) > 0) {
                transfers.push({
                    transaction: tr.id,
                    isDeposit: true,
                    address: inbound.src,
                    value: inbound.value,
                });
            }
            for (const outbound of tr.out_messages) {
                if (Number(outbound.value) > 0) {
                    transfers.push({
                        transaction: tr.id,
                        isDeposit: false,
                        address: outbound.dst,
                        value: outbound.value,
                    })
                }
            }
        });
    }
    return transfers;
}

/**
 * @param {Account} account
 * @param {?string} afterTransaction
 * @param {TransferCallback} onTransfer
 * @param {ErrorCallback} [onError]
 */
function readTransfers(account, afterTransaction, onTransfer, onError) {
    (async () => {
        try {
            /** @type {?Block} */
            let prevBlock = null;
            let stop = false;
            while (!stop) {
                /** @type {?Block} */
                let nextBlock = prevBlock
                    ? await fetchNextBlock(account, prevBlock)
                    : await fetchFirstBlock(account, afterTransaction);
                if (!nextBlock) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                const transfers = await fetchTransfers(
                    account,
                    prevBlock ? null : afterTransaction,
                    nextBlock
                );
                for (const transfer of transfers) {
                    let result = onTransfer(transfer);
                    if (result instanceof Promise) {
                        result = await result;
                    }
                    if (result === false) {
                        stop = true;
                        break;
                    }
                }
                prevBlock = nextBlock;
            }
        } catch (err) {
            if (onError) {
                onError(err);
            }
        }
    })();
}

module.exports = { readTransfers };
