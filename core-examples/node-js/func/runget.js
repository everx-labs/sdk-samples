const fs = require('fs');
const path = require('path');
const { TonClient, abiContract, signerKeys, signerNone,
    builderOpInteger,
    builderOpCell,
    builderOpCellBoc,
    builderOpBitString,
    builderOpAddress
 } = require('@eversdk/core');
const { libNode } = require('@eversdk/lib-node');

// ABI and imageBase64 of a contract used as a giver (multisig)
const everWallet = '0:d807caf6df3a7c2bb0b64915613eca9d8f17ca1de0b938dfdcbb9b4ff30c4526';
const everWalletAbi = require('./contracts/everWallet.abi.json');

const wallet = "0:9c0a906541795a64c20a80c9cb047cd41098f40a5d9929a77269b9bfca397c1e";

// const ENDPOINTS = ['https://devnet.evercloud.dev/1b9cc796b28a48bb9cef97cc2ed9a304/graphql'];

 const ENDPOINTS = ['https://n01.ton.dapp.tonlabs.io/graphql'];


// Link the platform-dependable ever-sdk binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@eversdk/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@eversdk/lib-web` and `@eversdk/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ever-sdk-js)
TonClient.useBinaryLibrary(libNode);
const client = new TonClient({
    network: {
        endpoints: ENDPOINTS,
        message_processing_timeout: 20000
    },
});

const u = (size, x) => {
    if (size === 256) {
        return builderOpBitString(`x${BigInt(x).toString(16).padStart(64, "0")}`)
    } else {
        return builderOpInteger(size, x);
    }
}
const u8 = x => u(8, x);
const u32 = x => u(32, x);
const u64 = x => u(64, x);
const u128 = x => u(128, x);
const u256 = x => u(256, x);
const b0 = u(1, 0);
const b1 = u(1, 1);
const bits = x => builderOpBitString(x);
const bytes = x => bits(x.toString("hex"));
const str = x => bytes(Buffer.from(x, "utf8"));


(async () => {
    try {

        let accountState = (await client.net.query({query:`query{
            blockchain{
              account(address:"0:9c0a906541795a64c20a80c9cb047cd41098f40a5d9929a77269b9bfca397c1e"){
                info{
                  boc
                }
              }
            }
          }`})).result.data.blockchain.account.info.boc;
          console.log(accountState);
        const seqNo =  await client.tvm.run_get({account: accountState, function_name:`seqno`});
        console.log(seqNo);
        console.log('Normal exit');
        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error(
                [
                    'Network is inaccessible. You have to start Evernode SE using `everdev se start`',
                    'If you run SE on another port or ip, replace http://localhost endpoint with',
                    'http://localhost:port or http://ip:port in index.js file.',
                ].join('\n'),
            );
        } else {
            console.error(error);
            process.exit(1);
        }
    }
})();
