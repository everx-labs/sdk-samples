const path = require("path");
const fs = require("fs");

/** @typedef {import("@tonclient/core").Signer} TonSigner */

function loadContract(name) {
    const contractPath = path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "ton-labs-contracts",
        "solidity",
        name,
    );
    return {
        // https://docs.ton.dev/86757ecb2/p/40ba94-abi-specification-v2
        abi: {
            type: "Contract",
            value: require(`${contractPath}.abi.json`),
        },
        // Compiled smart contract file
        tvc: fs.readFileSync(`${contractPath}.tvc`).toString("base64"),
    };
}

// Signer management

const SEED_PHRASE_WORD_COUNT = 12; //Mnemonic word count
const SEED_PHRASE_DICTIONARY_ENGLISH = 1; //Dictionary identifier

// See https://medium.com/myetherwallet/hd-wallets-and-derivation-paths-explained-865a643c7bf2
const HD_PATH = "m/44'/396'/0'/0/0";

const seedPhraseFile = path.join(__dirname, "seedPhrase.json");

// Key pair used to asymmetrically encrypt data.
// See https://en.wikipedia.org/wiki/Public-key_cryptography
const keyPairFile = path.join(__dirname, "keyPair.json");

/**
 *
 * @param {TonClient} client
 * @return {Promise<TonSigner>}
 */
async function prepareSignerWithRandomKeys(client) {
    // Generate seed phrase. It is used to generate or re-generate keys. Keep it secret.
    //https://github.com/tonlabs/TON-SDK/blob/e16d682cf904b874f9be1d2a5ce2196b525da38a/docs/mod_crypto.md#mnemonic_from_random
    const { phrase } = await client.crypto.mnemonic_from_random({
        dictionary: SEED_PHRASE_DICTIONARY_ENGLISH,
        word_count: SEED_PHRASE_WORD_COUNT,
    });
    fs.writeFileSync(seedPhraseFile, JSON.stringify(phrase));
    console.log(`Generated seed phrase "${phrase}"`);

    const keyPair = await client.crypto.mnemonic_derive_sign_keys({
        phrase,
        path: HD_PATH,
        dictionary: SEED_PHRASE_DICTIONARY_ENGLISH,
        word_count: SEED_PHRASE_WORD_COUNT,
    });
    fs.writeFileSync(keyPairFile, JSON.stringify(keyPair));

    console.log(`Generated keyPair:`);
    console.log(keyPair);

    return {
        type: "Keys",
        keys: keyPair,
    };
}

function getPreparedSigner() {
    if (!fs.existsSync(keyPairFile)) {
        console.log("Please use preparation.js to generate key pair and seed phrase");
        process.exit(1);
    }

    const keyPair = JSON.parse(fs.readFileSync(keyPairFile, "utf8"));
    return {
        type: "Keys",
        keys: keyPair,
    };
}

module.exports = {
    networkEndpoints: ["net1.ton.dev", "net5.ton.dev"],
    SafeMultisigContract: loadContract("safemultisig/SafeMultisigWallet"),
    prepareSignerWithRandomKeys,
    getPreparedSigner,
};
