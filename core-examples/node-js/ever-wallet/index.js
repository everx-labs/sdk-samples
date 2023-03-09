const fs = require('fs');
const path = require('path');
const { TonClient, abiContract, signerKeys, signerNone } = require('@eversdk/core');
const { libNode } = require('@eversdk/lib-node');

// ABI and imageBase64 of a binary HelloWallet contract
const WALLET_ABI= require('./contracts/Wallet.abi.json');
const WALLET_CODE = 'te6cckEBBgEA/AABFP8A9KQT9LzyyAsBAgEgAgMABNIwAubycdcBAcAA8nqDCNcY7UTQgwfXAdcLP8j4KM8WI88WyfkAA3HXAQHDAJqDB9cBURO68uBk3oBA1wGAINcBgCDXAVQWdfkQ8qj4I7vyeWa++COBBwiggQPoqFIgvLHydAIgghBM7mRsuuMPAcjL/8s/ye1UBAUAmDAC10zQ+kCDBtcBcdcBeNcB10z4AHCAEASqAhSxyMsFUAXPFlAD+gLLaSLQIc8xIddJoIQJuZgzcAHLAFjPFpcwcQHLABLM4skB+wAAPoIQFp4+EbqOEfgAApMg10qXeNcB1AL7AOjRkzLyPOI+zYS/';
const WALLET_KEYS =
{
    public: '992b8a4174ecf331093977e662b6d9471da30368b2a00e44bd6a1e93f68fdc8e',
    secret: 'ec7ea650075047c570abdf53e70f3b9d2dbdc97f40d89c655585ffcbec7657b2'
}

/**
 * If you are running this script not on the Evernode SE, you should:
 *  - change `ENDPOINTS`
 *  - change `GIVER_ADDRESS`
 *  - write down giver keys into 'GiverV2.keys.json'
 */
const ENDPOINTS = ['http://localhost'];
const GIVER_ADDRESS = '0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415';
const GIVER_ABI = require('./contracts/GiverV2.abi.json');;
const GIVER_KEYS = 
{
    "public": "2ada2e65ab8eeab09490e3521415f45b6e42df9c760a639bcf53957550b25a16",
    "secret": "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3"
}

// Link the platform-dependable ever-sdk binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@eversdk/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@eversdk/lib-web` and `@eversdk/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ever-sdk-js)
TonClient.useBinaryLibrary(libNode);
const client = new TonClient({
    network: {
        endpoints: ENDPOINTS
    },
});

(async () => {
    try {
        // Generate an ed25519 key pair
        //const walletKeys = await client.crypto.generate_random_sign_keys();
        console.log(`Wallet keys: ${JSON.stringify(WALLET_KEYS,null, 2)}`);

        const initData = (await client.abi.encode_boc({
            params:[
                {
                    name: `publicKey`,
                    type: `uint256`
                },
                {
                    name: `timestamp`,
                    type: `uint64`
                }
            ],
            data:{
                publicKey: `0x`+WALLET_KEYS.public,
                timestamp: 1678367396//Date.now()
            }
        })).boc
        console.log(`Init data: ${initData}`);

        const stateInit = (await client.boc.encode_tvc({
            code: WALLET_CODE,
            data: initData
        })).tvc;
        console.log(stateInit);
        console.log(`State init: ${stateInit}`);

        // Calculate future wallet address.
        const tvcHash = (await client.boc.get_boc_hash({boc: stateInit})).hash;
        const walletAddress = `0:${tvcHash}`;
        console.log(`Wallet address: ${walletAddress}`);

        // Send some tokens to `walletAddress` before deploy
        await getTokensFromGiver(walletAddress, 1_000_000_000);

        // Deploy wallet
        await makeFirstTransferWithDeploy(WALLET_KEYS);

        // Get wallet's account info and print balance
        const accountState = await getAccount(walletAddress);
        console.log("Hello wallet balance is", accountState.balance)

        // Run account's get method `getTimestamp`
        let walletTimestamp = await runGetMethod('getTimestamp', walletAddress, accountState.boc );
        console.log("`timestamp` value is", walletTimestamp)

        // Perform 2 seconds sleep, so that we receive an updated timestamp
        await new Promise(r => setTimeout(r, 2000));
        // Execute `touch` method for newly deployed Hello wallet contract
        // Remember the logical time of the generated transaction
        let transLt = await runOnChain(walletAddress, "touch");

        // Run contract's get method locally after account is updated
        walletTimestamp = await runGetMethodAfterLt('getTimestamp', walletAddress, transLt);
        console.log("Updated `timestamp` value is", walletTimestamp)

        // Send some tokens from Hello wallet to a random account
        // Remember the logical time of the generated transaction
        const destAddress = await genRandomAddress();
        transLt = await sendValue(walletAddress, destAddress, 100_000_000, WALLET_KEYS);

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

async function makeFirstTransferWithDeploy(stateInit, walletKeys) {
    // Deploy `Hello wallet` contract
    // See more info about `process_message` here:
    // https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_processing.md#process_message
    console.log('Deploy and make the first transfer');
    const FirstTransferParams = {
        abi: {
            type: 'Contract',
            value: WALLET_ABI,
        },
        deploy_set: {
            tvc: stateInit
        },
        call_set: {
            function_name: 'sendTransaction',
            input: {
                dest: `0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415`,
                value: `1000000000`,
                bounce: 
            },
        },
        signer: {
            type: 'Keys',
            keys,
        },
    };


    "inputs": [
        {
          "name": "dest",
          "type": "address"
        },
        {
          "name": "value",
          "type": "uint128"
        },
        {
          "name": "bounce",
          "type": "bool"
        },
        {
          "name": "flags",
          "type": "uint8"
        },
        {
          "name": "payload",
          "type": "cell"
        }
    await client.processing.process_message({
        send_events: false,
        message_encode_params: buildDeployOptions(walletKeys),
    });
    console.log('Success. Contract was deployed\n');
}

async function runOnChain(address, methodName) {
    // Encode the message with external call
    const params = {
        send_events: false,
        message_encode_params: {
            address,
            abi: {
                type: 'Contract',
                value: HelloWallet.abi,
            },
            call_set: {
                function_name: methodName,
                input: {},
            },
            signer: signerNone(),
        },
    };
    console.log(`Calling ${methodName} function`);
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


async function getAccount(address) {

    // `boc` or bag of cells - native blockchain data layout. Account's boc contains full account state (code and data) that
    // we will  need to execute get methods.
    const query = `
        query {
          blockchain {
            account(
              address: "${address}"
            ) {
               info {
                balance(format: DEC)
                boc
              }
            }
          }
        }`
    const {result}  = await client.net.query({query})
    const info = result.data.blockchain.account.info
    return info
}
async function runGetMethod(methodName, address, accountState) {
    // Execute the get method `getTimestamp` on the latest account's state
    // This can be managed in 3 steps:
    // 1. Download the latest Account State (BOC) 
    // 2. Encode message
    // 3. Execute the message locally on the downloaded state

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
            function_name: methodName,
            input: {},
        },
        signer: { type: 'None' },
    });

    // Execute `getTimestamp` get method  (execute the message locally on TVM)
    // See more info about run_tvm method here:
    // https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_tvm.md#run_tvm
    console.log('Run `getTimestamp` get method');
    const response = await client.tvm.run_tvm({
        message,
        account: accountState,
        abi: {
            type: 'Contract',
            value: HelloWallet.abi,
        },
    });
    return response.decoded.output
}


async function runGetMethodAfterLt(methodName, address, transLt) {
    // Wait for the account state to be more or equal the spesified logical time
    const accountState = await waitForAccountUpdate(address, transLt).then(({ result }) => result.boc);
    const result = await runGetMethod(methodName, address, accountState);
    return result;
    
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
