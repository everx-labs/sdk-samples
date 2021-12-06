const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const fs = require ('fs');

TonClient.useBinaryLibrary(libNode);
(async () => {
    const client = new TonClient();
    const contractPath = "../hello-wallet/HelloWallet.tvc";
    console.log("Contract path: " + contractPath);

    // Read TVC file
    const tvc = fs.readFileSync(contractPath, 'base64');
    try {
        // Decode TVC
        const decoded = await client.boc.decode_tvc({
            tvc: tvc,
        });

        // Output some of decoded data
        console.log("Contract code hash:", decoded.code_hash);
        console.log("Contract compiled with:", decoded.compiler_version);

        /*
            Outputs:
            Contract code hash: a8b86403c2e789b2b563407ee5b79636a32e6b1e8426d6d68f1170fa447815af
            Contract compiled with: sol 0.46.0
         */
    } catch (err) {
        console.error(err);
    }
    client.close();
})();