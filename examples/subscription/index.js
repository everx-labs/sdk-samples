const { Account } = require("@tonclient/appkit");
const { loadContract } = require("utils");
const {
    signerKeys,
    TonClient,
} = require("@tonclient/core");

const { libNode } = require("@tonclient/lib-node");

TonClient.useBinaryLibrary(libNode);

const MultisigContract = loadContract("solidity/safemultisig/SafeMultisigWallet");

/**
 *
 * @param client {TonClient}
 * @returns {Promise<Account>}
 */
async function deployContract(client) {
    const walletKeys = await client.crypto.generate_random_sign_keys();
    const acc = new Account(MultisigContract, {
        signer: signerKeys(walletKeys),
        client,
    });
    await acc.deploy({
        initInput: {
            owners: [`0x${walletKeys.public}`], // Multisig owner public key.
            reqConfirms: 0,  // Multisig required confirmations zero means that
            // no additional confirmation is need to send a transaction.
        },
        useGiver: true,
    });
    console.log(`Wallet contract was deployed at address: ${await acc.getAddress()}`);

    return acc;
}

async function sendMoney(acc, toAddress, amount) {
    await acc.run("sendTransaction", {
        dest: toAddress,
        value: amount,
        bounce: false,
        flags: 0,
        payload: "",
    });
}


(async () => {
    const client = new TonClient({ network: { endpoints: ["http://localhost"] } });
    try {
        const wallet1 = await deployContract(client);

        // Query data from accounts collection https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#query_collection
        const balance1 = (await wallet1.getAccount()).balance;
        console.log(`Account 1 balance is ${balance1}`);

        const wallet2 = await deployContract(client);

        // Query balance from accounts collection with account ID equal to the second wallet address.
        const balance2 = (await wallet2.getAccount()).balance;
        console.log(`Account 2 balance is ${balance2}`);


        await new Promise(resolve => setTimeout(resolve, 1_000));

        // Subscribe to accounts collection filtered by account ID equal to the second wallet address.
        // Returns account balance when account with the specified ID is updated.
        const subscriptionAccountHandle = (await client.net.subscribe_collection({
            collection: "accounts",
            filter: { id: { eq: await wallet2.getAddress() } },
            result: "balance",
        }, (d) => {
            console.log(">>> Account subscription triggered ", parseInt(d.result.balance));
            console.log();
        })).handle;

        // Subscribe to transactions collection filtered by account ID equal to the second wallet address.
        // Returns transaction ID when there is a new transaction for this account
        const subscriptionTransactionHandle = (await client.net.subscribe_collection({
            collection: "transactions",
            filter: { account_addr: { eq: await wallet2.getAddress() } },
            result: "id",
        }, (d) => {
            console.log(">>> Transaction subscription triggered", d);
        })).handle;

        // Subscribe to messages collection filtered by src address equal to the first wallet address
        // and dst address equal to the second wallet address.
        // Returns message ID when there is a new message fulfilling this filter.
        await client.net.subscribe_collection({
            collection: "messages",
            filter: {
                src: { eq: await wallet1.getAddress() },
                dst: { eq: await wallet2.getAddress() },
            },
            result: "id",
        }, (d) => {
            console.log(">>> message Subscription triggered", d);
        });


        console.log(`\Sending money from ${await wallet1.getAddress()} to ${await wallet2.getAddress()} and waiting for completion events.`);


        await sendMoney(wallet1, await wallet2.getAddress(), 5_000_000_000);

        // Cancels a subscription specified by its handle. https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#unsubscribe
        await client.net.unsubscribe({ handle: subscriptionAccountHandle });
        await client.net.unsubscribe({ handle: subscriptionTransactionHandle });
        //    await client.net.unsubscribe({ handle: subscriptionMessageHandle });


        // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#find_last_shard_block
        // Returns ID of the latest block in a wallet 1 address account shard.
        const block_id1 = (await client.net.find_last_shard_block({
            address: await wallet1.getAddress(),
        })).block_id;
        console.log(`Last Shard Block id ${block_id1} in shard of ${await wallet1.getAddress()}`);

        // Returns ID of the latest block in a wallet 2 address account shard.
        const block_id2 = (await client.net.find_last_shard_block({
            address: await wallet2.getAddress(),
        })).block_id;
        console.log(`Last Shard Block id ${block_id2} in shard of ${await wallet2.getAddress()}`);


        await new Promise(resolve => setTimeout(resolve, 1_000));
        wallet1.refresh();
        wallet2.refresh();

        console.log(`Account 1 balance is ${(await wallet1.getAccount()).balance}`);

        console.log(`Account 2 balance is ${(await wallet2.getAccount()).balance}`);
        await wallet1.free();
        await wallet2.free();
        client.close();
    } catch (error) {
        if (error.code === 504) {
            console.error(`Network is inaccessible. You have to start TON OS SE using \`tondev se start\`.\n If you run SE on another port or ip, replace http://localhost endpoint with http://localhost:port or http://ip:port in index.js file.`);
        } else {
            console.error(error);
        }
    }
})();
