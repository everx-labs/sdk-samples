const { 
    TonClient, 
    messageSourceEncoded, 
    messageSourceEncodingParams, 
    signerSigningBox, 
    abiContract, 
    signerNone 
} = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const { Giver, Hello } = require("./contracts");
const fs = require('fs');
const path = require('path');
const giverKeyPairFileName = 'GiverV2.keys.json';
const giverKeyPairFile = path.join(__dirname, giverKeyPairFileName);

TonClient.useBinaryLibrary(libNode);

const SEED_PHRASE_WORD_COUNT = 12;
const SEED_PHRASE_DICTIONARY_ENGLISH = 1;
const HD_PATH = "m/44'/396'/0'/0/0";
const seedPhrase = "abandon math mimic master filter design carbon crystal rookie group knife young";


// address of giver on TON OS SE
const giverAddress = "0:b5e9240fc2d2f1ff8cbb1d1dee7fb7cae155e5f6320e585fcc685698994a19a5";
// giver ABI on TON OS SE
const giverAbi = abiContract(Giver.abi);

// Requesting 10 local test tokens from TON OS SE giver
/**
 * 
 * @param {TonClient} client 
 * @param {string} account 
 */
async function get_tokens_from_giver(client, account) {
    if (!fs.existsSync(giverKeyPairFile)) {
        console.log(`Please place ${giverKeyPairFileName} file in project root folder with Giver's keys`);
        process.exit(1);
    }

    const giverKeyPair = JSON.parse(fs.readFileSync(giverKeyPairFile, 'utf8'));

    const params = {
        send_events: false,
        message_encode_params: {
            address: giverAddress,
            abi: giverAbi,
            call_set: {
                function_name: 'sendTransaction',
                input: {
                    dest: account,
                    value: 10_000_000_000,
                    bounce: false
                }
            },
            signer: {
                type: 'Keys',
                keys: giverKeyPair
            },
        },
    }
    await client.processing.process_message(params)
}

class dummySigningBox {
    /**
     * @param {TonClient} client 
     */
    constructor(client) {
        this.client = client;
    }

    async get_public_key() {
        if (!this.publicKey) {
            this.keys = (await this.client.crypto.mnemonic_derive_sign_keys({
                dictionary: SEED_PHRASE_DICTIONARY_ENGLISH,
                word_count: SEED_PHRASE_WORD_COUNT,
                phrase: seedPhrase,
                path: HD_PATH
            }));
            this.publicKey = this.keys.public;
        }
        return {
            public_key: this.publicKey
        };
    }

    async sign(params) {
        return (await this.client.crypto.sign({
            keys: this.keys,
            unsigned: params.unsigned,
        }));
    }
}

/**
 * @param {TonClient} client 
 */
async function main(client) {

    const signingBox = new dummySigningBox(client);
    const signer = signerSigningBox((await client.crypto.register_signing_box(signingBox)).handle);
    const tvc = Hello.tvc;
    const abi = abiContract(Hello.abi);

    // Receiving future Hello contract address
    const pubKey = (await signingBox.get_public_key()).public_key;
    const deployParams = {
        abi,
        deploy_set: {
            tvc,
        },
        call_set: {
            function_name: "constructor",
            input: {},
        },
        signer,
    };
    const futureAddress = (await client.abi.encode_message(deployParams)).address;

    console.log(`Future address of the contract will be: ${futureAddress}`);

    // Requesting contract deployment funds form a local TON OS SE giver
    // not suitable for other networks
    await get_tokens_from_giver(client, futureAddress);
    console.log(`Tokens were transferred from giver to ${futureAddress}`);

    // Contract deployment
    const helloAddress = (await client.processing.process_message({
        message_encode_params: messageSourceEncodingParams(deployParams),
        send_events: false,
    })).transaction.account_addr;

    console.log(`Hello contract was deployed at address: ${helloAddress}`);

    let response = await client.processing.process_message({
        message_encode_params: messageSourceEncodingParams({
            address: helloAddress,
            call_set: {
                function_name: "touch",
                input: {},
            },
            abi,
            signer,
        }),
        send_events: false,
    });
    console.log(`Contract run transaction with output ${response.decoded.output}, ${response.transaction.id}`);

    const account = (await client.net.wait_for_collection({
        collection: "accounts",
        filter: { id: { eq: helloAddress } },
        result: "boc"
    })).result;
    response = await client.tvm.run_tvm({
        account: account.boc,
        message: (await client.abi.encode_message({
            abi,
            address: helloAddress,
            call_set: {
                function_name: "sayHello",
            },
            signer: signerNone(),
        })).message,
        abi,
    });
    console.log(`Contract reacted to your sayHello ${JSON.stringify(response.decoded.output)}`);
}

(async () => {
    try {
        const client = new TonClient({
            network: {
                endpoints: ["http://localhost"],
            }
        });
        console.log("Hello localhost TON!");
        await main(client);
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
})();
