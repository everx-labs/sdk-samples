const { TonClient, abiContract} = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node");
const fs = require ('fs');

TonClient.useBinaryLibrary(libNode);
(async () => {
    const client = new TonClient();

    // Read TVC from file
    const tvc = fs.readFileSync("../hello-wallet/HelloWallet.tvc", "base64");
    const abi = abiContract(require("../hello-wallet/HelloWallet.abi.json"));
    try {
        // Decode TVC
        const decoded = await client.boc.decode_tvc({
            tvc: tvc,
        });

        // Update initial data and public key of the contract, result data is returned
        
        // **Attention!** Initial data exists only in state_init(tvc or state_init produced my any other means) 
        // of a contract before it was deployed. 
        // To get initial_data you can decode state_init with decode_tvc function, or construct it with `encode_init_data`.
        // You CAN NOT download initial data of a contract from Graphql API.
        const updatedData = (await client.abi.update_initial_data({
            abi: abi,
            data: decoded.data,
            initial_pubkey: "0000000000000000000000000000000000000000000000000000000000000000",
            initial_data: { x: 10, y: 15 },
        })).data;

        // Encode altered data to TVC
        const updated = (await client.boc.encode_tvc({
            code: decoded.code,
            data: updatedData,
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
