const { Account } = require("@eversdk/appkit");
const { TonClient, signerKeys } = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node");

const { HelloWallet } = require("./HelloWallet.js")

// Link the platform-dependable ever-sdk binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@eversdk/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@eversdk/lib-web` and `@eversdk/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ever-sdk-js )
TonClient.useBinaryLibrary(libNode);

/**
 *
 * @param client {TonClient}
 * @returns {Promise<void>}
 */
async function main(client) {
    // Generate an ed25519 key pair for new account
    const keys = await TonClient.default.crypto.generate_random_sign_keys();

    const helloAcc = new Account(HelloWallet, {
        signer: signerKeys(keys),
        client,
    });

    const address = await helloAcc.getAddress();
    console.log(`Future address of the contract will be: ${address}`);

    // Request contract deployment funds form a local Evernode SE giver
    // not suitable for other networks.
    // Deploy `hello` contract.
    await helloAcc.deploy({ useGiver: true });
    console.log(`Hello contract was deployed at address: ${address}`);

    // Call `touch` function
    let response = await helloAcc.run("touch", {});
    console.log(`Contract run transaction with output ${response.decoded.output}, ${response.transaction.id}`);

    // Read local variable `timestamp` with a get method `getTimestamp`
    // This can be done with `runLocal` function. The execution of runLocal is performed off-chain and does not 
    // cost any gas.
    response = await helloAcc.runLocal("getTimestamp", {});
    console.log("Contract reacted to your getTimestamp:", response.decoded.output)

    // Get account balance. 
    const query = `
        query {
          blockchain {
            account(
              address: "${address}"
            ) {
               info {
                balance(format: DEC)
              }
            }
          }
        }`
    const {result}  = await client.net.query({query})

    // Big numbers are returned as a string in hexadecimal or decimal representation,
    // in this query we choose decimal representation (format: DEC).
    const balanceAsDecString = result.data.blockchain.account.info.balance
    // The result can be parsed as a number using parseInt() or BigInt() functions
    console.log("Hello wallet balance is", parseInt(balanceAsDecString, 10))

    // Send some money to the random address
    const randomAddress = 
        "0:" + 
        Buffer.from(
            (await client.crypto.generate_random_bytes({length: 32})).bytes,
            "base64"
        ).toString("hex");

    response = await helloAcc.run("sendValue", {
        dest: randomAddress,
        amount: 100_000_000, // 0.1 token
        bounce: true,
    });
    console.log("Contract reacted to your sendValue, target address will recieve:", response.fees.total_output);
}

(async () => {
    const client = new TonClient({
        network: {
            // Local Evernode SE instance URL here
            endpoints: ["http://localhost"]
        }
    });
    try {
        console.log("Hello localhost TON!");
        await main(client);
        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error(`Network is inaccessible. You have to start Evernode SE using \`everdev se start\`.\n If you run SE on another port or ip, replace http://localhost endpoint with http://localhost:port or http://ip:port in index.js file.`);
        } else {
            console.error(error);
        }
    }
    client.close();
})();
