const { libNode } = require("@tonclient/lib-node");
const { Account } = require("@tonclient/appkit");
const { TonClient, signerKeys } = require("@tonclient/core");
const { SafeMultisigContract } = require("./contracts");
const { TransferIterator } = require("./transfers");
const { ShardIdent } = require("./sharding");
const { BlockIterator, BLOCK_TRANSACTIONS_FIELDS } = require("./blocks");

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
async function depositAccount(address, amount, client) {
    // Here you have to send tokens to specified account address
    //
    // In the production you can do it with several ways:
    // - using surf application
    // - using tonos-cli
    // - using you own wallet application
    // - using code
    //
    // In this example we use some already deployed account with GiverV2 smart contract
    // and enough positive balance. Such accounts shipped with TONOS SE instance.
    // And keys for this accounts are known.
    const giver = await Account.getGiverForClient(client);
    // Topup the target account
    await giver.sendTo(address, amount);
}

/**
 * @param {?Block} block
 */
function dumpBlock(block) {
    if (block) {
        if (block.account_blocks) {
            console.log(`\n${block.id} ${block.account_blocks.length}`);
        } else {
            process.stdout.write(".");
        }
    } else {
        process.stdout.write("-");
    }
}

/**
 * Demonstrates how to iterate 100 blocks since specified time.
 *
 * Also this example demonstrates how to suspend iteration
 * and then resume it from suspension point.
 *
 */
async function iterateBlocks(client) {
    const yesterday = new Date(2021, 4, 27, 0).getTime() / 1000;
    console.log(">>>", yesterday);
    const blocks = await BlockIterator.start(
        client,
        yesterday,
        new ShardIdent(0, ""),
        BLOCK_TRANSACTIONS_FIELDS,
    );
    for (let i = 0; i < 100; i += 1) {
        dumpBlock(await blocks.next());
    }
    const suspended = blocks.suspend();
    let resumed = await BlockIterator.resume(client, suspended);
    console.log("\n====================== Resume 1");
    for (let i = 0; i < 40; i += 1) {
        dumpBlock(await resumed.next());
    }
    console.log("\n====================== Resume 2");
    resumed = await BlockIterator.resume(client, suspended);
    for (let i = 0; i < 40; i += 1) {
        dumpBlock(await resumed.next());
    }
}

/**
 *
 * @param {Transfer} transfer
 */
function dumpTransfer(transfer) {
    if (transfer.isDeposit) {
        console.log(`Account ${transfer.account} deposits ${transfer.value} from ${transfer.counterparty} at ${transfer.time}`);
    } else {
        console.log(`Account ${transfer.account} withdraws ${transfer.value} to ${transfer.counterparty} at ${transfer.time}`);
    }
}

/**
 * Demonstrates how to iterate 100 transfers since specified time.
 *
 * Also this example demonstrates how to suspend iteration
 * and then resume it from suspension point.
 *
 */
async function iterateTransfers(client) {
    const yesterday = new Date(2021, 4, 27, 0).getTime() / 1000;
    const transfers = await TransferIterator.start(
        client,
        yesterday,
        new ShardIdent(0, ""),
        [],
    );
    for (let i = 0; i < 100; i += 1) {
        dumpTransfer(await transfers.next());
    }
    const suspended = transfers.suspend();

    console.log("\n====================== Resume 1");

    let resumed = await TransferIterator.resume(client, [], suspended);
    for (let i = 0; i < 40; i += 1) {
        dumpTransfer(await resumed.next());
    }

    console.log("\n====================== Resume 2");

    resumed = await TransferIterator.resume(client, [], suspended);
    for (let i = 0; i < 40; i += 1) {
        dumpTransfer(await resumed.next());
    }
}

/**
 * Demonstrates how to create wallet account,
 * deposits it with some values
 * and then read all transfers related to this account
 */
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

    // Create transfer iterator at this time point
    const transfers = await TransferIterator.start(
        client,
        Date.now() / 1000,
        ShardIdent.fromAddress(walletAddress),
        [walletAddress],
    );

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

    console.log("Sending 23 token...");
    await depositAccount(walletAddress, 23000000000, client);

    console.log("Sending 45 tokens...");
    await depositAccount(walletAddress, 45000000000, client);

    let transfer = await transfers.next();
    while (transfer) {
        dumpTransfer(transfer);
        transfer = await transfers.next();
    }
}

(async () => {
    const client = new TonClient({
        network: {
            endpoints: ["net.ton.dev"],
        },
    });
    try {
        BlockIterator.debugMode = true;
        await iterateTransfers(client);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
