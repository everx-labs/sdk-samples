const { Account } = require("@tonclient/appkit");
const {
    signerSigningBox,
    TonClient,
} = require("@tonclient/core");

const { libNode } = require("@tonclient/lib-node");

TonClient.useBinaryLibrary(libNode);

const SEED_PHRASE_WORD_COUNT = 12;
const SEED_PHRASE_DICTIONARY_ENGLISH = 1;
const HD_PATH = "m/44'/396'/0'/0/0";
const seedPhrase = "abandon math mimic master filter design carbon crystal rookie group knife young";

class dummySigningBox {
    /**
     *
     * @param client {TonClient}
     */
    constructor(client) {
        this.client = client;
    }

    async ensureKeys() {
        if (!this.keys) {
            this.keys = (await this.client.crypto.mnemonic_derive_sign_keys({
                dictionary: SEED_PHRASE_DICTIONARY_ENGLISH,
                word_count: SEED_PHRASE_WORD_COUNT,
                phrase: seedPhrase,
                path: HD_PATH,
            }));
        }
        return this.keys;
    }

    async get_public_key() {
        return {
            public_key: (await this.ensureKeys()).public,
        };
    }

    async sign(params) {
        return (await this.client.crypto.sign({
            keys: await this.ensureKeys(),
            unsigned: params.unsigned,
        }));
    }
}

/**
 *
 * @param client {TonClient}
 * @returns {Promise<void>}
 */
async function main(client) {
    const signingBox = new dummySigningBox(client);
    const signer = signerSigningBox((await client.crypto.register_signing_box(signingBox)).handle);

    const hello = new Account(HelloContract, {
        signer,
        client,
    });

    console.log(`Future address of the contract will be: ${await hello.getAddress()}`);

    await hello.deploy({
        useGiver: true,
    });
    console.log(`Hello contract was deployed at address: ${await hello.getAddress()}`);

    const responseTouch = await hello.run("touch", {});
    console.log(`Contract run transaction with output ${responseTouch.decoded.output}, ${responseTouch.transaction.id}`);

    const responseTvm = await hello.runLocal("sayHello", {});
    console.log(`Contract reacted to your sayHello ${JSON.stringify(responseTvm)}`);

    await hello.free();
}

(async () => {
    try {
        console.log("Hello localhost TON!");
        const client = new TonClient({ network: { endpoints: ["http://localhost"] } });
        await main(client);
        client.close();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();

const HelloContract = {
    abi: {
        "ABI version": 2,
        "header": ["time"],
        "functions": [
            {
                "name": "constructor",
                "inputs": [],
                "outputs": [],
            },
            {
                "name": "touch",
                "inputs": [],
                "outputs": [],
            },
            {
                "name": "sayHello",
                "inputs": [],
                "outputs": [
                    {
                        "name": "value0",
                        "type": "uint256",
                    },
                ],
            },
        ],
        "data": [],
        "events": [],
    },
    tvc: "te6ccgECEwEAAl4AAgE0BgEBAcACAgPPIAUDAQHeBAAD0CAAQdgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAIm/wD0pCAiwAGS9KDhiu1TWDD0oQkHAQr0pCD0oQgAAAIBIAwKAf7/fyHtRNAg10nCAY4U0//TP9MA1wv/+Gp/+GH4Zvhj+GKOG/QFcPhqcAGAQPQO8r3XC//4YnD4Y3D4Zn/4YeLTAAGfgQIA1xgg+QFY+EL5EPKo3tM/AY4e+EMhuSCfMCD4I4ED6KiCCBt3QKC53pL4Y+CANPI02NMfAfAB+EduCwAIkvI83gIBIA4NAN29Rar5/8ILdHHnaiaBBrpOEAxwpp/+mf6YBrhf/8NT/8MPwzfDH8MUcN+gK4fDU4AMAgegd5XuuF//wxOHwxuHwzP/ww8W98I3k5uPwzaPwAfBH8NXwhZGX//CHnhZ/8I2eFgHwlAOX/5PaqP/wzwCASAQDwCFu3MS5F+EFujhftRNDT/9M/0wDXC//4an/4Yfhm+GP4Yt7R+AD4I/hq+ELIy//4Q88LP/hGzwsA+EoBy//J7VR/+GeAIBIBIRAOe4GmaP/wgt0cL9qJoaf/pn+mAa4X//DU//DD8M3wx/DFvaPwlZEXuAAAAAAAAAAAAAAAACGeLQQgIaZo/wQhAAAAAWORlj5Fnhf+A58DnieS4/YAYYH/HC/whZGX//CHnhZ/8I2eFgHwlAOX/5Paqbz/8M8ABy3HAi0NYCMdIAMNwhxwCS8jvgIdcNH5LyPOFTEZLyO+HBAyKCEP////28sZLyPOAB8AH4R26S8jze",
};
