const { TonClient } = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node");

TonClient.useBinaryLibrary(libNode);
(async () => {
    const client = new TonClient();
    try {
        // Decode values from BOC
        const data = (await client.abi.decode_boc({
            boc: "te6ccgEBAgEAEgABCQAAAADAAQAQAAAAAAAAAHs=",
            // check all abi types here https://github.com/tonlabs/ton-labs-abi/blob/master/docs/ABI_2.1_spec.md#types
            params: [
                {
                    name: "a",
                    type: "uint32",
                },
                {
                    name: "b",
                    // New ABI type `Ref(<ParamType>)` which allows to store `ParamType` ABI parameter 
                    // in cell reference and, thus, decode manually encoded BOCs.
                    // Implemented only in decode_boc function, not yet implemented in ABI 
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
        process.exit(1);
    }
    client.close();
})();
