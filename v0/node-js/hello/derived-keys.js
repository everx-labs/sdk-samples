const { TONClient } = require('ton-client-node-js');
const Hello = require('./HelloContract');

(async () => {
    try {
        const tonos = await TONClient.create({ servers: ['http://localhost'] });

        // Generate master seed phrase that will be used as a master root for all keys.
        const seed = await tonos.crypto.mnemonicFromRandom({
            dictionary: 1
        });

        // Generate a lot of derived keys from single master seed
        for (let i = 0; i < 100; i += 1) {
            // Derive keys for i-th account
            const keys = (await tonos.crypto.mnemonicDeriveSignKeys({
                dictionary: 1,
                phrase: seed,
                path: `m/${i}`,
            }));

            // Calculate address for ith account
            const address = (await tonos.contracts.createDeployMessage({
                package: Hello.package,
                constructorParams: {},
                keyPair: keys,
            })).address;

            console.log('>>>', address, keys);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
