const R = require('ramda')
const hexToUtf8 = (hex) => Buffer.from(hex, 'hex').toString('utf-8')
/*
 * openNaclBoxContainer :: tonClient -> string -> string -> string -> object | Error
 */
const openNaclBoxContainer = async (tonClient, secretKey, optPubKey, encryptedData) => {
    try {
        const { nonce, base64, pub_key } = JSON.parse(hexToUtf8(encryptedData))

        if (optPubKey && pub_key && optPubKey !== pub_key)
            throw Error(`Conflict, which pub_key is correct? ${JSON.stringify({ optPubKey, pub_key })}`)

        const stringifiedJson = await tonClient.crypto.naclBoxOpen({
            nonce,
            secretKey,
            theirPublicKey: pub_key || optPubKey,
            message: { base64 },
            outputEncoding: 'Hex',
        })
        return JSON.parse(hexToUtf8(stringifiedJson))
    } catch (err) {
        console.log('openNaclBoxContainer error:', err)
        throw err
    }
}

module.exports = R.curry(openNaclBoxContainer)