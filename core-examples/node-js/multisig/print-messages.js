const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const { SafeMultisigContract, networkEndpoints, getPreparedSigner } = require("./utils");

TonClient.useBinaryLibrary(libNode);

(async () => {
    try {
        const tonClient = new TonClient({
            network: {
                //Read more about NetworkConfig https://docs.ton.dev/86757ecb2/v/0/p/5328db-configure-sdk
                endpoints: networkEndpoints,
            },
        });

        const signer = getPreparedSigner();

        // Here we create deployMessage simply to get account address and check its balance
        // if you know your wallet address, you do not need this step.
        const { address } = await tonClient.abi.encode_message({
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
        // See more about GraphQL API documentation here https://docs.ton.dev/86757ecb2/p/793337-ton-os-api
        const filter = {
            src: { eq: address },
            msg_type: { eq: 0 },
        };
        let count = 0;
        while (true) {
            /** @type {{
             *      id: string,
             *      dst: string,
             *      value: string,
             *      created_at: number,
             *      created_lt: number,
             * }[]}
             * */
            const messages = (await tonClient.net.query_collection({
                collection: "messages",
                filter,
                order: [
                    { path: "created_at", direction: "ASC" },
                    { path: "created_lt", direction: "ASC" },
                ],
                result: "id dst value(format:DEC) created_at created_lt",
                limit: 50,
            })).result;

            if (messages.length === 0) {
                break;
            }

            for (const message of messages) {
                const at = new Date(message.created_at * 1000).toUTCString();
                console.log(`Withdraw ${message.value} to ${message.dst} at ${at} (message id: ${message.id.substr(0, 4)})`);
            }
            count += messages.length;
            const last = messages[messages.length - 1];
            filter.created_at = { gt: last.created_at };
            filter.OR = {
                src: { eq: address },
                msg_type: { eq: 0 },
                created_at: { eq: last.created_at },
                created_lt: { gt: last.created_lt },
            };
        }
        console.log(`Total messages: ${count}`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
