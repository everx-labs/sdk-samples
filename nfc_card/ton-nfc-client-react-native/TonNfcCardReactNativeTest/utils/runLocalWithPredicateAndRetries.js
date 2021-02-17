/* eslint-disable consistent-return */
const assert = require('assert')
const promiseTimeout = require('./promiseTimeout')
const sleep = require('./sleep')
const {
    retries: { runLocal: runLocalRetries },
    timeout: { runLocal: runLocalTimeout },
} = require('./config')

assert.ok(runLocalRetries)
assert.ok(runLocalTimeout)

const runLocalWithPredicateAndRetries = (tonClient) => (predicate) => async (contract, fname, options = {}, keys) => {
    for (let n = 0; n < runLocalRetries; n++) {
        try {
            const result = await promiseTimeout(
                runLocalTimeout,
                tonClient.contracts.runLocal({
                    address: contract.address,
                    abi: contract.package.abi,
                    functionName: fname,
                    input: options,
                    keyPair: keys !== undefined ? keys : contract.keyPair,
                }),
            )

            if (predicate(result)) {
                return result
            } else {
                throw Error('Required condition not met')
            }
        } catch (err) {
            console.log(err)
            if (n < runLocalRetries - 1) {
                console.log(`Next try #${n + 1}`)
                await sleep(3000)
            } else {
                throw err
            }
        }
    }
}
module.exports = runLocalWithPredicateAndRetries
