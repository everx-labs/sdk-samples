const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");

TonClient.useBinaryLibrary(libNode);
(async () => {

    const client = new TonClient({
        network: {
            // Blockchain node URL 
            endpoints: ["https://main.ton.dev"]
        }
    });
    try {
        // Elector Fift contract address 
        const ELECTOR_ADDRESS = '-1:3333333333333333333333333333333333333333333333333333333333333333';
        // https://test.ton.org/fiftbase.pdf
        // Contract code https://github.com/ton-blockchain/ton/blob/master/crypto/smartcont/elector-code.fc

        // Get account BOC in `base64`
        // See https://docs.ton.dev/86757ecb2/p/45e664-basics-of-free-ton-blockchain/t/11b639
        const account = (await client.net.query_collection({
            collection: "accounts",
            filter: { id: { eq: ELECTOR_ADDRESS } },
            result: "boc",
        })).result[0];

        // Use run_get to execute get-methods of Fift contract 
        // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_tvm.md#run_get
        let result = (await client.tvm.run_get({
            account: account.boc,
            function_name: 'active_election_id'
        })).output;
        console.log("\nActive election id: ");
        console.log(JSON.stringify(result));



        result = (await client.tvm.run_get({
            account: account.boc,
            function_name: 'participates_in',
            input: '0x251098c7c84095b43e3bb32e7374d8a5e77149c7b22d4ec1e3be89b40f3b4e54'
        })).output;
        console.log("\nValidator with pubkey 0x251098c7c84095b43e3bb32e7374d8a5e77149c7b22d4ec1e3be89b40f3b4e54 participates in: ");
        console.log(JSON.stringify(result));

        result = (await client.tvm.run_get({
            account: account.boc,
            function_name: 'participant_list',
            tuple_list_as_array: true  // Use true in case of too many participants
        })).output;
        console.log("\nElection participant list: ");
        console.log(JSON.stringify(result));

        //get existed participant wallet address or default value
        let participant = (result && result[0] && result[0].value[0]) ? result[0].value[0][0] : "0x0000000000000000000000000000000000000000000000000000000000000001"
        
        result = (await client.tvm.run_get({
            account: account.boc,
            function_name: 'compute_returned_stake',
            input: participant
        })).output;
        console.log(`\nCompute returned stake for wallet ${participant}: `);
        console.log(JSON.stringify(result));

        result = (await client.tvm.run_get({
            account: account.boc,
            function_name: 'past_election_ids',
            tuple_list_as_array: true
        })).output;
        console.log("\nPast election ids: ");
        console.log(JSON.stringify(result));

    } catch (err) {
        console.error(err);
    }
    client.close();
})();