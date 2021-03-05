const { abiContract, TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const fs = require('fs');
const path = require('path');
const giverKeyPairFileName = 'GiverV2.keys.json';
const giverKeyPairFile = path.join(__dirname, giverKeyPairFileName);
// ABI and imageBase64 of a binary Hello contract
const contractPackage = require('./HelloContract.js');

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

// Requesting 1000000000 local test tokens from TON OS SE giver
async function get_grams_from_giver(client, account) {
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


async function main(client) {
    // Define contract ABI in the Application 
    // See more info about ABI type here https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_abi.md#abi
    const abi = {
        type: 'Contract',
        value: contractPackage.abi
    }
    // Generate an ed25519 key pair
    const helloKeys = await client.crypto.generate_random_sign_keys();
    
    // Prepare parameters for deploy message encoding
    // See more info about `encode_message` method parameters here https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_abi.md#encode_message
    const deployOptions = {
        abi,
        deploy_set: {
            tvc: contractPackage.tvcInBase64,
            initial_data: {}
        },
        call_set: {
            function_name: 'constructor',
            input: {}
        },
        signer: {
            type: 'Keys',
            keys: helloKeys
        }
    }

    // Encode deploy message
    // Get future `Hello` contract address from `encode_message` result
    // to sponsor it with tokens before deploy
    const { address } = await client.abi.encode_message(deployOptions);
    console.log(`Future address of the contract will be: ${address}`);

    // Request contract deployment funds form a local TON OS SE giver
    // not suitable for other networks
    await get_grams_from_giver(client, address);
    console.log(`Grams were transfered from giver to ${address}`);

    // Deploy `hello` contract
    // See more info about `process_message` here  
    // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_processing.md#process_message
    await client.processing.process_message({
        send_events: false,
        message_encode_params: deployOptions
    });

    console.log(`Hello contract was deployed at address: ${address}`);

    // Encode the message with `touch` function call
    const params = {
        send_events: false,
        message_encode_params: {
            address,
            abi,
            call_set: {
                function_name: 'touch',
                input: {}
            },
            // There is no pubkey key check in the contract
            // so we can leave it empty. Never use this approach in production
            // because anyone can call this function
            signer: { type: 'None' }
        }
    }
    // Call `touch` function
    let response = await client.processing.process_message(params);
    console.log(`Сontract run transaction with output ${response.decoded.output}, ${response.transaction.id}`);

    // Execute the get method `getTimestamp` on the latest account's state
    // This can be managed in 3 steps:
    // 1. Download the latest Account State (BOC)
    // 2. Encode message
    // 3. Execute the message locally on the downloaded state

    const [account, message] = await Promise.all([
        // Download the latest state (BOC)
        // See more info about query method here 
        // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#query_collection
        client.net.query_collection({
            collection: 'accounts',
            filter: { id: { eq: address } },
            result: 'boc'
        })
        .then(({ result }) => result[0].boc)
        .catch(() => {
            throw Error(`Failed to fetch account data`)
        }),
        // Encode the message with `getTimestamp` call
        client.abi.encode_message({
            abi,
            address,
            call_set: {
                function_name: 'getTimestamp',
                input: {}
            },
            signer: { type: 'None' }
        }).then(({ message }) => message)
    ]);

    // Execute `getTimestamp` get method  (execute the message locally on TVM)
    // See more info about run_tvm method here 
    // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_tvm.md#run_tvm
    response = await client.tvm.run_tvm({ message, account, abi });
    console.log('Contract reacted to your getTimestamp:', response.decoded.output);
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
        const client = new TonClient({
            network: { 
                // Local node URL here
                server_address: 'http://localhost'
            }
        });
        console.log("Hello localhost TON!");
        await main(client);
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();
