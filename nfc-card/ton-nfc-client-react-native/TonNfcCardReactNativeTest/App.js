/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react';
import Dialog from "react-native-dialog";
import DialogInput from 'react-native-dialog-input';

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
  FlatList,
  Alert,
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  Style,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';


import {NfcCardModuleWrapper} from 'ton-nfc-client';
//const recovery = require('./recovery')
//const recoveryRegistration = require('./recoveryRegistration')
//const testMultisigWithTwoCards = require('./testMultisigWithTwoCards')
const findActivationDataPiece = require('./activationData')
import NfcWrapper from "./NfcWrapper";

import Toast from 'react-native-simple-toast';


const nfcCardNativeWrapper = new NfcCardModuleWrapper();

function Separator() {
  return <View style={styles.separator}/>;
}

//NfcHandler.NfcEvents.addListener((msg) => Toast.showWithGravity(msg, Toast.LONG, Toast.TOP))
//NfcHandler.NfcEvents.addAndroidListeners()

export default class HelloWorldApp extends Component {

  componentDidMount() {
  }

  constructor(props) {
    super(props);
    this.state = {
      deviceLabel: '005815A3942073A6ADC70C035780FDD09DF09AFEEA4173B92FE559C34DCA0550',
      currentPin: '5555',
      data: '000000',
      newPin: '5555',
      hdIndex: '1',
      newKey: '0000',
      newKeyForChangeKey: '',
      keyIndex: '0',
      oldKeyIndex: '0',
      keyIndexToDelete: '0',
      serialNumber: '504394802433901126813236',
      email: 'alina1989malina@yandex.ru',
      isGenerateSeedDialogVisible: false,
      isChangePinDialogVisible: false,
      isSetDeviceLabelDialogVisible: false,
      isGetPkDialogVisible: false,
      isVerifyPinDialogVisible: false,
      isSignForDefHdPathDialogVisible: false,
      isSignDialogVisible: false,
      enableScrollViewScroll: true,
      isCreateKeyForHmacDialogVisible: false,
      isSelectKeyForHmacDialogVisible: false,
      isDeleteKeyForHmacDialogVisible: false,
      isKeyForHmacExistsDialogVisible: false,
      isAddKeyIntoKeyChainDialogVisible: false,
      isGetKeyFromKeyChainDialogVisible: false,
      isDeleteKeyFromKeyChainDialogVisible: false,
      isChangeKeyFromKeyChainDialogVisible: false,
      isDeleteKeyFromKeyChainDialogVisible: false,
      isTurnOnWalletDialogVisible: false,
      isAddRecoveryDataDialogVisible: false,
      isEmailDialogVisible: false,
      isEmailDialogVisible2: false,
      /*
      serialNumbers: [
        "535110459474599149736332",
        "449634915078431948176852",
        "314856935569386969029165",
        "115456704932151001962551",
        "124843680472432549475921",
        "126083846606069739011949",
        "343155875629760788267343",
        "334525464436284236725680",
        "504394802433901126813236",
        "358464153630021949155797"
      ]*/
    };
    nfcWrapper = new NfcWrapper();
  }

  printResults = (error, result) => {
    if (error != null) {
      alert("Error: " + error);
    } else {
      alert(result);
    }
  }

  showAddRecoveryDataDialog(isShow) {
    this.setState({isAddRecoveryDataDialogVisible: isShow})
  }

  showGenerateSeedDialog(isShow) {
    this.setState({isGenerateSeedDialogVisible: isShow})
  }

  showChangePinDialog(isShow) {
    this.setState({isChangePinDialogVisible: isShow})
  }

  showGetPkDialog(isShow) {
    this.setState({isGetPkDialogVisible: isShow})
  }

  showSignForDefaultHdPathDialog(isShow) {
    this.setState({isSignForDefHdPathDialogVisible: isShow})
  }

  showSignDialog(isShow) {
    this.setState({isSignDialogVisible: isShow})
  }

  showSetDeviceLabelDialog(isShow) {
    this.setState({isSetDeviceLabelDialogVisible: isShow})
  }

  showTurnOnWalletDialog(isShow) {
    this.setState({isTurnOnWalletDialogVisible: isShow})
  }

  showAddKeyIntoKeyChainDialog(isShow) {
    this.setState({isAddKeyIntoKeyChainDialogVisible: isShow})
  }

  showGetKeyFromKeyChainDialog(isShow) {
    this.setState({isGetKeyFromKeyChainDialogVisible: isShow})
  }

  showDeleteKeyFromKeyChainDialog(isShow) {
    this.setState({isDeleteKeyFromKeyChainDialogVisible: isShow})
  }

  showChangeKeyFromKeyChainDialog(isShow) {
    this.setState({isChangeKeyFromKeyChainDialogVisible: isShow})
  }

  showCreateKeyForHmacDialog(isShow) {
    this.setState({isCreateKeyForHmacDialogVisible: isShow})
  }

  showSelectKeyForHmacDialog(isShow) {
    this.setState({isSelectKeyForHmacDialogVisible: isShow})
  }

  showDeleteKeyForHmacDialog(isShow) {
    this.setState({isDeleteKeyForHmacDialogVisible: isShow})
  }

  showKeyForHmacExistsDialog(isShow) {
    this.setState({isKeyForHmacExistsDialogVisible: isShow})
  }

  showEmailDialog(isShow) {
    this.setState({isEmailDialogVisible: isShow})
  }

  showEmailDialog2(isShow) {
    this.setState({isEmailDialogVisible2: isShow})
  }

  render() {
    return (
        <SafeAreaView style={styles.container}>
          <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              style={styles.scrollView}>

            <Text style={{padding: 10, fontSize: 20}}>
              Test maintaining keys for hmac:
            </Text>
            <Separator/>
            <View>
              <Dialog.Container visible={this.state.isCreateKeyForHmacDialogVisible}>
                <Dialog.Title>Create key for hmac</Dialog.Title>
                <Dialog.Input label="Serial number" style={{height: 70}}
                              defaultValue={this.state.serialNumber} multiline={true} numberOfLines={4}
                              onChangeText={(serialNumber) => this.setState({serialNumber})}></Dialog.Input>
                <Dialog.Button label="Close" onPress={() => this.showCreateKeyForHmacDialog(false)}/>
                <Dialog.Button label="Submit" onPress={() => {
                  const data = findActivationDataPiece(this.state.serialNumber)
                  if (data === undefined ) {
                    alert("Serial number is not found.")
                  }
                  else {
                    console.log("data.P1 = " + data.P1)
                    console.log("data.CS = " + data.CS)
                    var authenticationPassword = data.P1
                    var commonSecret = data.CS
                    nfcWrapper.createKeyForHmac(authenticationPassword, commonSecret, this.state.serialNumber)
                  }
                }}/>
              </Dialog.Container>
            </View>
            <View>
              <Button onPress={() => this.showCreateKeyForHmacDialog(true)} title="createKeyForHmac"/>
            </View>
            <Separator/>

            <View>
              <Dialog.Container visible={this.state.isSelectKeyForHmacDialogVisible}>
                <Dialog.Title>Select key for hmac</Dialog.Title>
                <Dialog.Input label="Serial number" style={{height: 70}}
                              defaultValue={this.state.serialNumber} multiline={true} numberOfLines={4}
                              onChangeText={(serialNumber) => this.setState({serialNumber})}></Dialog.Input>
                <Dialog.Button label="Close" onPress={() => this.showSelectKeyForHmacDialog(false)}/>
                <Dialog.Button label="Submit" onPress={() => {
                  const data = findActivationDataPiece(this.state.serialNumber)
                  if (data === undefined ) {
                    alert("Serial number is not found.")
                  }
                  else {
                    nfcWrapper.selectKeyForHmac(this.state.serialNumber)
                  }
                }}/>
              </Dialog.Container>
            </View>
            <View>
              <Button onPress={() => this.showSelectKeyForHmacDialog(true)} title="selectKeyForHmac"/>
            </View>
            <Separator/>

            <View>
              <Dialog.Container visible={this.state.isDeleteKeyForHmacDialogVisible}>
                <Dialog.Title>Delete key for hmac</Dialog.Title>
                <Dialog.Input label="Serial number" style={{height: 70}}
                              defaultValue={this.state.serialNumber} multiline={true} numberOfLines={4}
                              onChangeText={(serialNumber) => this.setState({serialNumber})}></Dialog.Input>
                <Dialog.Button label="Close" onPress={() => this.showDeleteKeyForHmacDialog(false)}/>
                <Dialog.Button label="Submit" onPress={() => {
                  const data = findActivationDataPiece(this.state.serialNumber)
                  if (data === undefined ) {
                    alert("Serial number is not found.")
                  }
                  else {
                    nfcWrapper.deleteKeyForHmac(this.state.serialNumber)
                  }
                }}/>
              </Dialog.Container>
            </View>
            <View>
              <Button onPress={() => this.showDeleteKeyForHmacDialog(true)} title="deleteKeyForHmac"/>
            </View>
            <Separator/>

            <View>
              <Dialog.Container visible={this.state.isKeyForHmacExistsDialogVisible}>
                <Dialog.Title>Check whether key for hmac exist</Dialog.Title>
                <Dialog.Input label="Serial number" style={{height: 70}}
                              defaultValue={this.state.serialNumber} multiline={true} numberOfLines={4}
                              onChangeText={(serialNumber) => this.setState({serialNumber})}></Dialog.Input>
                <Dialog.Button label="Close" onPress={() => this.showKeyForHmacExistsDialog(false)}/>
                <Dialog.Button label="Submit" onPress={() => {
                  const data = findActivationDataPiece(this.state.serialNumber)
                  if (data === undefined ) {
                    alert("Serial number is not found.")
                  }
                  else {
                    nfcWrapper.isKeyForHmacExist(this.state.serialNumber)
                  }
                }}/>
              </Dialog.Container>
            </View>
            <View>
              <Button onPress={() => this.showKeyForHmacExistsDialog(true)} title="checkKeyForHmacExist"/>
            </View>
            <Separator/>

            <View>
              <Button onPress={() => nfcWrapper.getCurrentSerialNumber()} title="getCurrentSerialNumber"/>
            </View>
            <Separator/>

            <View>
              <Button onPress={() => nfcWrapper.getAllSerialNumbers()} title="getAllSerialNumbers"/>
            </View>
            <Separator/>


            <Separator/>
            <Text style={{padding: 10, fontSize: 20}}>
              Test APDU commands of CoinManager:
            </Text>

            <Separator/>

            <View style={styles.container}>
              <DialogInput isDialogVisible={this.state.isGenerateSeedDialogVisible}
                           title={"Generate seed"}
                           subTitleStyle={{color: 'red'}}
                           message={"Enter PIN"}
                           hintInput={"PIN..."}
                           submitInput={(currentPin) => {
                             nfcWrapper.generateSeed(currentPin)
                             this.showGenerateSeedDialog(false)
                           }}
                           closeDialog={() => this.showGenerateSeedDialog(false)}>
              </DialogInput>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => this.showGenerateSeedDialog(true)} title="generateSeed"/>
            </View>
            <Separator/>

            <View>
              <Dialog.Container visible={this.state.isChangePinDialogVisible}>
                <Dialog.Title>Change pin</Dialog.Title>
                <Dialog.Input label="Current pin" style={{height: 40}} defaultValue={this.state.currentPin}
                              onChangeText={(currentPin) => this.setState({currentPin})}></Dialog.Input>
                <Dialog.Input label="New pin" style={{height: 40}} defaultValue={this.state.newPin}
                              onChangeText={(newPin) => this.setState({newPin})}></Dialog.Input>
                <Dialog.Button label="Close" onPress={() => {
                  this.showChangePinDialog(false)
                }}/>
                <Dialog.Button label="Submit" onPress={() => {
                  nfcWrapper.changePin(this.state.currentPin, this.state.newPin)
                  this.showChangePinDialog(false)
                }
                }/>
              </Dialog.Container>
            </View>
            <View>
              <Button onPress={() => {
                this.showChangePinDialog(true)
              }} title="changePin"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => {
                nfcWrapper.getMaxPinTries()
              }} title="getMaxPinTries"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.getRemainingPinTries()} title="getRemainingPinTries"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.getRootKeyStatus()} title="getRootKeyStatus"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.getAvailableMemory()} title="getAvailableMemory"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.getAppsList()} title="getAppsList"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.resetWallet()} title="resetWallet"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.getSeVersion()} title="getSeVersion"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.getCsn()} title="getCsn"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.getDeviceLabel()} title="getDeviceLabel"/>
            </View>
            <Separator/>

            <View style={styles.container}>
              <DialogInput isDialogVisible={this.state.isSetDeviceLabelDialogVisible}
                           title={"Set Device label"}
                           subTitleStyle={{color: 'red'}}
                           message={"Enter Label"}
                           hintInput={" Device label..."}
                           initValueTextInput={'005815A3942073A6ADC70C035780FDD09DF09AFEEA4173B92FE559C34DCA0550'}
                           submitInput={(deviceLabel) => {
                             nfcWrapper.setDeviceLabel(deviceLabel)
                             this.showSetDeviceLabelDialog(false)
                           }}
                           closeDialog={() => this.showSetDeviceLabelDialog(false)}>
              </DialogInput>
            </View>
            <View>
              <Button onPress={() => this.showSetDeviceLabelDialog(true)} title="setDeviceLabel"/>
            </View>
            <Separator/>

            <Separator/>

            <Separator/>
            <Text style={{padding: 10, fontSize: 20}}>
              Test for Multisig:
            </Text>
            <Separator/>              
            <View>
              <Button onPress={() => {
                testMultisigWithTwoCards().then((response) => alert("Done!"))
              }} title="testMultisigWithTwoCards"/>
            </View>
            <Separator/>

            <Separator/>
            <Text style={{padding: 10, fontSize: 20}}>
              Test APDU commands for Recovery data:
            </Text>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.resetRecoveryData()} title="resetRecoveryData"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.isRecoveryDataSet()} title="isRecoveryDataSet"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.getRecoveryDataLen()} title="getRecoveryDataLen"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.getRecoveryDataHash()} title="getRecoveryDataHash"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => nfcWrapper.getRecoveryData()} title="getRecoveryData"/>
            </View>
            <Separator/>


            <View>
              <Dialog.Container visible={this.state.isEmailDialogVisible}>
                <Dialog.Title>Enter email</Dialog.Title>
                <Dialog.Input label="Enter email" style={{height: 40}} defaultValue={this.state.email}
                              onChangeText={(email) => this.setState({email})}></Dialog.Input>
                <Dialog.Button label="Close" onPress={() => this.showEmailDialog(false)}/>
                <Dialog.Button label="Submit" onPress={() => {
                    recoveryRegistration(this.state.email).then((response) => alert("done"))
                    this.showEmailDialog(false)
                  }
                }/>
              </Dialog.Container>
            </View>
            <View>
              <Button onPress={() => this.showEmailDialog(true)} title="testRecoveryRegistration"/>
            </View>
            <Separator/>



            <View>
              <Dialog.Container visible={this.state.isEmailDialogVisible2}>
                <Dialog.Title>Enter email</Dialog.Title>
                <Dialog.Input label="Enter email" style={{height: 40}} defaultValue={this.state.email}
                              onChangeText={(email) => this.setState({email})}></Dialog.Input>
                <Dialog.Button label="Close" onPress={() => this.showEmailDialog2(false)}/>
                <Dialog.Button label="Submit" onPress={() => {
                    recovery(this.state.email).then((response) => alert("done"))
                    this.showEmailDialog2(false)
                  }
                }/>
              </Dialog.Container>
            </View>
            <View>
              <Button onPress={() => this.showEmailDialog2(true)} title="testRecovery"/>
            </View>
              <Separator/>

            <View style={styles.container}>
              <DialogInput isDialogVisible={this.state.isAddRecoveryDataDialogVisible}
                           title={"Recovery data"}
                           subTitleStyle={{color: 'red'}}
                           message={"Enter recovery data"}
                           hintInput={"Recover data..."}
                           initValueTextInput={'00110022334455'}
                           submitInput={(recoveryData) => {
                             nfcWrapper.addRecoveryData(recoveryData)
                             this.showAddRecoveryDataDialog(false)
                           }}
                           closeDialog={() => this.showAddRecoveryDataDialog(false)}>
              </DialogInput>
            </View>
            <View>
              <Button onPress={() => this.showAddRecoveryDataDialog(true)} title="addRecoveryData"/>
            </View>
            <Separator/>

            <Separator/>

            <Text style={{padding: 10, fontSize: 20}}>
              Test card activation:
            </Text>
            <Separator/>

            <View>
              <Dialog.Container visible={this.state.isTurnOnWalletDialogVisible}>
                <Dialog.Title>Turn on wallet</Dialog.Title>
                <Dialog.Input label="New pin" style={{height: 40}} defaultValue={this.state.newPin}
                              onChangeText={(newPin) => this.setState({newPin})}></Dialog.Input>
                <Dialog.Input label="Serial number" style={{height: 40}}
                              defaultValue={this.state.serialNumber}
                              onChangeText={(serialNumber) => this.setState({serialNumber})}></Dialog.Input>
                <Dialog.Button label="Close!" onPress={() => this.showTurnOnWalletDialog(false)}/>
                <Dialog.Button label="Submit" onPress={() => {
                  const data = findActivationDataPiece(this.state.serialNumber)
                  if (data === undefined ) {
                    alert("Serial number is not found.")
                  }
                  else {
                    console.log("data.P1 = " + data.P1)
                    console.log("data.CS = " + data.CS)
                    console.log("data.IV = " + data.IV)
                    var authenticationPassword = data.P1
                    var commonSecret = data.CS
                    var initialVector = data.IV
                    nfcWrapper.turnOnWallet(this.state.newPin, authenticationPassword, commonSecret, initialVector)
                  }
                  this.showTurnOnWalletDialog(false)
                }
                }/>
              </Dialog.Container>
            </View>
            <View>
              <Button onPress={() => this.showTurnOnWalletDialog(true)} title="turnOnWallet"/>
            </View>
            <Separator/>

            <View>
              <Button onPress={() => {
                nfcWrapper.getHashOfEncryptedPassword()
              }} title="getHashOfEncryptedPassword"/>
            </View>
            <Separator/>

            <View>
              <Button onPress={() => {
                nfcWrapper.getHashOfEncryptedCommonSecret()
              }} title="getHashOfEncryptedCommonSecret"/>
            </View>
            <Separator/>

            <View>
              <Button onPress={() => {
                nfcWrapper.getHashes()
              }} title="getHashes"/>
            </View>
            <Separator/>

            <Separator/>
            <Separator/>


            <Text style={{padding: 10, fontSize: 20}}>
              Test APDU commands of TonWallet applet (related to Ed25519):
            </Text>
            <Separator/>


            <View>
              <Button onPress={() => {
                nfcWrapper.getTonAppletState()
              }} title="getTonAppletState"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => {
                nfcWrapper.getSerialNumber()
              }} title="getSerialNumber"/>
            </View>
            <Separator/>
            <View>
              <Button onPress={() => {
                nfcWrapper.getPublicKeyForDefaultPath()
              }} title="Get public key for default HD path"/>
            </View>
            <Separator/>
            {/*<View>*/}
            {/*   <Button onPress={() => {nfcWrapper.verifyDefaultPin()}} title="Verify default PIN" />*/}
            {/* </View>*/}
            {/* <Separator />*/}

           <View style={styles.container}>
              <DialogInput isDialogVisible={this.state.isGetPkDialogVisible}
                           title={"Get public key"}
                           message={"Enter hdIndex (0 < number < 2147483647)"}
                           hintInput={"hdIndex..."}
                           submitInput={(hdIndex) => {
                             nfcWrapper.getPublicKey(hdIndex);
                             this.showGetPkDialog(false);
                           }}
                           closeDialog={() => this.showGetPkDialog(false)}>
              </DialogInput>
            </View>
            <View>
              <Button onPress={() => this.showGetPkDialog(true)} title="Get public key"/>
            </View>
            <Separator/>


            <View style={styles.container}>
              <Dialog.Container visible={this.state.isSignForDefHdPathDialogVisible}>
                <Dialog.Title>Sign data for default HD path m/44'/396'/0'/0'/0'</Dialog.Title>
                <Dialog.Input label="Data to sign" style={{height: 70}} multiline={true} numberOfLines={4}
                              defaultValue={this.state.data}
                              onChangeText={(data) => this.setState({data})}></Dialog.Input>
                <Dialog.Input label="Pin" style={{height: 40}} defaultValue={this.state.currentPin}
                              onChangeText={(currentPin) => this.setState({currentPin})}></Dialog.Input>
                <Dialog.Button label="Close" onPress={() => {
                  this.showSignForDefaultHdPathDialog(false)
                }}/>
                <Dialog.Button label="Submit" onPress={() => {
                  nfcWrapper.verifyPinAndSignForDefaultHdPath(this.state.data, this.state.currentPin);
                  this.showSignDialog(false);
                }}/>
              </Dialog.Container>
            </View>
            <View>
              <Button onPress={() => this.showSignForDefaultHdPathDialog(true)} title="signForDefaultHdPath"/>
            </View>
            <Separator/>

            <View>
              <Dialog.Container visible={this.state.isSignDialogVisible}>
                <Dialog.Title>Sign data</Dialog.Title>
                <Dialog.Input label="Data to sign" style={{height: 70}} multiline={true} numberOfLines={4}
                              defaultValue={this.state.data}
                              onChangeText={(data) => this.setState({data})}></Dialog.Input>
                <Dialog.Input label="Hd index" style={{height: 40}} defaultValue={this.state.hdIndex}
                              onChangeText={(hdIndex) => this.setState({hdIndex})}></Dialog.Input>
                <Dialog.Input label="Pin" style={{height: 40}} defaultValue={this.state.currentPin}
                              onChangeText={(currentPin) => this.setState({currentPin})}></Dialog.Input>
                <Dialog.Button label="Close" onPress={() => {
                  this.showSignDialog(false)
                }}/>
                <Dialog.Button label="Submit" onPress={() => {
                  nfcWrapper.verifyPinAndSign(this.state.data, this.state.hdIndex, this.state.currentPin);
                  this.showSignDialog(false);
                }}/>
              </Dialog.Container>
            </View>
            <View>
              <Button onPress={() => this.showSignDialog(true)} title="sign"/>
            </View>
            <Separator/>
            <Separator/>


          </ScrollView>

          <Text style={{padding: 10, fontSize: 20}}>
            Test TonWallet applet keychain:
          </Text>
          <Text style={{padding: 10, fontSize: 15}}>
            Keychain data:
          </Text>
          <Separator/>
          <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              style={styles.scrollView}>
            <FlatList
                data={this.state.keyData}
                extraData={this.state}
                renderItem={({item, index}) =>
                    <View>
                      <Text> {index}. Key hmac = {item.hmac} </Text>
                      <Text> Key length = {item.length} </Text>
                      <Separator/>
                    </View>
                }
                ItemSeparatorComponent={this.renderSeparator}
            />
          </ScrollView>

          <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              style={styles.scrollView}>

            <View>
              <Button onPress={() => {
                nfcCardNativeWrapper.getKeyChainDataAboutAllKeys().then((result) => {
                  this.setState({keyData: JSON.parse(result).keysData})
                })
                    .catch((error) => {
                      Alert.alert(
                          'Response from card',
                          JSON.stringify(error.message),
                          [
                            {text: 'OK', onPress: () => console.log('OK Pressed')},
                          ],
                          {cancelable: false}
                      );
                    })
              }} title="Read data about keys in KeyChain"/>
            </View>
            <Separator/>

            <View>
              <Button onPress={() => {
                nfcWrapper.resetKeyChain();
                this.setState({
                  keyData: []
                });
              }} title="Reset KeyChain"/>
            </View>
            <Separator/>

            <View>
              <Button onPress={() => nfcWrapper.getKeyChainInfo()} title="Get KeyChain info"/>
            </View>
            <Separator/>

            <View>
              <Button onPress={() => {
                nfcWrapper.getNumberOfKeys();
              }} title="getNumberOfKeys"/>
            </View>
            <Separator/>

            <View>
              <Button onPress={() => {
                nfcWrapper.getOccupiedStorageSize();
              }} title="getOccupiedStorageSize"/>
            </View>
            <Separator/>

            <View>
              <Button onPress={() => {
                nfcWrapper.getFreeStorageSize();
              }} title="getFreeStorageSize"/>
            </View>
            <Separator/>

            <View>
              <Button onPress={() => {nfcWrapper.getHmac("0")}
            } title="getHmac"/>
            </View>
            <Separator/>

            <View>
              <Dialog.Container visible={this.state.isAddKeyIntoKeyChainDialogVisible}>
                <Dialog.Title>Add key into KeyChain</Dialog.Title>
                <Dialog.Input label="Enter new key:" defaultValue={this.state.newKey} style={{height: 100}}
                              multiline={true} numberOfLines={4}
                              onChangeText={(newKey) => this.setState({newKey})}></Dialog.Input>
                <Dialog.Button label="Close" onPress={() => this.showAddKeyIntoKeyChainDialog(false)}/>
                <Dialog.Button label="Submit" onPress={() => {
                  nfcCardNativeWrapper.addKeyIntoKeyChain(this.state.newKey)
                      .then((res) => {
                        Alert.alert(
                            'Response from card',
                            "Add key status: hmac of new key = " + res,
                            [
                              {text: 'OK', onPress: () => console.log('OK Pressed')},
                            ],
                            {cancelable: false}
                        )                       
                        this.state.keyData.push({
                          hmac: JSON.parse(res).message,
                          length: this.state.newKey.length / 2
                        })
                        this.setState({
                          keyData: this.state.keyData
                        })
                      })
                      .catch((error) => {
                        Alert.alert(
                            'Error',
                            JSON.stringify(error.message),
                            [
                              {text: 'OK', onPress: () => console.log('OK Pressed')},
                            ],
                            {cancelable: false}
                        )
                      })
                  this.showAddKeyIntoKeyChainDialog(false)
                }}/>
              </Dialog.Container>
            </View>
            <View>
              <Button onPress={() => this.showAddKeyIntoKeyChainDialog(true)} title="Add key"/>
            </View>
            <Separator/>

            <View style={styles.container}>
              <DialogInput isDialogVisible={this.state.isGetKeyFromKeyChainDialogVisible}
                           title={"Get key"}
                           message={"Enter key index"}
                           hintInput={"Key index..."}
                           submitInput={(keyIndex) => {
                             if (keyIndex < this.state.keyData.length) {
                               nfcWrapper.getKeyFromKeyChain(this.state.keyData[keyIndex].hmac)
                               this.showGetKeyFromKeyChainDialog(false)
                             } else {
                               Alert.alert(
                                   'Error',
                                   "Get key status: key index is too big",
                                   [
                                     {text: 'OK', onPress: () => console.log('OK Pressed')},
                                   ],
                                   {cancelable: false}
                               );
                               // this.showGetKeyFromKeyChainDialog(false);
                             }

                           }}
                           closeDialog={() => this.showGetKeyFromKeyChainDialog(false)}>
              </DialogInput>
            </View>
            <View>
              <Button onPress={() => this.showGetKeyFromKeyChainDialog(true)} title="Get key"/>
            </View>
            <Separator/>

            <View>
              <Dialog.Container visible={this.state.isChangeKeyFromKeyChainDialogVisible}>
                <Dialog.Title>Change key</Dialog.Title>
                <Dialog.Input label="Old key index" style={{height: 40}}
                              defaultValue={this.state.oldKeyIndex}
                              onChangeText={(oldKeyIndex) => this.setState({oldKeyIndex})}></Dialog.Input>
                <Dialog.Input label="New key" style={{height: 100}}
                              defaultValue={this.state.newKeyForChangeKey}
                              onChangeText={(newKeyForChangeKey) => this.setState({newKeyForChangeKey})}></Dialog.Input>
                <Dialog.Button label="Close" onPress={() => this.showChangeKeyFromKeyChainDialog(false)}/>
                <Dialog.Button label="Submit" onPress={() => {
                  nfcCardNativeWrapper.changeKeyInKeyChain(this.state.newKeyForChangeKey, this.state.keyData[this.state.oldKeyIndex].hmac)
                      .then((res) => {
                        Alert.alert(
                            'Response from card',
                            "Change key status: hmac of new key = " + res,
                            [
                              {text: 'OK', onPress: () => console.log('OK Pressed')},
                            ],
                            {cancelable: false}
                        );
                        this.state.keyData[this.state.oldKeyIndex] = {
                          hmac: JSON.parse(res).message,
                          length: this.state.keyData[this.state.oldKeyIndex].length
                        }
                        this.setState({
                          keyData: this.state.keyData
                        })
                      })
                      .catch((error) => {
                        Alert.alert(
                            'Error',
                            JSON.stringify(error.message),
                            [
                              {text: 'OK', onPress: () => console.log('OK Pressed')},
                            ],
                            {cancelable: false}
                        )
                      })
                  this.showChangeKeyFromKeyChainDialog(false)
                }}/>
              </Dialog.Container>
            </View>
            <View>
              <Button onPress={() => this.showChangeKeyFromKeyChainDialog(true)} title="Change key"/>
            </View>
            <Separator/>

            <View style={styles.container}>
              <DialogInput isDialogVisible={this.state.isDeleteKeyFromKeyChainDialogVisible}
                           title={"Delete key"}
                           message={"Enter key index"}
                           hintInput={"Key index..."}
                           submitInput={(keyIndexToDelete) => {
                            nfcCardNativeWrapper.deleteKeyFromKeyChain(this.state.keyData[keyIndexToDelete].hmac)
                                 .then((result) => {
                                   Alert.alert(
                                       'Response from card',
                                       "Delete key status (number of remained keys) : " + result,
                                       [
                                         { text: 'OK', onPress: () => console.log('OK Pressed') },
                                       ],
                                       { cancelable: false }
                                   )
                                   this.state.keyData.splice(keyIndexToDelete, 1)
                                   this.setState({ keyData: this.state.keyData })
                                 })
                                 .catch((error) => {
                                   Alert.alert(
                                       'Error',
                                       error,
                                       [
                                         { text: 'OK', onPress: () => console.log('OK Pressed') },
                                       ],
                                       { cancelable: false }
                                   )
                                 })
                             this.showDeleteKeyFromKeyChainDialog(false)
                           }}
                           closeDialog={() => this.showDeleteKeyFromKeyChainDialog(false)}>
              </DialogInput>
            </View>
            <View>
              <Button onPress={() => this.showDeleteKeyFromKeyChainDialog(true)} title="Delete key" />
            </View>
            <Separator />

          </ScrollView>

        </SafeAreaView>

    );
  }
}


const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  container: {
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    textAlign: 'center',
    marginVertical: 8,
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  separator: {
    marginVertical: 8,
    borderBottomColor: '#737373',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
