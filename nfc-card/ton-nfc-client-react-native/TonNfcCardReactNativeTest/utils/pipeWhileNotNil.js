const R = require('ramda')

module.exports = R.curry((arr, val) => R.pipeWith(
  (f, x) => (R.isNil(x) ? null : f(x)), //
  [(x) => (R.isNil(x) ? null : x), ...arr]
)(val))
