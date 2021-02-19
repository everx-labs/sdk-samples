const assert = require('assert')
const retries = { deploy: 3 }
const timeout = { deploy: 60000 }

const promiseTimeout = require('./promiseTimeout')
const getGramsFromGiver = require('./getGramsFromGiver')

module.exports = (netClient) => async (contract, constructorParams = {}, keyPair) => {
    console.log(`Deploying contract...`)
    for (let n = 0; n < retries.deploy; n++) {
        try {
            const params = {
                package: contract.package,
                constructorParams,
                keyPair: keyPair || contract.keyPair,
            }

            const { address: futureAddress } = await netClient.contracts.createDeployMessage(params)
            await getGramsFromGiver(netClient)(futureAddress)

            process.stdout.write('Deploying...')
            const { address } = await promiseTimeout(timeout.deploy, netClient.contracts.deploy(params))

            console.log(' ✓')
            return address
        } catch (err) {
            console.log(err)
            if (n < retries.deploy - 1) {
                console.log(`Next try #${n + 1}`)
            } else {
                throw err
            }
        }
    }
}