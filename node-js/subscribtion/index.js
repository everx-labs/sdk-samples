const { TONClient } = require('ton-client-node-js');

const fs = require('fs');
const path = require('path');

let client;

const walletContract = {
    abi: require('./SafeMultisigWallet.abi.json'),
    imageBase64: fs.readFileSync(path.resolve(__dirname, `SafeMultisigWallet.tvc`)).toString('base64'),
}

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
async function get_grams_from_giver(client, account) {
    // console.log(account);
    const { contracts } = client;
    await contracts.run({
        address: giverAddress,
        functionName: 'sendGrams',
        abi: giverAbi,
        input: {
            dest: account,
            amount: 10_000_000_000,
        },
        keyPair: null,
    });
}


/**
 * Generate public and secret key pairs
 */
async function generateWalletKeys() {
    return await client.crypto.ed25519Keypair();
}

async function deployContract(walletKeys) {
    // We create a deploy message to calculate the future address of the contract
    // and to send it with 'sendMessage' later - if we use Pattern 1 for deploy (see below)
    const deployMessage = (await client.contracts.createDeployMessage({
        package: walletContract,
        constructorParams: {
            owners: [`0x${walletKeys.public}`], //Multisig owner public key
            reqConfirms: 0,  //Multisig required confirms
        },
        keyPair: walletKeys,
    }));

    const futureAddress = deployMessage.address;

    console.log(`Future address of the contract will be: ${futureAddress}`);

    // Requesting contract deployment funds form a local TON OS SE giver
    // not suitable for other networks
    await get_grams_from_giver(client, futureAddress);
    console.log(`Grams were transferred from giver to ${futureAddress}`);

    // Contract deployment
    const address = (await client.contracts.deploy({
        package: walletContract,
        constructorParams: {
            owners: [`0x${walletKeys.public}`], //Multisig owner public key
            reqConfirms: 0,  //Multisig required confirms
        },
        keyPair: walletKeys,
    })).address;

    console.log(`Contract was deployed at address: ${address}`);

    return address;
}

async function sendMoney(fromKey, fromAddress, toAddress, amount) {
    let response = await client.contracts.run({
        address: fromAddress,
        abi: walletContract.abi,
        functionName: 'sendTransaction',
        input: {
            dest: toAddress,
            value: amount,
            bounce: false,
            flags: 0,
            payload: ''
        },
        keyPair: fromKey,
    });
    console.log('Contract ran transaction with ID #', response.transaction.id);
}

async function main() {

    const wallet1keys = await generateWalletKeys();
    const wallet1Address = await deployContract(wallet1keys);

    const wallet2keys = await generateWalletKeys();
    const wallet2Address = await deployContract(wallet2keys);
    await new Promise(resolve => setTimeout(resolve, 10_000));

    //short form of filter
    const subscription = await client.queries.accounts.subscribe({
        //skip word filter in short form
        id: { eq: wallet2Address }
    }, 'balance', (e, d) => {
        console.log('>>> Account subscription triggered', d);
    });

    //full form of subscription
    const transactionSubscription = await client.queries.transactions.subscribe({
        filter: {
            account_addr: { eq: wallet2Address },
        },
        result: 'id',
        onDocEvent(e, d) {
            console.log('>>> Transaction subscription triggered', d);
        },
    });

    const messageSubscription = await client.queries.messages.subscribe({
        filter: {
            src: { eq: wallet1Address },
            dst: { eq: wallet2Address },
        },
        result: 'id',
        onDocEvent(e, d) {
            console.log('>>> message Subscription triggered', e, d);
        },
    });
    console.log('sendMoney to ', wallet2Address);
    await sendMoney(wallet1keys, wallet1Address, wallet2Address, 1_000_000_000);


    await new Promise(resolve => setTimeout(resolve, 10_000));
    subscription.unsubscribe();
    transactionSubscription.unsubscribe();
    messageSubscription.unsubscribe();
    process.exit(0);
}

(async () => {
    try {
        client = await TONClient.create({
            servers: ['http://localhost']
        });
        console.log("Hello localhost TON!");
        await main();
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();
