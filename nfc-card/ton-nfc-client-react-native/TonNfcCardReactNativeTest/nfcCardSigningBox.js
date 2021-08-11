import React, { Component } from 'react';
import {
    Spacer,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Button,
    Text,
    TextInput,
    StatusBar,
    NativeModules,
    Alert
} from 'react-native';

import Toast from 'react-native-simple-toast';

import { decodeMessage, encodeOutput } from 'ton-client-js/dist/modules/crypto-box';

class NfcCardSigningBox {

    constructor(client) {
        this.client = client;
    }

    async getPublicKey() {
        console.log('>>> Before public key')
        Toast.show('>>> Before public key')
        let runRetries = 5

        if (!this.publicKey) {
            console.log('>>> Request public key')
            Toast.show('>>> Request public key')

            for (let n = 0; n < runRetries; n++) {
                try {
                    alert("Hold the card near you smartphone/iPhone.. And wait about ~ 20 sec to read its public key. \n Be sure the card is near your phone until you will see the key!")
                    await new Promise(r => setTimeout(r, 20000));
                    this.publicKey = await NativeModules.NfcCardModule.getPublicKeyForDefaultPath();
                    console.log(' ✓')
                    alert("Signing box got Public key from card = " + this.publicKey + ". Please remove security card for now. \n  And please wait!")
                    await new Promise(r => setTimeout(r, 5000))
                    break
                } catch (err) {
                    console.log(err.message)
                    if (n < runRetries - 1) {
                        console.log(`Run next try request pub key #${n + 1}`)
                        await new Promise(r => setTimeout(r, 30000));
                    } else {
                        throw err
                    }
                }
            }


        }
        console.log('>>> Got public key', this.publicKey)
        Toast.show('>>> Got public key ' + this.publicKey)
        return this.publicKey;
    }

    async sign(message, outputEncoding) {
        console.log('>>> Prepare msg for signing')
        Toast.show('>>> Prepare msg for signing')
        let msgBytes = decodeMessage(message)
        console.log('>>> msgBytes = ')
        console.log(msgBytes)
        let dataForSigning = msgBytes.toString('hex')
        console.log('>>> dataForSigning in hex = ' + dataForSigning)
        Toast.show('>>> dataForSigning in hex = ' + dataForSigning)

        const card = NativeModules.NfcCardModule
        console.log('>>> Before signature request ')
        alert("Hold the card near you smartphone/iPhone. And wait about ~ 20 sec to get signature. \n Be sure the card is near your phone until you will see the key!")
        return new Promise(function (res, err) {
            setTimeout(async function () {
                console.log('>>> Start signature requesting from the card')
                const result = await card.verifyPinAndSignForDefaultHdPath(dataForSigning, "5555")
                console.log('>>> Raw signature from card =  ' + result)
                const finalRes = encodeOutput(Buffer.from(result, 'hex'), outputEncoding)
                console.log('>>> Signature in required encoding =  ' + finalRes)
                alert('Signing box got Signature from security card = ' + finalRes  + ". Please remove security card for now. \n  And please wait!")
                await new Promise(r => setTimeout(r, 5000))
                res(finalRes)
            }, 20000)
        })
    }
}

module.exports = NfcCardSigningBox