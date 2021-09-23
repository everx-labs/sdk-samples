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
const { TonClient, signerKeys } = require("@tonclient/core");
const { ensureGiver, depositAccount, walletWithdraw } = require("./wallet");
const { seconds } = require("./transactions");
const { Account } = require("@tonclient/appkit");
const { SafeMultisigContract } = require("./contracts");
const { queryAccountTransactions } = require("./account-transactions");
const { queryAllTransactions } = require("./all-transactions");

TonClient.useBinaryLibrary(libNode);

/**
 * Prints transaction transfer details.
 *
 * @param {Transaction} transaction
 * @param {Transfer} transfer
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
    // Here we specify 1 custodian and 1 reqConfirms
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

    // Set time upper bound 2 minutes before now – to avoid eventually consistency.

    console.log(`Transfers for ${walletAddress} account since ${startBlockTime}`);
    let result = await queryAccountTransactions(client, walletAddress, {
        startTime: startBlockTime,
    });
    const countLimit = 200;
    let count = 0;
    while (count < countLimit && result.transactions.length > 0) {
        for (const transaction of result.transactions) {
            printTransfers(transaction);
            count += 1;
        }
        result = await queryAccountTransactions(client, walletAddress, {
            after: result.last,
        });
    }

    console.log(`Transfers for all accounts since ${startBlockTime}`);
    result = await queryAllTransactions(client, {
        startTime: startBlockTime,
    });
    count = 0;
    while (count < countLimit && result.transactions.length > 0) {
        for (const transaction of result.transactions) {
            printTransfers(transaction);
            count += 1;
        }
        result = await queryAllTransactions(client, {
            after: result.last,
        });
    }
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
