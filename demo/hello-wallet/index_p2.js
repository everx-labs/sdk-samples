// This sample shows how to deploy and run contracts in 3 steps:
// using `encode_message`, `send_message` and `wait_for_transaction` functions.
// Also it demonstrates how to catch intermediate events during message processing and log them

const { Account } = require("@tonclient/appkit");
const { libNode } = require("@tonclient/lib-node");
const { HelloWallet } = require("./HelloWallet.js")
const {
    abiContract,
    signerKeys,
    TonClient,
} = require("@tonclient/core");

TonClient.useBinaryLibrary(libNode);

async function logEvents(params, response_type) {
    console.log(`params = ${JSON.stringify(params, null, 2)}`);
    console.log(`response_type = ${JSON.stringify(response_type, null, 2)}`);
}

/**
 *
 * @param client {TonClient}
 * @returns {Promise<void>}
 */
async function main(client) {
    // Generate an ed25519 key pair for new account
    const helloAcc = new Account(HelloWallet, {
        signer: signerKeys(await client.crypto.generate_random_sign_keys()),
        client
    });

    const address = await helloAcc.getAddress();
    console.log(`Future address of the contract will be: ${address}`);

    // Request contract deployment funds form a local TON OS SE giver
    // not suitable for other networks
    const giver = await Account.getGiverForClient(client);
    await giver.sendTo(address, 10_000_000_000);
    console.log(`Grams were transferred from giver to ${address}`);

    // Send deploy message to the network
    // See more info about `send_message` here
    // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_processing.md#send_message
    const deployMessage = await client.abi.encode_message(await helloAcc.getParamsOfDeployMessage());
    let shard_block_id;
    shard_block_id = (await client.processing.send_message({
            message: deployMessage.message,
            send_events: true,
        }, logEvents,
    )).shard_block_id;
    console.log(`Deploy message was sent.`);


    // Monitor message delivery.
    // See more info about `wait_for_transaction` here
    // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_processing.md#wait_for_transaction
    const deploy_processing_result = await client.processing.wait_for_transaction({
            abi: abiContract(HelloWallet.abi),
            message: deployMessage.message,
            shard_block_id: shard_block_id,
            send_events: true,
        },
        logEvents,
    );
    console.log(`Deploy transaction: ${JSON.stringify(deploy_processing_result.transaction, null, 2)}`);
    console.log(`Deploy fees: ${JSON.stringify(deploy_processing_result.fees, null, 2)}`);
    console.log(`Hello contract was deployed at address: ${address}`);


    // Encode the message with `touch` function call
    const params = {
        abi: abiContract(HelloWallet.abi),
        address,
        call_set: {
            function_name: "touch",
            input: {},
        },
        // There is no pubkey key check in the contract
        // so we can leave it empty. Never use this approach in production
        // because anyone can call this function
        signer: { type: "None" },
    };

    // Create external inbound message with `touch` function call
    const encode_touch_result = await client.abi.encode_message(params);
    console.log(`Encoded successfully`);

    // Send `touch` call message to the network
    // See more info about `send_message` here
    // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_processing.md#send_message
    shard_block_id = (await client.processing.send_message({
            message: encode_touch_result.message,
            send_events: true,
        }, logEvents,
    )).shard_block_id;
    console.log(`Touch message was sent.`);


    // Monitor message delivery.
    // See more info about `wait_for_transaction` here
    // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_processing.md#wait_for_transaction
    const touch_processing_result = await client.processing.wait_for_transaction({
            abi: abiContract(HelloWallet.abi),
            message: encode_touch_result.message,
            shard_block_id: shard_block_id,
            send_events: true,
        },
        logEvents,
    );
    console.log(`Touch transaction: ${JSON.stringify(touch_processing_result.transaction, null, 2)}`);
    console.log(`Touch fees: ${JSON.stringify(touch_processing_result.fees, null, 2)}`);

    // Execute `getTimestamp` get method  (execute the message locally on TVM)
    // See more info about run_tvm method here
    // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_tvm.md#run_tvm
    const response = await helloAcc.runLocal("getTimestamp", {});
    console.log("Contract reacted to your getTimestamp:", response.decoded.output);
    await helloAcc.free();
}

(async () => {
    // Use local TON OS SE instance
    const client = new TonClient({ network: { endpoints: ["http://localhost"] } });
    try {
        console.log("Hello localhost TON!");
        await main(client);
    } catch (error) {
        if (error.code === 504) {
            console.error(`Network is inaccessible. You have to start TON OS SE using \`tondev se start\`.\n If you run SE on another port or ip, replace http://localhost endpoint with http://localhost:port or http://ip:port in index.js file.`);
        } else {
            console.error(error);
        }
    } finally {
        client.close();
    }
})();
