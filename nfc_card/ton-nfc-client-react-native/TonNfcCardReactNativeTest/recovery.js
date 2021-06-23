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
import Toast from 'react-native-simple-toast'

const getOld2FA= require('./getOld2FA')
const getNew2FA = require('./getNew2FA')

const NfcCardSigningBox = require('./nfcCardSigningBox.js')

import { Buffer } from 'buffer';
global.Buffer = Buffer;

const gen_pair_request = 0
const sign_restore_tx = 1
const aes_key_request = 2

/*
   uint8 constant RECOVERY_NOT_IN_PROGRESS = 0;
    uint8 constant RECOVERY_2FA_EMAILED = 1;
    uint8 constant RECOVERY_2FA_SENT = 2;
    uint8 constant RECOVERY_REGISTRATION_STARTED = 3;
    uint8 constant RECOVERY_REGISRTATION_FINISHED = 4;
    uint8 constant RECOVERY_UPDATE_REQUESTED = 5;
    uint8 constant RECOVERY_UPDATE_CONFIRMED = 6;
    uint8 constant RECOVERY_2FA_SUCCESS = 7;
    uint8 constant RECOVERY_2FA_CHECK_FAILED = 10; // 2FA-code verification failed
    uint8 constant RECOVERY_UPDATE_FAILED = 11;
    uint8 constant RECOVERY_2FA_BANNED = 12;
*/

const exit = (message, code) => {
    console.log(message)
    alert(message)
}


const recovery = async (email) => {
 try {
    console.log('Start recovery test')
    alert('Start recovery test')

    let action = aes_key_request 

    console.log('email = ' + email)

    const signingBox = new NfcCardSigningBox(ton)
 
    TONClient.setLibrary(TONClientClass.clientPlatform);

    const ton = new TONClient();

    ton.config.setData({
        servers: ['net.ton.dev' /*'cinet.tonlabs.io'*/],
    });

    ton.setup();

    // Перед началом теста запросим адрес юзер-трекинга, мультисига, и их ключи
    await new Promise(r => setTimeout(r, 5000))
    alert("Requesting data about uTracking and multisig...")
    await new Promise(r => setTimeout(r, 5000))
    const testData = await requestRecoveryData()
    const newSurfPubKey = testData.multisig.keyPair.public 

    const custodianNewSurf = {
        keyPair: {
            public: testData.multisig.keyPair.public,
            secret: testData.multisig.keyPair.secret,
        }
    }

    const ownersPKs = [testData.multisig.keyPair.public]

    alert("New Multisig addr = " + testData.multisig.address + ", New Surf public key = " + testData.multisig.keyPair.public)


    // Заберем из полученных данных ключи и адреса
    Object.assign(uTracking, R.pick(['keyPair', 'address', 'encryptionPublicKey'], testData.uTracking))
   // Object.assign(multisig, R.pick(['keyPair', 'address'], testData.multisig))

   // Нам понадобится публичный ключ рекавери-сервиса для расшифровки его сообщений
    const recoveryServicePK = utils.strip0x(
    await utils
        .runLocalWithPredicateAndRetries(ton)(R.path(['output', 'key']))(integrationConfig, 'getKey', {
            id: 10,
        })
        .then(R.path(['output', 'key'])),
    )

    // Helper. Возвращает публичный ключ шифрования SCSC контракта
    const getSCSCEncPK = (serviceId) =>
    utils
        .runLocalWithPredicateAndRetries(ton)(R.path(['output', 'key']))(integrationConfig, 'getKey', {
            id: serviceId,
        })
        .then(R.path(['output', 'key']))

    // Helper. Шифрует данные naclBox
    // Returns hex string

    const encrypt = async (json) =>
        utils
            .naclBoxContainer(ton)(
                uTracking.keyPair.secret,
                uTracking.encryptionPublicKey,
                utils.strip0x(await getSCSCEncPK(8)), // SCSC service has id == 8
                json,
            )
            .catch(exit)

    await new Promise(r => setTimeout(r, 5000));
    console.log("Start story with 2FA code")
    alert("Start story with 2FA code")

    // 2FA код должен прилететь по почте. но для теста он просто пишется сервисом в файл
    //
    const fname = `${uTracking.encryptionPublicKey}.2fa.html`

    console.log("URL = " + url2FA + fname)

    // Запросим 2FA код. Это гарантированно старый код, еще с прошлого запуска. он нам не подойдет
    // Кроме того его может вообще не быть
    let oldCode2FA = await getOld2FA(fname)

    await new Promise(r => setTimeout(r, 5000))
    alert('Reset registration process')
    console.log('Reset registration process')
    await utils.run(ton)(uTracking, 'stopRecovery', {})

    await new Promise(r => setTimeout(r, 5000))
    alert('Send requestRecoveryRegistration for userTracking address ' + uTracking.address)
    console.log('Send requestRecoveryRegistration for userTracking address %s', uTracking.address)
    let request = await encrypt({ email, action })
    await utils.run(ton)(uTracking, 'requestRecoveryRegistration', { request })

    await new Promise(r => setTimeout(r, 5000))
    alert('requestRecoveryRegistration request is done')

    let code2FA = await getNew2FA(fname,  oldCode2FA)

    function sendCorrect2FA() {
        return new Promise(async (resolve) => {
            await new Promise(r => setTimeout(r, 5000))
            alert('Sending correct 2FA code')
            console.log('Sending correct 2FA code')
            const encCode2FA = await encrypt({ code2FA })
            await utils.run(ton)(uTracking, 'send2FA', { code2FA: encCode2FA })
            await new Promise(r => setTimeout(r, 5000))
            alert('Sending correct 2FA code is done')
            console.log('Sending correct 2FA code is done')
            return resolve()
        })
    }

    function checkStatusOf2FAVerification(status) {
        return new Promise(async (resolve) => {
            let recoveryStatus = '0x2';
            while (recoveryStatus !== status) {
                recoveryStatus = await utils
                    .runLocalWithPredicateAndRetries(ton)(R.T)(uTracking, 'getRecoveryStatus', {})
                    .then(R.path(['output', 'recoveryStatus']))
                console.log("recoveryStatus " + recoveryStatus)
                await new Promise(r => setTimeout(r, 5000))
                console.log('waiting....')
            }
            await new Promise(r => setTimeout(r, 5000))
            alert('Correct 2FA code verification is done.')
            console.log('Correct 2FA code verification is done.')
            return resolve()
        })
    }

    await sendCorrect2FA()
    await checkStatusOf2FAVerification('0x4')

    await new Promise(r => setTimeout(r, 5000))
    alert('Requesting recovery data.')
    console.log('Requesting recovery data.')
    let encryptedDataFromRecoveryService
    while (!encryptedDataFromRecoveryService) {
        encryptedDataFromRecoveryService = await utils
            .runLocalWithPredicateAndRetries(ton)(R.T)(uTracking, 'getRecoveryData', {})
        .then(R.path(['output', 'recoveryData']))
        console.log(encryptedDataFromRecoveryService)
        await new Promise(r => setTimeout(r, 5000))
        console.log('waiting....')
    }
    await new Promise(r => setTimeout(r, 5000))
    alert('Encrypted Recovery data = ' + encryptedDataFromRecoveryService)

    const [part1, part2] = JSON.parse(
        Buffer.from(encryptedDataFromRecoveryService, 'hex').toString('utf-8'),
    )

    const json1 = await utils.openNaclBoxContainer(
        ton,
        uTracking.keyPair.secret,
        recoveryServicePK,
        Buffer.from(JSON.stringify(part1), 'utf-8').toString('hex'),
    )

    const aesKey = json1.aes_key

    var aesKeyBytes = aesjs.utils.hex.toBytes(aesKey);
    console.log("aesKeyBytes.length : " + aesKeyBytes.length);

    await new Promise(r => setTimeout(r, 5000))
    alert("aesKeyBytes.length : " + aesKeyBytes.length)
    await new Promise(r => setTimeout(r, 5000))
    alert("aesKey from recovery service: " + aesKey)
    console.log("aesKey from recovery service: " + aesKey);

    await new Promise(r => setTimeout(r, 5000))
    console.log("Get recovery data from security card")
    alert("Get recovery data from security card")

    alert("Hold the card near you smartphone/iPhone. And wait about ~ 20 sec to read its public key. \n Be sure the card is near your phone until you will see the key!")
    await new Promise(r => setTimeout(r, 20000))

    var encryptedRecoveryDataFromSecurityCard = await NativeModules.NfcCardModule.getRecoveryData()
    await new Promise(r => setTimeout(r, 5000))
    console.log("encryptedRecoveryDataFromSecurityCard = " + encryptedRecoveryDataFromSecurityCard)
    alert("encryptedRecoveryDataFromSecurityCard = " + encryptedRecoveryDataFromSecurityCard)

    var encryptedRecoveryDataFromSecurityCardBytes =  aesjs.utils.hex.toBytes(encryptedRecoveryDataFromSecurityCard)

     // The counter is optional, and if omitted will begin at 1
    var aesCtr = new aesjs.ModeOfOperation.ctr(aesKeyBytes, new aesjs.Counter(5))
    var decryptedBytes = aesCtr.decrypt(encryptedRecoveryDataFromSecurityCardBytes)
 
     // To print or store the binary data, you may convert it to hex
    var decryptedRcoveryDataJson = aesjs.utils.utf8.fromBytes(decryptedBytes)

    console.log("Decrypted recovery data : " + decryptedRcoveryDataJson)

    await new Promise(r => setTimeout(r, 5000))
    alert("Decrypted recovery data : " + decryptedRcoveryDataJson)

    const recoveryData = JSON.parse(decryptedRcoveryDataJson)

    let oldMultisigAddr = recoveryData.multisigAddress
    let oldSurfPublicKey = recoveryData.surfPublicKey

    let multisigData = {
        address: oldMultisigAddr,
        keyPair: {
            public: oldSurfPublicKey,
            secret: '',
        },
    }

    console.log("1 ")

    const { imageBase64 } = multisig.package
    const { codeBase64 } = await ton.contracts.getCodeFromImage({ imageBase64 })
    const { hash } = await ton.contracts.getBocHash({ bocBase64: codeBase64 })


    console.log("2 ")
    Object.assign(multisig, R.pick(['address'], multisigData))

    console.log("3 ")

    alert("Start submitUpdate request to multisig by security card. Please wait.")

    await new Promise(r => setTimeout(r, 5000))
    alert("Start submitUpdate request to multisig by security card. Please wait.")
    const { output } = await runWithSigningBox(ton)(signingBox, { ...multisig }, 'submitUpdate', {
        codeHash: `0x${hash}`,
        owners: ownersPKs.map((k) => `0x${k}`),
        reqConfirms: ownersPKs.length,
    })
    const { updateId } = output
                            
    await new Promise(r => setTimeout(r, 5000))
    alert("Done submitUpdate by security card")

    action = sign_restore_tx

    oldCode2FA = await getOld2FA(fname)

    console.log("Start requestUpdateConfirmation")
    await new Promise(r => setTimeout(r, 5000))
    alert("Start requestUpdateConfirmation")

    request = await encrypt({
        email,
        multisig_addr: oldMultisigAddr,
        update_id: updateId,
        action,
    })
    await utils.run(ton)(uTracking, 'requestUpdateConfirmation', { request })

    console.log("requestUpdateConfirmation request is done")
    await new Promise(r => setTimeout(r, 5000))
    alert("requestUpdateConfirmation request is done")

    code2FA = await getNew2FA(fname,  oldCode2FA)
    await sendCorrect2FA()
    await checkStatusOf2FAVerification('0x6')

    await new Promise(r => setTimeout(r, 5000))
    alert("Start executeUpdate by security card. Please wait.")

    await runWithSigningBox(ton)(signingBox, { ...multisig }, 'executeUpdate', { updateId, code: codeBase64 })

    await new Promise(r => setTimeout(r, 5000))
    alert("Done executeUpdate by security card")

    await new Promise(r => setTimeout(r, 5000))

    console.log('OK, now custodians are:', ownersPKs)
    alert('OK, now custodians are: ', ownersPKs)

    alert("Hold the card near you smartphone/iPhone. And wait about ~ 20 sec to read its public key. \n Be sure the card is near your phone until you will see the key!")
    await new Promise(r => setTimeout(r, 20000));

    await NativeModules.NfcCardModule.resetRecoveryData()

    alert("Reset recovery data is done. Test is finished.")

    console.log("finish")
 } catch (e) {
     exit(e.message)
 }
}

module.exports = recovery