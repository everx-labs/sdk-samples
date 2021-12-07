const { TonClient, abiContract} = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");

TonClient.useBinaryLibrary(libNode);

const ABI = abiContract({
    "ABI version": 2,
    "version": "2.1",
    "header": ["time"],
    "functions": [
        {
            "name": "get",
            "inputs": [
            ],
            "outputs": [
                {"name":"value0","type":"uint8"},
                {"name":"value1","type":"string"}
            ]
        },
        {
            "name": "constructor",
            "inputs": [
            ],
            "outputs": [
            ]
        }
    ],
    "data": [
        {"key":1,"name":"a","type":"uint8"},
        {"key":2,"name":"s","type":"string"}
    ],
    "events": [
    ],
    "fields": [
        {"name":"_pubkey","type":"uint256"},
        {"name":"_timestamp","type":"uint64"},
        {"name":"_constructorFlag","type":"bool"},
        {"name":"a","type":"uint8"},
        {"name":"s","type":"string"}
    ]
});

(async () => {
    const client = new TonClient();

    try {
        // Decode initial data and initial public key from a given contract's data
        // **Attention!** Initial data exists only in state_init(tvc or state_init produced my any other means) 
        // of a contract before it was deployed. 
        // To get initial_data you can decode state_init with decode_tvc function, or construct it with `encode_init_data`.
        // You CAN NOT download initial data of a contract from Graphql API.
        const decodedData = await client.abi.decode_initial_data({
            abi: ABI,
            data: "te6ccgEBBwEARwABAcABAgPPoAQCAQFIAwAWc29tZSBzdHJpbmcCASAGBQADHuAAQQiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIoA==",
        });

        // Output decoded values
        console.log("Contract initial data:", decodedData.initial_data);
        console.log("Contract initial public key:", decodedData.initial_pubkey);

        /*
            Outputs:
            Contract initial data: { a: '123', s: 'some string' }
            Contract initial public key: 2222222222222222222222222222222222222222222222222222222222222222
         */
    } catch (err) {
        console.error(err);
    }
    client.close();
})();