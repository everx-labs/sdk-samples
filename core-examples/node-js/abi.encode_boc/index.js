const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");

TonClient.useBinaryLibrary(libNode);

(async () => {
    const client = new TonClient({});
    try {
        // Encoding ABI parameters values into a BOC:
        const boc = (await client.abi.encode_boc({
            params: [
                { name: "dest", type: "address" },
                { name: "value", type: "uint128" },
                { name: "bounce", type: "bool" },
            ],
            data: {
                "dest": "-1:3333333333333333333333333333333333333333333333333333333333333333",
                "value": 1234567,
                "bounce": true,
            }
        })).boc;

        console.log('BOC', boc);

        client.close();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
