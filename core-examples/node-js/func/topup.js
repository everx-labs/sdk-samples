
const fs = require('fs');
const path = require('path');
const { TonClient, abiContract, signerKeys, signerNone } = require('@eversdk/core');
const { libNode } = require('@eversdk/lib-node');

const GIVER_ABI = require('./contracts/GiverV2.abi.json');
const GIVER_KEYS = readKeysFromFile('GiverV2.keys.json');
// Request funds from Giver contract

/**
 * If you are running this script not on the Evernode SE, you should:
 *  - change `ENDPOINTS`
 *  - change `GIVER_ADDRESS`
 *  - write down giver keys into 'GiverV2.keys.json'
 */
 const ENDPOINTS = ['http://localhost'];
 const GIVER_ADDRESS = '0:b5e9240fc2d2f1ff8cbb1d1dee7fb7cae155e5f6320e585fcc685698994a19a5';

 const walletAddress = "0:52cfb9b4cabf147aa28853d443e2d8aa76bb5eea5cf47042595c7112a447b827";

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
        // Send some tokens to `walletAddress` before deploy
        await getTokensFromGiver(walletAddress, 1_000_000_000);

    }
    catch (error) {
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
    console.log('Normal exit');
    process.exit(0);
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