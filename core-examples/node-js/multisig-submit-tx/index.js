const { abiContract, TonClient } = require('@tonclient/core')
const { libNode } = require('@tonclient/lib-node')
const fs = require('fs')
const path = require('path')

/**
 * In this example we will send `value` to `destAddress`
 * Correct next 6 lines with your data
 */
const value = 10_000_000_000
const destAddress = '0:7a867df1edb6654e142376a05fc380f121d24190a1d164f9784bf7c5f7d5521e'
const endpoints = ["net1.ton.dev", "net5.ton.dev"]
const msigKeysFileName = 'msig.keys.json'
const msigAbiFileName = 'SafeMultisigWallet.abi.json'
const msigAddress = '0:469c51a08633376690a088218ec20f190be22a1e7a0ba3005eb12444363a5997'

TonClient.useBinaryLibrary(libNode)
const client = new TonClient({ network: { endpoints } })

const msigKeysFile = path.join(__dirname, msigKeysFileName)
const msigAbiFile = path.join(__dirname, msigAbiFileName)

if (!fs.existsSync(msigKeysFile) || !fs.existsSync(msigAbiFile)) {
    console.log(`Error: Some of the required files are missing:\n${msigKeysFile}\n${msigAbiFile}`)
    process.exit(1)
}

const params = {
    send_events: false,
    message_encode_params: {
        address: msigAddress,
        abi: {
            type: 'Contract',
            value: JSON.parse(fs.readFileSync(msigAbiFile, 'utf8')),
        },
        call_set: {
            function_name: 'submitTransaction',
            input: {
                dest: destAddress,
                value,
                bounce: false,
                allBalance: false,
                payload: '',
            },
        },
        signer: {
            type: 'Keys',
            keys: JSON.parse(fs.readFileSync(msigKeysFile, 'utf8')),
        },
    },
}

console.log('Calling multisig with params:', params)

client.processing
    .process_message(params)
    .then(() => {
        console.log(`OK, value: ${value} was sent to ${destAddress}`)
        process.exit(0)
    })
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
