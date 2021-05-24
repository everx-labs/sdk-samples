const { libNode } = require("@tonclient/lib-node");
const { Account } = require("@tonclient/appkit");
const { TonClient, signerKeys } = require("@tonclient/core");
const { SafeMultisigContract } = require("./contracts");
const { readTransfers } = require("./exchange");

TonClient.useBinaryLibrary(libNode);

/**
 * Sends deploy fees.
 *
 * @param {string} address
 * @param {number} amount
 * @param {TonClient} client
 * @returns {Promise<void>}
 */
async function sendTokensTo(address, amount, client) {
    // This is demo version of sending deploy fees
    // In the real blockchain you have to use some other methods
    // to send deploy fees to you wallet.
    const giver = await Account.getGiverForClient(client);
    await giver.sendTo(address, amount);
}

function readLine() {
    return new Promise((resolve) => {
        process.stdin.once("data", (buf) => resolve(buf.toString()));
    });
}


async function main(client) {
    console.log("Generate new wallet keys");
    const walletKeys = await client.crypto.generate_random_sign_keys();
    const wallet = new Account(SafeMultisigContract, {
        client,
        signer: signerKeys(walletKeys),
    });

    const walletAddress = await wallet.getAddress();
    console.log(`Sending deploy fee to new wallet at ${walletAddress}`);
    await sendTokensTo(walletAddress, 10000000000, client);
    console.log(`Deploying new wallet at ${walletAddress}`);
    await wallet.deploy({
        initInput: {
            owners: [`0x${walletKeys.public}`],
            reqConfirms: 1
        }
    });

    console.log(`Start reading transfers on ${walletAddress}`);
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
