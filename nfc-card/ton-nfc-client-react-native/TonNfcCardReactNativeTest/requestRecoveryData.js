const { path } = require('ramda')
const { user, pass } = require('./config')
import {decode as atob, encode as btoa} from 'base-64'

import Toast from 'react-native-simple-toast';


const requestRecoveryData = () => 
fetch('https://jessie.tonlabs.io/card-service/test-data.json'/*'https://dev.services.tonlabs.io/card-service/test-data.json'*/, {
    method:'GET', 
    headers: {'Authorization': 'Basic ' + btoa('ton:integration')}
})
.then(response => { 
   //console.log(response)
    return response.json()
})  
.then(json => {
    //console.log(json)
    console.log("Multisig address = " + json.multisig.address)
    console.log("Surf public key = " + json.multisig.keyPair.public)
    console.log("P1 = " + json.cards[0].P1)
    console.log("CS = " + json.cards[0].CS)
    Toast.show("Multisig address = " + json.multisig.address + "\n" + 
        "Surf public key = " + json.multisig.keyPair.public + "\n" + 
        "P1 = " + json.cards[0].P1 + "\n" + 
        "CS = " + json.cards[0].CS
    )

    return json   
})


module.exports = requestRecoveryData

