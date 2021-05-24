const { libNode } = require("@tonclient/lib-node");
const { Account } = require("@tonclient/appkit");
const { TonClient, signerKeys } = require("@tonclient/core");
const { SafeMultisigContract } = require("./contracts");
const { readTransfers } = require("./exchange");

TonClient.useBinaryLibrary(libNode);

/**
 * Topup an account for deploy operation.
 * This sample uses TON OS SE's High load giver which is integrated into SDK
 * and works only on local blockchain to topup an address before deploy.
 * In production you can use any other contract that can transfer funds, as a giver,
 * like, for example, a multisig wallet.
 * Or you can deploy your own High Load giver. To do that you need to generate your own pair of keys,
 * generate its address, sponsor it from another wallet and then finally deploy it the same way as you
 * deploy other contracts. 
 *
 * @param {string} address
 * @param {number} amount
 * @param {TonClient} client
 * @returns {Promise<void>}
 */
async function sendTokensTo(address, amount, client) {
    // We get the SE giver
    const giver = await Account.getGiverForClient(client);
    // Topup the target account
    await giver.sendTo(address, amount);
}

function readLine() {
    return new Promise((resolve) => {
        process.stdin.once("data", (buf) => resolve(buf.toString()));
    });
}


async function main(client) {
    // Generate a key pair for a wallet
    console.log("Generate new wallet keys");
    const walletKeys = await client.crypto.generate_random_sign_keys();
    // In this example we will deploy safeMultisig wallet.
    // Read about it here https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig
    // The first step - initialize new account object with ABI, 
    // target network (client) and signer (initialize it with previously generated key pair)
    const wallet = new Account(SafeMultisigContract, {
        client,
        signer: signerKeys(walletKeys),
    });

    // Calculate wallet address so that we can sponsor it before deploy
    const walletAddress = await wallet.getAddress();

    console.log(`Sending deploy fee to new wallet at ${walletAddress}`);
    // Use SE giver to sponsor the wallet. In production use your own giver or transfer funds from multisig 
    // wallet (or any wallet that can send transfers) before deploy
    await sendTokensTo(walletAddress, 10000000000, client);

    console.log(`Deploying new wallet at ${walletAddress}`);
    // Now lets deploy safeMultisig wallet
    // Here we declaratively specify 1 custodian and 1 reqConfirms
    // but in real life there can be many custodians as well and more than 1 required confirmations
    await wallet.deploy({
        initInput: {
            owners: [`0x${walletKeys.public}`], // constructor parameters of multisig 
            reqConfirms: 1
        }
    });

    console.log(`Start reading transfers on ${walletAddress}`);
    // Here we perform sequential block reading of the target account shard
    // to get all the deposits to the wallet (received) and withdrawals from the wallet (Sent)
    readTransfers(wallet, null, (transfer) => {
        if (transfer.isDeposit) {
            console.log(`Received ${transfer.value} from ${transfer.address}`);
        } else {
            console.log(`Sent ${transfer.value} to ${transfer.address}`);
        }
    });


    console.log("Sending 23 token...");
    await sendTokensTo(walletAddress, 23000000000, client);

    console.log("Sending 45 tokens...");
    await sendTokensTo(walletAddress, 45000000000, client);

    console.log("Press [Enter] to exit...");
    await readLine();
}

(async () => {
    const client = new TonClient({
        network: {
            endpoints: ["http://localhost"],
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
