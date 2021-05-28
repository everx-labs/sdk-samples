const { libNode } = require("@tonclient/lib-node");
const { Account } = require("@tonclient/appkit");
const { TonClient, signerKeys } = require("@tonclient/core");
const { SafeMultisigContract } = require("./contracts");
const { TransferIterator } = require("./transfers");
const { ShardIdent } = require("./sharding");
const { BlockIterator } = require("./blocks");

TonClient.useBinaryLibrary(libNode);

/**
 * Prints transfer details.
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
 * Demonstrates how to iterate 100 transfers since the specified time.
 *
 * Also this example demonstrates how to suspend iteration
 * and then resume it from the suspension point.
 *
 */
async function iterateTransfers(client) {
    const startTime = new Date(2021, 4, 27, 0).getTime() / 1000;

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
    const transfers = await TransferIterator.start(
        client,
        startTime,
        new ShardIdent(0, ""),
        [],
    );

    // Reads first 100 transfers and print their details
    for (let i = 0; i < 100; i += 1) {
        const record = await transfers.next()
        if (record) {
            dumpTransfer(record)
        } else {
            break
        }
    }

    // We can suspend current iteration and get suspended state
    const suspended = transfers.suspend();

    // Suspended state is just a plain object so you can
    // safely serialize it into file and use it later to resume
    // iteration.

    console.log("\n====================== Resume");

    // Creates new iterator that will continue iteration from
    // the previously suspended state.
    const resumed = await TransferIterator.resume(client, [], suspended);
    for (let i = 0; i < 40; i += 1) {
        const record = await resumed.next()
        if (record) {
            dumpTransfer(record)
        } else {
            break
        }
    }
}

/**
 * Topup an account for deploy operation.
 * This sample uses TON OS SE's High load giver which is integrated into SDK
 * and works only on local blockchain to topup an address before deploy.
 * In production you can use any other contract that can transfer funds, as a giver,
 * like, for example, a multisig wallet.
 * Or you can deploy your own High Load giver. Search for its source code, abi and bytecode (tvc)
 * here https://github.com/tonlabs/tonos-se/tree/master/contracts/giver_v2
 *
 * @param {string} address
 * @param {number} amount
 * @param {TonClient} client
 * @returns {Promise<void>}
 */
async function depositAccount(address, amount, client) {
    // Here you have to send tokens to the specified account address
    //
    // In production you can do it with several ways:
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
    // target network (client) and signer (previously generated key pair)
    const wallet = new Account(SafeMultisigContract, {
        client,
        signer: signerKeys(walletKeys),
    });

    // Calculate wallet address so that we can sponsor it before deploy
    const walletAddress = await wallet.getAddress();

    // Create transfer iterator. Generally it can iterate all the blocks and 
    // transactions but here this iterator will iterate only the blocks containing
    // our wallet account transactions
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
            endpoints: ["net1.ton.dev", "net5.ton.dev"],
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
