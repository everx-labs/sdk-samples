'use strict'
const promiseTimeout = (ms, promise) =>
    Promise.race([
        promise,
        new Promise((resolve, reject) => {
            setTimeout(() => reject(Error(`Exited by timeout ${ms} ms.`)), ms)
        }),
    ])

module.exports = promiseTimeout
