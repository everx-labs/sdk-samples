const { Account } = require("@tonclient/appkit");
const { libNode } = require("@tonclient/lib-node");
const { HelloContract } = require("./HelloContract.js");
const {
    signerKeys,
    TonClient,
} = require("@tonclient/core");
TonClient.useBinaryLibrary(libNode);

/**
 * @param client {TonClient}
 * @returns {Promise<void>}
 */
async function main(client) {

    // Generate an ed25519 key pair for new account.
    const helloAccount = new Account(HelloContract, {
        signer: signerKeys(await client.crypto.generate_random_sign_keys()),
        client,
    });
    
    
    const address = await helloAccount.getAddress();
    console.log(`Future address of the contract will be: ${address}`);

    console.log(`Let's try to delpoy without tokens: \n`);
    try {
        await helloAccount.deploy();
    } catch (error) {
      if (error.code === 409) {
            console.error(`>> Account does not exist. You need to transfer funds to this account first to have a positive balance and then deploy its code ${address}`);
        } else {
            console.error(error);
        }
    }

    console.log(`\nLet's try to delpoy with insufficient tokens: \n`);
    const giver = await Account.getGiverForClient(client);
    await giver.sendTo(address, 1)
    console.log(`1 nano token was transferred from giver to ${address}.`);
    try {
        await helloAccount.deploy();
    } catch (error) {
        if (error.code === 407) {
            console.error(`>> Account has insufficient balance for the requested operation. Send enough tokens to ${address} account balance.`);
        } else {
            console.error(error);
        }
    }
 
    
    console.log('Let\'s calculate amount of nano tokens you need to deploy contract:');
    // https://docs.ton.dev/86757ecb2/p/632251-fee-calculation-details

    let fee = await helloAccount.calcDeployFees();
    console.log(`The fee is: `);
    console.log(fee);

    console.log(`\nTo deploy a contract we need to transer ${fee.total_account_fees} nano tokens to ${address}.`);
    await giver.sendTo(address, fee.total_account_fees);
    console.log(`Nano tokens transferred from giver to ${address}: ${fee.total_account_fees}`);
    let response = await helloAccount.deploy();
    console.log(response);
    console.log(`Hello contract was deployed at address: ${address}`);

    
    console.log('Let\'s calculate amount of nano tokens you need to run "touch" function:')

    fee = await helloAccount.calcRunFees("touch", {});
    console.log(fee);
    console.log("\nFee to run contract function \"touch\" is: " + fee.total_account_fees);
    await giver.sendTo(address, fee.total_account_fees);

    response = await helloAccount.run("touch", {});
    console.log(`Contract ran transaction with balanse delta ${parseInt(response.transaction.balance_delta)}`);

}

(async () => {
    const client = new TonClient({
        network: {
            // Local TON OS SE instance URL here 
            endpoints: ["http://localhost"],
        },
    });
    try {
        console.log("Hello localhost TON!");
        await main(client);
        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error(`Network is inaccessible. You have to start TON OS SE using \`tondev se start\`.\n If you run SE on another port or ip, replace http://localhost endpoint with http://localhost:port or http://ip:port in index.js file.`);
        } else {
            console.error(error);
        }
    }
    client.close();
})();
