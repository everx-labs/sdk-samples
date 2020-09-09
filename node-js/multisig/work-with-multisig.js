const { TONClient } = require('ton-client-node-js');
const fs = require('fs');
const path = require('path');
const keyPairFile = path.join(__dirname, 'keyPair.json');

// Address to send tokens to
const recipient = '0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415';

const multisigContractPackage = {
    abi: require('../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.abi.json'),
    imageBase64: fs.readFileSync('../../ton-labs-contracts/solidity/safemultisig/SafeMultisigWallet.tvc').toString('base64'),
};

const ACCOUNT_TYPE_UNINITIALIZED = 0;


(async () => {
    try {
        // You can also connect to local blockchain TON OS SE https://docs.ton.dev/86757ecb2/p/069155-ton-os-se/b/09fbbd
        // Read more about message expiration and retries here https://docs.ton.dev/86757ecb2/p/88321a-reliable-message-delivery
        const tonClient = await TONClient.create({
            servers: ['http://localhost'],
            messageExpirationTimeout: 60000,
            retriesCount: 3,
        });

        if (!fs.existsSync(keyPairFile)) {
            console.log('Please use preparation.js to generate key pair and seed phrase');
            process.exit(1);
        }

        const keyPair = JSON.parse(fs.readFileSync(keyPairFile, 'utf8'));

        // Here we create deployMessage simply to get account address and check its balance
        const address1 = (await tonClient.contracts.createDeployMessage({
            package: multisigContractPackage,
            constructorParams: {
                owners: [`0x${keyPair.public}`],//Multisig owner public key
                reqConfirms: 0,  //Multisig required confirms
            },
            keyPair: keyPair,
        })).address;

        const multisigAddress = (await tonClient.contracts.getDeployData({
            abi: multisigContractPackage.abi,
            imageBase64: multisigContractPackage.imageBase64,
            constructorParams: {
                owners: [`0x${keyPair.public}`], //Multisig owner public key
                reqConfirms: 0, //Multisig required confirms
            },
            publicKeyHex: keyPair.public,
            workchainId: 0,
        })).address;

        // Check account balance
        const accountData = await tonClient.queries.accounts.query({
                id: { eq: multisigAddress }
            },
            'acc_type balance code');

        if (accountData.length === 0) {
            console.log(`You need to transfer at least 0.5 tokens to and use deploy.js to deploy the contract.`);
            process.exit(1);
        }

        // Print the custodians of the wallet
        // See https://docs.ton.dev/86757ecb2/p/598b5c-runlocal-method
        const response = await tonClient.contracts.runLocal({
            address: multisigAddress,
            abi: multisigContractPackage.abi,
            functionName: 'getCustodians',
            input: {},
            keyPair: keyPair
        });

        console.log('Сustodians list:', response.output.custodians);

        // Prepare input parameter for 'submitTransaction' method of multisig wallet
        const transaction = {
            dest: recipient,
            value: 100_000_000,
            bounce: false, 
            allBalance: false,
            payload: ''
        };

       // Run 'submitTransaction' method of multisig wallet       
       // Pattern 1. 
       // 3-steps-pattern: createRunMessage → sendMessage → waitForRunTransaction

       // Create run message 
       const runMessage = await tonClient.contracts.createRunMessage({
            address: multisigAddress,
            abi: multisigContractPackage.abi,
            functionName: 'submitTransaction',
            input: transaction,
            keyPair: keyPair
       })

       // Now we send the run message and get the message processing state to proceed.
       const messageProcessingState = await tonClient.contracts.sendMessage(runMessage.message);

       // Wait for the result transaction. 
       // In case of network  problems waitForRunTransaction will return an error with updated messageProcessingState, 
       // which you can use again to resolve waiting later
       const sentTransactionInfo = await tonClient.contracts.waitForRunTransaction(runMessage, messageProcessingState);
       console.log(`Tokens were sent. Transaction id is ${sentTransactionInfo.transaction.id}`); 
       console.log(`Run fees are  ${JSON.stringify(sentTransactionInfo.fees, null, 2)}`);


       // Pattern 2. 
       // This is an easy to implement pattern to deploy, but we do not recommend to use it because of 
       // network inconsistency and application crash probability. For more reliable approach - use the Pattern 1
       /*
        const sentTransactionInfo = await tonClient.contracts.run({
            address: multisigAddress,
            abi: multisigContractPackage.abi,
            functionName: 'submitTransaction',
            input: transaction,
            keyPair: keyPair
        });
        */
        // See https://docs.ton.dev/86757ecb2/p/35a3f3-field-descriptions
        console.log("Transaction info:")

        console.log("Id:")
        console.log(sentTransactionInfo.transaction.id);

        console.log("Block id:")
        console.log(sentTransactionInfo.transaction.block_id);

        console.log("Account address:")
        console.log(multisigAddress);

        console.log("Logical time:")
        console.log(sentTransactionInfo.transaction.lt);

        console.log("Transaction inbound message ID:")
        console.log(sentTransactionInfo.transaction.in_msg);

        console.log("Transaction outbound message IDs:")
        console.log(sentTransactionInfo.transaction.out_msgs);

        //Print the list of all transactions of this account
        //Read more about aggregation methods here: https://docs.ton.dev/86757ecb2/p/772196-collection-query-methods/t/24ab01
        const transactionsCount = (await tonClient.queries.transactions.aggregate({
            filter: {
                account_addr: { eq: multisigAddress }
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
                    account_addr: { eq: multisigAddress },
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
            address: multisigAddress,
            convertTo: 'Hex',
        })).address;
        console.log(convertedAddress);

        console.log("Multisig non-bounce address in Base64:")
        convertedAddress = (await tonClient.contracts.convertAddress({
            address: multisigAddress,
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
            address: multisigAddress,
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
