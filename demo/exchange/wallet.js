const { Account } = require("@tonclient/appkit");
const { SafeMultisigContract } = require("./contracts");
const { signerKeys } = require("@tonclient/core");
let _giver = null;

/**
 * Initializes Giver Account that will be used to topup other accounts before deploy.
 *
 * SafeMultisig wallet is used. If you want to use another contract as Giver -
 * read more about how to add a contract to a project here
 * https://docs.ton.dev/86757ecb2/p/07f1a5-add-contract-to-your-app-/b/462f33
 *
 */
async function ensureGiver(client) {
    if (!_giver) {
        const address = process.argv[2];
        const secret = process.argv[3];
        if (!address || !secret) {
            console.log("USE: node index <giver-address> <giver-secret-key>");
            console.log("Giver must be the safe multisig wallet");
            process.exit(1);
        }
        _giver = new Account(SafeMultisigContract, {
            client,
            signer: signerKeys({
                public: (await client.crypto.nacl_sign_keypair_from_secret_key({ secret }))
                    .secret.substr(64),
                secret,
            }),
        });
    }
    return _giver;
}

/**
 *
 * @param {Account} account
 * @param {string} functionName
 * @param {Object} input
 * @return {Promise<Transaction[]>}
 */
async function runAndWaitForRecipientTransactions(account, functionName, input) {
    const runResult = await account.run(functionName, input);
    const transactions = [];

    // This step is only required if you want to know when the recipient actually receives their tokens.
    // In Free TON blockchain, transfer consists of 2 transactions (because the blockchain is asynchronous):
    //  1. Sender sends tokens - this transaction is returned by `Run` method
    //  2. Recipient receives tokens - this transaction can be caught with `query_transaction_tree method`
    // Read more about transactions and messages here
    // https://docs.ton.dev/86757ecb2/p/45e664-basics-of-free-ton-blockchain/t/20b3af
    for (const messageId of runResult.transaction.out_msgs) {
        const tree = await account.client.net.query_transaction_tree({
            in_msg: messageId,
        });
        transactions.push(...tree.transactions);
    }
    return transactions;
}

/**
 * Sends some tokens from msig wallet to specified address.
 *
 * @param {Account} wallet
 * @param {string} address
 * @param {number} amount
 * @returns {Promise<void>}
 */
async function walletSend(wallet, address, amount) {
    await runAndWaitForRecipientTransactions(wallet, "sendTransaction", {
        dest: address,
        value: amount,
        bounce: false,
        flags: 1,
        payload: "",
    });
}

/**
 * Withdraws some tokens from Multisig wallet to a specified address.
 *
 * In case of 1 custodian `submitTransaction` method performs full withdraw operation.
 *
 * In case of several custodians, `submitTransaction` creates a transaction inside the wallet
 * for other custodians to confirm.
 * Other custodians need to invoke  `confirmTransaction` method for confirmation.
 * Once enough custodians confirm the transaction it will be withdrawn.
 * Read more how to work with multisig here
 * https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig
 *
 * @param {Account} wallet
 * @param {string} address
 * @param {number} amount
 * @returns {Promise<void>}
 */
async function walletWithdraw(wallet, address, amount) {
    const transactions = await runAndWaitForRecipientTransactions(wallet, "submitTransaction", {
        dest: address,
        value: amount,
        bounce: false,
        allBalance: false,
        payload: "",
    });
    if (transactions.length > 0) {
        console.log(`Recipient received transfer. The recipient's transaction is: ${transactions[0].id}`);
    }
}

/**
 * Topup an account for deploy operation.
 *
 * We need an account which can be used to deposit other accounts.
 * We call it "giver".
 *
 * This sample uses already deployed multisig wallet with positive balance as a giver.
 *
 * In production you can use any other contract that can transfer funds, as a giver.
 *
 * @param {string} address
 * @param {number} amount
 * @param {TonClient} client
 * @returns {Promise<void>}
 */
async function depositAccount(address, amount, client) {
    await walletSend(await ensureGiver(client), address, amount);
}

module.exports = {
    ensureGiver,
    depositAccount,
    runAndWaitForRecipientTransactions,
    walletWithdraw,
    walletSend
};
