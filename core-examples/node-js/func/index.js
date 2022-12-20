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
const everWalletAbi = require('./contracts/SafeMultisigWallet.abi.json');

// const ENDPOINTS = ['https://devnet.evercloud.dev/1b9cc796b28a48bb9cef97cc2ed9a304/graphql'];

const ENDPOINTS = ['localhost'];


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
const u128 = x => u(128, x);
const u256 = x => u(256, x);
const b0 = u(1, 0);
const b1 = u(1, 1);
const bits = x => builderOpBitString(x);
//const bytes = x => builderOpCell([bits(x.toString("hex"))]);
const bytes = x => bits(x.toString("hex"));

//const str = x => bytes(Buffer.from(x, "utf8"));





(async () => {
    try {
        // Generate an ed25519 key pair
        // const TON_DICTIONARY: u8 = 0;
        // const walletMnemonics = (await client.crypto.mnemonic_from_random({dictionary:0, word_count:24})).phrase;
        const walletMnemonics = "galaxy promote aerobic pact engine prepare unaware cage mango slow day host crisp bright worth sustain breeze update cricket shine traffic exist term loan";
        const walletKeys = await client.crypto.mnemonic_derive_sign_keys({
            phrase: walletMnemonics,
            dictionary: 0,
            word_count: 24
        })

        console.log(`Mnemonic: ${walletMnemonics}`);
        console.log(`Keys: ${JSON.stringify(walletKeys,undefined, 2)}`);

        const walletCodeInHex = "B5EE9C72410214010002D4000114FF00F4A413F4BCF2C80B010201200203020148040504F8F28308D71820D31FD31FD31F02F823BBF264ED44D0D31FD31FD3FFF404D15143BAF2A15151BAF2A205F901541064F910F2A3F80024A4C8CB1F5240CB1F5230CBFF5210F400C9ED54F80F01D30721C0009F6C519320D74A96D307D402FB00E830E021C001E30021C002E30001C0039130E30D03A4C8CB1F12CB1FCBFF1011121302E6D001D0D3032171B0925F04E022D749C120925F04E002D31F218210706C7567BD22821064737472BDB0925F05E003FA403020FA4401C8CA07CBFFC9D0ED44D0810140D721F404305C810108F40A6FA131B3925F07E005D33FC8258210706C7567BA923830E30D03821064737472BA925F06E30D06070201200809007801FA00F40430F8276F2230500AA121BEF2E0508210706C7567831EB17080185004CB0526CF1658FA0219F400CB6917CB1F5260CB3F20C98040FB0006008A5004810108F45930ED44D0810140D720C801CF16F400C9ED540172B08E23821064737472831EB17080185005CB055003CF1623FA0213CB6ACB1FCB3FC98040FB00925F03E20201200A0B0059BD242B6F6A2684080A06B90FA0218470D4080847A4937D29910CE6903E9FF9837812801B7810148987159F31840201580C0D0011B8C97ED44D0D70B1F8003DB29DFB513420405035C87D010C00B23281F2FFF274006040423D029BE84C600201200E0F0019ADCE76A26840206B90EB85FFC00019AF1DF6A26840106B90EB858FC0006ED207FA00D4D422F90005C8CA0715CBFFC9D077748018C8CB05CB0222CF165005FA0214CB6B12CCCCC973FB00C84014810108F451F2A7020070810108D718FA00D33FC8542047810108F451F2A782106E6F746570748018C8CB05CB025006CF165004FA0214CB6A12CB1FCB3FC973FB0002006C810108D718FA00D33F305224810108F459F2A782106473747270748018C8CB05CB025005CF165003FA0213CB6ACB1F12CB3FC973FB00000AF400C9ED54696225E5";        
        const walletCodeInBase64 = Buffer.from(walletCodeInHex, 'hex').toString('base64');
        console.log('Code in base64', walletCodeInBase64);

        walletId = 698983191;

        const initData = (await client.boc.encode_boc({
            builder: [
                u32(0), 
                u32(walletId),
                bytes(walletKeys.public),
                b0
            ],
        })).boc;

        console.log('Init data', initData);

        const stateInit = (await client.boc.encode_tvc({
            code: walletCodeInBase64,
            data: initData
        })).tvc;
       /* const stateInit1 = (await client.boc.encode_boc({
            builder: [
                b0, b0, b1, b1, null
            ]
        })) */
        console.log('State init: ', stateInit);

        const address = `0:`+(await client.boc.get_boc_hash({boc: stateInit})).hash;
        console.log('Address: ', address);

        // create deploy message body to sign
        const expireAt = Math.floor(Date.now() / 1e3) + 60;
        const dataToSign = (await client.boc.encode_boc({
            builder: [
                u32(walletId),
                b1, b1,  b1,  b1,  b1,
                b1, b1,  b1,  b1,  b1,
                b1, b1,  b1,  b1,  b1,
                b1, b1,  b1,  b1,  b1,
                b1, b1,  b1,  b1,  b1,
                b1, b1,  b1,  b1,  b1,
                b1, b1,
               // u32(expireAt),
                u32(0) ,
                u8(0)
            ],
        })).boc;
        console.log('dataToSign: ', dataToSign);
        const tvmHashToSignInHex = (await client.boc.get_boc_hash({boc: dataToSign})).hash;
        const tvmHashToSignInBase64 = Buffer.from(tvmHashToSignInHex,'hex').toString('base64');

        const sign_secret = (await client.crypto.nacl_sign_keypair_from_secret_key({secret: walletKeys.secret})).secret;
        const signature = (await client.crypto.nacl_sign_detached({unsigned: tvmHashToSignInBase64, secret: sign_secret })).signature;
        console.log('signature: ', signature);

        const deployBody =  (await client.boc.encode_boc({
            builder: [
                bytes(signature),
                u32(walletId),
                b1, b1,  b1,  b1,  b1,
                b1, b1,  b1,  b1,  b1,
                b1, b1,  b1,  b1,  b1,
                b1, b1,  b1,  b1,  b1,
                b1, b1,  b1,  b1,  b1,
                b1, b1,  b1,  b1,  b1,
                b1, b1,
                u32(0) ,
                u8(0)
            ],
        })).boc;
        const deployMessage = await client.boc.encode_external_in_message({
            dst:"0:52cfb9b4cabf147aa28853d443e2d8aa76bb5eea5cf47042595c7112a447b827",
            init: stateInit,
            body: deployBody
        })

        console.log('Deploy message',deployMessage.message );

        const shard_block_id = (await client.processing.send_message({message: deployMessage.message, send_events: false})).shard_block_id;
        await client.processing.wait_for_transaction({
            message: deployMessage.message,
            shard_block_id,
            send_events: false
        })

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

