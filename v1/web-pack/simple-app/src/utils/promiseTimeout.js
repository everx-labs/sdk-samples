const promiseTimeout = (ms, promise) =>
    Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(Error(`Exited by timeout ${ms} ms.`)), ms)
        }),
    ])

module.exports = promiseTimeout
