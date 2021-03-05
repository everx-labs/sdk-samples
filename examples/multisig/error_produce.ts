// this example produces error intentionally
import {libNode} from "@tonclient/lib-node";
import * as fs from "fs";
import * as path from "path";
import {Account, TonClientEx} from "utils/account";
import {signerKeys} from "@tonclient/core";
import {MultisigContract} from "./contracts";

const keyPairFile = path.join(__dirname, "keyPair.json");
const keyPairFile2 = path.join(__dirname, "keyPair2.json");

// Account is active when contract is deployed.
const ACCOUNT_TYPE_ACTIVE = 1;

// Address to send tokens to
const recipient = "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415";

(async () => {
    try {
        TonClientEx.useBinaryLibrary(libNode);
        TonClientEx.setDefaultConfig({
            network: {
                // server_address:'net.ton.dev',
                endpoints: ["net.ton.dev"],
                message_retries_count: 0, // default = 5
            },
            abi: {
                message_expiration_timeout: 30000, // default = 40000
            },
        });

        if (!fs.existsSync(keyPairFile)) {
            console.log("Please use preparation.js to generate key pair and seed phrase");
            process.exit(1);
        }

        const keyPair = JSON.parse(fs.readFileSync(keyPairFile, "utf8"));

        const acc = new Account(MultisigContract, {signer: signerKeys(keyPair)});
        const address = await acc.getAddress();
        console.log(address);
        const info = await acc.getAccount();

        if (info.acc_type !== ACCOUNT_TYPE_ACTIVE) {
            console.log(`Contract ${address} is not deployed yet. Use deploy.js to deploy it.`);
            process.exit(1);
        }

        // Execute `getCustodians` get method  (execute the message locally on TVM)
        // See more info about run_tvm method here
        // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_tvm.md#run_tvm
        const response = await acc.runLocal("getCustodians", {});
        // Print the custodians of the wallet
        console.log("Сustodians list:", response.decoded?.output?.custodians);


        // Prepare input parameter for 'submitTransaction' method of multisig wallet
        const submitTransactionParams = {
            dest: recipient,
            value: 100_000_000,
            bounce: false,
            allBalance: false,
            payload: "",
        };

        // Run 'submitTransaction' method of multisig wallet

        //use wrong key pair
        const keyPair2 = JSON.parse(fs.readFileSync(keyPairFile2, "utf8"));

        console.log("Call `submitTransaction` function");
        const sentTransactionInfo = await acc.run("submitTransaction", submitTransactionParams, {
            signer: signerKeys(keyPair2),
        });
        // Call `submitTransaction` function
        console.log(sentTransactionInfo);
        console.log("Transaction info:");

        console.log("Id:");
        console.log(sentTransactionInfo.transaction.id);

        console.log("Account address:");
        console.log(sentTransactionInfo.transaction.account_addr);

        console.log("Logical time:");
        console.log(sentTransactionInfo.transaction.lt);

        console.log("Transaction inbound message ID:");
        console.log(sentTransactionInfo.transaction.in_msg);

        console.log("Transaction outbound message IDs:");
        console.log(sentTransactionInfo.transaction.out_msgs);

        // Convert address to different types
        console.log("Multisig address in HEX:");
        let convertedAddress = (await TonClientEx.default.utils.convert_address({
            address,
            output_format: {
                type: "Hex",
            },
        })).address;
        console.log(convertedAddress);

        console.log("Multisig non-bounce address in Base64:");
        convertedAddress = (await TonClientEx.default.utils.convert_address({
            address,
            output_format: {
                type: "Base64",
                url: false,
                test: false,
                bounce: false,
            },
        })).address;
        console.log(convertedAddress);

        console.log("Multisig bounce address in Base64:");
        convertedAddress = (await TonClientEx.default.utils.convert_address({
            address,
            output_format: {
                type: "Base64",
                url: false,
                test: false,
                bounce: true,
            },
        })).address;
        console.log(convertedAddress);

        process.exit(0);
    } catch (error) {
        console.error(JSON.stringify(error, null, 2));
        process.exit(1);
    }
})();
