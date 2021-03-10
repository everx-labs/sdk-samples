import {Account, TonClientEx} from "utils/account";
import {AggregationFn, signerKeys} from "@tonclient/core";
import {loadContract} from "utils";

const {libNode} = require("@tonclient/lib-node");

TonClientEx.useBinaryLibrary(libNode);
TonClientEx.defaultConfig = {
    network: {
        // Local node URL.
        server_address: "http://localhost",
    },
};

const MultisigContract = loadContract("solidity/safemultisig/SafeMultisigWallet");

async function deployContract() {
    const walletKeys = await TonClientEx.default.crypto.generate_random_sign_keys();
    const acc = new Account(MultisigContract, {
        signer: signerKeys(walletKeys),
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

async function sendMoney(acc: Account, toAddress: string, amount: any) {
    await acc.run("sendTransaction", {
        dest: toAddress,
        value: amount,
        bounce: false,
        flags: 0,
        payload: "",
    });
}

(async () => {
    try {
        // Creating two wallets that will be used in the following examples.
        const wallet1 = await deployContract();
        const wallet2 = await deployContract();

        // Query the GraphQL API version.
        console.log(">> query without params sample");
        let result = (await TonClientEx.default.net.query({"query": "{info{version}}"})).result;
        console.log("GraphQL API version is " + result.data.info.version + "\n");

        // In the following we query a collection. We get balance of the first wallet.
        // See https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#query_collection
        console.log(">> query_collection sample");
        result = (await TonClientEx.default.net.query_collection({
            collection: "accounts",
            filter: {
                id: {
                    eq: await wallet1.getAddress(),
                },
            },
            result: "balance",
        })).result;

        console.log(`Account 1 balance is ${parseInt(result[0].balance)}\n`);

        // You can do multiple queries in a single fetch request with the help of `batch_query`.
        // In the following query we get balance of both wallets at the same time.
        // See https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#batch_query
        console.log(">>batch_query sample");
        const batchQueryResult = (await TonClientEx.default.net.batch_query({
            "operations": [
                {
                    type: "QueryCollection",
                    collection: "accounts",
                    filter: {
                        id: {
                            eq: await wallet1.getAddress(),
                        },
                    },
                    result: "balance",
                }, {
                    type: "QueryCollection",
                    collection: "accounts",
                    filter: {
                        id: {
                            eq: await wallet2.getAddress(),
                        },
                    },
                    result: "balance",
                }],
        })).results;
        console.log("Balance of wallet 1 is " + batchQueryResult[0][0].balance);
        console.log("Balance of wallet 2 is " + batchQueryResult[1][0].balance + "\n");

        // If you need to wait till a certain value appears in the networl, you can use the following code.
        // Here we wait until a transaction from wallet 1 to wallet 2 appears.
        // See https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#wait_for_collection
        console.log(">>wait_for_collection sample");

        let waitForCollection = TonClientEx.default.net.wait_for_collection({
            collection: "messages",
            filter: {
                src: {
                    eq: await wallet1.getAddress(),
                },
                dst: {
                    eq: await wallet2.getAddress(),
                },
            },
            result: "id",
            timeout: 600000,
        });

        await sendMoney(wallet1, await wallet2.getAddress(), 5_000_000_000);
        result = (await waitForCollection).result;
        console.log("Got message with ID = " + result.id + "\n");

        // If you need to do an aggregation for a certain collection you can use aggregate_collection
        // as in the example below. Please note that in a real network the query may take time because
        // of the amount of data.
        // See https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#aggregate_collection
        console.log(">> aggregation_functions example");
        const aggregationFunctionsResults = (await TonClientEx.default.net.aggregate_collection({
            collection: "accounts",
            fields: [
                {
                    field: "balance",
                    fn: AggregationFn.MIN,
                }, {
                    field: "balance",
                    fn: AggregationFn.MAX,
                }, {
                    field: "balance",
                    fn: AggregationFn.AVERAGE,
                }, {
                    field: "balance",
                    fn: AggregationFn.SUM,
                }, {
                    field: "balance",
                    fn: AggregationFn.COUNT,
                },
            ],
        })).values;
        console.log("Minimum account balance: " + aggregationFunctionsResults[0]);
        console.log("Maximum account balance: " + aggregationFunctionsResults[1]);
        console.log("Average balance: " + aggregationFunctionsResults[2]);
        console.log("Total balance of all accounts: " + aggregationFunctionsResults[3]);
        console.log("Number of accounts: " + aggregationFunctionsResults[4] + "\n");


        // To get ID of the last block in a specified account shard for a wallet 1 use the following code.
        // See https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#find_last_shard_block
        console.log(">> find_last_shard_block example");
        const block_id1 = (await TonClientEx.default.net.find_last_shard_block({
            address: await wallet1.getAddress(),
        })).block_id;
        console.log(`Last Shard Block ID for address "${await wallet1.getAddress()}" is "${block_id1}"\n`);

        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();
