const { Account } = require("@tonclient/appkit");
const { libNode } = require("@tonclient/lib-node");
const { SafeMultisigContract } = require("./SafeMultisigContract.js");
const { DePoolContract } = require("./DePoolContract.js");
const {
    signerKeys,
    signerNone,
    TonClient,
} = require("@tonclient/core");

// Link the platform-dependable TON-SDK binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@tonclient/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@tonclient/lib-web` and `@tonclient/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ton-client-js )
TonClient.useBinaryLibrary(libNode);

async function getExistingMultisigAccount(client) {
    const keys = {
        public: 'c0786e0dcd57ed9896512e66b74f2ecdade2fc22e1bc10121c690b4b27a4248d',
        secret: '4ed7bb112fe4f2bc236bdaf5d36f7a52454768aa59f6481f0f6ef0e85d3f6bb7'
    };

    // Generate an ed25519 key pair for new account
    const account = new Account(SafeMultisigContract, {
        address: "0:7d92f89e21abc572ff3757240c816143cc9e106130c7d22b2aa5ba7bfca86521",
        signer: signerKeys(keys),
        client
    });
    const address = await account.getAddress();

    console.log(`Multisig address: ${address}`);
    return account;
}

async function getExistingDePoolAccount(client, validatorWallet) {

    // Generate an ed25519 key pair for new account
    const accountDePool = new Account(DePoolContract, {
        address: "0:5a5a26be552edbad09fee2c1b201d9f71c523a6fcb659c87f6248e16f5383f3c",
        signer: signerNone(),
        client
    });
    const address = await accountDePool.getAddress();

    console.log(`DePool address: ${address}`);

    return accountDePool;
}

(async () => {
    // Use test network
    const client = new TonClient({ network: { endpoints: ["net1.ton.dev", "net5.ton.dev"] } });
    try {
        let multisigAccount = await getExistingMultisigAccount(client);
        let dePoolAccount = await getExistingDePoolAccount(client, multisigAccount.address);

        const multisigAccountAddress = await multisigAccount.getAddress();
        const dePoolAccountAddress = await dePoolAccount.getAddress();

        
        // Generate payload with order to deposit ordinary stake in depool from multisignature wallet.
        // See https://docs.ton.dev/86757ecb2/p/04040b-run-depool-v3/t/5600a5
        // https://github.com/tonlabs/TON-SDK/blob/b6449a8f575c62a9e6fbcfa11979f3c9863f797b/docs/mod_abi.md#encode_message_body
        const payload = (await client.abi.encode_message_body({
            abi: dePoolAccount.abi,
            call_set: {
                function_name: "addOrdinaryStake",
                input: {
                    stake: 10_000_000_000, // Min stake vary in different dePools.
                },
            },
            is_internal: true,
            signer: signerNone(),
        })).body;

        // Send actual money to use for ordinary stake.
        await multisigAccount.run("sendTransaction", {
            dest: dePoolAccountAddress,
            value: 11_000_000_000, // Add more than stake in addOrdinaryStake for blockchain fees.
            bounce: false,
            flags: 0,
            payload // Payload contains the "addOrdinaryStake" message with deposit order for ordinary stake with 10 TONs.
        });
        console.log("Wait for depool answer:");

        // Wait for transaction
        const subscriptionMessage = await client.net.wait_for_collection({
            collection: 'messages',
            filter: {
                src: { eq: dePoolAccountAddress },
                dst: { eq: multisigAccountAddress },
            },
            result: "boc"
        });
        
        console.log('Mutisig recieved answer from depool');
           
        // Get stake data from depool to check if it was done correctly.
        // In case stake was not accepted, exit code 116 will be returned.
        //https://github.com/tonlabs/ton-contracts/blob/master/solidity/depool/DePoolLib.sol
        let response = await dePoolAccount.runLocal("getParticipantInfo", {
            addr: multisigAccountAddress
        });
        console.log(response.decoded.output);
       

    } catch (error) {
        console.error(error);
        process.exit(1);
    }

    client.close();
    process.exit(0);
})();
