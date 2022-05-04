const { libNode } = require("@eversdk/lib-node");
const {
    signerKeys,
    TonClient,
} = require("@eversdk/core");
const { MultisigContract } = require("./contracts");

const SEED_PHRASE_WORD_COUNT = 12; //Mnemonic word count
const SEED_PHRASE_DICTIONARY_ENGLISH = 1; //Dictionary identifier

// See https://medium.com/myetherwallet/hd-wallets-and-derivation-paths-explained-865a643c7bf2
const HD_PATH = "m/44'/396'/0'/0/0";

const fs = require("fs");
const path = require("path");
const { Account } = require("@eversdk/appkit");

const seedPhraseFile = path.join(__dirname, "seedPhrase.json");

// Key pair used to asymmetrically encrypt data.
// See https://en.wikipedia.org/wiki/Public-key_cryptography
const keyPairFile = path.join(__dirname, "keyPair.json");

(async () => {
    // Link the platform-dependable ever-sdk binary with the target Application in Typescript
    // This is a Node.js project, so we link the application with `libNode` binary
    // from `@eversdk/lib-node` package
    // If you want to use this code on other platforms, such as Web or React-Native,
    // use  `@eversdk/lib-web` and `@eversdk/lib-react-native` packages accordingly
    // (see README in  https://github.com/tonlabs/ever-sdk-js )
    TonClient.useBinaryLibrary(libNode);

    const client = new TonClient({
        network: {
            endpoints: [
                "eri01.net.everos.dev",
                "rbx01.net.everos.dev",
                "gra01.net.everos.dev",
            ]
        }
    });
    try {

        const { crypto } = client;
        // Generate seed phrase. It is used to generate or re-generate keys. Keep it secret.
        //https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_crypto.md#mnemonic_from_random
        const { phrase } = await crypto.mnemonic_from_random({
            dictionary: SEED_PHRASE_DICTIONARY_ENGLISH,
            word_count: SEED_PHRASE_WORD_COUNT,
        });
        fs.writeFileSync(seedPhraseFile, JSON.stringify(phrase));
        console.log(`Generated seed phrase "${phrase}"`);

        let keyPair = await crypto.mnemonic_derive_sign_keys({
            phrase,
            path: HD_PATH,
            dictionary: SEED_PHRASE_DICTIONARY_ENGLISH,
            word_count: SEED_PHRASE_WORD_COUNT,
        });
        fs.writeFileSync(keyPairFile, JSON.stringify(keyPair));
        console.log(`Generated keyPair:`);
        console.log(keyPair);

        const acc = new Account(MultisigContract, { signer: signerKeys(keyPair), client });
        console.log(`Here is the future address of your contract ${await acc.getAddress()}. Please save the keys. You will need them later to work with your multisig wallet.`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
