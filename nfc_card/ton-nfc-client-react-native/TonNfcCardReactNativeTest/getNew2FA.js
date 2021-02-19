const { url2FA, user, pass } = require('./config')
const request2FA = require('./request2FA')
import {
    Alert
} from 'react-native';

import Toast from 'react-native-simple-toast'


const getNew2FA = async (fname,  oldCode2FA) => {
    await new Promise(r => setTimeout(r, 5000))
    alert('Requesting correct 2FA code...')
    console.log('Requesting correct 2FA code...')
    let code2FA
    while (true) {
        console.log("request2FA.... ")
        Toast.show("request2FA.... ")
        code2FA = await request2FA(fname)
        console.log("New code2FA = " + { code2FA })
        Toast.show("New code2FA = " + { code2FA })
        if (code2FA && (oldCode2FA ? code2FA !== oldCode2FA : true)) {
            await new Promise(r => setTimeout(r, 5000))
            console.log('Got correct 2FA code %s', code2FA)
            alert('Got correct 2FA code ' + code2FA)
            break
        }
        await new Promise(r => setTimeout(r, 5000))
    }
    return code2FA
} 

module.exports = getNew2FA