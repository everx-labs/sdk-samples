const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const fs = require('fs');
const path = require('path');
const { cpuUsage } = require("process");
let client;

const multisigContractPackage = {
    // https://docs.ton.dev/86757ecb2/p/40ba94-abi-specification-v2
    abi: require('../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json'),
    // Compiled smart contract file
    tvcInBase64: fs.readFileSync('../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc').toString('base64'),
};

// address of giver on NodeSE
const giverAddress = '0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94';
// giver ABI on NodeSE
const giverAbi = {
    'ABI version': 1,
    functions: [
        {
            name: 'constructor',
            inputs: [],
            outputs: [],
        },
        {
            name: 'sendGrams',
            inputs: [
                { name: 'dest', type: 'address' },
                { name: 'amount', type: 'uint64' },
            ],
            outputs: [],
        },
    ],
    events: [],
    data: [],
};

// Requesting 1000000000 local test tokens from Node SE giver
async function get_grams_from_giver(account) {
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
    await client.processing.process_message(params);
}


/**
 * Generate public and secret key pairs
 */
async function generateWalletKeys() {
    return await client.crypto.generate_random_sign_keys();
}

async function deployContract(walletKeys) {
    // We create a deploy message to calculate the future address of the contract
    // and to send it with 'sendMessage' later - if we use Pattern 1 for deploy (see below)

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
                owners: [`0x${walletKeys.public}`], //Multisig owner public key
                reqConfirms: 0,  //Multisig required confirms}
            }
        },
        signer: {
            type: 'Keys',
            keys: walletKeys
        }
    };

    const { address } = await client.abi.encode_message(deployOptions);
    console.log(`Future address of the wallet contract will be: ${address}`);
    // Requesting contract deployment funds form a local TON OS SE giver
    // not suitable for other networks
    await get_grams_from_giver(address);
    console.log(`Grams were transferred from giver to ${address}`);
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
    let response = await client.processing.process_message(params);
    //console.log(`Сontract run 'sendTransaction' function with transaction  ${response.transaction.id}`);
}

async function subscribeCollection(
    params,
    responseHandler,
) {
    return client.net.subscribe_collection(params, responseHandler);
};


(async () => {
    try {
        TonClient.useBinaryLibrary(libNode);
        client = new TonClient({
            network: {
                // Local node URL 
                server_address: "http://localhost"
            }
        });
        const wallet1keys = await generateWalletKeys();
        const wallet1Address = await deployContract(wallet1keys);


        let result = (await client.net.query_collection({
            collection: 'accounts',
            filter: {
                id: {
                    eq: wallet1Address
                }
            },
            result: 'balance'
        })).result;

        console.log(`Account 1 balance ${parseInt(result[0].balance)}`)

        const wallet2keys = await generateWalletKeys();
        const wallet2Address = await deployContract(wallet2keys);
        result = (await client.net.query_collection({
            collection: 'accounts',
            filter: { id: { eq: wallet2Address } },
            result: 'balance'
        })).result;
        console.log(`Account 2 balance ${parseInt(result[0].balance)}`);

        await new Promise(resolve => setTimeout(resolve, 1_000));

        const subscriptionAccountHandle = (await client.net.subscribe_collection({
            collection: 'accounts',
            filter: { id: { eq: wallet2Address } },
            result: "balance",
        }, (d) => {
            console.log('>>> Account subscription triggered ', parseInt(d.result.balance))
            console.log();
        })).handle;


        const subscriptionTransactionHandle = (await client.net.subscribe_collection({
            collection: 'transactions',
            filter: { account_addr: { eq: wallet2Address } },
            result: "id",
        }, (d) => {
            console.log('>>> Transaction subscription triggered', d);
        })).handle;


        const subscriptionMessageHandle = (await client.net.subscribe_collection({
            collection: 'messages',
            filter: {
                src: { eq: wallet1Address },
                dst: { eq: wallet2Address },
            },
            result: "id",
        }, (d) => {
            console.log('>>> message Subscription triggered', d);
        })).handle;


        console.log(`\nSend money from ${wallet1Address} to ${wallet2Address}`);
        await sendMoney(wallet1keys, wallet1Address, wallet2Address, 5_000_000_000);


        await client.net.unsubscribe({ handle: subscriptionAccountHandle });
        await client.net.unsubscribe({ handle: subscriptionTransactionHandle });
        await client.net.unsubscribe({ handle: subscriptionMessageHandle });


        const { block_id } = await client.net.find_last_shard_block({
            address: wallet1Address
        });
        console.log(`Last Shard Block id ${block_id}`);


        await new Promise(resolve => setTimeout(resolve, 1_000));

        result = (await client.net.query_collection({
            collection: 'accounts',
            filter: {
                id: {
                    eq: wallet1Address
                }
            },
            result: 'balance'
        })).result;

        console.log(`Account 1 balance ${parseInt(result[0].balance)}`)

        result = (await client.net.query_collection({
            collection: 'accounts',
            filter: { id: { eq: wallet2Address } },
            result: 'balance'
        })).result;
        console.log(`Account 2 balance ${parseInt(result[0].balance)}`);


        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();