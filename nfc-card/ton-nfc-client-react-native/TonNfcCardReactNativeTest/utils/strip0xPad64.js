module.exports = str =>
  str
    .trim()
    .replace(/^0x/, '')
    .padStart(64, '0')
