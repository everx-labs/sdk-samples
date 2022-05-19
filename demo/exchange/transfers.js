function hasTransfersOnTransactions(transactions) {
    return transactions.some(t => t.out_messages.some(m => Number(m.value) > 0) || t.in_message != null && Number(t.in_message.value))
}

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
 * Get summary transaction fee.
 */
function getTransactionFee(transaction) {
    return Number(transaction.ext_in_msg_fee ?? 0) +
        Number(transaction.storage === null ? 0 : transaction.storage.storage_fees_collected ?? 0) +
        Number(transaction.compute === null ? 0 : transaction.compute.gas_fees ?? 0) +
        Number(transaction.action === null ? 0 : transaction.action.total_fwd_fees ?? 0)
}
/**
 * Prints transaction transfer details.
 */
function printTransactionTransfer(transaction, transfer) {
    const fees = getTransactionFee(transaction);
    if (transfer.isDeposit) {
        console.log(`Account ${transaction.account_addr} deposits ${transfer.value} from ${transfer.counterparty} at ${transaction.now} fees ${fees}`);
    } else {
        console.log(`Account ${transaction.account_addr} withdraws ${transfer.value} to ${transfer.counterparty} at ${transaction.now} fees ${fees}`);
    }
}

/**
 * Prints all transaction transfers details.
 */
function printTransfers(transaction) {
    for (const transfer of getTransfersFromTransaction(transaction)) {
        printTransactionTransfer(transaction, transfer);
    }
}

module.exports = {
    hasTransfersOnTransactions,
    getTransfersFromTransaction,
    printTransactionTransfer,
    printTransfers,
};
