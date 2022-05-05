const fs = require('fs');
const path = require('path');
const { TonClient, abiContract, signerKeys, signerNone } = require('@eversdk/core');
const { libNode } = require('@eversdk/lib-node');

// ABI and imageBase64 of a binary HelloWallet contract
const { HelloWallet } = require('./contracts/HelloWallet.js');
const GIVER_ABI = require('./contracts/GiverV2.abi.json');
const GIVER_KEYS = readKeysFromFile('GiverV2.keys.json');

/**
 * If you are running this script not on the Evernode SE, you should:
 *  - change `ENDPOINTS`
 *  - change `GIVER_ADDRESS`
 *  - write down giver keys into 'GiverV2.keys.json'
 */
const ENDPOINTS = ['http://localhost'];
const GIVER_ADDRESS = '0:b5e9240fc2d2f1ff8cbb1d1dee7fb7cae155e5f6320e585fcc685698994a19a5';

// Link the platform-dependable ever-sdk binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@eversdk/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@eversdk/lib-web` and `@eversdk/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ever-sdk-js)
TonClient.useBinaryLibrary(libNode);
const client = new TonClient({
    network: {
        endpoints: ENDPOINTS,
        // for a query, this is the period of time during which
        // the query waits for its condition to be fulfilled
        wait_for_timeout: 180000,
    },
});

(async () => {
    try {
        // Generate an ed25519 key pair
        const walletKeys = await client.crypto.generate_random_sign_keys();

        // Calculate future wallet address.
        const walletAddress = await calcWalletAddress(walletKeys);

        // Send some tokens to `walletAddress` before deploy
        await getTokensFromGiver(walletAddress, 1_000_000_000);

        await deployWallet(walletKeys);

        // Execute `touch` method for newly deployed Hello wallet contract
        // Remember the logical time of the generated transaction
        let transLt = await touchWallet(walletAddress);

        // You can run contract's get methods locally
        await executeGetTimeLocally(walletAddress, transLt);

        // Send some tokens from Hello wallet to a random account
        // Remember the logical time of the generated transaction
        const destAddress = await genRandomAddress();
        transLt = await sendValue(walletAddress, destAddress, 100_000_000, walletKeys);
        await waitForAccountUpdate(destAddress, transLt);

        console.log('Normal exit');
        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error(
                [
                    'Network is inaccessible. You have to start Evernode SE using `everdev se start`',
                    'If you run SE on another port or ip, replace http://localhost endpoint with',
                    'http://localhost:port or http://ip:port in index.js file.',
                ].join('\n'),
            );
        } else {
            console.error(error);
            process.exit(1);
        }
    }
})();

async function calcWalletAddress(keys) {
    // Get future `Hello`Wallet contract address from `encode_message` result
    const { address } = await client.abi.encode_message(buildDeployOptions(keys));
    console.log(`Future address of Hello wallet contract is: ${address}`);
    return address;
}

function buildDeployOptions(keys) {
    // Prepare parameters for deploy message encoding
    // See more info about `encode_message` method parameters here:
    // https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_abi.md#encode_message
    const deployOptions = {
        abi: {
            type: 'Contract',
            value: HelloWallet.abi,
        },
        deploy_set: {
            tvc: HelloWallet.tvc,
            initial_data: {},
        },
        call_set: {
            function_name: 'constructor',
            input: {},
        },
        signer: {
            type: 'Keys',
            keys,
        },
    };
    return deployOptions;
}

// Request funds from Giver contract
async function getTokensFromGiver(dest, value) {
    console.log(`Transfering ${value} tokens from giver to ${dest}`);

    const params = {
        send_events: false,
        message_encode_params: {
            address: GIVER_ADDRESS,
            abi: abiContract(GIVER_ABI),
            call_set: {
                function_name: 'sendTransaction',
                input: {
                    dest,
                    value,
                    bounce: false,
                },
            },
            signer: {
                type: 'Keys',
                keys: GIVER_KEYS,
            },
        },
    };
    await client.processing.process_message(params);
    console.log('Success. Tokens were transfered\n');
}

async function deployWallet(walletKeys) {
    // Deploy `Hello wallet` contract
    // See more info about `process_message` here:
    // https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_processing.md#process_message
    console.log('Deploying Hello wallet contract');
    await client.processing.process_message({
        send_events: false,
        message_encode_params: buildDeployOptions(walletKeys),
    });
    console.log('Success. Contract was deployed\n');
}

async function touchWallet(address) {
    // Encode the message with `touch` function call
    const params = {
        send_events: false,
        message_encode_params: {
            address,
            abi: {
                type: 'Contract',
                value: HelloWallet.abi,
            },
            call_set: {
                function_name: 'touch',
                input: {},
            },
            signer: signerNone(),
        },
    };
    console.log('Calling `touch` function');
    const response = await client.processing.process_message(params);
    const { id, lt } = response.transaction;
    console.log('Success. TransactionId is: %s\n', id);
    return lt;
}


// Sometimes it is needed to execute getmethods after on-chain calls.
// This means that the downloaded account state should have the changes made by the on-chain call. 
// To ensure it, we need to remember the transaction lt (logical time) of the last call
// and then wait for the account state to have lt > the transaction lt. 
// Note that account.last_trans_lt is always bigger than transaction.lt because this field stores the end lt of transaction interval
// For more information about transaction lt interval read TON Blockchain spec https://test.ton.org/tblkch.pdf P. 4.2.1
async function waitForAccountUpdate(address, transLt) {
    console.log('Waiting for account update');
    const startTime = Date.now();
    const account = await client.net.wait_for_collection({
        collection: 'accounts',
        filter: {
            id: { eq: address },
            last_trans_lt: { gt: transLt },
        },
        result: 'boc',
    });
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.log(`Success. Account was updated, it took ${duration} sec.\n`);
    return account;
}

async function executeGetTimeLocally(address, transLt) {
    // Execute the get method `getTimestamp` on the latest account's state
    // This can be managed in 3 steps:
    // 1. Download the latest Account State (BOC) 
    // 2. Encode message
    // 3. Execute the message locally on the downloaded state

    // Download the latest state (BOC)
    // See more info about wait_for_collection method here:
    // https://docs.everos.dev/ever-sdk/reference/types-and-methods/mod_net#wait_for_collection
    const account = await waitForAccountUpdate(address, transLt).then(({ result }) => result.boc);

    // Encode the message with `getTimestamp` call
    const { message } = await client.abi.encode_message({
        // Define contract ABI in the Application
        // See more info about ABI type here:
        // https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_abi.md#abi
        abi: {
            type: 'Contract',
            value: HelloWallet.abi,
        },
        address,
        call_set: {
            function_name: 'getTimestamp',
            input: {},
        },
        signer: { type: 'None' },
    });

    // Execute `getTimestamp` get method  (execute the message locally on TVM)
    // See more info about run_tvm method here:
    // https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_tvm.md#run_tvm
    console.log('Run `getTimestamp` function locally');
    const response = await client.tvm.run_tvm({
        message,
        account,
        abi: {
            type: 'Contract',
            value: HelloWallet.abi,
        },
    });
    console.log('Success. Output is: %o\n', response.decoded.output);
}

async function sendValue(address, dest, amount, keys) {
    // Encode the message with `sendValue` function call
    const sendValueParams = {
        send_events: false,
        message_encode_params: {
            address,
            // Define contract ABI in the Application
            // See more info about ABI type here:
            // https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_abi.md#abi
            abi: {
                type: 'Contract',
                value: HelloWallet.abi,
            },
            call_set: {
                function_name: 'sendValue',
                input: {
                    dest,
                    amount,
                    bounce: false,
                },
            },
            signer: signerKeys(keys),
        },
    };
    console.log(`Sending ${amount} tokens to ${dest}`);
    // Call `sendValue` function
    const response = await client.processing.process_message(sendValueParams);
    console.log('Success. Target account will recieve: %d tokens\n', response.fees.total_output);
    return response.transaction.lt;
}

// Helpers
function readKeysFromFile(fname) {
    const fullName = path.join(__dirname, fname);
    // Read the Giver keys. We need them to sponsor a new contract
    if (!fs.existsSync(fullName)) {
        console.log(`Please place ${fname} file with Giver keys in project root folder`);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(fullName, 'utf8'));
}

async function genRandomAddress() {
    const { bytes } = await client.crypto.generate_random_bytes({ length: 32 });
    return `0:${Buffer.from(bytes, 'base64').toString('hex')}`;
}
