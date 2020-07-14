const { TONClient } = require('ton-client-node-js');

const SEED_PHRASE_WORD_COUNT = 12;
const SEED_PHRASE_DICTIONARY_ENGLISH = 1;

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
    abi: require('../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json'),
    // Compiled smart contract file
    imageBase64: fs.readFileSync('../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc').toString('base64'),
};

(async () => {
    try {
        //See https://docs.ton.dev/86757ecb2/p/069155-ton-os-se/b/09fbbd
        const tonClient = await TONClient.create({
            // You can connect to localhost if you use TON OS SE
            servers: ['net.ton.dev'],
        });
        // Generate seed phrase. It is used to generate or re-generate keys. Keep it secret.
        const seedPhrase = await tonClient.crypto.mnemonicFromRandom({ dictionary: SEED_PHRASE_DICTIONARY_ENGLISH, wordCount: SEED_PHRASE_WORD_COUNT });
        fs.writeFileSync(seedPhraseFile, JSON.stringify(seedPhrase));
        console.log(`Generated seed phrase "${seedPhrase}"`);

        //Generates keypair from seed phrase
        const hdk_master = await tonClient.crypto.hdkeyXPrvFromMnemonic({
            dictionary: SEED_PHRASE_DICTIONARY_ENGLISH,
            wordCount: SEED_PHRASE_WORD_COUNT,
            phrase: seedPhrase
        });
        const hdk_root = await tonClient.crypto.hdkeyXPrvDerivePath(hdk_master, HD_PATH, false);
        const secret = await tonClient.crypto.hdkeyXPrvSecret(hdk_root);
        let keyPair = await tonClient.crypto.naclSignKeypairFromSecretKey(secret);
        if (keyPair.secret.length > keyPair.public.length) {
            keyPair.secret = keyPair.secret.substring(0, keyPair.public.length);
        }
        fs.writeFileSync(keyPairFile, JSON.stringify(keyPair));
        console.log(`Generated keyPair:`);
        console.log(keyPair);

        // Generate future address of the contract. It is unique and the same
        // per key pair and contract to be deployed.
        const futureAddress = (await tonClient.contracts.createDeployMessage({
            package: multisigContractPackage,
            constructorParams: {
                // Multisig owners public key.
                // We are going to use a single key.
                // You can use any number of keys and custodians.
                // See https://docs.ton.dev/86757ecb2/p/94921e-multisignature-wallet-management-in-tonos-cli/t/242ea8
                owners: [`0x${keyPair.public}`],
                // Number of custodians to require for confirm transaction.
                // We use 0 for simplicity. Consider using 2+ for sufficient security.
                reqConfirms: 0,
            },
            keyPair: keyPair,
        })).address;

        console.log(`Here is the future address of your contract ${futureAddress}. Please save the keys. You will need them later to work with your multisig wallet.`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();

