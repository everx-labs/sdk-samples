const { path } = require('ramda')
const rp = require('request-promise-native')
const { url2FA, user, pass } = require('./config')

// :: string -> Promise<string | Nil>

const requestTestData = () =>
    rp({
        method: 'GET',
        uri: url2FA + 'test-data.json',
        auth: {
            user,
            pass,
            sendImmediately: true,
        },
        resolveWithFullResponse: true,
        json: true,
    })
        .then(path(['body']))
        .catch(console.log)
module.exports = requestTestData