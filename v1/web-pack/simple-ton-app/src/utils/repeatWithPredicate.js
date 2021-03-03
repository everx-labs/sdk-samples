/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

const uuid = require('uuid')

const cfg = require('./config')
const sleep = require('./sleep')
const promiseTimeout = require('./promiseTimeout')

const repeatWithPredicate = async (thunk, predicate = () => true) => {
    const correlationId = uuid.v4()

    for (let n = 0; n < cfg.retriesCount; n++) {
        const message = (status) => `Processing attempt: ${JSON.stringify({ correlationId, attempt: n, status })}`

        console.debug(message('started'))
        try {
            const result = await promiseTimeout(cfg.retryTimeout, thunk())
            if (!predicate(result)) throw Error('Predicate error')

            console.debug(message('OK'))
            return result
        } catch (err) {
            console.debug(message('Failed'), err)
            if (n < cfg.retriesCount - 1) {
                await sleep(cfg.retriesPause)
            } else {
                throw err
            }
        }
    }
}
module.exports = repeatWithPredicate
