// This sample shows how to attach a comment to a multisig transfer
// and decode it
// Before running this sample deploy multisig wallet to net.ton.dev and place your keys in
// the project root folder into keys.json file and multisig account address to address.txt file

const { TonClient, signerNone, abiContract } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const fs = require("fs");
const path = require("path");
const keyPairFile = path.join(__dirname, "keys.json");
const addressFile = path.join(__dirname, "address.txt");
const transferAbi = require("./transfer.abi.json");

const recipient = "0:2bb4a0e8391e7ea8877f4825064924bd41ce110fce97e939d3323999e1efbb13";

const multisigContractPackage = {
    // https://docs.ton.dev/86757ecb2/p/40ba94-abi-specification-v2
    abi: require("../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json"),
    // Compiled smart contract file
    tvcInBase64: fs.readFileSync(
        "../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc").toString(
            "base64"),
};

(async () => {
    try {
        TonClient.useBinaryLibrary(libNode);
        const tonClient = new TonClient({
            network: {
                //Read more about NetworkConfig https://github.com/tonlabs/TON-SDK/blob/e16d682cf904b874f9be1d2a5ce2196b525da38a/docs/mod_client.md#networkconfig
                endpoints: ["net1.ton.dev", "net5.ton.dev"],
                message_retries_count: 3,
            },
            abi: {
                message_expiration_timeout: 30000,
            },
        });

        if (!fs.existsSync(keyPairFile)) {
            console.log("Please create keys.json file in project root folder with multisig keys");
            process.exit(1);
        }
        let address;
        if (!fs.existsSync(addressFile)) {
            console.log("Please create address.txt file in project root folder with multisig address");
            process.exit(1);
        } else {
            address = fs.readFileSync(addressFile, "utf8")
        }

        const keyPair = JSON.parse(fs.readFileSync(keyPairFile, "utf8"));

        // Prepare body with comment
        // For that we need to prepare internal message with transferAbi and then extract body from it
        const body = (await tonClient.abi.encode_message_body({
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


        // Prepare input parameter for 'submitTransaction' method of multisig wallet
        const submitTransactionParams = {
            dest: recipient,
            value: 100_000_000,
            bounce: false,
            allBalance: false,
            payload: body,
        };

        // Run 'submitTransaction' method of multisig wallet
        // Create run message

        console.log("Call `submitTransaction` function");

        const params = {
            send_events: false,
            message_encode_params: {
                address,
                abi: abiContract(multisigContractPackage.abi),
                call_set: {
                    function_name: "submitTransaction",
                    input: submitTransactionParams,
                },

                signer: {
                    type: "Keys",
                    keys: keyPair,
                },
            },
        };
        // Call `submitTransaction` function
        const transactionInfo = await tonClient.processing.process_message(params);
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
    }
    process.exit(1);

})();