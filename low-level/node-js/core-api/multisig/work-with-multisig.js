
const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const fs = require('fs');
const path = require('path');
const keyPairFile = path.join(__dirname, 'keyPair.json');

// Account is active when contract is deployed.
const ACCOUNT_TYPE_ACTIVE = 1;

// Address to send tokens to
const recipient = '0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415';

const multisigContractPackage = {
    // https://docs.ton.dev/86757ecb2/p/40ba94-abi-specification-v2
    abi: require('../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json'),
    // Compiled smart contract file
    tvcInBase64: fs.readFileSync('../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc').toString('base64'),
};

const ACCOUNT_TYPE_UNINITIALIZED = 0;

(async () => {
    try {
        TonClient.useBinaryLibrary(libNode);
        const tonClient = new TonClient({
            network: {
                //Read more about NetworkConfig https://github.com/tonlabs/TON-SDK/blob/e16d682cf904b874f9be1d2a5ce2196b525da38a/docs/mod_client.md#networkconfig
                server_address: 'net.ton.dev',
                message_retries_count: 3,
                message_processing_timeout: 60000,
                network_retries_count: 2,
                reconnect_timeout: 3
            }
        });

        if (!fs.existsSync(keyPairFile)) {
            console.log('Please use preparation.js to generate key pair and seed phrase');
            process.exit(1);
        }

        const keyPair = JSON.parse(fs.readFileSync(keyPairFile, 'utf8'));

        // Here we create deployMessage simply to get account address and check its balance
        const { address } = await tonClient.abi.encode_message({
            abi: {
                type: 'Contract',
                value: multisigContractPackage.abi
            },
            deploy_set: {
                tvc: multisigContractPackage.tvcInBase64,
                initial_data: {}
            },
            call_set: {
                function_name: 'constructor',
                input: {
                    // Multisig owners public key.
                    // We are going to use a single key.
                    // You can use any number of keys and custodians.
                    // See https://docs.ton.dev/86757ecb2/p/94921e-multisignature-wallet-management-in-tonos-cli/t/242ea8
                    owners: [`0x${keyPair.public}`],
                    // Number of custodians to require for confirm transaction.
                    // We use 0 for simplicity. Consider using 2+ for sufficient security.
                    reqConfirms: 0
                }
            },
            signer: {
                type: 'Keys',
                keys: keyPair
            }
        });
        console.log(address);
        // Check account balance
        let { result } = await tonClient.net.query_collection({
            collection: 'accounts',
            filter: {
                id: {
                    eq: address
                }
            },
            result: 'acc_type balance code'
        });

        if (result.length === 0) {
            console.log(`You need to transfer at least 0.5 tokens to and use deploy.js to deploy the contract ${address}.`);
            process.exit(1);
        }

        if (result[0].acc_type !== ACCOUNT_TYPE_ACTIVE) {
            console.log(`Contract ${address} is not deployed yet. Use deploy.js to deploy it.`);
            process.exit(1);
        }

        const [account, message] = await Promise.all([
            // Download the latest state (BOC)
            // See more info about query method here 
            // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#query_collection
            tonClient.net.query_collection({
                collection: 'accounts',
                filter: { id: { eq: address } },
                result: 'boc'
            })
                .then(({ result }) => result[0].boc)
                .catch(() => {
                    throw Error(`Failed to fetch account data`)
                }),
            // Encode the message with `getTimestamp` call
            tonClient.abi.encode_message({
                abi: {
                    type: 'Contract',
                    value: multisigContractPackage.abi
                },
                address,
                call_set: {
                    function_name: 'getCustodians',
                    input: {}
                },
                signer: { type: 'None' }
            }).then(({ message }) => message)
        ]);

        // Execute `getCustodians` get method  (execute the message locally on TVM)
        // See more info about run_tvm method here 
        // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_tvm.md#run_tvm
        const response = await tonClient.tvm.run_tvm({
            message, account, abi: {
                type: 'Contract',
                value: multisigContractPackage.abi
            }
        });
        // Print the custodians of the wallet
        console.log('Сustodians list:', response.decoded.output.custodians);


        // Prepare input parameter for 'submitTransaction' method of multisig wallet
        const submitTransactionParams = {
            dest: recipient,
            value: 100_000_000,
            bounce: false,
            allBalance: false,
            payload: ''
        };

        // Run 'submitTransaction' method of multisig wallet       
        // Create run message 

        console.log("Call `submitTransaction` function");
        const params = {
            send_events: false,
            message_encode_params: {
                address,
                abi: {
                    type: 'Contract',
                    value: multisigContractPackage.abi
                },
                call_set: {
                    function_name: 'submitTransaction',
                    input: submitTransactionParams
                },

                signer: {
                    type: 'Keys',
                    keys: keyPair
                }
            }
        }
        // Call `submitTransaction` function
        const sentTransactionInfo = await tonClient.processing.process_message(params);
        console.log(sentTransactionInfo);
        console.log("Transaction info:")

        console.log("Id:")
        console.log(sentTransactionInfo.transaction.id);

        console.log("Account address:")
        console.log(sentTransactionInfo.transaction.account_addr);

        console.log("Logical time:")
        console.log(sentTransactionInfo.transaction.lt);

        console.log("Transaction inbound message ID:")
        console.log(sentTransactionInfo.transaction.in_msg);

        console.log("Transaction outbound message IDs:")
        console.log(sentTransactionInfo.transaction.out_msgs);

        // Convert address to different types
        console.log("Multisig address in HEX:")
        let convertedAddress = (await tonClient.utils.convert_address({
            address,
            output_format: {
                type: 'Hex'
            },
        })).address;
        console.log(convertedAddress);

        console.log("Multisig non-bounce address in Base64:")
        convertedAddress = (await tonClient.utils.convert_address({
            address,
            output_format: {
                type: 'Base64',
                url: false,
                test: false,
                bounce: false
            }
        })).address;
        console.log(convertedAddress);

        console.log("Multisig bounce address in Base64:")
        convertedAddress = (await tonClient.utils.convert_address({
            address,
            output_format: {
                type: 'Base64',
                url: false,
                test: false,
                bounce: true
            }
        })).address;
        console.log(convertedAddress);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();