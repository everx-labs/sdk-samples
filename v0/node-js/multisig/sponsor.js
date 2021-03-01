// This sponsors your multisig wallet before deploy.
// It can only be used on local blockchain TON OS SE, because it uses pre-deployed TON OS SE giver
// Read more about TON OS SE here https://docs.ton.dev/86757ecb2/p/2771b0-overview
//
// To sponsor your multisig wallet before deploy on any other network, transfer funds from other wallet 
// via Surf or tonos-cli for instance

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

// enter your wallet address that you got at the preparation.js step here:
const multisigAddress = "0:fefbfd88b07e1d5b4027e7d346beb758d4454c73f2310275920131665034073e";

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
    await get_grams_from_giver(client, multisigAddress);
    console.log(`Grams were transfered from giver to ${multisigAddress}`);

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