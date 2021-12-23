const { Account } = require("@tonclient/appkit");
const { TonClient, signerKeys } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const assert = require('assert');

const { HelloWallet } = require("./HelloWallet.js")

// Link the platform-dependable TON-SDK binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@tonclient/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@tonclient/lib-web` and `@tonclient/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ton-client-js )
TonClient.useBinaryLibrary(libNode);

const giverContract = {
    abi: {
        "ABI version": 2,
        header: ["time", "expire"],
        functions: [
            {
                name: "sendTransaction",
                inputs: [
                    {
                        "name": "dest",
                        "type": "address",
                    },
                    {
                        "name": "value",
                        "type": "uint128",
                    },
                    {
                        "name": "bounce",
                        "type": "bool",
                    },
                ],
                outputs: [],
            },
            {
                name: "getMessages",
                inputs: [],
                outputs: [
                    {
                        components: [
                            {
                                name: "hash",
                                type: "uint256",
                            },
                            {
                                name: "expireAt",
                                type: "uint64",
                            },
                        ],
                        name: "messages",
                        type: "tuple[]",
                    },
                ],
            },
            {
                name: "upgrade",
                inputs: [
                    {
                        name: "newcode",
                        type: "cell",
                    },
                ],
                outputs: [],
            },
            {
                name: "constructor",
                inputs: [],
                outputs: [],
            },
        ],
        data: [],
        events: [],
    },
};

/**
 *
 * @param client {TonClient}
 * @returns {Promise<void>}
 */
async function main(client) {
    // Address of the Giver
    const giverAddress = "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415";
    // Keypair for the Giver
    const giverKeys = signerKeys({
        public: "2ada2e65ab8eeab09490e3521415f45b6e42df9c760a639bcf53957550b25a16",
        secret: "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3",
    });

    // Create Giver's account
    const giverAccount = new Account(giverContract, {
        client,
        address: giverAddress,
        signer: giverKeys,
    });

    const giverSendTo = async (address, value) => {
        // Run method `sendTransaction` for the Giver. You can use your custom account,
        // in this case, method name and arguments might vary:
        return await giverAccount.run("sendTransaction", {
            dest: address,
            value,
            bounce: false,
        });
    };

    // In order to implement giver's logics, we must implement `AccountGiver` interface
    const giver = {
        address: giverAddress,
        sendTo: async (address, value) => await giverSendTo(address, value),
    };

    // Set Giver for a client
    Account.setGiverForClient(client, giver);

    // Test 1. Create test `HelloWallet` contract in order to test deployment using configured Giver

    // Generate an ed25519 key pair for new account
    const helloAccKeys = await TonClient.default.crypto.generate_random_sign_keys();

    // Create test contract
    const helloAcc = new Account(HelloWallet, {
        signer: signerKeys(helloAccKeys),
        client,
    });

    // Get address of the contract:
    const address = await helloAcc.getAddress();

    // Request contract deployment funds form the Giver and deploy `HelloWallet` contract.
    await helloAcc.deploy({ useGiver: true });
    console.log(`HelloWallet contract was deployed at address: ${address}`);

    // Test 2. Just send funds from the Giver to a random address

    const helloAcc2Keys = await TonClient.default.crypto.generate_random_sign_keys();

    const helloAcc2 = new Account(HelloWallet, {
        signer: signerKeys(helloAcc2Keys),
    });

    // Get address of the contract:
    const address2 = await helloAcc2.getAddress();

    console.log("Sending funds to address:", address2);

    const result = await giverSendTo(address2, 10000000000);

    const transaction_tree = await client.net.query_transaction_tree({
        in_msg: result.transaction.in_msg,
    });

    assert.equal(transaction_tree.messages.length, 2, "There are must be 2 messages");
    assert(!transaction_tree.messages[1].bounce, "Expected 2nd message to be not-bounceable");
    assert.equal(
        transaction_tree.messages[1].value,
        '0x2540be400' /*10 000 000 000*/,
        "2nd message must have a value of 10 000 000 000",
    );
    assert.equal(transaction_tree.messages[1].dst, address2, "2nd message's destination must be " + address2);

    assert.equal(transaction_tree.transactions.length, 2, "There are must be 2 transactions");
    assert.equal(
        transaction_tree.transactions[1].account_addr,
        address2,
        "2nd transaction's account address must be " + address2,
    );
    assert(
        transaction_tree.transactions[1].aborted,
        "2nd transaction must be aborted because of uninitialized account",
    );

    console.log("Funds transferred.");
}

(async () => {
    const client = new TonClient({
        network: {
            // Local TON OS SE instance URL here
            endpoints: ["http://localhost"]
        }
    });
    try {
        console.log("AppKit custom giver configuration example");
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
