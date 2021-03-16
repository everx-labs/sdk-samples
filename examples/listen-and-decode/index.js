const { AccountEx } = require("./accountex");
const {
    signerKeys,
    TonClient,
    MessageBodyType,
} = require("@tonclient/core");

const { libNode } = require("@tonclient/lib-node");

TonClient.useBinaryLibrary(libNode);
TonClient.defaultConfig = { network: { endpoints: ["http://localhost"] } };

const { HelloEventsContract } = require("./contracts");

class HelloEvents extends AccountEx {
    constructor(options) {
        super(HelloEventsContract, options);
    }

    /**
     * @param text {string}
     * @returns {Promise<HelloEvents>}
     */
    static async deployNew(text) {
        const keys = await TonClient.default.crypto.generate_random_sign_keys();
        const account = new HelloEvents({ signer: signerKeys(keys) });
        await account.deploy({
            initInput: {
                text: Buffer.from(text).toString("hex"),
            },
            useGiver: true,
        });
        return account;
    }

    /**
     *
     * @param text {string}
     * @returns {Promise<void>}
     */
    async setHelloText(text) {
        await this.run("setHelloText", {
            text: Buffer.from(text).toString("hex"),
        });
    }

    /**
     *
     * @returns {Promise<string>}
     */
    async getHelloText() {
        const { decoded } = await this.runLocal("getHelloText", {});
        return Buffer.from(decoded.output.text, "hex").toString();
    }
}

(async () => {
    try {
        const hello = await HelloEvents.deployNew("Hello World!");
        console.log(`Initial hello text is "${await hello.getHelloText()}"`);

        await hello.subscribeAccount("balance", (acc) => {
            console.log("Account has updated. Current balance is ", parseInt(acc.balance));
        });

        await hello.subscribeMessages("boc", async (msg) => {
            try {
                const decoded = await hello.decodeMessage(msg.boc);
                switch (decoded.body_type) {
                case MessageBodyType.Input:
                    console.log(`External inbound message, function "${decoded.name}", parameters: `, JSON.stringify(decoded.value));
                    break;
                case MessageBodyType.Output:
                    console.log(`External outbound message, function "${decoded.name}", result`, JSON.stringify(decoded.value));
                    break;
                case MessageBodyType.Event:
                    console.log(`External outbound message, event "${decoded.name}", parameters`, JSON.stringify(decoded.value));
                    break;
                }
            } catch (err) {
            }
        });

        await hello.setHelloText("Hello there!");
        console.log(`Updated hello text is ${await hello.getHelloText()}`);

        /** Free up all internal resources associated with wallets. */
        await hello.free();
    } catch (error) {
        console.error(error);
    }
    TonClient.default.close();
})();
