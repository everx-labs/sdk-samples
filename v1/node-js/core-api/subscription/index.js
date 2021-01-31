const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const fs = require('fs');
const path = require('path');
let client;

const multisigContractPackage = {
    // https://docs.ton.dev/86757ecb2/p/40ba94-abi-specification-v2
    abi: require('../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json'),
    // Compiled smart contract file.
    tvcInBase64: fs.readFileSync('../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc').toString('base64'),
};

// Address of giver on TON OS SE, https://docs.ton.dev/86757ecb2/p/00f9a3-ton-os-se-giver
const giverAddress = '0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94';
// Giver ABI on TON OS SE
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

// Requesting local test tokens from TON OS SE giver.
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
    console.log(`Future address of the wallet contract will be: ${address}`);

    // Requesting contract deployment funds form a local TON OS SE giver.
    // Not suitable for other networks.
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
    await client.processing.process_message(params);
}

(async () => {
    try {
        TonClient.useBinaryLibrary(libNode);
        client = new TonClient({
            network: {
                // Local node URL.
                server_address: "http://localhost"
            }
        });
        const wallet1keys = await generateWalletKeys();
        const wallet1Address = await deployContract(wallet1keys);

        // Query data from accounts collection https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#query_collection
        let result = (await client.net.query_collection({
            collection: 'accounts',
            filter: {
                id: {
                    eq: wallet1Address
                }
            },
            result: 'balance'
        })).result;

        console.log(`Account 1 balance is ${parseInt(result[0].balance)}`)

        const wallet2keys = await generateWalletKeys();
        const wallet2Address = await deployContract(wallet2keys);

        // Queries balance from collection with account ID equals second wallet address. 
        result = (await client.net.query_collection({
            collection: 'accounts',
            filter: { id: { eq: wallet2Address } },
            result: 'balance'
        })).result;
        console.log(`Account 2 balance is ${parseInt(result[0].balance)}`);


        await new Promise(resolve => setTimeout(resolve, 1_000));

        // Subscribe to accounts collection with account ID equals second wallet address.
        // Returns account balance when accounts collection will change.
        const subscriptionAccountHandle = (await client.net.subscribe_collection({
            collection: 'accounts',
            filter: { id: { eq: wallet2Address } },
            result: "balance",
        }, (d) => {
            console.log('>>> Account subscription triggered ', parseInt(d.result.balance))
            console.log();
        })).handle;

        // Subscribe to transactions collection with account ID equals second wallet address.
        // Returns transaction ID when transaction is received with such ID.
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


        console.log(`\Sending money from ${wallet1Address} to ${wallet2Address} and waiting for completion events.`);


        await sendMoney(wallet1keys, wallet1Address, wallet2Address, 5_000_000_000);

        // Cancels a subscription specified by its handle. https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#unsubscribe
        await client.net.unsubscribe({ handle: subscriptionAccountHandle });
        await client.net.unsubscribe({ handle: subscriptionTransactionHandle });
        await client.net.unsubscribe({ handle: subscriptionMessageHandle });



        // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#find_last_shard_block
        // Returns ID of the latest block in a wallet 1 address account shard.
        const block_id1 = (await client.net.find_last_shard_block({
            address: wallet1Address
        })).block_id;
        console.log(`Last Shard Block id ${block_id1} in shard of ${wallet1Address}`);

        // Returns ID of the latest block in a wallet 2 address account shard.
        const block_id2 = (await client.net.find_last_shard_block({
            address: wallet2Address
        })).block_id;
        console.log(`Last Shard Block id ${block_id2} in shard of ${wallet2Address}`);


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

        console.log(`Account 1 balance is ${parseInt(result[0].balance)}`)

        result = (await client.net.query_collection({
            collection: 'accounts',
            filter: { id: { eq: wallet2Address } },
            result: 'balance'
        })).result;
        console.log(`Account 2 balance is ${parseInt(result[0].balance)}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();