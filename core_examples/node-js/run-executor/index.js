const { libNode } = require("@tonclient/lib-node");
// https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig
const { SafeMultisigWalletContract } = require("./SafeMultisigWalletContract.js");
const { signerKeys, abiContract, TonClient } = require("@tonclient/core");

TonClient.useBinaryLibrary(libNode);

const fs = require('fs');
const path = require('path');
const giverKeyPairFileName = 'GiverV2.keys.json';
const giverKeyPairFile = path.join(__dirname, giverKeyPairFileName);
// ABI and imageBase64 of a binary Hello contract
const {GiverV2} = require('./GiverV2.js');
const { Console } = require("console");
// Address of giver on TON OS SE
const giverAddress = '0:b5e9240fc2d2f1ff8cbb1d1dee7fb7cae155e5f6320e585fcc685698994a19a5';

// Function that requests 10 local test tokens from TON OS SE giver
async function get_tokens_from_giver(client, account) {
    if (!fs.existsSync(giverKeyPairFile)) {
        console.log(`Please place ${giverKeyPairFileName} file in project root folder with Giver's keys`);
        process.exit(1);
    }

    const giverKeyPair = JSON.parse(fs.readFileSync(giverKeyPairFile, 'utf8'));

    const params = {
        send_events: false,
        message_encode_params: {
            address: giverAddress,
            abi: abiContract(GiverV2.abi),
            call_set: {
                function_name: 'sendTransaction',
                input: {
                    dest: account,
                    value: 10_000_000_000,
                    bounce: false
                }
            },
            signer: signerKeys(giverKeyPair)
        },
    }
    await client.processing.process_message(params)
}

async function main(client) {

    // Let's create a message to emulate deploy of SafeMultisigWallet contract with 2 owners (custodians), who are authorized to manage the wallet.
    // Lets generate 2 key pairs for both custodians.
    const multisigKeys = await client.crypto.generate_random_sign_keys();
    const multisigKeys1 = await client.crypto.generate_random_sign_keys();

    // Creating signed deploy message.
    // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_abi.md#encode_message
    let deploy_message_encode_params = {
        abi: abiContract(SafeMultisigWalletContract.abi),
        deploy_set: {
            tvc: SafeMultisigWalletContract.tvc,
            initial_data: {}
        },
        call_set: {
            function_name: 'constructor',
            input: {
                // Multisig owners public key.
                // We are going to use a single key.
                // You can use any number of keys and custodians.
                // See https://docs.ton.dev/86757ecb2/p/94921e-multisignature-wallet-management-in-tonos-cli/t/242ea8
                owners: [`0x${multisigKeys.public}`, `0x${multisigKeys1.public}`],
                // Number of custodians to require for confirm transaction.
                // We use 0 for simplicity. Consider using 2+ for sufficient security.
                reqConfirms: 2
            }
        },
        signer: signerKeys(multisigKeys)
    };

    let deployMessage = await client.abi.encode_message(deploy_message_encode_params);

    // Calculate future account address.
    const address = deployMessage.address;
    console.log("In this sample we are emulating deploy and call of the contract:  ", deployMessage.address);

    // Emulate deploy on blockchain using run_executor. In real blockchain we need to sponsor account address for deploy.
    // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_tvm.md#run_executor
    let result = await client.tvm.run_executor({
        message: deployMessage.message,
        account: {
            type: 'Uninit', //state of the pre-paid contract.
        },
        abi: abiContract(SafeMultisigWalletContract.abi),
        return_updated_account: true // We use return_updated_account = true to recieve account BOC.
    });
    const deployedAccountBOC = result.account;
    console.log("Emulate contract deploy. Account change state from", result.transaction.orig_status_name, "to", result.transaction.end_status_name);
    console.log("Estimated deploy fees are: ", result.fees);

    // Now lets deploy and compare estimated and real fees
    
    // Request contract deployment funds form a local TON OS SE giver
    // If you want to run deploy on other networks,
    // update `get_tokens_from_giver` function so that it uses your contract as a giver.
    // For instance, you can use Multisig contract  as a giver https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig, 
    // transfering tokens with `submitTransaction` method. 
    // Or you can deploy the `GiverV2` contract (https://github.com/tonlabs/tonos-se/tree/master/contracts) 
    // with your own key pair and update it in GiverV2.keys.json file. 

    console.log("Deploy to the local blockchain.");

    await get_tokens_from_giver(client, address);
    console.log(`Tokens were transfered from giver to ${address}`);

    const response = await client.processing.process_message({
        send_events: false,
        message_encode_params: deploy_message_encode_params
    });
    console.log(`Transaction id is ${response.transaction.id}`);
    console.log(`Deploy fees are  ${JSON.stringify(response.fees, null, 2)}`);
    console.log(`Contract is successfully deployed. You can play with your multisig wallet now at ${address}`);
    console.log(`Explore its data at the local version of TON Live http://localhost/accounts/accountDetails?id=0%3A` + `${address.split(':')[1]}`);
    
    // Let's emulate `submitTransaction` function call.
    // Create an external inbound message for emulation of token transfer back to giver

    let submit_encode_message_params = {
        abi: abiContract(SafeMultisigWalletContract.abi),
        address,
        call_set: {
            function_name: 'submitTransaction',
            input: { // read about multisig parameters here https://docs.ton.dev/86757ecb2/p/94921e-multisignature-wallet-management-in-tonos-cli/t/4829ad
                dest: giverAddress,
                value: 100_000_000, 
                bounce: false, 
                allBalance: true, 
                payload: "",
            }
        },
        signer: signerKeys(multisigKeys)
    };

    submitTransactionMessage = await client.abi.encode_message(submit_encode_message_params);

    // Emulate message proccessing with run_executor.
    
    result = await client.tvm.run_executor({
        message: submitTransactionMessage.message,
        account: {
            type: 'Account',
            boc: deployedAccountBOC,
            unlimited_balance: true // this flags emulates unlimited balance on the account
        },
        abi: abiContract(SafeMultisigWalletContract.abi),
       // skip_transaction_check: true, 
        return_updated_account: true
    });
    let newAccountBOC = result.account;

    console.log("Emulate `submitTransaction` function execution.");
    console.log("Estimated execution fees are: ", result.fees);
    console.log(`We have just emulated the submition of a transaction with ID = ${result.decoded.output.transId}`);

    // Let's run submitTransaction on-chain and compare fees. 
    result = await client.processing.process_message({
        send_events: false,
        message_encode_params: submit_encode_message_params
    });
    console.log(`Transaction id is ${result.transaction.id}`);
    console.log(`Execution fees are  ${JSON.stringify(result.fees, null, 2)}`);

    // Now lets run a get method over our virtual multisig wallet.
    // We will retrieve the list of not confirmed transactions. 
    getTransactionsMessage = await client.abi.encode_message({
        abi: abiContract(SafeMultisigWalletContract.abi),
        address,
        call_set: {
            function_name: 'getTransactions',
            input: {}
        },
        signer: { type: 'None' }
    });

    //  Run multisig's get method `getTransactions` with `run_tvm` function
    result = await client.tvm.run_tvm({
        message: getTransactionsMessage.message,
        account: newAccountBOC,
        abi: abiContract(SafeMultisigWalletContract.abi),
    });
    let transactions = result.decoded.output.transactions;
    console.log("Run get method `getTransactions` on the virtual Multisig to get the list of not confirmed transactions."+
    " We check that the transaction that we have received in the previous step is present. The result is: ", transactions);

    // Let's try to confirm our virtual transaction on our virtual multisig with another custodian using run_executor.
    let confirm_transacton_params = {
        abi: abiContract(SafeMultisigWalletContract.abi),
        address,
        call_set: {
            function_name: 'confirmTransaction',
            input: {
                transactionId: transactions[0].id,
            }
        },
        signer: signerKeys(multisigKeys1) // Use keys from the second custodian.
    };
    let confirmTransactionMessage = await client.abi.encode_message(confirm_transacton_params);

    result = await client.tvm.run_executor({
        message: confirmTransactionMessage.message,
        account: {
            type: 'Account',
            boc: newAccountBOC,
            unlimited_balance: true
        },
        abi: abiContract(SafeMultisigWalletContract.abi),
        skip_transaction_check: true,
        return_updated_account: true
    });
    newAccountBOC = result.account;
    console.log("Emulate `confirmTransaction` function execution.");
    console.log("Estimated execution fees are: ", result.fees);
    console.log(`We have just emulated the confirmation of transaction ${transactions[0].id}`);
    console.log("Let's check that there are no unconfirmed transactions left.");

    getTransactionsMessage = await client.abi.encode_message({
        abi: abiContract(SafeMultisigWalletContract.abi),
        address,
        call_set: {
            function_name: 'getTransactions',
            input: {}
        },
        signer: { type: 'None' }
    });

    result = await client.tvm.run_tvm({
        message: getTransactionsMessage.message,
        account: newAccountBOC,
        abi: abiContract(SafeMultisigWalletContract.abi),
    });
    transactions = result.decoded.output.transactions
    console.log("Check that all transactions are signed. `getTransactions` returns: ", transactions);
    console.log("The list is empty which means we successfully confirmed the virtual transaction.");


    // This is basically the essential capabilities of run_execuor function which allows to emulate execution and calculate fees.
    // If you need to emulate execution with presize account balance then start with top-up from giver emulation. 
    // To do it you need to create an internal message (with `create_internal_message` function) of transfer from some address (some virtual giver) to your deploy address
    // and run it on executor, with `unlimited_balance` parameter set to false, Account type = None and skip_transaction_check = true. 
    // All further calls are the same. 
    // Like this:


    console.log("BONUS. Top-up emulation!");
    let topup_internal_message_params = {
        abi: abiContract(SafeMultisigWalletContract.abi),
            address,
            src_address: giverAddress,
            value: "10000000000",
            bounce: false
    };
    let topup_internal_message = await client.abi.encode_internal_message(topup_internal_message_params);

    result = await client.tvm.run_executor({
        message: topup_internal_message.message,
        // Non-existing account to run a creation internal message. 
        // Should be used with skip_transaction_check = true if the message has no deploy data since transactions on the uninitialized account are always aborted
        account: {
            type: 'None', 
        },
        abi: abiContract(SafeMultisigWalletContract.abi),
        skip_transaction_check: true,
        return_updated_account: true // We use return_updated_account = true to recieve account BOC.
    });
    console.log("Emulate account top-up. Account's status changed from ", result.transaction.orig_status_name, "to", result.transaction.end_status_name);
    let account_json = await client.boc.parse_account({boc: result.account});
    console.log("Account balance is: ", BigInt(account_json.parsed.balance).toString(10) );
    console.log("Account state is: ");
    console.log(account_json);

}


(async () => {
    const client = new TonClient({
        network: {
            // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_client.md#clientconfig
            // Configucation guide: https://docs.ton.dev/86757ecb2/p/5328db-configure-sdk/b/18573c
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
