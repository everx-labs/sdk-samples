/* eslint-disable consistent-return */
//const assert = require('assert')
const promiseTimeout = require('./promiseTimeout')
const sleep = require('./sleep')
const {
  retries: { run: runRetries },
  timeout: { run: runTimeout },
} = require('./config')

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

//assert.ok(runTimeout)
//assert.ok(runRetries)

module.exports = (tonClient) => async (sigBox, contract, fname, options = {}, parentSpan) =>
  tonClient.trace(
    'run',
    async (span) => {
      span.setTag('function', fname)
      span.setTag('address', contract.address)

      const params = {
        address: contract.address,
        abi: contract.package.abi,
        functionName: fname,
        input: options,
        signingBox: sigBox,
      }

      console.log(`\nRunning contract function: ${fname}`)

     /// console.log(`\nRunning contract function: ${fname} with args: ${JSON.stringify(params, null, 2)}`)

      for (let n = 0; n < runRetries; n++) {
        try {
          console.log("Start tonClient.contracts.run...")
          const result = await promiseTimeout(runTimeout, tonClient.contracts.run(params, span))
          console.log(' ✓')
          Toast.show("run is done  ✓")
          return result
        } catch (err) {
          console.log(err.message)
          alert("Error happened during run: " + err.message)
          if (n < runRetries - 1) {
            console.log(`Run next try #${n + 1}`)
            alert(`Run next try #${n + 1}`)
            await sleep(1000)
          } else {
            throw err
          }
        }
      }
    },
    parentSpan,
  )
