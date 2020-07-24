// This script can only be used on local blockchain TON OS SE
// Read more about TON OS SE here https://docs.ton.dev/86757ecb2/p/2771b0-overview
const { TONClient } = require('ton-client-node-js');

// address of TON OS SE giver
const giverAddress = '0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94';
// ABI of TON OS SE giver 
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

async function main(client) {
    // Requesting contract deployment funds form a local NodeSE giver
    // not suitable for other networks
    const futureAddress = "0:a975e73ef87b4a6192896bed9a3555eda304c8b734c89d546a98e492c66a5677";

    await get_grams_from_giver(client, futureAddress);
    console.log(`Grams were transfered from giver to ${futureAddress}`);

};

(async () => {
    try {
        const client = await TONClient.create({
            servers: ['http://localhost'],
        });
        await main(client);
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();