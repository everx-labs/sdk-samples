const { TonClient, abiContract} = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node");

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
        // Encode given initial data and initial public key into a contract's data
        const encodedData = (await client.abi.encode_initial_data({
            abi: ABI,
            initial_data: { a: "123", s: "some string" },
            initial_pubkey: "2222222222222222222222222222222222222222222222222222222222222222"
        })).data;

        // Output encoded data (base64)
        console.log("Initial data BOC:", encodedData);
        /*
            Outputs:
            Initial data BOC: te6ccgEBBwEARwABAcABAgPPoAQCAQFIAwAWc29tZSBzdHJpbmcCASAGBQADHuAAQQiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIoA==
         */
    } catch (err) {
        console.error(err);
    }
    client.close();
})();
