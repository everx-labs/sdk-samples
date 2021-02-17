import { Component } from 'react';

import {
    Alert
} from 'react-native';

import NfcCardModule from 'ton-nfc-client';

printResults = (error, result) => {
    if (error != null) {
        Alert.alert(
            'Error',
            error,
            [
                {text: 'OK', onPress: () => console.log('OK Pressed')},
            ],
            {cancelable: false}
        );
    } else {

        Alert.alert(
            'Response from card',
            result,
            [
                {text: 'OK', onPress: () => console.log('OK Pressed')},
            ],
            {cancelable: false}
        );
    }
}

showResponse = (result) => {
    Alert.alert(
        'Response from card',
        JSON.stringify(result),
        [
            {text: 'OK', onPress: () => console.log('OK Pressed')},
        ],
        {cancelable: false}
    );
}

showError = (error) => {
    Alert.alert(
        'Error',
        JSON.stringify(error),
        [
            {text: 'OK', onPress: () => console.log('OK Pressed')},
        ],
        {cancelable: false}
    );
}

export default class NfcWrapper extends Component {

    /* CoinManager commands */

    getSeVersion() {
        NfcCardModule.getSeVersion()
            .then((result) => showResponse("SE version : " + result)).catch((e) => showError(e.message))
    }

    getCsn() {
        NfcCardModule.getCsn()
            .then((result) =>{ 
                console.log(result)
                showResponse("CSN (SEID, Secure Element Id) : " + result)
            }).catch((e) => showError(e.message))
    }

    getDeviceLabel() {
        NfcCardModule.getDeviceLabel()
            .then((result) => showResponse("Device label : " + result)).catch((e) => showError(e.message))
    }

    setDeviceLabel(label) {
        NfcCardModule.setDeviceLabel(label)
            .then((result) => showResponse("Set Device label status: " + result)).catch((e) => showError(e.message))
    }

    getMaxPinTries() {
       NfcCardModule.getMaxPinTries()
            .then((result) => showResponse("Maximum Pin tries : " + result)).catch((e) => showError(e.message))
    }

    getRemainingPinTries() {
        NfcCardModule.getRemainingPinTries()
            .then((result) => showResponse("Remainig Pin tries : " + result)).catch((e) => showError(e.message))
    }

    getRootKeyStatus() {
        NfcCardModule.getRootKeyStatus()
            .then((result) => showResponse("Root key status : " + result)).catch((e) => showError(e.message))
    }

    getAvailableMemory() {
        NfcCardModule.getAvailableMemory()
            .then((result) => {
                console.log(result)
                showResponse("Available card's memory : " + result)
            }).catch((e) => showError(e.message))
    }

    getAppsList() {
        NfcCardModule.getAppsList().then((result) => {
            console.log(result)
            showResponse("Applet AIDs list : " + result)
    }).catch((e) => showError(e.message))
    }

    generateSeed(pin) {
        NfcCardModule.generateSeed(pin).then((result) => showResponse("Generate seed status : " + result)).catch((e) => showError(e.message))
    }

    resetWallet() {
        NfcCardModule.resetWallet().then((result) => showResponse("Reset wallet status : " + result)).catch((e) => showError(e.message))
    }

    changePin(oldPin, newPin) {
        NfcCardModule.changePin(
            oldPin,
            newPin).then((result) => showResponse("Change Pin status : " + result)).catch((e) => showError(e.message))
    }

    /* Commands to maintain keys for hmac */

    selectKeyForHmac(serialNumber) {
        NfcCardModule.selectKeyForHmac(serialNumber)
            .then((result) => showResponse("Select key for hmac status : " + result)).catch((e) => showError(e.message))
    }

    createKeyForHmac(authenticationPassword, commonSecret, serialNumber) {
        NfcCardModule.createKeyForHmac(authenticationPassword, commonSecret, serialNumber)
            .then((result) => showResponse("Create key for hmac status : " + result)).catch((e) => showError(e.message))
    }

    getCurrentSerialNumber() {
        NfcCardModule.getCurrentSerialNumber()
            .then((result) => showResponse("Current selected serial number : " + result)).catch((e) => showError(e.message))
    }

    getAllSerialNumbers() {
        NfcCardModule.getAllSerialNumbers()
            .then((result) => showResponse("All serial numbers currently supported by NFC module : " + result)).catch((e) => showError(e.message))
    }

    isKeyForHmacExist(serialNumber) {
        NfcCardModule.isKeyForHmacExist(serialNumber)
            .then((result) => showResponse("Does key for hmac exist : " + result)).catch((e) => showError(e.message))
    }

    deleteKeyForHmac(serialNumber) {
        NfcCardModule.deleteKeyForHmac(serialNumber)
            .then((result) => showResponse("Delete key for hmac status : " + result)).catch((e) => showError(e.message))
    }

    /* Card activation commands (TonWalletApplet) */


    turnOnWallet(newPin, authenticationPassword, commonSecret, initialVector) {
        NfcCardModule.turnOnWallet(
            newPin,
            authenticationPassword,
            commonSecret,
            initialVector).then((result) => {
                console.log(result)
                showResponse("TonWalletApplet state : " + result)
        }).catch((e) => showError(e.message))
    }

    getHashOfEncryptedPassword() {
        NfcCardModule.getHashOfEncryptedPassword().then((result) => {
            console.log(result)
            showResponse("Hash of encrypted password : " + result)
    }).catch((e) => showError(e.message))
    }

    getHashOfEncryptedCommonSecret() {
        NfcCardModule.getHashOfEncryptedCommonSecret().then((result) => {
            console.log(result)
            showResponse("Hash of encrypted common secret : " + result)
    }).catch((e) => showError(e.message))
    }

    /* Common stuff (TonWalletApplet)  */

    getTonAppletState(){
        NfcCardModule.getTonAppletState()
            .then((result) => {
                console.log(result)
                showResponse("TonWallet applet state: " + result)
            })
            .catch((e) => showError(e.message))
    }

    getSerialNumber(){
        NfcCardModule.getSerialNumber()
            .then((result) => showResponse("Serial number: " + result))
            .catch((e) => showError(e.message))
    }

    /* Recovery data stuff (TonWalletApplet)  */

    addRecoveryData(recoveryData){
        NfcCardModule.addRecoveryData(recoveryData)
            .then((result) => showResponse("Recovery Data: " + result))
            .catch((e) => showError(e.message))
    }

    getRecoveryData(){
        NfcCardModule.getRecoveryData()
            .then((result) => showResponse("Recovery Data: " + result))
            .catch((e) => showError(e.message))
    }

    getRecoveryDataHash(){
        NfcCardModule.getRecoveryDataHash()
            .then((result) => {
                console.log(result)
                showResponse("Recovery Data Hash: " + result)
            })
            .catch((e) => showError(e.message))
    }

    getRecoveryDataLen(){
        NfcCardModule.getRecoveryDataLen()
            .then((result) => {
                console.log(result)
                showResponse("Recovery Data Length: " + result)
            })
            .catch((e) => showError(e.message))
    }

    isRecoveryDataSet(){
        NfcCardModule.isRecoveryDataSet()
            .then((result) => {
                console.log(result)
                showResponse("isRecoveryDataSet flag: " + result)
            })
            .catch((e) => showError(e.message))
    }

    resetRecoveryData(){
        NfcCardModule.resetRecoveryData()
            .then((result) => showResponse("Reset recovery data status: " + result))
            .catch((e) => showError(e.message))
    }

    enncryptAndAddRecoveryData(recoveryData, key){
        console.log("Raw recovery data : " + recoveryData);
        var recoveryDataBytes = aesjs.utils.utf8.toBytes(recoveryData);
         
        // The counter is optional, and if omitted will begin at 1
        var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
        var encryptedBytes = aesCtr.encrypt(recoveryDataBytes);
         
        // To print or store the binary data, you may convert it to hex
        var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
        console.log("Encrypted recovery data : " +encryptedHex);

        return NfcCardModule.addRecoveryData(encryptedHex)
            /*.then((result) => {
                showResponse("Add Recovery Data: " + result)
                console.log("Add Recovery Data: " + result)
                return result;
            })
            .catch((e) => {
                showError(e.message)
                console.log(e.message)
            })*/
    }

    /* TonWalletApplet commands (ed25519 related) */

    /* verifyDefaultPin(){
         NfcCardModule.verifyDefaultPin()
             .then((result) => showResponse("verifyDefaultPin result: " + result))
             .catch((e) => showError(e.message))
     }*/


    getPublicKeyForDefaultPath(){
        NfcCardModule.getPublicKeyForDefaultPath()
            .then((result) => {
                console.log(result)
                showResponse("Public key for default HD path m/44'/396'/0'/0'/0' : " + result)
            })
            .catch((e) => showError(e.message))
    }

    async verifyPin(pin) {
        try {
            let result = await NfcCardModule.verifyPin(pin);
            console.log(result)
            showResponse("verifyPin result: " + result)
        }
        catch (e) {
            showError(e.message)
        }
    }

    getPublicKey(hdIndex) {
        NfcCardModule.getPublicKey(hdIndex)
            .then((result) => {
                console.log(result)
                showResponse("Public key for HD path m/44'/396'/0'/0'/" + hdIndex + "' : " + result)
            })
            .catch((e) => showError(e.message))
    }

    async signForDefaultHdPath(dataForSigning) {
        try {
            let result = await NfcCardModule.signForDefaultHdPath(dataForSigning)
            console.log(result)
            showResponse("Signature : " + result)
        }
        catch (e) {
            showError(e.message)
        }
    }

    async sign(dataForSigning, hdIndex) {
        try {
            let result = await NfcCardModule.sign(dataForSigning, hdIndex)
            console.log(result)
            showResponse("Signature : " + result)
        }
        catch (e) {
            showError(e.message)
        }
    }

    async verifyPinAndSignForDefaultHdPath(dataForSigning, pin) {
        try {
            let result = await NfcCardModule.verifyPinAndSignForDefaultHdPath(dataForSigning, pin)
            console.log(result)
            showResponse("Signature : " + result)
        }
        catch (e) {
            showError(e.message)
        }
    }

    async verifyPinAndSign(dataForSigning, hdIndex, pin) {
        try {
            let result = await NfcCardModule.verifyPinAndSign(dataForSigning, hdIndex, pin)
            console.log(result)
            showResponse("Signature : " + result)
        }
        catch (e) {
            showError(e.message)
        }
    }

    /* Keychain commands */

    async resetKeyChain(){
        try {
            let result = await NfcCardModule.resetKeyChain();
            showResponse("resetKeyChain status :" + result)
        }
        catch (e) {
            showError(e.message)
        }
    }

    async getKeyChainDataAboutAllKeys(){
        try {
            let result = await NfcCardModule.getKeyChainDataAboutAllKeys();
            console.log(result)
            showResponse("getKeyChainDataAboutAllKeys status :" + result)
        }
        catch (e) {
            showError(e.message)
        }    
    }

    async getKeyChainInfo(){
        try {
            let result = await NfcCardModule.getKeyChainInfo();
            var obj = JSON.parse(result);
            console.log(result)
            showResponse("KeyChain info: Number of keys = " +  obj.numberOfKeys + ", Occupied size = "
                    + obj.occupiedSize + ", Free size = "  + obj.freeSize);
        }
        catch (e) {
            showError(e.message)
        } 
    }

    async getNumberOfKeys(){
        try {
            let result = await NfcCardModule.getNumberOfKeys();
            console.log(result)
            showResponse("getKeyChainDataAboutAllKeys status :" + result)
        }
        catch (e) {
            showError(e.message)
        }  
    }

    async getOccupiedStorageSize(){
        try {
            let result = await NfcCardModule.getOccupiedStorageSize();
            console.log(result)
            showResponse("getOccupiedStorageSize status :" + result)
        }
        catch (e) {
            showError(e.message)
        }  
    }

    async getFreeStorageSize(){
        try {
            let result = await NfcCardModule.getFreeStorageSize();
            console.log(result)
            showResponse("getFreeStorageSize status :" + result)
        }
        catch (e) {
            showError(e.message)
        }  
    }

    async getKeyFromKeyChain(keyHmac){
        try {
            let result = await NfcCardModule.getKeyFromKeyChain(keyHmac);
            console.log(result)
            showResponse("Key : " + result)
        }
        catch (e) {
            showError(e.message)
        }  
    }

    async addKeyIntoKeyChain(newKey){
        try {
            let result = await NfcCardModule.addKeyIntoKeyChain(newKey);
            showResponse("Add key status (hmac of new key) : "  + result)
        }
        catch (e) {
            showError(e.message)
        } 
    }

    /*  deleteKeyFromKeyChain(keyHmac){
          NfcCardModule.deleteKeyFromKeyChain(keyHmac).then((result) => showResponse("Delete key status (number of remained keys) : " + result))
              .catch((e) => showError(e.message))
      }

      finishDeleteKeyFromKeyChainAfterInterruption(keyHmac){
          NfcCardModule.finishDeleteKeyFromKeyChainAfterInterruption(keyHmac).then((result) => showResponse("Finish Delete key status after interruption (number of remained keys) : " + result))
              .catch((e) => showError(e.message))
      }*/

    async changeKeyInKeyChain(newKey, oldKeyHmac){
        try {
            let result = await NfcCardModule.changeKeyInKeyChain(newKey, oldKeyHmac);
            showResponse("Change key status (hmac of new key) : "  + result)
        }
        catch (e) {
            showError(e.message)
        } 
    }

    async getIndexAndLenOfKeyInKeyChain(keyHmac){
        try {
            let result = await NfcCardModule.getIndexAndLenOfKeyInKeyChain(keyHmac);
            console.log(result)
            showResponse("getIndexAndLenOfKeyInKeyChain response : " + result)
        }
        catch (e) {
            showError(e.message)
        }
    }

    async checkAvailableVolForNewKey(keySize){
        try {
            let result = await NfcCardModule.checkAvailableVolForNewKey(keySize);
            showResponse("checkAvailableVolForNewKey response : "  + result)
        }
        catch (e) {
            showError(e.message)
        }
    }

    async checkKeyHmacConsistency(keyHmac){
        try {
            let result = await NfcCardModule.checkKeyHmacConsistency(keyHmac);
            showResponse("checkKeyHmacConsistency response : "  + result)
        }
        catch (e) {
            showError(e.message)
        }
    }


}
