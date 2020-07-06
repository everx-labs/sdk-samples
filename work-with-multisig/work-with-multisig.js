const { TONClient } = require('ton-client-node-js');
const fs = require('fs');
const path = require('path');
const keyPairFile = path.join(__dirname, 'keyPair.json');

// Address to send tokens to
const destinationAddress = '0:2bb4a0e8391e7ea8877f4825064924bd41ce110fce97e939d3323999e1efbb13';

const multisigContractPackage = {
    abi: require('../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json'),
    imageBase64: fs.readFileSync('../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc').toString('base64'),
};

const ACCOUNT_TYPE_UNINITIALIZED = 0;


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

        const address = (await tonClient.contracts.createDeployMessage({
            package: multisigContractPackage,
            constructorParams: {
                owners: [`0x${keyPair.public}`],//Multisig owner public key
                reqConfirms: 0,  //Multisig required confirms
            },
            keyPair: keyPair,
        })).address;

        const accountData = await tonClient.queries.accounts.query({
                id: { eq: address }
            },
            'acc_type balance code');

        if (accountData.length === 0) {
            console.log(`You need to transfer at least 0.5 tokens and use deploy.js to deploy the contract.`);
            process.exit(1);
        }

        // See https://docs.ton.dev/86757ecb2/p/598b5c-runlocal-method
        const response = await tonClient.contracts.runLocal({
            address: address,
            abi: multisigContractPackage.abi,
            functionName: 'getCustodians',
            input: {},
            keyPair: keyPair
        });

        console.log('Сustodians list:', response.output.custodians);


        // See https://docs.ton.dev/86757ecb2/p/35a3f3-field-descriptions
        const transaction = {
            dest: destinationAddress,
            value: 100_000_000,
            bounce: false,
            allBalance: false,
            payload: ''
        };

        const sentTransactionInfo = await tonClient.contracts.run({
            address: address,
            abi: multisigContractPackage.abi,
            functionName: 'submitTransaction',
            input: transaction,
            keyPair: keyPair
        });

        // See https://docs.ton.dev/86757ecb2/p/35a3f3-field-descriptions
        console.log("Transaction info:")

        console.log("Id:")
        console.log(sentTransactionInfo.transaction.id);

        console.log("Block id:")
        console.log(sentTransactionInfo.transaction.block_id);

        console.log("Account address:")
        console.log(destinationAddress);

        console.log("Logical time:")
        console.log(sentTransactionInfo.transaction.lt);

        console.log("Transaction inbound message ID:")
        console.log(sentTransactionInfo.transaction.in_msg);

        console.log("Transaction outbound message IDs:")
        console.log(sentTransactionInfo.transaction.out_msgs);

        //Print the list of all transactions of this account
        const transactionsCount = (await tonClient.queries.transactions.aggregate({
            filter: {
                account_addr: { eq: address }
            },
            fields: [{
                field: 'id',
                fn: 'COUNT',
            }],
        }))[0];
        console.log(`All ${transactionsCount} account transactions id:`);


        let logicalTime = "0x0";

        for (let i = 0; i < (transactionsCount / 10); i++) {
            let result = await tonClient.queries.transactions.query({
                filter: {
                    account_addr: { eq: address },
                    lt: { gt: logicalTime }
                },
                orderBy: [{
                    path: 'now',
                    direction: 'ASC',
                }, {
                    path: 'lt',
                    direction: 'ASC',
                }
                ],
                limit: 10,
                result: 'id now lt',
            });

            for (let y = 0; y < result.length; y++) {
                console.log("id " + result[y].id + " transaction time(now) " + result[y].now);
                logicalTime = result[y].lt;
            }
        }
        // Convert address to different types
        console.log("Multisig address in HEX:")
        let convertedAddress = (await tonClient.contracts.convertAddress({
            address: address,
            convertTo: 'Hex',
        })).address;
        console.log(convertedAddress);

        console.log("Multisig non-bounce address in Base64:")
        convertedAddress = (await tonClient.contracts.convertAddress({
            address: address,
            convertTo: 'Base64',
            base64Params: {
                test: false,
                bounce: false,
                url: false,
            },
        })).address;
        console.log(convertedAddress);

        console.log("Multisig bounce address in Base64:")
        convertedAddress = (await tonClient.contracts.convertAddress({
            address: address,
            convertTo: 'Base64',
            base64Params: {
                test: false,
                bounce: true,
                url: false,
            },
        })).address;
        console.log(convertedAddress);


        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
