const { Account } = require("@tonclient/appkit");
const { libNode } = require("@tonclient/lib-node");
const { DePoolContract } = require("./DePoolContract.js");
const {
    signerNone,
    TonClient,
} = require("@tonclient/core");
TonClient.useBinaryLibrary(libNode);

async function main(client) {
    //Use an existing depool account address
    const dePoolAddress = "0:a07c4668a8ac1801b5ea77c86e317ca027d76c288c6da4d29d7d1fd716aff40a";

    const dePoolAcc = new Account(DePoolContract, {
        address: dePoolAddress,
        client,
        signer: signerNone(), 
    });

    response = await dePoolAcc.runLocal("getDePoolInfo", {});
    console.log(`DePool ${dePoolAddress} Info:`, response.decoded.output);
    const validatorWallet = response.decoded.output.validatorWallet;

    response = await dePoolAcc.runLocal("getParticipantInfo", { "addr": validatorWallet });
    console.log(`\nValidator Wallet ${validatorWallet} Stake Info:`, response.decoded.output);

    response = await dePoolAcc.runLocal("getDePoolBalance", {});
    console.log(`\nDePool Balance Nano Crystal:`, response.decoded.output.value0);
}

(async () => {
    const client = new TonClient({
        network: {
            endpoints: ["http://main.ton.dev"],
        },
    });
    try {
        console.log("Hello main TON!");
        await main(client);
        process.exit(0);
    } catch (error) {
        console.error(error);
    }
    client.close();
})();