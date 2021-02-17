const R = require('ramda')
/*
 *  naclBoxContainer :: tonClient -> string -> string -> string -> object -> string | Error
 */
const naclBoxContainer = (tonClient) => async (secretKey, encryptionPublicKey, theirPublicKey, json) => {
    try {
        const nonce = await tonClient.crypto.randomGenerateBytes(24, 'Hex')

        const base64 = await tonClient.crypto.naclBox({
            message: {
                base64: Buffer.from(JSON.stringify(json)).toString('base64'),
            },
            nonce,
            theirPublicKey,
            secretKey,
            outputEncoding: 'Base64',
        })

        return Buffer.from(
            JSON.stringify({
                nonce,
                base64,
                pub_key: encryptionPublicKey,
            }),
            'utf-8',
        ).toString('hex')
    } catch (err) {
        console.log('naclBox error:', err)
        throw err
    }
}

module.exports = R.curry(naclBoxContainer)