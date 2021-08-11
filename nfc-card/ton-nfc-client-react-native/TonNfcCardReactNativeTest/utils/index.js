/* eslint-disable global-require */
const R = require('ramda')
const convert = require('./convert')

const base64ToUtf8 = convert('base64', 'utf8')
const hexToUtf8 = convert('hex', 'utf8')
const utf8ToHex = convert('utf8', 'hex')
const pipeWhileNotNil = require('./pipeWhileNotNil')
const asyncPipe = (arr) => R.pipeWith(R.then, R.map(R.unless(R.isNil), arr))

module.exports = {
    asyncPipe,
    base64ToUtf8,
    hexToUtf8,
    deploy: require('./deploy'),
    naclBoxContainer: require('./naclBoxContainer'),
    openNaclBoxContainer: require('./openNaclBoxContainer'),
    pipeWhileNotNil,
    promiseTimeout: require('./promiseTimeout'),
    run: require('./run'),
    runWithSigningBox: require('./runWithSigningBox'),
    runLocalWithPredicateAndRetries: require('./runLocalWithPredicateAndRetries'),
    sleep: require('./sleep'),
    strip0x: (str) => str.replace(/^0x/, ''),
    strip0xPad64: require('./strip0xPad64'),
    utf8ToHex,
}
