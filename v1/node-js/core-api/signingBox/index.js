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

TonClient.useBinaryLibrary(libNode);

const SEED_PHRASE_WORD_COUNT = 12;
const SEED_PHRASE_DICTIONARY_ENGLISH = 1;
const HD_PATH = "m/44'/396'/0'/0/0";
const seedPhrase = "abandon math mimic master filter design carbon crystal rookie group knife young";


// address of giver on NodeSE
const giverAddress = "0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94";
// giver ABI on NodeSE
const giverAbi = abiContract(Giver.abi);

// Requesting 1000000000 local test tokens from Node SE giver
/**
 * 
 * @param {TonClient} client 
 * @param {string} account 
 */
async function get_grams_from_giver(client, account) {
    await client.processing.process_message({
        message_encode_params: messageSourceEncodingParams({
            address: giverAddress,
            call_set: {
                function_name: "sendGrams",
                input: {
                    dest: account,
                    amount: 10_000_000_000,
                },
            },
            abi: giverAbi,
            signer: signerNone(),
        }),
        send_events: false,
    });
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
    await get_grams_from_giver(client, futureAddress);
    console.log(`Grams were transferred from giver to ${futureAddress}`);

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
