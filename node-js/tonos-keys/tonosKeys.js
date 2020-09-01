// This sample demonstrates 2 ways of how to generate a seed phrase and tonon-compatible 
// (that can be used in Surf and tonon-cli) key pair from it with SDK 

const { TONClient } = require('ton-client-node-js');

const SEED_PHRASE_WORD_COUNT = 12;
const SEED_PHRASE_DICTIONARY_ENGLISH = 1;
const HD_PATH = "m/44'/396'/0'/0/0";


( async () =>{


    try {
        const tonClient = await TONClient.create({
            servers: ['localhost'],
            log_verbose: true
        });

        // Generate a seed phrase from random. 
        const seedPhrase = await tonClient.crypto.mnemonicFromRandom({ dictionary: SEED_PHRASE_DICTIONARY_ENGLISH, wordCount: SEED_PHRASE_WORD_COUNT });
        console.log(`Seed phrase "${seedPhrase}"`);


        // Generate a tonos-compatible key pair from the seed phrase

        // 1. Easy way via single method
        let tonosKeyPair1 = await tonClient.crypto.mnemonicDeriveSignKeys({
            dictionary: SEED_PHRASE_DICTIONARY_ENGLISH,
            wordCount: SEED_PHRASE_WORD_COUNT,
            phrase: seedPhrase,
            path: HD_PATH
        });

        console.log(`\n1 method. Tonos-compatible key pair:`);
        console.log(tonosKeyPair1);

        // 2. Step-by-step way to demonstrate the algorithm

        const hdk_root = await tonClient.crypto.hdkeyXPrvFromMnemonic({
            dictionary: SEED_PHRASE_DICTIONARY_ENGLISH,
            wordCount: SEED_PHRASE_WORD_COUNT,
            phrase: seedPhrase
        });
        console.log(`\nSerialized extended master private key: \n${hdk_root}`);

        const extended_prkey = await tonClient.crypto.hdkeyXPrvDerivePath(hdk_root, HD_PATH, false);
        console.log(`Serialized derived extended private key: \n${extended_prkey}`);

        const secret = await tonClient.crypto.hdkeyXPrvSecret(extended_prkey);
        console.log(`Derived private key: \n${secret}`);

        let tonosKeyPair2 = await tonClient.crypto.naclSignKeypairFromSecretKey(secret);

        if (tonosKeyPair2.secret.length > tonosKeyPair2.public.length) {
            tonosKeyPair2.secret = tonosKeyPair2.secret.substring(0, tonosKeyPair2.public.length);
        }
        console.log(`\n2 method. Tonos-compatible key pair:`);
        console.log(tonosKeyPair2);

        const simpleKeys = await tonClient.crypto.ed25519Keypair();
        console.log(`ed25519 key pair not from mnemonic:`);
        console.log(simpleKeys);
    }
    catch(error) {
        console.error(error);
    }

})();


