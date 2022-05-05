// This sample shows how to attach a comment to a multisig transfer
// and decode it
// Before running this sample deploy multisig wallet to net.ton.dev and place your keys in
// the project root folder into keys.json file and multisig account address to address.txt file

const { TonClient, signerNone, abiContract } = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node");
const fs = require("fs");
const path = require("path");
const keyPairFile = path.join(__dirname, "keys.json");
const addressFile = path.join(__dirname, "address.txt");
const transferAbi = require("./transfer.abi.json");

const recipient = "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415";

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
                //Read more about NetworkConfig https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_client.md#networkconfig
                endpoints: [
                    "eri01.net.everos.dev",
                    "rbx01.net.everos.dev",
                    "gra01.net.everos.dev",
                ],
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
