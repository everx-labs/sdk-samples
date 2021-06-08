
const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const fs = require('fs');
const path = require('path');
const keyPairFile = path.join(__dirname, 'keyPair.json');

// Account is active when contract is deployed.
const ACCOUNT_TYPE_ACTIVE = 1;

// Address to send tokens to
const recipient = '0:2bb4a0e8391e7ea8877f4825064924bd41ce110fce97e939d3323999e1efbb13';

// Source code of multisig wallet
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
                //Read more about NetworkConfig https://docs.ton.dev/86757ecb2/v/0/p/5328db-configure-sdk
                endpoints: ['net1.ton.dev', 'net5.ton.dev'],
                // how many retries SDK will perform in case of message delivery failure
                message_retries_count: 3, 
                message_processing_timeout: 60000, 
            }
        });

        if (!fs.existsSync(keyPairFile)) {
            console.log('Please use preparation.js to generate key pair and seed phrase');
            process.exit(1);
        }

        const keyPair = JSON.parse(fs.readFileSync(keyPairFile, 'utf8'));

        // Here we create deployMessage simply to get account address and check its balance
        // if you know your wallet address, you do not need this step. 
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

        // Let's check if the account is deployed and check its balance
        // See more about GraphQL API documentation here https://docs.ton.dev/86757ecb2/p/793337-ton-os-api
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

        // Let's run `getCustodians` get method
        // We need to perform 3 steps: download the wallet's state, encode a message that will request data,
        // and execute it locally on the wallet's state to receive the data

        const [account, message] = await Promise.all([
            // Download the latest state (so-called BOC)
            // See more info about query method here 
            // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#query_collection
            // See more about BOC here https://docs.ton.dev/86757ecb2/p/45e664-basics-of-free-ton-blockchain/t/11b639
            tonClient.net.query_collection({
                collection: 'accounts',
                filter: { id: { eq: address } },
                result: 'boc'
            })
                .then(({ result }) => result[0].boc)
                .catch(() => {
                    throw Error(`Failed to fetch account data`)
                }),
            // Encode the message with `getCustodians` call
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


        // Transfer tokens from your wallet   
        //
        // Attention! If you have more than 1 custodian in your multisig you need to perform the transfer
        // in 2 steps:     
        // 1. Run `submitTransaction` function with the first cusdodian to initiate a transfer and get transId from its result
        // 2. Confirm the transaction with `confirmTransactionz function passing the confirming `transId` with 
        // `reqConfirms` number of custodians. 

        // Prepare input parameter for 'submitTransaction' method of multisig wallet
        const submitTransactionParams = {
            dest: recipient,
            value: 100_000_000,
            bounce: false,
            allBalance: false,
            payload: ''
        };

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