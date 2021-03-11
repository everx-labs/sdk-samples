const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");

const SEED_PHRASE_WORD_COUNT = 12; //Mnemonic word count
const SEED_PHRASE_DICTIONARY_ENGLISH = 1; //Dictionary identifier

// See https://medium.com/myetherwallet/hd-wallets-and-derivation-paths-explained-865a643c7bf2
const HD_PATH = "m/44'/396'/0'/0/0";

const fs = require('fs');
const path = require('path');

const seedPhraseFile = path.join(__dirname, 'seedPhrase.json');

// Key pair used to asymmetrically encrypt data.
// See https://en.wikipedia.org/wiki/Public-key_cryptography
const keyPairFile = path.join(__dirname, 'keyPair.json');

const multisigContractPackage = {
    // https://docs.ton.dev/86757ecb2/p/40ba94-abi-specification-v2
    abi: require('../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json'),
    // Compiled smart contract file
    tvcInBase64: fs.readFileSync('../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc').toString('base64'),
};

(async () => {
    try {
        // Link the platform-dependable TON-SDK binary with the target Application in Typescript
        // This is a Node.js project, so we link the application with `libNode` binary 
        // from `@tonclient/lib-node` package
        // If you want to use this code on other platforms, such as Web or React-Native,
        // use  `@tonclient/lib-web` and `@tonclient/lib-react-native` packages accordingly
        // (see README in  https://github.com/tonlabs/ton-client-js )
        TonClient.useBinaryLibrary(libNode);
        const tonClient = new TonClient({
            network: {
                server_address: 'net.ton.dev'
            }
        });

        // Generate seed phrase. It is used to generate or re-generate keys. Keep it secret.
        //https://github.com/tonlabs/TON-SDK/blob/e16d682cf904b874f9be1d2a5ce2196b525da38a/docs/mod_crypto.md#mnemonic_from_random
        const { phrase } = await tonClient.crypto.mnemonic_from_random({ dictionary: SEED_PHRASE_DICTIONARY_ENGLISH, word_count: SEED_PHRASE_WORD_COUNT });
        fs.writeFileSync(seedPhraseFile, JSON.stringify(phrase));
        console.log(`Generated seed phrase "${phrase}"`);

        let keyPair = await tonClient.crypto.mnemonic_derive_sign_keys({ phrase, path: HD_PATH, dictionary: SEED_PHRASE_DICTIONARY_ENGLISH, word_count: SEED_PHRASE_WORD_COUNT });
        fs.writeFileSync(keyPairFile, JSON.stringify(keyPair));
        console.log(`Generated keyPair:`);
        console.log(keyPair);

        // Generate future address of the contract. It is unique and the same per key pair and contract to be deployed.
        // Encode deploy message
        const { address } = await tonClient.abi.encode_message({
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
                    // Multisig owners public key.
                    // We are going to use a single key.
                    // You can use any number of keys and custodians.
                    // See https://docs.ton.dev/86757ecb2/p/94921e-multisignature-wallet-management-in-tonos-cli/t/242ea8
                    owners: [`0x${keyPair.public}`],
                    // Number of custodians to require for confirm transaction.
                    // We use 0 for simplicity. Consider using 2+ for sufficient security.
                    reqConfirms: 0
                }
            },
            signer: {
                type: 'Keys',
                keys: keyPair
            },
            processing_try_index: 1
        });
        console.log(`Here is the future address of your contract ${address}. Please save the keys. You will need them later to work with your multisig wallet.`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();