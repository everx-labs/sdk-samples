const path = require('path')
const fs = require('fs')
const { TonClient } = require('@eversdk/core')
const { libNode } = require('@eversdk/lib-node')

const contractPackage = loadContract('someContract')

// Link the platform-dependable ever-sdk binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@eversdk/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@eversdk/lib-web` and `@eversdk/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ever-sdk-js )
TonClient.useBinaryLibrary(libNode)

const initialShards = [
    '00001',
    '00011',
    '00101',
    '00111',
    '01001',
    '01011',
    '01101',
    '01111',
    '10001',
    '10011',
    '10101',
    '10111',
    '11001',
    '11011',
    '11101',
    '11111',
]

;(async () => {
    try {
        const client = new TonClient()
        for (let shard of initialShards) {
            for (;;) {
                const keyPair = await client.crypto.generate_random_sign_keys()
                // Generate future address of the contract. It is unique and the same per key pair and contract to be deployed.
                // Encode deploy message
                const { address } = await client.abi.encode_message({
                    abi: contractPackage.abi,
                    deploy_set: {
                        tvc: contractPackage.tvc,
                        initial_data: {},
                    },
                    call_set: {
                        function_name: 'constructor',
                        input: {},
                    },
                    signer: {
                        type: 'Keys',
                        keys: keyPair,
                    },
                })
                if (getShard(address) === shard) {
                    console.log(`Shard ${shard}\nAddress:${address}\nKey pair:`, keyPair)
                    break
                }
            }
        }
        process.exit(0)
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
})()

//---
function loadContract(name) {
    const contractPath = path.resolve(__dirname, 'contracts', name)
    return {
        abi: {
            type: 'Contract',
            value: require(`${contractPath}.abi.json`),
        },
        tvc: fs.readFileSync(`${contractPath}.tvc`).toString('base64'),
    }
}

function getShard(addr) {
    return BigInt('0x' + addr.split(':')[1])
        .toString(2)
        .padStart(256, '0')
        .slice(0, 5)
}
