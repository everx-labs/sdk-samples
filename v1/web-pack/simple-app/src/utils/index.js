const deploy = require('./deploy')
const getBalance = require('./getBalance')
const getLocal = require('./getLocal')
const repeatWithPredicate = require('./repeatWithPredicate')
const run = require('./run')
const sleep = require('./sleep')

const pubkeyRegex = /^[0-9a-fA-F]{64}$/
const addressRegex = /^-?[0-9a-fA-F]+:[0-9a-fA-F]{64}$/

const onlyZero = /^0+$/

// :: String -> String
const strip0x = (str) => str.replace(/^0x/, '')
const add0x = (str) => (str === '' ? '' : `0x${strip0x(str)}`)
const stripWorkchain = (str) => str.replace(/^[^:]*:/, '')

// :: * -> Bool
const isValidPublicKey = (x) => typeof x === 'string' && pubkeyRegex.test(strip0x(x)) && !onlyZero.test(strip0x(x))
const isValidAddress = (x) => typeof x === 'string' && addressRegex.test(x) && !onlyZero.test(stripWorkchain(x))

// :: String|Number, String|Number -> Bool
const isNear = (x, y) => Math.abs(parseInt(y) - parseInt(x)) < 200000000 // 2e8

// :: String -> String
const convert = (from, to) => (data) => Buffer.from(data, from).toString(to)
const base64ToUtf8 = convert('base64', 'utf8')
const hexToUtf8 = (hex) => convert('hex', 'utf8')(strip0x(hex))
const hexToBase64 = (hex) => convert('hex', 'base64')(strip0x(hex))
const utf8ToHex = convert('utf8', 'hex')

const toNano = (n) => n * 1000000000 // 1e9
const fromNano = (n) => n / 1000000000

module.exports = {
    add0x,
    base64ToUtf8,
    deploy,
    fromNano,
    toNano,
    getBalance,
    getLocal,
    hexToBase64,
    hexToUtf8,
    isNear,
    isValidAddress,
    isValidPublicKey,
    repeatWithPredicate,
    run,
    sleep,
    strip0x,
    utf8ToHex,
}
