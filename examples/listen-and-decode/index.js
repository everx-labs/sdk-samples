const { AccountEx } = require("./accountex");
const { loadContract } = require("utils");
const {
    signerKeys,
    TonClient,
} = require("@tonclient/core");

const { libNode } = require("@tonclient/lib-node");

TonClient.useBinaryLibrary(libNode);
TonClient.defaultConfig = { network: { endpoints: ["http://localhost"] } };

const MultisigContract = loadContract("solidity/safemultisig/SafeMultisigWallet");

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Multisig extends AccountEx {
    /**
     *
     * @returns {Promise<Multisig>}
     */
    static async deployNew() {
        const keys = await TonClient.default.crypto.generate_random_sign_keys();
        const multisig = new Multisig(MultisigContract, { signer: signerKeys(keys) });
        await multisig.deploy({
            initInput: {
                owners: [`0x${keys.public}`], // Multisig owner public key.
                reqConfirms: 0,  // Multisig required confirmations zero means that
                // no additional confirmation is need to send a transaction.
            },
            useGiver: true,
        });
        return multisig;
    }

    async sendMoney(toAddress, amount) {
        await this.run("sendTransaction", {
            dest: toAddress,
            value: amount,
            bounce: false,
            flags: 0,
            payload: "",
        });
    }
}

async function logMessage(title, acc, msg) {
    let decoded;
    try {
        decoded = JSON.stringify(await acc.decodeMessage(msg.boc), undefined, "    ");
    } catch (err) {
    }
    console.log(`>>> ${title} message subscription triggered.`);
    console.log(">>> Id:   ", msg.id);
    if (decoded) {
        console.log("    Body: ", decoded);
    }
}

(async () => {
    try {
        const wallet1 = await Multisig.deployNew();
        console.log(`Account 1 balance is ${await wallet1.getBalance()}`);

        const wallet2 = await Multisig.deployNew();
        console.log(`Account 2 balance is ${await wallet2.getBalance()}`);

        await sleep(1_000);

        await wallet2.subscribeAccount("balance", (acc) => {
            console.log(">>> Account subscription triggered ", parseInt(acc.balance));
        });

        await wallet2.subscribeTransactions("id", (tr) => {
            console.log(">>> Transaction subscription triggered", tr.id);
        });

        await wallet1.subscribeMessages("id boc", async (msg) => {
            await logMessage("Wallet1", wallet1, msg);
        });

        await wallet2.subscribeMessages("id boc", async (msg) => {
            await logMessage("Wallet2", wallet2, msg);
        });

        console.log(
            `Sending money from ${await wallet1.getAddress()} ` +
            `to ${await wallet2.getAddress()} and waiting for completion events.`
        );

        await wallet1.sendMoney(await wallet2.getAddress(), 5_000_000_000);

        // Free up all internal resources associated with wallets.
        await wallet1.free();
        await wallet2.free();

        await sleep(1_000);

        wallet1.refresh();
        wallet2.refresh();

        console.log(`Account 1 balance is ${(await wallet1.getAccount()).balance}`);
        console.log(`Account 2 balance is ${(await wallet2.getAccount()).balance}`);
    } catch (error) {
        console.error(error);
    }
    TonClient.default.close();
})();
