// This sample shows how to attach a comment to a multisig transfer
// and decode it
// Before running this sample deploy multisig wallet to Development network and place your keys in
// the project root folder into keys.json file


const {
    signerNone,
    abiContract,
    signerKeys,
    TonClient,
} = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node");
const { loadContract } = require("utils");

const fs = require("fs");
const path = require("path");

const keyPairFile = path.join(__dirname, "keyPair.json");

const transferAbi = require("./transfer.abi.json");
const { Account } = require("@eversdk/appkit");
const recipient = "0:acad9bed05bbf1223de0c9c7865d5f34d488487e941f76e888b19640ced190cf";

const MultisigContract = loadContract("solidity/safemultisig/SafeMultisigWallet");

TonClient.useBinaryLibrary(libNode);

// Create a project on https://dashboard.evercloud.dev and pass
// its Development Network HTTPS endpoint as a parameter:
const HTTPS_DEVNET_ENDPOINT = process.argv[2];

if (HTTPS_DEVNET_ENDPOINT === undefined) {
    throw new Error("HTTPS endpoint required");
}

(async () => {
    const client = new TonClient({
        network: {
            endpoints: [HTTPS_DEVNET_ENDPOINT],
            message_retries_count: 3,
        },
        abi: {
            message_expiration_timeout: 30000,
        },
    });
    try {
        if (!fs.existsSync(keyPairFile)) {
            console.log("Please create keyPair.json file in project root folder  with multisig keys");
            process.exit(1);
        }

        const keyPair = JSON.parse(fs.readFileSync(keyPairFile, "utf8"));

        // Prepare body with comment
        // For that we need to prepare internal message with transferAbi and then extract body from it
        const body = (await client.abi.encode_message_body({
            abi: abiContract(transferAbi),
            call_set: {
                function_name: "transfer",
                input: {
                    comment: Buffer.from("My comment").toString("hex"),
                },
            },
            is_internal: true,
            signer: signerNone(),
        })).body;


        const multisig = new Account(MultisigContract, {
            signer: signerKeys(keyPair),
            client,
        });

        // Run 'submitTransaction' method of multisig wallet
        // Create run message

        console.log("Call `submitTransaction` function");
        const transactionInfo = (await multisig.run("submitTransaction", {
            dest: recipient,
            value: 100_000_000,
            bounce: false,
            allBalance: false,
            payload: body,
        }));


        console.log(transactionInfo);
        console.log("Transaction info:");

        console.log("Id:");
        console.log(transactionInfo.transaction.id);
        console.log("messages:");
        console.log(transactionInfo.out_messages);
        const messages = transactionInfo.out_messages;

        const decodedMessage1 = (await client.abi.decode_message({
            abi: abiContract(transferAbi),
            message: messages[0],
        }));

        // Decode comment from hex to string
        decodedMessage1.value.comment = Buffer.from(decodedMessage1.value.comment, "hex").toString("utf8");

        console.log("Decoded message 1:", decodedMessage1.value);

        const decodedMessage2 = (await client.abi.decode_message({
            abi: abiContract(MultisigContract.abi),
            message: messages[1],
        }));

        console.log("Decoded message 2:", decodedMessage2);
        client.close();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
