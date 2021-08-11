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

const { url2FA, user, pass } = require('./config')
const R = require('ramda')
//const assert = require('assert')
import { TONClient as TONClientClass } from 'ton-client-react-native-js';
import { TONClient } from 'ton-client-js';

import { decodeMessage, encodeOutput } from 'ton-client-js/dist/modules/crypto-box';

const { networks, nonce, contracts } = require('./config')
const { uTracking, integrationConfig, multisig } = contracts
const utils = require('./utils')
const request2FA = require('./request2FA')
//const requestTestData = require('./requestTestData')
const addOwnerToMultisig = require('./addOwnerToMultisig')
const requestRecoveryData = require('./requestRecoveryData')
var aesjs = require('aes-js');
const { run, deploy, runWithSigningBox } = require('./utils')

import Toast from 'react-native-simple-toast';

import { Buffer } from 'buffer';
global.Buffer = Buffer;


const {
    QMessageProcessingStatus,
    QMessageType,
} = require('ton-client-js/dist/modules/TONContractsModule')

const email = 'alina1989malina@yandex.ru'

const exit = (message, code) => {
    console.log(message)
    alert(message)
}

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
                    alert("Hold the card#1 near you smartphone/iPhone.. And wait about ~ 20 sec to read its public key. \n Be sure the card is near your phone until you will see the key!")
                    await new Promise(r => setTimeout(r, 20000));
                    this.publicKey = await NativeModules.NfcCardModule.getPublicKeyForDefaultPath();
                    console.log(' ✓')
                    alert("Signing box got Public key from card #1 = " + this.publicKey + ". Please remove security card#1 for now. \n  And please wait!")
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
        alert("Hold the card#1 near you smartphone/iPhone. And wait about ~ 20 sec to get signature. \n Be sure the card is near your phone until you will see the key!")
        return new Promise(function (res, err) {
            setTimeout(async function () {
                console.log('>>> Start signature requesting from the card')
                const result = await card.verifyPinAndSignForDefaultHdPath(dataForSigning, "5555")
                console.log('>>> Raw signature from card =  ' + result)
                const finalRes = encodeOutput(Buffer.from(result, 'hex'), outputEncoding)
                console.log('>>> Signature in required encoding =  ' + finalRes)
                alert('Signing box got Signature from security card #1 = ' + finalRes  + ". Please remove security card#1 for now. \n  And please wait!")
                await new Promise(r => setTimeout(r, 5000))
                res(finalRes)
            }, 20000)
        })
    }
}

const testMultisigWithTwoCards = async () => {
    console.log("Getting public key from security card #1")
    Toast.show("Getting public key from security card #1")
    alert("Hold the card#1 near you smartphone/iPhone. And wait about ~ 20 sec to read its public key. \n Be sure the card is near your phone until you will see the key!")
    await new Promise(r => setTimeout(r, 20000));
    var firstSecurityCardPk = await NativeModules.NfcCardModule.getPublicKeyForDefaultPath()
    console.log("Public key from card #1 = " + firstSecurityCardPk)
    alert("Public key from card #1 = " + firstSecurityCardPk + ". Please remove security card#1 for now.")
    await new Promise(r => setTimeout(r, 5000))

    TONClient.setLibrary(TONClientClass.clientPlatform);

    const ton = new TONClient();

    ton.config.setData({
        servers: ['net.ton.dev'/*'cinet.tonlabs.io'*/],
    });

    ton.setup();

    // Перед началом теста запросим адрес юзер-трекинга, мультисига, и их ключи
    alert("Requesting data about uTracking and multisig...")
    await new Promise(r => setTimeout(r, 5000))
    const testData = await requestRecoveryData()

    // Заберем из полученных данных ключи и адреса
    Object.assign(uTracking, R.pick(['keyPair', 'address', 'encryptionPublicKey'], testData.uTracking))
    Object.assign(multisig, R.pick(['keyPair', 'address'], testData.multisig))

    // Для теста добавим в мультисиг второго кастодиана - публичный ключ юзер-трекинга

    const ownersPKs = [multisig.keyPair.public]

    console.log("ownersPKs with one Custodian (Surf) = " + ownersPKs)
    alert("Multisig addr = " + testData.multisig.address + ", Surf public key = " + multisig.keyPair.public)

    const signingBox = new NfcCardSigningBox(ton)
    const reqConfirms = 2
    const { imageBase64 } = multisig.package
    const { codeBase64 } = await ton.contracts.getCodeFromImage({ imageBase64 })
    const { hash } = await ton.contracts.getBocHash({ bocBase64: codeBase64 })

    const custodianA = {
        keyPair: {
            public: multisig.keyPair.public,
            secret: multisig.keyPair.secret,
        }
    }

    //   Добавляет второго кастодиана карту#1
    {
        await new Promise(r => setTimeout(r, 5000))
        alert("Start adding 2nd Custodian security card #1 into multisig")
        console.log("Start adding 2nd Custodian security card #1 into multisig")
        
        ownersPKs.push(firstSecurityCardPk)

        console.log("ownersPKs with two Custodians (Surf, security card #1) = " + ownersPKs)
        Toast.show("ownersPKs with two Custodians (Surf, security card #1) = " + ownersPKs)

        await new Promise(r => setTimeout(r, 5000))
        alert("Start submitUpdate request by Serf pk to multisig. Please wait.")
        const { output } = await run(ton)({ ...multisig, ...custodianA }, 'submitUpdate', {
            codeHash: `0x${hash}`,
            owners: ownersPKs.map((k) => `0x${k}`),
            reqConfirms,
        })
        const { updateId } = output
        alert("submitUpdate is done")

        await new Promise(r => setTimeout(r, 5000))
        alert("Start executeUpdate request to multisig. Please wait.")
        await run(ton)({ ...multisig, ...custodianA }, 'executeUpdate', { updateId, code: codeBase64 })
        alert("executeUpdate is done")

        await new Promise(r => setTimeout(r, 5000))

        alert( 'OK, now custodians are Surf and security card #1:' + ownersPKs )
        console.log('OK, now custodians are Surf and security card #1:', ownersPKs)
    }

    await new Promise(r => setTimeout(r, 20000));

    console.log("Getting public key from security card #2")
    Toast.show("Getting public key from security card #2")
    alert("Hold the card#2 near you smartphone/iPhone. And wait about ~ 20 sec to read its public key. Be sure the card is near your phone until you will see the key!")
    await new Promise(r => setTimeout(r, 20000));

    var secondSecurityCardPk = await NativeModules.NfcCardModule.getPublicKeyForDefaultPath()
    console.log("Public key from security card #2 = " + secondSecurityCardPk);
    alert("Public key from security card #2 = " + secondSecurityCardPk + ". Please remove security card#2 for now.")

    await new Promise(r => setTimeout(r, 5000))

    console.log('>>> Wait for sometime for smartphone/iPhone. to be ready work with card #1 again')
    alert('>>> Wait for sometime for smartphone/iPhone. to be ready work with card #1 again')
    await new Promise(r => setTimeout(r, 30000));
    
    alert("Start adding 3d Custodian security card #2 into multisig")
    console.log("Start adding 3d Custodian security card #2 into multisig")
    await new Promise(r => setTimeout(r, 5000))

     // Добавляем 3го кастодиан в мультисиг
     {
        ownersPKs.push(secondSecurityCardPk)

        console.log("ownersPKs with three Custodians (Surf, security card #1, security card #2) = " + ownersPKs)
        Toast.show("ownersPKs with three Custodians (Surf, security card #1, security card #2) = " + ownersPKs)
        
        //  Эту транзу засабмитил securitycard #1
        alert("Start submitUpdate request to multisig by security card #1. Please wait.")
        await new Promise(r => setTimeout(r, 5000))

        const { output } = await runWithSigningBox(ton)(signingBox, { ...multisig }, 'submitUpdate', {
            codeHash: `0x${hash}`,
            owners: ownersPKs.map((k) => `0x${k}`),
            reqConfirms,
        })
        const { updateId } = output

        alert("Done submitUpdate by security card #1")
        await new Promise(r => setTimeout(r, 5000))

        // Подтвердил и выполнил Surf
        alert("Start confirmUpdate by Serf pk. Please wait.")
        await new Promise(r => setTimeout(r, 5000))

        await run(ton)({ ...multisig, ...custodianA }, 'confirmUpdate', { updateId })

        alert("Done confirmUpdate by Serf")
        await new Promise(r => setTimeout(r, 5000))

        //  Эту транзу выполняет securitycard #1
        alert("Start executeUpdate by security card #1. Please wait.")
        await new Promise(r => setTimeout(r, 5000))

        await runWithSigningBox(ton)(signingBox, { ...multisig }, 'executeUpdate', { updateId, code: codeBase64 })
        alert("Done executeUpdate by security card #1")
        await new Promise(r => setTimeout(r, 5000))

        console.log('OK, now custodians are: Surf, security card #1, security card #2', ownersPKs)
        alert('OK, now custodians are: Surf, security card #1, security card #2', ownersPKs)
        await new Promise(r => setTimeout(r, 5000))
    }

    console.log('Done!')
    alert('Done!')
}

module.exports = testMultisigWithTwoCards