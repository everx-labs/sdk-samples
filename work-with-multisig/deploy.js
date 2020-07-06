const { TONClient } = require('ton-client-node-js');
const fs = require('fs');
const path = require('path');
const keyPairFile = path.join(__dirname, 'keyPair.json');

const multisigContractPackage = {
    abi: require('../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json'),
    imageBase64: fs.readFileSync('../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc').toString('base64'),
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
        const tonClient = await TONClient.create({
            servers: ['net.ton.dev'],
            messageExpirationTimeout: 30000,
            retriesCount: 3,
        });

        if (!fs.existsSync(keyPairFile)) {
            console.log('Please use preparation.js to generate key pair and seed phrase');
            process.exit(1);
        }

        const keyPair = JSON.parse(fs.readFileSync(keyPairFile, 'utf8'));

        const futureAddress = (await tonClient.contracts.createDeployMessage({
            package: multisigContractPackage,
            constructorParams: {
                owners: [`0x${keyPair.public}`],//Multisig owner public key
                reqConfirms: 0,  //Multisig required confirms
            },
            keyPair: keyPair,
        })).address;

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

        await tonClient.contracts.deploy({
            package: multisigContractPackage,
            constructorParams: {
                owners: [`0x${keyPair.public}`],
                reqConfirms: 0,
            },
            keyPair: keyPair,
        });

        console.log(`Contract is successfully deployed. You can play with your multisig wallet now at ${futureAddress}`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
