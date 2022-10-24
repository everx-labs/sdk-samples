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

(async () => {
    try {
        const client = new TonClient({
            network: {
                endpoints: [ HTTPS_DEVNET_ENDPOINT ],
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
            call_set: {
                function_name: "constructor",
                input: {
                    // Multisig owners public key.
                    // We are going to use a single key.
                    // You can use any number of keys and custodians.
                    // See https://docs.ton.dev/86757ecb2/p/94921e-multisignature-wallet-management-in-tonos-cli/t/242ea8
                    owners: [`0x${signer.keys.public}`],
                    // Number of custodians to require for confirm transaction.
                    // We use 0 for simplicity. Consider using 2+ for sufficient security.
                    reqConfirms: 0,
                },
            },
            signer,
        });
        console.log(address);

        // Let's read and print all withdraws from our account.
        // To do this we iterate internal outbound messages with positive value.
        // See more about GraphQL API documentation here https://docs.everos.dev/ever-sdk/samples/graphql-samples/quick-start#api-documentation

        const query = `query {
          blockchain {
            account(
              address: "${address}"
            ) {
              messages(msg_type: IntOut, allow_latest_inconsistent_data: true) {
                edges {
                  node {
                    dst
                    value(format: DEC)
                    created_at
                  }
                }
              }
            }
          }
        }`

        const {result}= await client.net.query({query})
        const messages = result.data.blockchain.account.messages.edges
        if (messages.length === 0) {
            console.log(`Account ${address} does not have internal outbound messages`)
            process.exit(1);
        }

        for (const {node: message} of messages) {
            const at = new Date(message.created_at * 1000).toUTCString();
            console.log(`Withdraw ${message.value} to ${message.dst} at ${at}`);
        }
        console.log(`Total messages: ${messages.length}`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
