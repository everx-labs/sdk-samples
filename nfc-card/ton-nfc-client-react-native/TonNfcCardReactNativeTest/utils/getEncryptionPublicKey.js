const { path } = require('ramda')
const strip0xPad64 = require('./strip0xPad64')
const runLocalWithPredicateAndRetries = require('./runLocalWithPredicateAndRetries')
// const propNotEmpty = require('./fp/propNotEmpty')

const map = {} // TODO

async function getEncryptionPublicKey (tonClient, address, abi) {
  if (map[address]) return map[address]

  process.stdout.write(`Try to get user encryptionPublicKey from: ${address}`)

  const predicate = o => true
  // because this prop is named differently in different contracts
  //	o => R.or(propNotEmpty(['output', 'encryptionKey'], o), propNotEmpty(['output', 'encryptionPublicKey'], o))

  const {
    output: { encryptionKey, encryptionPublicKey }
  } = await runLocalWithPredicateAndRetries(tonClient)(predicate)(
    { address, package: { abi }, keyPair: null },
    'getEncryptionPublicKey',
    {}
  )
  console.log(' ✓')
  return (map[address] = strip0xPad64(encryptionKey || encryptionPublicKey))
}

module.exports = getEncryptionPublicKey
