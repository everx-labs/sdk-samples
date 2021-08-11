const convert = (from, to) => data => Buffer.from(data, from).toString(to)
module.exports = convert
