const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const fs = require ('fs');

TonClient.useBinaryLibrary(libNode);
(async () => {
    const client = new TonClient();

    // Read TVC from file
    const tvc = fs.readFileSync("../hello-wallet/HelloWallet.tvc", 'base64');
    try {
        // Decode TVC
        const decoded = await client.boc.decode_tvc({
            tvc: tvc,
        });

        // Do something with contract's data or else
        // ....

        // Encode altered data to TVC
        const updated = (await client.boc.encode_tvc({
            code: decoded.code,
            data: decoded.data,
            library: decoded.library,
            split_depth: decoded.split_depth,
            tick: decoded.tick,
            tock: decoded.tock,
        })).tvc;

        // Write updated TVC into a file
        fs.writeFileSync("updated.tvc", updated, "base64");
    } catch (err) {
        console.error(err);
    }
    client.close();
})();