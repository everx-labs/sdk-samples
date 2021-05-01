const { libNode } = require("@tonclient/lib-node");
// https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig
const { SafeMultisigWalletContract } = require("./SafeMultisigWalletContract.js");
const {
    signerKeys,
    TonClient,
} = require("@tonclient/core");
TonClient.useBinaryLibrary(libNode);

async function main(client) {

    // Let's create message for deploy SafeMultisigWallet contract with 2 owners (custodians), who are authorized to manage the wallet.
    const multisigKeys = await client.crypto.generate_random_sign_keys();
    const multisigKeys1 = await client.crypto.generate_random_sign_keys();

    // Creating signed deploy message.
    // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_abi.md#encode_message
    let constructorMessage = await client.abi.encode_message({
        abi: {
            type: 'Contract',
            value: SafeMultisigWalletContract.abi,
        },
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
        signer: {
            type: 'Keys',
            keys: multisigKeys // creates a signed message with provided key pair.
        }
    });

    // Future account address.
    const address = constructorMessage.address;

    // Emulate deploy on blockchain using run_executor. In real blockchain we need to sponsor account address for deploy.
    // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_tvm.md#run_executor
    let result = await client.tvm.run_executor({
        message: constructorMessage.message,
        account: {
            type: 'Uninit', //state of the pre-deployed contract.
        },
        abi: {
            type: 'Contract',
            value: SafeMultisigWalletContract.abi,
        },
        return_updated_account: true // We use return_updated_account to recieve account BOC.
        // BOC (Bag of cells) is a universal format for data packaging in Free TON. Every object - account, transaction, message, block are stored in blockchain database as bocs. By the way, boc of the block includes bocs of all messages and transactions that were executed in this block inside of it.
    });
    const deployedAccountBOC = result.account;
    console.log("Emulate contract deploy. Account change state from", result.transaction.orig_status_name, "to", result.transaction.end_status_name);

    // Let's emulate `submitTransaction` function call.
    console.log("Emulate submitTransaction function call");
    submitTransactionMessage = await client.abi.encode_message({
        abi: {
            type: 'Contract',
            value: SafeMultisigWalletContract.abi,
        },
        address,
        call_set: {
            function_name: 'submitTransaction',
            input: {
                dest: address,
                value: 100_000_000,
                bounce: false,
                allBalance: true,
                payload: "",
            }
        },
        signer: {
            type: 'Keys',
            keys: multisigKeys
        }
    });

    // Emulate message proccessing with run_executor.
    result = await client.tvm.run_executor({
        message: submitTransactionMessage.message,
        account: {
            type: 'Account',
            boc: deployedAccountBOC,
            unlimited_balance: true
        },
        abi: {
            type: 'Contract',
            value: SafeMultisigWalletContract.abi,
        },
        skip_transaction_check: true,
        return_updated_account: true
    });
    let newAccountBOC = result.account;


    getTransactionsMessage = await client.abi.encode_message({
        abi: {
            type: 'Contract',
            value: SafeMultisigWalletContract.abi,
        },
        address,
        call_set: {
            function_name: 'getTransactions',
            input: {}
        },
        signer: { type: 'None' }
    });

    //  Parse BOC to recieved get data from contract.
    let response = await client.tvm.run_tvm({
        message: getTransactionsMessage.message,
        account: newAccountBOC,
        abi: {
            type: 'Contract',
            value: SafeMultisigWalletContract.abi,
        }
    });

    console.log("Contract `getTransactions`: ", response.decoded.output.transactions);


    // Let's try another call of contract using run_executor.
    // Let's confirm previous transaction.
    let confirmTransactionMessage = await client.abi.encode_message({
        abi: {
            type: 'Contract',
            value: SafeMultisigWalletContract.abi,
        },
        address,
        call_set: {
            function_name: 'confirmTransaction',
            input: {
                transactionId: response.decoded.output.transactions[0].id,
            }
        },
        signer: {
            type: 'Keys',
            keys: multisigKeys1  // Use keys from the second custodian.
        }
    });
    console.log("Sign transaction by second custodian")

    result = await client.tvm.run_executor({
        message: confirmTransactionMessage.message,
        account: {
            type: 'Account',
            boc: newAccountBOC,
            unlimited_balance: true
        },
        abi: {
            type: 'Contract',
            value: SafeMultisigWalletContract.abi,
        },
        skip_transaction_check: true,
        return_updated_account: true
    });
    newAccountBOC = result.account;

    getTransactionsMessage = await client.abi.encode_message({
        abi: {
            type: 'Contract',
            value: SafeMultisigWalletContract.abi,
        },
        address,
        call_set: {
            function_name: 'getTransactions',
            input: {}
        },
        signer: { type: 'None' }
    });

    response = await client.tvm.run_tvm({
        message: getTransactionsMessage.message,
        account: newAccountBOC,
        abi: {
            type: 'Contract',
            value: SafeMultisigWalletContract.abi,
        }
    });
    console.log("Check that all transactions are signed. `getTransactions` returns: ", response.decoded.output.transactions);
}


(async () => {
    const client = new TonClient({
        network: {
            // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_client.md#clientconfig
            endpoints: ["http://localhost"],
        },
    });
    try {
        console.log("Hello localhost TON!");
        await main(client);
        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error(`
            Network is inaccessible. You have to start TON OS SE using \`tondev se start\` `);
        } else {
            console.error(error);
        }
    }
    client.close();
})();
