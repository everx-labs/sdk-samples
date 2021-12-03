const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");

TonClient.useBinaryLibrary(libNode);
(async () => {
    const client = new TonClient();
    try {
        // Decode values from BOC
        const data = (await client.abi.decode_boc({
            boc: "te6ccgEBAgEAEgABCQAAAADAAQAQAAAAAAAAAHs=",
            params: [
                {
                    name: "a",
                    type: "uint32",
                },
                {
                    name: "b",
                    type: "ref(int64)",
                },
                {
                    name: "c",
                    type: "bool",
                },
            ],
            allow_partial: true,
        })).data;

        // Output decoded data
        console.log("a =", data.a);
        console.log("b =", data.b);
        console.log("c =", data.c);

        /*
            Outputs:
            a = 0
            b = 123
            c = true
        */
    } catch (err) {
        console.error(err);
    }
    client.close();
})();