// This sample shows how to attach a comment to a multisig transfer
// and decode it
// Before running this sample deploy multisig wallet to net.ton.dev and place your keys in
// the project root folder into keys.json file


const {
    signerNone,
    abiContract,
    signerKeys,
    TonClient,
} = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const { loadContract } = require("utils");

const fs = require("fs");
const path = require("path");

const keyPairFile = path.join(__dirname, "keys.json");

const transferAbi = require("./transfer.abi.json");
const { Account } = require("@tonclient/appkit");
const recipient = "0:acad9bed05bbf1223de0c9c7865d5f34d488487e941f76e888b19640ced190cf";

const MultisigContract = loadContract("solidity/safemultisig/SafeMultisigWallet");

TonClient.useBinaryLibrary(libNode);

(async () => {
    const client = new TonClient({
        network: {
            //Read more about NetworkConfig https://github.com/tonlabs/TON-SDK/blob/e16d682cf904b874f9be1d2a5ce2196b525da38a/docs/mod_client.md#networkconfig
            endpoints: ["net1.ton.dev", "net5.ton.dev"],
            message_retries_count: 3,
        },
        abi: {
            message_expiration_timeout: 30000,
        },
    });
    try {
        if (!fs.existsSync(keyPairFile)) {
            console.log("Please create keys.json file in project root folder  with multisig keys");
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

        const decodedMessage1 = (await tonClient.abi.decode_message({
            abi: abiContract(transferAbi),
            message: messages[0],
        }));

        // Decode comment from hex to string
        decodedMessage1.value.comment = Buffer.from(decodedMessage1.value.comment, "hex").toString("utf8");

        console.log("Decoded message 1:", decodedMessage1.value);

        const decodedMessage2 = (await tonClient.abi.decode_message({
            abi: abiContract(multisigContractPackage.abi),
            message: messages[1],
        }));

        console.log("Decoded message 2:", decodedMessage2);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
