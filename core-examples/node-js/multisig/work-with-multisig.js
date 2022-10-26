const { TonClient } = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node");
const { SafeMultisigContract, getPreparedSigner } = require("./utils");

TonClient.useBinaryLibrary(libNode);

// Create a project on https://dashboard.evercloud.dev and pass
// its Development Network HTTPS endpoint as a parameter:
const HTTPS_DEVNET_ENDPOINT = process.argv[2] 

if (HTTPS_DEVNET_ENDPOINT === undefined) {
    throw new Error("HTTPS endpoint required")
}


// Account is active when contract is deployed.
const ACCOUNT_TYPE_ACTIVE = 1;

// Address to send tokens to
const recipient = "0:2bb4a0e8391e7ea8877f4825064924bd41ce110fce97e939d3323999e1efbb13";

(async () => {
    try {
        const client = new TonClient({
            network: {
                //Read more about NetworkConfig https://docs.everos.dev/ever-sdk/guides/installation/configure_sdk
                endpoints: [ HTTPS_DEVNET_ENDPOINT ],
                // how many retries SDK will perform in case of message delivery failure
                message_retries_count: 3,
                message_processing_timeout: 60000,
            },
        });

        const signer = getPreparedSigner();

        // Here we create deployMessage simply to get account address and check its balance
        // if you know your wallet address, you do not need this step.
        const { address } = await client.abi.encode_message({
            abi: SafeMultisigContract.abi,
            deploy_set: {
                tvc: SafeMultisigContract.tvc,
                initial_data: {},
            },
            signer,
        });
        console.log(address);

        // Let's check if the account is deployed and check its balance
        // See more about GraphQL API documentation here https://docs.everos.dev/ever-platform/samples/graphql-samples/quick-start#api-documentation
        /** @type {{ acc_type: number, balance: string, code: string}[]} */
        const {info} = (await client.net.query({
            query: `
                query {
                  blockchain {
                    account(
                        address: "${address}"
                    ) {
                       info {
                        acc_type balance code
                      }
                    }
                  }
                }`
        })).result.data.blockchain.account;

        if (!info) {
            console.log(`Accont doesn\'t exist. You need to transfer at least 0.5 tokens and use deploy.js to deploy the contract ${address}.`);
            process.exit(1);
        }

        if (info.acc_type !== ACCOUNT_TYPE_ACTIVE) {
            console.log(`Contract ${address} is not deployed yet. Use deploy.js to deploy it.`);
            process.exit(1);
        }

        // Let's run `getCustodians` get method
        // We need to perform 3 steps: download the wallet's state, encode a message that will request data,
        // and execute it locally on the wallet's state to receive the data

        const [boc, message] = await Promise.all([
            // Download the latest state (so-called BOC)
            // See more info about query method here
            // https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_net.md#query
            // See more about BOC here https://everos.dev/faq/blockchain-basic
            client.net
                .query({
                    query: `
                    query {
                      blockchain {
                        account(
                          address: "${address}"
                        ) {
                           info {
                            boc
                          }
                        }
                      }
                    }`,
                })
                .then(({ result }) => result.data.blockchain.account.info.boc)
                .catch(() => {
                    throw Error(`Failed to fetch account data`)
                }),

            // Encode the message with `getCustodians` call
            client.abi.encode_message({
                abi: SafeMultisigContract.abi,
                address,
                call_set: {
                    function_name: "getCustodians",
                    input: {},
                },
                signer: { type: "None" },
            }).then(({ message }) => message),
        ]);

        // Execute `getCustodians` get method  (execute the message locally on TVM)
        // See more info about run_tvm method here
        // https://github.com/tonlabs/ever-sdk/blob/master/docs/reference/types-and-methods/mod_tvm.md#run_tvm
        /** @type {{decoded:{output:{custodians:string[]}}}}*/
        const response = await client.tvm.run_tvm({
            message,
            account: boc,
            abi: SafeMultisigContract.abi,
        })
        // Print the custodians of the wallet
        console.log("Custodians list:", response.decoded.output.custodians);


        // Transfer tokens from your wallet
        //
        // Attention! If you have more than 1 custodian in your multisig you need to perform the transfer
        // in 2 steps:
        // 1. Run `submitTransaction` function with the first custodian to initiate a transfer and get transId from its result
        // 2. Confirm the transaction with `confirmTransaction function passing the confirming `transId` with
        // `reqConfirms` number of custodians.

        // Prepare input parameter for 'submitTransaction' method of multisig wallet
        const submitTransactionParams = {
            dest: recipient,
            value: 100_000_000,
            bounce: false,
            allBalance: false,
            payload: "",
        };

        // Create run message
        console.log("Making a transfer (call `submitTransaction`)...");
        const params = {
            send_events: false,
            message_encode_params: {
                address,
                abi: SafeMultisigContract.abi,
                call_set: {
                    function_name: "submitTransaction",
                    input: submitTransactionParams,
                },
                signer,
            },
        };
        // Call `submitTransaction` function
        const sentTransactionInfo = await client.processing.process_message(params);

        console.log("Transaction info:");
        console.log(sentTransactionInfo);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
