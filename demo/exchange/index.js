/**
 *  In this example we demonstrate how to integrate Free TON into an exchange backend.
 *
 * It covers such use-cases as:
 *
 * - wallet deploy
 * - wallet deposit
 * - wallet withdraw
 * - sequential blockchain deposits and withdraws reading
 * - sequential wallet deposits and withdraws reading
 *
 * To run this sample you need to have a multisig wallet with positive balance, already deployed to the Developer Network.
 * Specify its private key and address at the launch. It will be used to pay for deploy operation.
 *
 * Read about multisig wallet here https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig
 *
 * To migrate from Developer Network to Free TON you need to update the endpoints specified in TonClient configuration to Free TON endpoints.
 *
 * See the list of supported networks and endpoints here https://docs.ton.dev/86757ecb2/p/85c869-networks
 * */

const { libNode } = require("@tonclient/lib-node");
const { Account } = require("@tonclient/appkit");
const { TonClient, signerKeys } = require("@tonclient/core");
const { SafeMultisigContract } = require("./contracts");

TonClient.useBinaryLibrary(libNode);

function seconds(ms) {
    return Math.round(ms / 1000);
}

/**
 * Prints transaction transfer details.
 *
 * @param {Transaction} transaction
 * @param {TransactionTransfer} transfer
 */
function printTransactionTransfer(transaction, transfer) {
    if (transfer.isDeposit) {
        console.log(`Account ${transaction.account_addr} deposits ${transfer.value} from ${transfer.counterparty} at ${transaction.now}`);
    } else {
        console.log(`Account ${transaction.account_addr} withdraws ${transfer.value} to ${transfer.counterparty} at ${transaction.now}`);
    }
}

/**
 * Prints all transaction transfers details.
 *
 * @param {Transaction} transaction
 */
function printTransfers(transaction) {
    for (const transfer of transaction.transfers) {
        printTransactionTransfer(transaction, transfer);
    }
}

let _giver = null;

/**
 * Initializes Giver Account that will be used to topup other accounts before deploy.
 *
 * Safemultisig wallet is used. If you want to use another contract as Giver -
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

    // This step is only required if you want to know when the recipent actually receives their tokens.
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
 * Other costodians need to invoke  `confirmTransaction` method for confirmation.
 * Once enough custodians confirm the transaction it will be withdrawed.
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
 * @returns {Promise<ResultOfProcessMessage>}
 */
async function depositAccount(address, amount, client) {
    await walletSend(await ensureGiver(client), address, amount);
}

/**
 * Demonstrates how to iterate 100 transactions since the specified time.
 *
 * Also this example demonstrates how to suspend iteration
 * and then resume it from the suspension point.
 *
 */
async function iterateTransactions(client) {
    const startTime = seconds(new Date(2021, 4, 27, 0).getTime());

    // Starts transfer iterator from the specific time.
    //
    // Also we can specify shard filter.
    // Shard filter is a bitmask for the first high bits of the account address.
    // This can significantly reduce time ans loading factor for the data retrieval.
    // You can scale transfer iterator by starting several processes with several
    // shard filters.
    //
    // In addition to the shard filter you can optionally specify a list of accounts address you
    // are interested in.
    //
    // Transfer iterator will return only transfers related to accounts
    // located in shards that satisfy the shard filter and included into the account filter.
    // If you specify an empty shard filter and empty account filter,
    // you will iterate all transfers for all accounts since the specified time.
    //
    const iterator = await client.net.create_transaction_iterator({
        start_time: startTime,
        include_transfers: true,
    });

    let resume_state = null;

    // Reads first 100 transfers and print their details
    for (let i = 0; i < 100; i += 1) {
        const next = await client.net.iterator_next({
            iterator: iterator.handle,
            limit: 10,
            return_resume_state: true,
        });
        for (const transaction of next.items) {
            printTransfers(transaction);
        }
        resume_state = next.resume_state;
        if (!next.has_more) {
            break;
        }
    }
    await client.net.remove_iterator(iterator);

    // Suspended state is just a plain object so you can
    // safely serialize it into file and use it later to resume
    // iteration.

    console.log("\n====================== Resume");

    // Creates new iterator that will continue iteration from
    // the previously suspended state.
    const resumed = await client.net.resume_transaction_iterator({
        resume_state,
    });
    for (let i = 0; i < 40; i += 1) {
        const next = await client.net.iterator_next({
            iterator: resumed.handle,
        });
        for (const transaction of next.items) {
            printTransfers(transaction);
        }
    }
    await client.net.remove_iterator(resumed);
}

/**
 * Demonstrates how to create wallet account,
 * deposit some value to it,
 * withdraw some value from it
 * and then read all transfers related to this account
 *
 * @param {TonClient} client
 */
async function main(client) {
    const giver = await ensureGiver(client);

    // Generate a key pair for a wallet
    console.log("Generate new wallet keys");
    const walletKeys = await client.crypto.generate_random_sign_keys();

    // In this example we will deploy safeMultisig wallet.
    // Read about it here https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig

    // The first step - initialize new account object with ABI,
    // target network (client) and signer (previously generated key pair)
    const wallet = new Account(SafeMultisigContract, {
        client,
        signer: signerKeys(walletKeys),
    });

    // Calculate wallet address so that we can sponsor it before deploy
    // https://docs.ton.dev/86757ecb2/p/45e664-basics-of-free-ton-blockchain/t/359040
    const walletAddress = await wallet.getAddress();

    const startBlockTime = seconds(Date.now());

    // Prepay contract before deploy.
    console.log(`Sending deploy fee to new wallet at ${walletAddress}`);
    await depositAccount(walletAddress, 10000000000, client);

    console.log(`Deploying new wallet at ${walletAddress}`);
    // Now lets deploy safeMultisig wallet
    // Here we declaratively specify 1 custodian and 1 reqConfirms
    // but in real life there can be many custodians as well and more than 1 required confirmations
    await wallet.deploy({
        initInput: {
            owners: [`0x${walletKeys.public}`], // constructor parameters of multisig
            reqConfirms: 1,
        },
    });

    // Lets make a couple of deposits
    console.log("Depositing 6 token...");
    await depositAccount(walletAddress, 6000000000, client);

    console.log("Depositing 7 tokens...");
    await depositAccount(walletAddress, 7000000000, client);


    // Let's make a couple of withdraws from our wallet to Giver wallet
    const giverAddress = await giver.getAddress();

    console.log("Withdrawing 2 tokens...");
    await walletWithdraw(wallet, giverAddress, 2000000000);

    console.log("Withdrawing 3 tokens...");
    await walletWithdraw(wallet, giverAddress, 3000000000);

    // Iterate transfers
    // See the api reference documentation here
    // https://tonlabs.github.io/ton-client-js/classes/netmodule.html#create_transaction_iterator
    const iterator = await client.net.create_transaction_iterator({
        start_time: startBlockTime,
        end_time: seconds(Date.now()),
        accounts_filter: [walletAddress],
        include_transfers: true,
    });
    let has_more = true;
    while (has_more) {
        // https://tonlabs.github.io/ton-client-js/classes/netmodule.html#iterator_next
        const next = await client.net.iterator_next({
            iterator: iterator.handle,
        });
        for (const transaction of next.items) {
            printTransfers(transaction);
        }
        has_more = next.has_more;
    }
    // https://tonlabs.github.io/ton-client-js/classes/netmodule.html#remove_iterator
    await client.net.remove_iterator(iterator);
}


(async () => {
    const client = new TonClient({
        network: {
            // To migrate from Developer Network to Free TON network, specify its endpoints here
            // https://docs.ton.dev/86757ecb2/p/85c869-networks
            endpoints: ["net1.ton.dev", "net5.ton.dev"], // Developer Network endpoints
        },
    });
    try {
        await main(client);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
