const { TONClient } = require('ton-client-node-js');
const fs = require('fs');
const path = require('path');
const keyPairFile = path.join(__dirname, 'keyPair.json');

const multisigContractPackage = {
    abi: require('../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json'),
    imageBase64: fs.readFileSync('../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc').toString('base64'),
};

// Account is active when contract is deployed.
const ACCOUNT_TYPE_ACTIVE = 1;

// Account is uninitialized when contract is not deployed yet.
const ACCOUNT_TYPE_UNINITIALIZED = 0;

// Number of tokens required to deploy the contract.
// See https://docs.ton.dev/86757ecb2/p/6207cd-estimate-fees on how to calculate definite number.
const CONTRACT_REQUIRED_DEPLOY_TOKENS = 500_000_000;


(async () => {
    try {
        // See https://docs.ton.dev/86757ecb2/p/069155-ton-os-se/b/09fbbd
        const tonClient = await TONClient.create({
            servers: ['net.ton.dev'],
            //See https://docs.ton.dev/86757ecb2/p/88321a-reliable-message-delivery
            messageExpirationTimeout: 60000, //timeout value in ms after the message becomes expired
            retriesCount: 3,  //the number of retries attempts            
        });

        if (!fs.existsSync(keyPairFile)) {
            console.log('Please use preparation.js to generate key pair and seed phrase');
            process.exit(1);
        }

        const keyPair = JSON.parse(fs.readFileSync(keyPairFile, 'utf8'));

        // We create a deploy message to calculate the future address of the contract 
        // and to send it with 'sendMessage' later - if we use Pattern 1 for deploy (see below)
        const deployMessage = (await tonClient.contracts.createDeployMessage({
            package: multisigContractPackage,
            constructorParams: {
                owners: [`0x${keyPair.public}`],//Multisig owner public key
                reqConfirms: 0,  //Multisig required confirms
            },
            keyPair: keyPair,
        }));

        const futureAddress = deployMessage.address;

        // Query account type, balance and code to analyse if it is possible to deploy the contract
        const accountData = await tonClient.queries.accounts.query({
                // See https://docs.ton.dev/86757ecb2/p/772196-collection-query-methods for syntax
                id: { eq: futureAddress }
            },
            'acc_type balance code');

        if (accountData.length === 0) {
            console.log(`You need to transfer at least 0.5 tokens for deploy to ${futureAddress}.`);
            process.exit(1);
        }

        if (accountData[0].acc_type == ACCOUNT_TYPE_ACTIVE) {
            console.log('Contract is already deployed');
            process.exit(1);
        }

        // Balance is stored as HEX so we need to convert it.
        if (accountData[0].acc_type == ACCOUNT_TYPE_UNINITIALIZED && BigInt(accountData[0].balance) <= BigInt(CONTRACT_REQUIRED_DEPLOY_TOKENS)) {
            console.log('Balance is too low for deploy');
            process.exit(1);
        }

       // Deploy multisig contract with 1 custodian having keyPair.public key and requiring 0 confirmations.
       // Pattern 1. 
       // 3-steps-pattern: createDeployMessage → sendMessage → waitForDeployTransaction 

       // We already created the deploy message earlier. Now we send the deploy message and get the message processing state to proceed.
       const messageProcessingState = await tonClient.contracts.sendMessage(deployMessage.message);

       // In case of network  problems waitForDeployTransaction will return an error with updated messageProcessingState 
       // which you can use again to resolve waiting later
       const result = await tonClient.contracts.waitForDeployTransaction(deployMessage, messageProcessingState);
       console.log(`Contract is deployed to ${futureAddress}`); 
       console.log(`Transaction id is ${result.transaction.id}`); 
       console.log(`Deploy fees are  ${JSON.stringify(result.fees, null, 2)}`);


       // Pattern 2. 
       // This is an easy to implement pattern to deploy, but we do not recommend to use it because of 
       // network inconsistency and application crash probability. For more reliable approach - use the Pattern 1

      /*  await tonClient.contracts.deploy({
            package: multisigContractPackage,
            constructorParams: {
                owners: [`0x${keyPair.public}`],
                reqConfirms: 0,
            },
            keyPair: keyPair,
        });
        */

        console.log(`Contract is successfully deployed. You can play with your multisig wallet now at ${futureAddress}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
