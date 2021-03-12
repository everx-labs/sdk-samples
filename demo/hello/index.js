const { libNode } = require("@tonclient/lib-node");
const { HelloContract } = require("./HelloContract.js");
const {
    Account,
    signerKeys,
    TonClient,
} = require("@tonclient/core");

// Link the platform-dependable TON-SDK binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@tonclient/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@tonclient/lib-web` and `@tonclient/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ton-client-js )
TonClient.useBinaryLibrary(libNode);
TonClient.defaultConfig = {
    network: {
        // Local node URL here
        server_address: "http://localhost",
    },
};

async function main() {
    // Generate an ed25519 key pair for new account
    const helloAcc = new Account(HelloContract, {
        signer: signerKeys(await TonClient.default.crypto.generate_random_sign_keys()),
    });

    const address = await helloAcc.getAddress();
    console.log(`Future address of the contract will be: ${address}`);

    // Request contract deployment funds form a local TON OS SE giver
    // not suitable for other networks.
    // Deploy `hello` contract.
    await helloAcc.deploy({ useGiver: true });
    console.log(`Hello contract was deployed at address: ${address}`);

    // Call `touch` function
    let response = await helloAcc.run("touch", {});

    console.log(`Contract run transaction with output ${response.decoded.output}, ${response.transaction.id}`);

    // Execute `getTimestamp` get method  (execute the message locally on TVM)
    response = await helloAcc.runLocal("getTimestamp", {});
    console.log("Contract reacted to your getTimestamp:", response.decoded.output);
}

(async () => {
    try {
        console.log("Hello localhost TON!");
        await main();
        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error(`
Network is inaccessible.
You have to start Node SE using \`tondev se start\`
`);
        } else {
            console.error(error);
        }
    }
    TonClient.default.close();
})();
