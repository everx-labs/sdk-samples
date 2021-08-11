const { Account } = require("@tonclient/appkit");
const { libNode } = require("@tonclient/lib-node");
// https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig
const { SafeMultisigWalletContract } = require("./SafeMultisigWalletContract.js");
const {
    signerKeys,
    TonClient,
} = require("@tonclient/core");
TonClient.useBinaryLibrary(libNode);

async function main(client) {

    const multisigKeys = await TonClient.default.crypto.generate_random_sign_keys();
    const multisigKeys1 = await TonClient.default.crypto.generate_random_sign_keys();

    const signer = signerKeys(multisigKeys);
    const signer1 = signerKeys(multisigKeys1);

    const multisigAccount = new Account(SafeMultisigWalletContract, {
        signer,
        client,
    });

    const address = await multisigAccount.getAddress();

    // We don't deploy contract on real network.
    // We just emulate it. After this call the multisig contract instance
    // will have an account boc that can be used in consequent calls.
    await multisigAccount.deployLocal({
        initFunctionName: 'constructor',
        initInput: {
            // Multisig owners public key.
            // We are going to use a single key.
            // You can use any number of keys and custodians.
            // See https://docs.ton.dev/86757ecb2/p/94921e-multisignature-wallet-management-in-tonos-cli/t/242ea8
            owners: [`0x${multisigKeys.public}`, `0x${multisigKeys1.public}`],
            // Number of custodians to require for confirm transaction.
            // We use 0 for simplicity. Consider using 2+ for sufficient security.
            reqConfirms: 2
        }
    });

    console.log("Emulate `submitTransaction` call by first custodian")
    let response = await multisigAccount.runLocal("submitTransaction", {
        dest: address,
        value: 100_000_000,
        bounce: false,
        allBalance: true,
        payload: "",
    });

    response = await multisigAccount.runLocal("getTransactions", {});
    console.log("Contract returns `getTransactions`:", response.decoded.output.transactions);

    //change account signer to emulate `confirmTransaction` by second custodian
    multisigAccount.signer = signer1;
    console.log("Sign transaction by second custodian");
    response = await multisigAccount.runLocal("confirmTransaction", {
        transactionId: response.decoded.output.transactions[0].id
    });

    response = await multisigAccount.runLocal("getTransactions", {});
    console.log("Check that all transaction signed. `getTransactions` returns: ", response.decoded.output.transactions);
}


(async () => {
    const client = new TonClient({
        network: {
            // Local TON OS SE instance URL here 
            endpoints: ["http://localhost"],
        },
    });
    try {
        console.log("Hello localhost TON!");
        await main(client);
        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error(`Network is inaccessible. You have to start TON OS SE using \`tondev se start\`.\n If you run SE on another port or ip, replace http://localhost endpoint with http://localhost:port or http://ip:port in index.js file.`);
        } else {
            console.error(error);
        }
    }
    client.close();
})();
