const { url2FA, user, pass } = require('./config')
const request2FA = require('./request2FA')
import {
    Alert
} from 'react-native';

import Toast from 'react-native-simple-toast'


const getOld2FA = async (fname) => {
    await new Promise(r => setTimeout(r, 5000))
    alert("Request oldCode2FA code")
    const oldCode2FA = await request2FA(fname)
    console.log("oldCode2FA = " + oldCode2FA )
    await new Promise(r => setTimeout(r, 5000))
    alert("oldCode2FA = " + oldCode2FA )
    return oldCode2FA
} 


module.exports = getOld2FA