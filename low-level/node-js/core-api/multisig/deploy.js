const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const fs = require('fs');
const path = require('path');
const keyPairFile = path.join(__dirname, 'keyPair.json');

const multisigContractPackage = {
    // https://docs.ton.dev/86757ecb2/p/40ba94-abi-specification-v2
    abi: require('../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json'),
    // Compiled smart contract file
    tvcInBase64: fs.readFileSync('../../../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc').toString('base64'),
};

// Account is active when contract is deployed.
const ACCOUNT_TYPE_ACTIVE = 1;

// Account is uninitialized when contract is not deployed yet.
const ACCOUNT_TYPE_UNINITIALIZED = 0;

// Number of tokens required to deploy the contract.
// See https://docs.ton.dev/86757ecb2/p/6207cd-estimate-fees on how to calculate definite number.
const CONTRACT_REQUIRED_DEPLOY_TOKENS = 500_000_000;


(async () => {
    try {
        TonClient.useBinaryLibrary(libNode);
        
        //Read more about NetworkConfig https://docs.ton.dev/86757ecb2/v/0/p/5328db-configure-sdk

        const tonClient = new TonClient({
            network: {
                endpoints: ['net1.ton.dev', 'net5.ton.dev']
            }
        });

        if (!fs.existsSync(keyPairFile)) {
            console.log('Please use preparation.js to generate key pair and seed phrase');
            process.exit(1);
        }

        const keyPair = JSON.parse(fs.readFileSync(keyPairFile, 'utf8'));
        // We create a deploy message to calculate the future address of the contract 
        // and to send it with 'sendMessage' later - if we use Pattern 1 for deploy (see below)
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
            },
            processing_try_index: 1
        });

        // Query account type, balance and code to analyse if it is possible to deploy the contract
        // See more info about query method here https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_net.md#query_collection
        const { result } = await tonClient.net.query_collection({
            collection: 'accounts',
            filter: {
                id: {
                    eq: address
                }
            },
            result: 'acc_type balance code'
        });
        if (result.length === 0) {
            console.log(`You need to transfer at least 0.5 tokens for deploy to ${address} to net.ton.dev.`);
            process.exit(1);
        }

        if (result[0].acc_type == ACCOUNT_TYPE_ACTIVE) {
            console.log(`Contract ${address} is already deployed`);
            process.exit(1);
        }

        // Balance is stored as HEX so we need to convert it.
        if (result[0].acc_type == ACCOUNT_TYPE_UNINITIALIZED && BigInt(result[0].balance) <= BigInt(CONTRACT_REQUIRED_DEPLOY_TOKENS)) {
            console.log(`Balance of ${address} is too low for deploy to net.ton.dev`);
            process.exit(1);
        }

        const response = await tonClient.processing.process_message({
            send_events: false,
            message_encode_params: {
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
                },
                processing_try_index: 1
            }
        });
        console.log(`Transaction id is ${response.transaction.id}`);
        console.log(`Deploy fees are  ${JSON.stringify(response.fees, null, 2)}`);
        console.log(`Contract is successfully deployed. You can play with your multisig wallet now at ${address}`);

        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();