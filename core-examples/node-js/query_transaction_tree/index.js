const { abiContract, TonClient } = require('@tonclient/core')
const { libNode } = require('@tonclient/lib-node')
const fs = require('fs')
const path = require('path')

/**
 * In this example we will query the transaction tree of value transfer
 * We need to do it to check that inner message with transfer was delivered.
 *
 * Correct next 6 lines with your data. You can either copy the message_id from ton.live
 * or receive it as a result of encode_message and process_message functions.
 */

const inMsg = "9add67505ac1cb530414ad6c3979865475722f25506c364df3a9a5c71c93e5ec";
const endpoints = ['net1.ton.dev', 'net5.ton.dev'];
// https://docs.ton.dev/86757ecb2/p/40ba94-abi-specification-v2
const msigAbiFileName = 'SafeMultisigWallet.abi.json'

TonClient.useBinaryLibrary(libNode)
const client = new TonClient({
    network: { 
        endpoints 
    } 
});

const msigAbiFile = path.join(__dirname, msigAbiFileName)

const params = {
    in_msg: inMsg,
    abi: abiContract(msigAbiFile)
}
console.log('Query params:', params)

client.net.query_transaction_tree(params)
.then((result) => {
    // list of messages, produced in this transaction tree
    console.log(result.messages);
    // list of produced transactions 
    console.log(result.transactions);
    process.exit(0)
})    
.catch((err) => {
    console.error(err)
    process.exit(1)
}); 




