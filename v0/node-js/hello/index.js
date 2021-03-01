const { TONClient } = require('ton-client-node-js');
// ABI and imageBase64 of a binary Hello contract
const contractPackage = require('./HelloContract.js');

// address of giver on TON OS SE
const giverAddress = '0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94';
// giver ABI on TON OS SE
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

// Requesting 1000000000 local test tokens from TON OS SE giver
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


async function main(client) {
    // Generating public and secret key pairs
    const helloKeys = await client.crypto.ed25519Keypair();

    // Future Hello contract address
    const futureAddress = (await client.contracts.getDeployData({
        abi: contractPackage.abi,
        imageBase64: contractPackage.imageBase64,
        publicKeyHex: helloKeys.public,
        workchainId: 0,
    })).address;

    console.log(`Future address of the contract will be: ${futureAddress}`);

    // Requesting contract deployment funds form a local TON OS SE giver
    // not suitable for other networks
    await get_grams_from_giver(client, futureAddress);
    console.log(`Grams were transfered from giver to ${futureAddress}`);

    // Contract deployment
    const helloAddress = (await client.contracts.deploy({
        package: contractPackage,
        constructorParams: {},
        keyPair: helloKeys,
    })).address;

    console.log(`Hello contract was deployed at address: ${helloAddress}`);

    let response = await client.contracts.run({
        address: helloAddress,
        abi: contractPackage.abi,
        functionName: 'touch',
        input: {},
        keyPair: null, // there is no pubkey key check in the contract so we can leave it empty. Dangerous to lost all account balance because  
        //anyone can call this function
    });
    console.log('Сontract run transaction with output', response.output, ', ', response.transaction.id);

    response = await client.contracts.runLocal({
        address: helloAddress,
        abi: contractPackage.abi,
        functionName: 'sayHello',
        input: {},
        keyPair: null, 
    });
    console.log('Contract reacted to your sayHello', response.output);
}

(async () => {
    try {
        const client = await TONClient.create({
            servers: ['http://localhost'],
        });
        console.log("Hello localhost TON!");
        await main(client);
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();
