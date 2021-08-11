const { abiContract, TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const fs = require('fs');
const path = require('path');
const giverKeyPairFileName = 'GiverV2.keys.json';
const giverKeyPairFile = path.join(__dirname, giverKeyPairFileName);
let client;

const multisigContractPackage = {
    // https://docs.ton.dev/86757ecb2/p/40ba94-abi-specification-v2
    abi: require('../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json'),
    // Compiled smart contract file.
    tvcInBase64: fs.readFileSync('../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc').toString('base64'),
};

// Address of giver on TON OS SE
const giverAddress = '0:b5e9240fc2d2f1ff8cbb1d1dee7fb7cae155e5f6320e585fcc685698994a19a5';
// Giver ABI on TON OS SE
const giverAbi = abiContract({
    'ABI version': 2,
    header: ['time', 'expire'],
    functions: [
        {
            name: 'sendTransaction',
            inputs: [
                { 'name': 'dest', 'type': 'address' },
                { 'name': 'value', 'type': 'uint128' },
                { 'name': 'bounce', 'type': 'bool' }
            ],
            outputs: []
        },
        {
            name: 'getMessages',
            inputs: [],
            outputs: [
                {
                    components: [
                        { name: 'hash', type: 'uint256' },
                        { name: 'expireAt', type: 'uint64' }
                    ],
                    name: 'messages',
                    type: 'tuple[]'
                }
            ]
        },
        {
            name: 'upgrade',
            inputs: [
                { name: 'newcode', type: 'cell' }
            ],
            outputs: []
        },
        {
            name: 'constructor',
            inputs: [],
            outputs: []
        }
    ],
    data: [],
    events: []
});

// Requesting 10 local test tokens from TON OS SE giver
async function get_tokens_from_giver(account) {
    if (!fs.existsSync(giverKeyPairFile)) {
        console.log(`Please place ${giverKeyPairFileName} file in project root folder with Giver's keys`);
        process.exit(1);
    }

    const giverKeyPair = JSON.parse(fs.readFileSync(giverKeyPairFile, 'utf8'));

    const params = {
        send_events: false,
        message_encode_params: {
            address: giverAddress,
            abi: giverAbi,
            call_set: {
                function_name: 'sendTransaction',
                input: {
                    dest: account,
                    value: 10_000_000_000,
                    bounce: false
                }
            },
            signer: {
                type: 'Keys',
                keys: giverKeyPair
            },
        },
    }
    await client.processing.process_message(params)
}


/**
 * Generate public and secret key pairs.
 */
async function generateWalletKeys() {
    return await client.crypto.generate_random_sign_keys();
}

async function deployContract(walletKeys) {
    // We create a deploy message to calculate the future address of the contract
    // and to send it with 'sendMessage' later - if we use Pattern 1 for deploy (see below).

    const deployOptions = {
        abi: {
            type: 'Contract',
            value: multisigContractPackage.abi
        },
        deploy_set: {
            tvc: multisigContractPackage.tvcInBase64,
            initial_data: {}
        },
        call_set: {
            function_name: 'constructor',
            input: {
                owners: [`0x${walletKeys.public}`], // Multisig owner public key.
                reqConfirms: 0,  // Multisig required confirmations zero means that
                // no additional confirmation is neede to send a transaction.
            }
        },
        signer: {
            type: 'Keys',
            keys: walletKeys
        }
    };

    const { address } = await client.abi.encode_message(deployOptions);

    // Requesting contract deployment funds form a local TON OS SE giver.
    // Not suitable for other networks.
    await get_tokens_from_giver(address);
    await client.processing.process_message({
        send_events: false,
        message_encode_params: deployOptions
    });

    console.log(`Wallet contract was deployed at address: ${address}`);

    return address;
}

async function sendMoney(senderKeys, fromAddress, toAddress, amount) {
    const params = {
        send_events: false,
        message_encode_params: {
            address: fromAddress,
            abi: {
                type: 'Contract',
                value: multisigContractPackage.abi
            },
            call_set: {
                function_name: 'sendTransaction',
                input: {
                    dest: toAddress,
                    value: amount,
                    bounce: false,
                    flags: 0,
                    payload: ''
                },
            },
            signer: {
                type: 'Keys',
                keys: senderKeys
            }
        }
    }
    await client.processing.process_message(params);
}

(async () => {
    try {
        // Link the platform-dependable TON-SDK binary with the target Application in Typescript
        // This is a Node.js project, so we link the application with `libNode` binary 
        // from `@tonclient/lib-node` package
        // If you want to use this code on other platforms, such as Web or React-Native,
        // use  `@tonclient/lib-web` and `@tonclient/lib-react-native` packages accordingly
        // (see README in  https://github.com/tonlabs/ton-client-js )
        TonClient.useBinaryLibrary(libNode);
        client = new TonClient({
            network: {
                // Local node URL.
                server_address: "http://localhost"
            }
        });

        // Creating two wallets that will be used in the following examples.
        const wallet1keys = await generateWalletKeys();
        const wallet1Address = await deployContract(wallet1keys);

        const wallet2keys = await generateWalletKeys();
        const wallet2Address = await deployContract(wallet2keys);

        // Query the GraphQL API version.
        console.log(">> query without params sample");
        result = (await client.net.query({ "query": "{info{version}}" })).result;
        console.log("GraphQL API version is " + result.data.info.version + '\n');

        // In the following we query a collection. We get balance of the first wallet.
        // See https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#query_collection
        console.log(">> query_collection sample");
        result = (await client.net.query_collection({
            collection: 'accounts',
            filter: {
                id: {
                    eq: wallet1Address
                }
            },
            result: 'balance'
        })).result;

        console.log(`Account 1 balance is ${parseInt(result[0].balance)}\n`);

        // You can do multiple queries in a single fetch request with the help of `batch_query`.
        // In the following query we get balance of both wallets at the same time.
        // See https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#batch_query
        console.log(">>batch_query sample");
        const batchQueryResult = (await client.net.batch_query({
            "operations": [
                {
                    type: 'QueryCollection',
                    collection: 'accounts',
                    filter: {
                        id: {
                            eq: wallet1Address
                        }
                    },
                    result: 'balance'
                }, {
                    type: 'QueryCollection',
                    collection: 'accounts',
                    filter: {
                        id: {
                            eq: wallet2Address
                        }
                    },
                    result: 'balance'
                }]
        })).results;
        console.log("Balance of wallet 1 is " + batchQueryResult[0][0].balance);
        console.log("Balance of wallet 2 is " + batchQueryResult[1][0].balance + '\n');

        // If you need to wait till a certain value appears in the networl, you can use the following code.
        // Here we wait until a transaction from wallet 1 to wallet 2 appears.
        // See https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#wait_for_collection
        console.log(">>wait_for_collection sample");

        let waitForCollection = client.net.wait_for_collection({
            collection: 'messages',
            filter: {
                src: {
                    eq: wallet1Address
                },
                dst: {
                    eq: wallet2Address
                },
            },
            result: 'id',
            timeout: 600000
        });

        await sendMoney(wallet1keys, wallet1Address, wallet2Address, 5_000_000_000);
        result =(await waitForCollection).result;
        console.log("Got message with ID = " + result.id + '\n');

        // If you need to do an aggregation for a certain collection you can use aggregate_collection
        // as in the example below. Please note that in a real network the query may take time because
        // of the amount of data.
        // See https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#aggregate_collection
        console.log(">> aggregation_functions example");
        const aggregationFunctionsResults = result = (await client.net.aggregate_collection({
            collection: 'accounts',

            fields: [
                {
                    field: "balance",
                    fn: "MIN"
                },
                {
                    field: "balance",
                    fn: "MAX"
                }, {
                    field: "balance",
                    fn: "AVERAGE"
                }, {
                    field: "balance",
                    fn: "SUM"
                },
                {
                    field: "balance",
                    fn: "COUNT"
                }
            ]
        })).values;
        console.log("Minimum account balance: " + aggregationFunctionsResults[0]);
        console.log("Maximum account balance: " + aggregationFunctionsResults[1]);
        console.log("Average balance: " + aggregationFunctionsResults[2]);
        console.log("Total balance of all accounts: " + aggregationFunctionsResults[3]);
        console.log("Number of accounts: " + aggregationFunctionsResults[4] + '\n');


        // To get ID of the last block in a specified account shard for a wallet 1 use the following code.
        // See https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#find_last_shard_block
        console.log(">> find_last_shard_block example");
        const block_id1 = (await client.net.find_last_shard_block({
            address: wallet1Address
        })).block_id;
        console.log(`Last Shard Block ID for address "${wallet1Address}" is "${block_id1}"\n`);

        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error(`Network is inaccessible. You have to start TON OS SE using \`tondev se start\`.\n If you run SE on another port or ip, replace http://localhost endpoint with http://localhost:port or http://ip:port in index.js file.`);
        } else {
            console.error(error);
        }
    }
})();