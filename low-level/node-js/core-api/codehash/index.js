const {TonClient} = require("@tonclient/core");
const {libNode} = require("@tonclient/lib-node");
const { SetcodeMultisigWallet } = require("./SetcodeMultisigWallet.js");

TonClient.useBinaryLibrary(libNode);
(async () => {
    const client = new TonClient({
        network: {
            endpoints: ["http://localhost"]
        }
    });
    try {
        // To update code in SetCodeMultisigWallet you need to pass codehash to submitUpdate().
        // https://github.com/tonlabs/ton-labs-contracts/blob/master/solidity/setcodemultisig/SetcodeMultisigWallet.sol#L458
        // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_boc.md#get_code_from_tvc
        
        // First, get the code from tvc.
        const code =  (await client.boc.get_code_from_tvc({tvc:SetcodeMultisigWallet.tvc})).code;

        // Then get the hash.
        // https://github.com/tonlabs/TON-SDK/blob/master/docs/mod_boc.md#get_boc_hash
        const hashCode = (await client.boc.get_boc_hash({boc:code})).hash;
        
        console.log(`SetCode Multisig wallet code hash: ${hashCode}`)

        // Your can find all popular Smart contract hash codes at https://ton.live/contracts
    } catch (error) {
        if (error.code === 504) {
            console.error(`Network is inaccessible. You have to start TON OS SE using \`tondev se start\`.\n If you run SE on another port or ip, replace http://localhost endpoint with http://localhost:port or http://ip:port in index.js file.`);
        } else {
            console.error(error);
        }
    }
    client.close();
})();
