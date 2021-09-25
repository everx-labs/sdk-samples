/**
 *  In this example we demonstrate how to integrate Free TON into an exchange backend.
 *
 * It covers such use-cases as:
 *
 * - wallet deploy
 * - wallet deposit
 * - wallet withdraw
 * - sequential blockchain transactions reading
 * - sequential wallet transactions reading
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
const { ensureGiver, depositAccount, walletWithdraw, getAccount, deployAccount } = require(
    "./wallet");
const { seconds } = require("./transactions");
const { SafeMultisigContract } = require("./contracts");
const { queryAccountTransactions } = require("./account-transactions");
const { queryAllTransactions } = require("./all-transactions");

TonClient.useBinaryLibrary(libNode);

/**
 * Prints transaction transfer details.
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
 */
async function main(client) {

    // Сonfigures the specified multisig wallet as a wallet to sponsor deploy operation
    // Read more about deploy and other basic concepts here https://ton.dev/faq/blockchain-basic
    const giver = await ensureGiver(client);

    // Generate a key pair for a wallet
    console.log("Generate new wallet keys");
    const walletKeys = await client.crypto.generate_random_sign_keys();

    // In this example we will deploy safeMultisig wallet.
    // Read about it here https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig

    // The first step - initialize new account object with ABI,
    // target network (client) and previously generated key pair (signer) and 
    // calculate future wallet address so that we can sponsor it before deploy.
    // Read more about deploy and other basic concepts here https://ton.dev/faq/blockchain-basic
    const wallet = await getAccount(client, SafeMultisigContract, signerKeys(walletKeys));
    const walletAddress = wallet.address;

    // Save timestamp before we send the first transaction. We will need it later
    const startBlockTime = seconds(Date.now());

    // Prepay contract before deploy.
    console.log(`Sending deploy fee from giver wallet ${giver.address} to the new wallet at ${walletAddress}`);
    await depositAccount(walletAddress, 2000000000, client);

    console.log(`Deploying new wallet at ${walletAddress}`);
    // Now lets deploy safeMultisig wallet
    // Here we specify 1 custodian and 1 reqConfirms
    // but in real life there can be many custodians as well and more than 1 required confirmations
    await deployAccount(wallet,  {
        owners: [`0x${walletKeys.public}`], // constructor parameters of multisig
        reqConfirms: 1,
    });

    // Lets make a deposit
    console.log("Depositing 2 tokens...");
    await depositAccount(walletAddress, 2000000000, client);


    // Let's make a withdraw from our wallet to Giver wallet
    const giverAddress = await giver.address;

    console.log(`Withdrawing 2 tokens from ${wallet.walletAddress} to ${giverAddress}...`);
    await walletWithdraw(wallet, giverAddress, 1000000000);

    // And here we retrieve all the wallet's transactions since the specified time
    //
    // Attention!
    // Note that the most recent API data can be present in an inconsistent
    // state. 
    // This means that if you paginate the data up till the current moment, there is a chance you will miss some of it.
    //
    // This happens due to sharded blockchain topology and no logical order of data inserts across
    // multiple shardchains (data inside 1 shardshain can be easily sorted, but not across them all) which can split and merge
    // Usually this data relates to the last minute. The older API data is always in consistent state.
    //
    // Therefore, not to miss any data while reading you can specify the `endTime` = (now - 2 minutes) option in correspondint methods.
    // Two minutes before now is enough not to miss anything.
    //
    // We are currently working on a new coursor field to allow reliable recent data pagination,
    // as soon as it is ready, there will be an announcement and this sample will be updated.
    // This is a high priority feature for us right now. 

    console.log(`Transactions for ${walletAddress} account since ${startBlockTime}`);
    let result = await queryAccountTransactions(client, walletAddress, {
        startTime: startBlockTime,
        // endTime: endBlockTime,     // You can set an upper time boundary @endTime to 2 minutes before now – to avoid data eventually consistency.

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

    // Now let's iterate all transactions
    //
    // Please, notice that we have added upper limit boundary so that we eliminate gaps in read data
    // due to data eventual consistency.
    //
    // Currently we are working on a feature that will allow reliable reading of recent data
    //
    // Watch out for announcements. This sample will also be refactored after the feature is released.
    console.log(`Transactions of all accounts since ${startBlockTime}`);
    result = await queryAllTransactions(client, {
        startTime: startBlockTime,
        endTime: seconds(Date.now()) - 20, // we use 20 so that we catch the transactions generated in this sample. Replace with 120.
    });
    count = 0;
    while (count < countLimit && result.transactions.length > 0) {
        for (const transaction of result.transactions) {
            printTransfers(transaction);
            count += 1;
        }
        result = await queryAllTransactions(client, {
            after: result.last,
            endTime: seconds(Date.now()) - 20, // we use 20 so that we catch the transactions generated in this sample. Replace with 120.
        });
    }
}


(async () => {
    const client = new TonClient({
        network: {
            // If you use DApp Server, specify its URL here the same way.
            // If you want to work with public Free TON API - specify its endpoints 
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
