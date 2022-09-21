/**
 *  In this example we demonstrate how to integrate EVER OS into an exchange backend.
 *
 * It covers such use-cases as:
 *
 * - wallet deploy
 * - wallet deposit
 * - wallet withdraw
 * - cursor-based pagination read all transfers related to this wallet
 *
 * To run this sample you need to have a multisig wallet with positive balance, already deployed to the Developer Network.
 * Specify its private key and address at the launch. It will be used to pay for deploy operation.
 *
 * Read about multisig wallet here https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig
 * See example on how to deploy it here https://github.com/tonlabs/sdk-samples/tree/master/core-examples/node-js/multisig
 *
 * To migrate from Developer Network to Everscale you need to update the endpoints specified in TonClient configuration to Everscale endpoints.
 *
 * See the list of supported networks and endpoints here https://docs.everos.dev/ever-sdk/reference/ever-os-api/networks
 * */

const { libNode } = require("@eversdk/lib-node");
const { TonClient, signerKeys } = require("@eversdk/core");
const { ensureGiver, depositAccount, walletWithdraw, getAccount, deployAccount } = require(
    "./wallet");
const { SafeMultisigContract } = require("./contracts");
const { keyPress, seconds } = require("./utils");
const { getLastMasterBlockSeqNo, getLastMasterBlockSeqNoByTime } = require("./blockchain");
const { queryAccountTransactions } = require("./account-transactions");
const { queryAllTransactions } = require("./all-transactions");
const { hasTransfersOnTransactions, printTransfers } = require("./transfers");

TonClient.useBinaryLibrary(libNode);

/**
 * Demonstrates how to create wallet account,
 * deposit some value to it,
 * withdraw some value from it
 * and then read all transfers related to this account
 */
async function main(client) {
    // Сonfigures the specified multisig wallet as a wallet to sponsor deploy operation
    const giver = await ensureGiver(client);

    // Generate a key pair for a wallet that we will deploy
    console.log("Generate new wallet keys");
    const walletKeys = await client.crypto.generate_random_sign_keys();

    // In this example we will deploy safeMultisig wallet.
    // Read about it here https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig

    // The first step - initialize new account object with ABI,
    // target network (client) and previously generated key pair (signer) and 
    // calculate future wallet address so that we can sponsor it before deploy.
    // Read more about deploy and other basic concepts here https://everos.dev/faq/blockchain-basic
    const wallet = await getAccount(client, SafeMultisigContract, signerKeys(walletKeys));

    // Save last master block seq_no before we send the first transaction.
    // It will be used later as starting point for pagination request.
    const lastSeqNo = await getLastMasterBlockSeqNo(client);

    // Prepay contract before deploy.
    console.log(`Sending deploy fee from giver wallet ${giver.address} to the new account at ${wallet.address}`);
    await depositAccount(wallet.address, 500_000_000, client);

    console.log(`Deploying new wallet at ${wallet.address}`);
    // Now lets deploy safeMultisig wallet
    // Here we specify 1 custodian and 1 reqConfirms
    // but in real life there can be many custodians as well and more than 1 required confirmations
    await deployAccount(wallet,  {
        owners: [`0x${walletKeys.public}`], // constructor parameters of multisig
        reqConfirms: 1,
    });

    // Lets make a deposit
    console.log("Depositing 2 tokens...");
    await depositAccount(wallet.address, 2_000_000_000, client);


    // Let's make a withdraw from our wallet to Giver wallet
    console.log(`Withdrawing 1 token from ${wallet.address} to ${giver.address}...`);
    await walletWithdraw(wallet, giver.address, 1_000_000_000);

    // To build a query with pagination, let's limit the count of transactions
    // which will be obtained by one request
    const countLimit = 10;

    // And here we retrieve all the wallet's transactions since the specified block seq_no
    // Due to blockchain multi-sharded nature its data needs some time to reach consistency
    // for reliable pagination. This is why we use `for` here, waiting for the last transaction
    // in the list
    let size = 0;
    console.log(`\nTransactions for ${wallet.address} account since block(seq_no):${lastSeqNo}`);
    for await (let transactions of queryAccountTransactions(client, wallet.address, {seq_no: lastSeqNo, count: countLimit})) {
        transactions.forEach(printTransfers);
        size += transactions.length;
        if (size >= 4) {
            // Wait 4 transactions:
            //   1. Sending deploy fee
            //   2. Deploying new wallet
            //   3. Depositing 2 tokens
            //   4. Withdrawing 1 token
            break;
        }
    }

    // Now let's iterate all blockchain transactions with value transfers.
    // Starting from master seq_no which was generated 10 minuts ago.
    const afterSeqNo = await getLastMasterBlockSeqNoByTime(client, seconds(Date.now() - 10*60*1000));
    console.log(`\nTransactions of all accounts`);
    for await (let transactions of queryAllTransactions(client, {seq_no: afterSeqNo, count: countLimit})) {
        // Trying get next trnsactions which contain any valuable transfers
        if (!hasTransfersOnTransactions(transactions)) {
            continue;
        }

        transactions.forEach(printTransfers);

        try {
            await keyPress();
        } catch(_) {
            // If pressed Ctrl+C exits from iteration
            break;
        }
    }
}


(async () => {
    const client = new TonClient({
        network: {
            endpoints: [
                // Create a project on https://dashboard.evercloud.dev and replace this endpoint 
                // with your "Everscale network" or "Development Network" HTTPS endpoint:
                "https://devnet.evercloud.dev/cafebabed4/graphql"
            ],
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
