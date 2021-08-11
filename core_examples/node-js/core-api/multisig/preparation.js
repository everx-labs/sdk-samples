const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const { SafeMultisigContract, networkEndpoints, prepareSignerWithRandomKeys } = require("./utils");

// Link the platform-dependable TON-SDK binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@tonclient/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@tonclient/lib-web` and `@tonclient/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ton-client-js )
TonClient.useBinaryLibrary(libNode);


(async () => {
    try {
        const tonClient = new TonClient({
            network: {
                endpoints: networkEndpoints,
            },
        });

        const signer = await prepareSignerWithRandomKeys(tonClient);

        // Generate future address of the contract. It is unique and the same per key pair and contract to be deployed.
        // Encode deploy message
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
            processing_try_index: 1,
        });
        console.log(`Here is the future address of your contract ${address}. Please save the keys. You will need them later to work with your multisig wallet.`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
