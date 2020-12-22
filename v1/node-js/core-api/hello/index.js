const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
// ABI and imageBase64 of a binary Hello contract
const HelloContract = require('./HelloContract.js');

// Address of giver on NodeSE
const giverAddress = '0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94';
// Giver ABI on NodeSE
const giverAbi = {
    'ABI version': 1,
    functions: [{
            name: 'constructor',
            inputs: [],
            outputs: []
        }, {
            name: 'sendGrams',
            inputs: [
                { name: 'dest', type: 'address' },
                { name: 'amount', type: 'uint64' }
            ],
            outputs: []
        }],
    events: [],
    data: []
};

// Requesting 1000000000 local test tokens from Node SE giver
async function get_grams_from_giver(client, account) {
    const params = {
        send_events: false,
        message_encode_params: {
            address: giverAddress,
            abi: {
                type: 'Contract',
                value: giverAbi
            },
            call_set: {
                function_name: 'sendGrams',
                input: {
                    dest: account,
                    amount: 10_000_000_000
                }
            },
            signer: { type: 'None' }
        },
    }
    await client.processing.process_message(params)
}


async function main(client) {
    const abi = {
        type: 'Contract',
        value: HelloContract.package.abi
    }
    // Generating public and secret key pairs
    const helloKeys = await client.crypto.generate_random_sign_keys();
    
    // Future Hello contract address
    const deployOptions = {
        abi,
        deploy_set: {
            tvc: HelloContract.package.imageBase64,
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
    const { address } = await client.abi.encode_message(deployOptions);
    console.log(`Future address of the contract will be: ${address}`);

    // Requesting contract deployment funds form a local TON OS SE giver
    // not suitable for other networks
    await get_grams_from_giver(client, address);
    console.log(`Grams were transfered from giver to ${address}`);

    // Contract deployment
    await client.processing.process_message({
        send_events: false,
        message_encode_params: deployOptions
    });

    console.log(`Hello contract was deployed at address: ${address}`);

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
            // so we can leave it empty. Dangerous to lost all account balance
            // because anyone can call this function
            signer: { type: 'None' }
        }
    }
    let response = await client.processing.process_message(params);
    console.log(`Сontract run transaction with output ${response.decoded.output}, ${response.transaction.id}`);

    // Load account's BOC and encode message for executing runLocal
    const [account, message] = await Promise.all([
        client.net.query_collection({
            collection: 'accounts',
            filter: { id: { eq: address } },
            result: 'boc'
        })
        .then(({ result }) => result[0].boc)
        .catch(() => {
            throw Error(`Failed to fetch account data`)
        }),
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

    response = await client.tvm.run_tvm({ message, account, abi });
    console.log('Contract reacted to your getTimestamp:', response.decoded.output);
}

(async () => {
    try {
        TonClient.useBinaryLibrary(libNode);
        const client = new TonClient({
            network: { 
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
