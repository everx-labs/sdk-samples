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

const ENDPOINTS = ['https://devnet.evercloud.dev/1b9cc796b28a48bb9cef97cc2ed9a304/graphql'];

// Link the platform-dependable ever-sdk binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@eversdk/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@eversdk/lib-web` and `@eversdk/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ever-sdk-js)
TonClient.useBinaryLibrary(libNode);
const client = new TonClient({
    network: {
        endpoints: ENDPOINTS
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
const b1 = u(1, 0);
const bits = x => builderOpBitString(x);
const bytes = x => builderOpCell([bits(x.toString("hex"))]);
const str = x => bytes(Buffer.from(x, "utf8"));




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

        const walletCodeInHex = "B5EE9C72410215010002F5000114FF00F4A413F4BCF2C80B010201200203020148040504F8F28308D71820D31FD31FD31F02F823BBF263ED44D0D31FD31FD3FFF404D15143BAF2A15151BAF2A205F901541064F910F2A3F80024A4C8CB1F5240CB1F5230CBFF5210F400C9ED54F80F01D30721C0009F6C519320D74A96D307D402FB00E830E021C001E30021C002E30001C0039130E30D03A4C8CB1F12CB1FCBFF1112131403EED001D0D3030171B0915BE021D749C120915BE001D31F218210706C7567BD228210626C6E63BDB022821064737472BDB0925F03E002FA403020FA4401C8CA07CBFFC9D0ED44D0810140D721F404305C810108F40A6FA131B3925F05E004D33FC8258210706C7567BA9131E30D248210626C6E63BAE30004060708020120090A005001FA00F404308210706C7567831EB17080185005CB0527CF165003FA02F40012CB69CB1F5210CB3F0052F8276F228210626C6E63831EB17080185005CB0527CF1624FA0214CB6A13CB1F5230CB3F01FA02F4000092821064737472BA8E3504810108F45930ED44D0810140D720C801CF16F400C9ED54821064737472831EB17080185004CB0558CF1622FA0212CB6ACB1FCB3F9410345F04E2C98040FB000201200B0C0059BD242B6F6A2684080A06B90FA0218470D4080847A4937D29910CE6903E9FF9837812801B7810148987159F31840201580D0E0011B8C97ED44D0D70B1F8003DB29DFB513420405035C87D010C00B23281F2FFF274006040423D029BE84C600201200F100019ADCE76A26840206B90EB85FFC00019AF1DF6A26840106B90EB858FC0006ED207FA00D4D422F90005C8CA0715CBFFC9D077748018C8CB05CB0222CF165005FA0214CB6B12CCCCC971FB00C84014810108F451F2A702006C810108D718C8542025810108F451F2A782106E6F746570748018C8CB05CB025004CF16821005F5E100FA0213CB6A12CB1FC971FB00020072810108D718305202810108F459F2A7F82582106473747270748018C8CB05CB025005CF16821005F5E100FA0214CB6A13CB1F12CB3FC973FB00000AF400C9ED5446A9F34F";        
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
            data: initData,

        })).tvc;
        console.log('State init: ', stateInit);

        const address = `0:`+(await client.boc.get_boc_hash({boc: stateInit})).hash;
        console.log('Address: ', address);

        // create deploy message body to sign
        // create seqno=0 cell
        const seqnoCell = (await client.boc.encode_boc({
            builder: [
                u32(0)
            ],
        })).boc;
        console.log('seqnoCell: ', seqnoCell);

        const sign_secret = (await client.crypto.nacl_sign_keypair_from_secret_key({secret: walletKeys.secret})).secret;
        const signature = (await client.crypto.nacl_sign_detached({unsigned:seqnoCell, secret: sign_secret })).signature;
        console.log('signature: ', signature);

        const deployBody =  (await client.boc.encode_boc({
            builder: [
                bytes(signature),
             //   builderOpCell([
                    builderOpCellBoc(seqnoCell)
               // ])
            ],
        })).boc;
        const deployMessage = await client.boc.encode_external_in_message({
            dst:"0:52cfb9b4cabf147aa28853d443e2d8aa76bb5eea5cf47042595c7112a447b827",
            init: stateInit,
            body: deployBody
        })

        console.log('Deploy message',deployMessage.message );

        await client.processing.send_message({message: deployMessage.message, send_events: false});

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

