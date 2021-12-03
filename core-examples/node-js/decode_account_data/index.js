const { TonClient, abiContract} = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");

TonClient.useBinaryLibrary(libNode);

const ABI = abiContract({
    "ABI version": 2,
    "version": "2.1",
    "header": ["time"],
    "functions": [],
    "data": [],
    "events": [],
    "fields": [
        {"name":"__pubkey","type":"uint256"},
        {"name":"__timestamp","type":"uint64"},
        {"name":"fun","type":"uint32"},
        {"name":"opt","type":"optional(bytes)"},
        {
            "name":"big",
            "type":"optional(tuple)",
            "components":[
                {"name":"value0","type":"uint256"},
                {"name":"value1","type":"uint256"},
                {"name":"value2","type":"uint256"},
                {"name":"value3","type":"uint256"}
            ]
        },
        {"name":"a","type":"bytes"},
        {"name":"b","type":"bytes"},
        {"name":"length","type":"uint256"}
    ]
});

(async () => {
    const client = new TonClient();
    try {
        const decodedData = (await client.abi.decode_account_data({
            abi: ABI,
            data: "te6ccgEBBwEA8AAEWeix2Dmr4nsqu51KKUOpFDqcfirgZ5m9JN7B16iJGuXdAAABeqRZIJYAAAAW4AYEAwEBQAAAAAAAAAAAAA" +
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAgAAABRJIGxpa2UgaXQuAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAA" +
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIFAEAAAAAAAAAAAAAAAA" +
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAKSGVsbG8=",
        })).data;

        // Output decoded data
        console.log(decodedData);

        /*
            Outputs:
            {
              __pubkey: '0xe8b1d839abe27b2abb9d4a2943a9143a9c7e2ae06799bd24dec1d7a8891ae5dd',
              __timestamp: '1626254942358',
              fun: '22',
              opt: '48656c6c6f',
              big: {
                value0: '0x0000000000000000000000000000000000000000000000000000000000000002',
                value1: '0x0000000000000000000000000000000000000000000000000000000000000008',
                value2: '0x0000000000000000000000000000000000000000000000000000000000000002',
                value3: '0x0000000000000000000000000000000000000000000000000000000000000000'
              },
              a: '49206c696b652069742e',
              b: '',
              length: '0x000000000000000000000000000000000000000000000000000000000000000f'
            }
         */
    } catch (err) {
        console.error(err);
    }
    client.close();
})();