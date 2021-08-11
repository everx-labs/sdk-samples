

const config = {
    retries: {
        run: 2, /*5,*/
        runLocal: 20,
    },
    timeout: {
        run: 600000, // Promise.race for run, Almost disabled (10m)
        runDeferredAttempts: [0, 18000].concat(
            Array.from(Array(8).keys()).map((x) => (x + 1) * 30000),
            // Array.from(Array(30).keys()).map(x => (x + 1) * 60000)
        ),
        runLocal: 30000, // Promise.race duration for runLocal
        secondsWaitForLatecomers: 20,
        waitFor: 3000,
    },
    errors: {
        E_NO_PROP: 'E_NO_PROP',
    },
}

const get = (target, prop) => target[prop] || (console.log(config.errors.E_NO_PROP, prop))
module.exports = new Proxy(config, { get })