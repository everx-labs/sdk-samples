/**
 * This sample demonstrates how to perform subsequent blockchain deposits or withdraws reading.
 * You can read either all blockchain transfers, or transfers of specified accounts.
 *
 * Also, for convenience, this sample includes the steps of wallet deploy, deposit and withdraw.
 *
 * To run this sample you need to have a multisig wallet with positive balance,
 * already deployed to the Developer Network. Specify its private key at the launch
 *
 * `node index privateKey`
 *
 * Read about multisig wallet here https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisighttps://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig
 *
 * To migrate to Free TON you need to update the endpoints specified in TonClient configuration
 * to Free TON endpoints.
 *
 * See the list of supported networks and endpoints here https://docs.ton.dev/86757ecb2/p/85c869-networks
 *
 * */

const { libNode } = require("@tonclient/lib-node");
const { Account } = require("@tonclient/appkit");
const { TonClient, signerKeys } = require("@tonclient/core");
const { SafeMultisigContract } = require("./contracts");
const { TransferIterator } = require("./lib/transfers");
const { Shard } = require("./lib/sharding");

TonClient.useBinaryLibrary(libNode);

function seconds(ms) {
    return Math.round(ms / 1000);
}

/**
 * Prints transfer details.
 *
 * @param {Transfer} transfer
 */
function printTransfer(transfer) {
    if (transfer.isDeposit) {
        console.log(`Account ${transfer.account} deposits ${transfer.value} from ${transfer.counterparty} at ${transfer.time}`);
    } else {
        console.log(`Account ${transfer.account} withdraws ${transfer.value} to ${transfer.counterparty} at ${transfer.time}`);
    }
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
 * Demonstrates how to iterate 100 transfers since the specified time.
 *
 * Also this example demonstrates how to suspend iteration
 * and then resume it from the suspension point.
 *
 */
async function iterateTransfers(client) {
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
    const transfers = await TransferIterator.start(
        client,
        {
            startBlockTime: startTime,
            shard: Shard.zero(),
        },
        [],
    );

    // Reads first 100 transfers and print their details
    for (let i = 0; i < 100; i += 1) {
        printTransfer(await transfers.next());
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
        printTransfer(await resumed.next());
    }
}

/**
 *
 * @param {Transaction} transaction
 */
function printTransfers(transaction) {
    for (const transfer of transaction.transfers) {
        if (transfer.isDeposit) {
            console.log(`Account ${transaction.account_addr} deposits ${transfer.value} from ${transfer.counterparty} at ${transaction.now}`);
        } else {
            console.log(`Account ${transaction.account_addr} withdraws ${transfer.value} to ${transfer.counterparty} at ${transaction.now}`);
        }
    }
}

let _giver = null;

async function ensureGiver(client) {
    if (!_giver) {
        const secret = process.argv[2];
        if (!secret) {
            console.log("USE: node index <safe-msig-sign-key>");
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
 * Topup an account for deploy operation.
 *
 * We need an account which can be used to deposit other accounts.
 * Usually it is called "giver".
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
    const giver = await ensureGiver(client);
    await giver.run("sendTransaction", {
        dest: address,
        value: amount,
        bounce: false,
        flags: 1,
        payload: "",
    });
}

/**
 * Demonstrates how to create wallet account,
 * deposits some values to it,
 * withdraw some value from it
 * and then read all transfers related to this account
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

    // Lets make a couple deposits
    console.log("Depositing 6 token...");
    await depositAccount(walletAddress, 6000000000, client);

    console.log("Depositing 7 tokens...");
    await depositAccount(walletAddress, 7000000000, client);

    const giverAddress = await giver.getAddress();
    console.log("Withdrawing 2 tokens...");
    await wallet.run("sendTransaction", {
        dest: giverAddress,
        value: 2000000000,
        bounce: false,
        flags: 1,
        payload: "",
    });

    // Now we perform withdraw operation. Let's withdraw 3 tokens
    console.log("Withdrawing 3 tokens...");
    await wallet.run("sendTransaction", {
        dest: giverAddress,
        value: 3000000000,
        bounce: false,
        flags: 1, /// when using flag 1 forward fees are charged from the sender, not the recipient
        payload: "",
    });
    // Wait for 5 sec to finalize all transactions
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Create transfer iterator
    // this iterator will iterate only blocks containing
    // our wallet account updates and transactions
    const transfers = await TransferIterator.start(
        client,
        {
            startBlockTime,
            endBlockTime: seconds(Date.now()),
            shard: Shard.fromAddress(walletAddress),
        },
        [walletAddress],
    );
    while (!transfers.eof()) {
        const transfer = await transfers.next();
        if (transfer) {
            printTransfer(transfer);
        }
    }
}


(async () => {
    const client = new TonClient({
        network: {
            // To migrate to Free TON network, specify its endpoints here
            // https://docs.ton.dev/86757ecb2/p/85c869-networks
            endpoints: ["net1.ton.dev", "net5.ton.dev"],
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
