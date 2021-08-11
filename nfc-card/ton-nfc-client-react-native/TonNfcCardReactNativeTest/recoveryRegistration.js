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

const R = require('ramda')
const { url2FA, user, pass } = require('./config')

import { TONClient as TONClientClass } from 'ton-client-react-native-js';
import { TONClient } from 'ton-client-js';

import { decodeMessage, encodeOutput } from 'ton-client-js/dist/modules/crypto-box';

const { networks, nonce, contracts } = require('./config')
const { uTracking, integrationConfig, multisig } = contracts
const utils = require('./utils')
const request2FA = require('./request2FA')
const addOwnerToMultisig = require('./addOwnerToMultisig')
const requestRecoveryData = require('./requestRecoveryData')
var aesjs = require('aes-js')
const { run, deploy, runWithSigningBox } = require('./utils')
import Toast from 'react-native-simple-toast';

const NfcCardSigningBox = require('./nfcCardSigningBox.js')

import { Buffer } from 'buffer';
  global.Buffer = Buffer;

const exit = (message, code) => {
    console.log(message)
    alert(message)
}

const gen_pair_request = 0
const sign_restore_tx = 1
const aes_key_request = 2

const action = gen_pair_request 

const recoveryRegistration = async (email) => {
  try {
        console.log('email = ' + email)
        console.log("Getting public key from security card")
        Toast.show("Getting public key from security card")
        alert("Hold the card near you smartphone/iPhone. And wait about ~ 20 sec to read its public key. \n Be sure the card is near your phone until you will see the key!")
        await new Promise(r => setTimeout(r, 20000));

        var securityCardPk = await NativeModules.NfcCardModule.getPublicKeyForDefaultPath();

        console.log("Public key from card = " + securityCardPk)
        alert("Public key from card = " + securityCardPk + ". Please remove security card for now.")
        await new Promise(r => setTimeout(r, 5000))


        TONClient.setLibrary(TONClientClass.clientPlatform);

        const ton = new TONClient();

        ton.config.setData({
            servers: ['net.ton.dev' /*'cinet.tonlabs.io'*/],
        });

        ton.setup();

        const signingBox = new NfcCardSigningBox(ton)

        // Перед началом теста запросим адрес юзер-трекинга, мультисига, и их ключи
        await new Promise(r => setTimeout(r, 5000))
        alert("Requesting data about uTracking, multisig and recovery data for recording into card...")
        await new Promise(r => setTimeout(r, 5000))
        const testData = await requestRecoveryData()
        var recoveryDataJson = JSON.stringify( {
            surfPublicKey:  testData.multisig.keyPair.public,
            multisigAddress:  testData.multisig.address,
            p1: testData.cards[0].P1,
            cs: testData.cards[0].CS
        })

        console.log(recoveryDataJson)

        // Заберем из полученных данных ключи и адреса
        Object.assign(uTracking, R.pick(['keyPair', 'address', 'encryptionPublicKey'], testData.uTracking))
        Object.assign(multisig, R.pick(['keyPair', 'address'], testData.multisig))

        // Для теста добавим в мультисиг второго кастодиана - публичный ключ юзер-трекинга

        const ownersPKs = [multisig.keyPair.public]

        console.log("ownersPKs with one Custodian (Surf) = " + ownersPKs)
        alert("Multisig addr = " + testData.multisig.address + ", Surf public key = " + multisig.keyPair.public)
        await new Promise(r => setTimeout(r, 5000))
        alert("Password = " + testData.cards[0].P1 + ", common secret = " + testData.cards[0].CS)

        const reqConfirms = 2
        const { imageBase64 } = multisig.package
        const { codeBase64 } = await ton.contracts.getCodeFromImage({ imageBase64 })
        const { hash } = await ton.contracts.getBocHash({ bocBase64: codeBase64 })

        const custodianSurf = {
            keyPair: {
                public: multisig.keyPair.public,
                secret: multisig.keyPair.secret,
            }
        }

        //   Добавляет второго кастодиана карту
        {
            await new Promise(r => setTimeout(r, 5000))
            alert("Start adding 2nd Custodian security card into multisig")
            console.log("Start adding 2nd Custodian security card into multisig")

            ownersPKs.push(securityCardPk)
            console.log("ownersPKs with two Custodians (Surf, security card) = " + ownersPKs)
            Toast.show("ownersPKs with two Custodians (Surf, security card) = " + ownersPKs)
        
            await new Promise(r => setTimeout(r, 5000))
            alert("Start submitUpdate request by Serf pk to multisig. Please wait.")
            const { output } = await run(ton)({ ...multisig, ...custodianSurf }, 'submitUpdate', {
                codeHash: `0x${hash}`,
                owners: ownersPKs.map((k) => `0x${k}`),
                reqConfirms,
            })
            const { updateId } = output
            alert("submitUpdate is done")

            await new Promise(r => setTimeout(r, 5000))
            alert("Start executeUpdate request to multisig. Please wait.")
            await run(ton)({ ...multisig, ...custodianSurf }, 'executeUpdate', { updateId, code: codeBase64 })
            alert("executeUpdate is done")

            await new Promise(r => setTimeout(r, 5000))
            alert( 'OK, now custodians are Surf and security card:' + ownersPKs )
            console.log('OK, now custodians are Surf and security card:', ownersPKs)
        }

        await new Promise(r => setTimeout(r, 5000))
        console.log('Start registration in recovery service')
        alert('Start registration in recovery service')

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

        const fname = `${uTracking.encryptionPublicKey}.2fa.html`

        console.log("URL = " + url2FA + fname)

        await new Promise(r => setTimeout(r, 5000));
        console.log("Start 2FA code verification")
        alert("Start 2FA code verifiation")

        // Запросим 2FA код. Это гарантированно старый код, еще с прошлого запуска. он нам не подойдет
        // Кроме того его может вообще не быть
        await new Promise(r => setTimeout(r, 5000))
        alert("Request oldCode2FA code")
        const oldCode2FA = await request2FA(fname)
        console.log("oldCode2FA = " + { oldCode2FA })

        await new Promise(r => setTimeout(r, 5000))
        alert("oldCode2FA = " + { oldCode2FA })

        // Шифрует email пользователя открытым ключом SC-сервиса, подписывает полученное сообщение закрытым ключом пользователя Surf
        await new Promise(r => setTimeout(r, 5000))
        alert('Reset registration process')
        console.log('Reset registration process')
        await utils.run(ton)(uTracking, 'stopRecovery', {})

        await new Promise(r => setTimeout(r, 5000))
        alert('Send requestRecoveryRegistration for userTracking address ' + uTracking.address)
        console.log('Send requestRecoveryRegistration for userTracking address %s', uTracking.address)
        const request = await encrypt({ email, action })
        await utils.run(ton)(uTracking, 'requestRecoveryRegistration', { request })
    
        await new Promise(r => setTimeout(r, 5000))
        alert('requestRecoveryRegistration request is done')

        // Читаем в цикле файл `fname`, пока в нем не появится 2FA код
        await new Promise(r => setTimeout(r, 5000))
        alert('Requesting correct 2FA code...')
        console.log('Requesting correct 2FA code...')
  
        let code2FA
        while (true) {
            console.log("request2FA.... ")
            Toast.show("request2FA.... ")
            code2FA = await request2FA(fname)
            console.log("New code2FA = " + { code2FA })
            if (code2FA && (oldCode2FA ? code2FA !== oldCode2FA : true)) {
                await new Promise(r => setTimeout(r, 5000))
                console.log('Got correct 2FA code %s', code2FA)
                alert('Got correct 2FA code ' + code2FA)
                break
            }
            await new Promise(r => setTimeout(r, 5000))
        }

        await new Promise(r => setTimeout(r, 5000))
        console.log('Sending WRONG old 2FA code')
        alert('Sending WRONG old 2FA code for test')
        const encOldCode2FA = await encrypt({ code2FA: oldCode2FA })
        await utils.run(ton)(uTracking, 'send2FA', { code2FA: encOldCode2FA  })

        await new Promise(r => setTimeout(r, 5000))
        alert('Sending WRONG 2FA code for test is done')

        await new Promise(r => setTimeout(r, 5000))
        alert('Wait for recovery status')
        let recoveryStatus
        while (!recoveryStatus) {
            recoveryStatus = await utils
                .runLocalWithPredicateAndRetries(ton)(R.T)(uTracking, 'getRecoveryStatus', {})
            .then(R.path(['output', 'recoveryStatus']))
            console.log("recoveryStatus " + recoveryStatus)
            await new Promise(r => setTimeout(r, 5000))
            console.log('waiting....')
        }
        await new Promise(r => setTimeout(r, 5000))
        alert('Recovery status = ' + recoveryStatus)
        if (recoveryStatus === '0x7' || recoveryStatus === '0x4') {
            exit(`Something went wrong. We sent incorrect 2FA code, but got recoveryStatus (success: 0x07  OR 0x04 )`, 0)
        }

        // Subscribe on messages from userTracking contract
        await new Promise(r => setTimeout(r, 5000))
        console.log('Waiting for the 2FA check answer')
        alert('Waiting for the 2FA check answer')

        await new Promise(r => setTimeout(r, 5000))
        console.log('2FA check failed, now sending right 2FA code')
        alert('2FA check failed, now sending right 2FA code')
        const encCode2FA = await encrypt({ code2FA })
        await utils.run(ton)(uTracking, 'send2FA', { code2FA: encCode2FA })
        await new Promise(r => setTimeout(r, 5000))
        alert('Sending correct 2FA code is done')
        console.log('Sending correct 2FA code is done')

        let recoveryStatusForCorrectCase = '0x2';
        while (recoveryStatusForCorrectCase !== '0x4') {
            recoveryStatusForCorrectCase = await utils
                .runLocalWithPredicateAndRetries(ton)(R.T)(uTracking, 'getRecoveryStatus', {})
                .then(R.path(['output', 'recoveryStatus']))
            console.log("recoveryStatus " + recoveryStatusForCorrectCase)
            await new Promise(r => setTimeout(r, 5000))
            console.log('waiting....')
        }
        await new Promise(r => setTimeout(r, 5000))
        alert('Recovery status = ' + recoveryStatusForCorrectCase)
        if (recoveryStatusForCorrectCase !== '0x4') {
            exit(`Something went wrong. We sent correct 2FA code, but got recoveryStatus not equal to 0x04 (fail)`, 0)
        }

        await new Promise(r => setTimeout(r, 5000))
        alert('Correct 2FA code verification is done.')
        console.log('Correct 2FA code verification is done.')

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

        const json2 = part2
            ? await utils.openNaclBoxContainer(
                  ton,
                  uTracking.keyPair.secret,
                  recoveryServicePK,
                  Buffer.from(JSON.stringify(part2), 'utf-8').toString('hex'),
              )
            : null

        console.log(JSON.stringify(json1))
        console.log(JSON.stringify(json2))


        if (json1.pub_key && json2.aes_key) {
            await new Promise(r => setTimeout(r, 5000));
            alert("Start adding 3d Custodian HSM into multisig")
            console.log("Start adding 3d Custodian HSM into multisig")
                    

            // Добавляем 3го кастодиан в мультисиг
            {
                ownersPKs.push(json1.pub_key)
                await new Promise(r => setTimeout(r, 5000))
                alert('Public key from recovery service = ' + json1.pub_key)
                console.log('Public key from recovery service = ' + json1.pub_key)
    
                //  Эту транзу засабмитил custodianB
                await new Promise(r => setTimeout(r, 5000))
                alert("Start submitUpdate request to multisig by security card. Please wait.")
                const { output } = await runWithSigningBox(ton)(signingBox, { ...multisig }, 'submitUpdate', {
                    codeHash: `0x${hash}`,
                    owners: ownersPKs.map((k) => `0x${k}`),
                    reqConfirms,
                })
                const { updateId } = output
                                
                await new Promise(r => setTimeout(r, 5000))
                alert("Done submitUpdate by security card")
            
    
                // Подтвердил и выполнил custodianA
                await new Promise(r => setTimeout(r, 5000))
                alert("Start confirmUpdate by Serf pk. Please wait.")
                await run(ton)({ ...multisig, ...custodianSurf}, 'confirmUpdate', { updateId })
                await new Promise(r => setTimeout(r, 5000))
                alert("Done confirmUpdate by Serf")
    
                await new Promise(r => setTimeout(r, 5000))
                alert("Start executeUpdate by security card. Please wait.")
    
                await runWithSigningBox(ton)(signingBox, { ...multisig }, 'executeUpdate', { updateId, code: codeBase64 })
    
                await new Promise(r => setTimeout(r, 5000))
                alert("Done executeUpdate by security card")
    
                await new Promise(r => setTimeout(r, 5000))
    
                console.log('OK, now custodians are: Surf, security card, HSM', ownersPKs)
                alert('OK, now custodians are: Surf, security card, HSM', ownersPKs)
            }
    
            var aesKeyBytes = aesjs.utils.hex.toBytes(json2.aes_key);
            console.log("aesKeyBytes.length : " + aesKeyBytes.length);
    
            await new Promise(r => setTimeout(r, 5000))
            alert("aesKeyBytes.length : " + aesKeyBytes.length)
    
            await new Promise(r => setTimeout(r, 5000))
            alert("aesKey from recovery service: " + json2.aes_key)
    
            console.log("Recovery data to record into card : " + recoveryDataJson);
            var recoveryDataBytes = aesjs.utils.utf8.toBytes(recoveryDataJson);
    
            await new Promise(r => setTimeout(r, 5000))
            alert("Recovery data to record into card : " + recoveryDataJson)
    
            // The counter is optional, and if omitted will begin at 1
            var aesCtr = new aesjs.ModeOfOperation.ctr(aesKeyBytes, new aesjs.Counter(5));
            var encryptedBytes = aesCtr.encrypt(recoveryDataBytes);
    
            // To print or store the binary data, you may convert it to hex
            var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
            console.log("Encrypted recovery data : " + encryptedHex);
            console.log("Encrypted recovery data length : " + encryptedHex.length);
    
            await new Promise(r => setTimeout(r, 5000))
            alert("Encrypted recovery data : " + encryptedHex)
    
            await new Promise(r => setTimeout(r, 5000))
            alert("Hold the card near you smartphone/iPhone. And wait about ~ 20 sec to read its public key. \n Be sure the card is near your phone until you will see the key!")
            
            await new Promise(r => setTimeout(r, 20000));
            var addRes = await NativeModules.NfcCardModule.addRecoveryData(encryptedHex)
            console.log("add Recovery data into card result  = " + addRes)
            await new Promise(r => setTimeout(r, 5000))
            alert("add Recovery data into card result  = " + addRes)
    
            await new Promise(r => setTimeout(r, 5000))
            console.log('Done!')
            alert('Done!')
            exit(`Test passed!`, 0)
        }
    
        console.log("finish")

   } catch (e) {
    exit(e.message)
   }
}

module.exports = recoveryRegistration

    



    

   

  

    

    


    


    



    
   


