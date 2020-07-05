# Work with multisig example

In this example you will learn to use [ton-client-node-js](https://docs.ton.dev/86757ecb2/p/61b5eb-nodejs)
SDK with [multisig contract](https://docs.ton.dev/86757ecb2/p/94921e-multisignature-wallet-management-in-tonos-cli).

In order to do it, you need sequentially:

1. Make preparations.
2. Deploy contract.
3. Use deployed contract.

Below we describe each of the steps in more detail.

## Make preparations

You can find source code in `preparation.js`. In order to run it, use:

```sh
node preparation.js
```

In this step:

1. Generate a seed phrase based on a dictionary and number of words specified.
2. Use seed phrase to generate public and private key pair.
3. Write these in files.
4. Check the future contract address.


## Deploy contract

You can find source code in `deploy.js`. In order to run it, use:
                                         
```sh
node deploy.js
```

In this step we use key pair to deploy the contract. Before running this step you need to ensure you have
at least 0.5 tokens on your wallet address.

## Use deployed contract

You can find source code in `work-with-multisig.js`. In order to run it, use:
                                                     
```sh
node work-with-multisig.js
```

In this step we:

1. Get the custodians list.
2. Send a transaction to transfer 0.1 token to pre-defined address.
3. Output sent transaction information.
4. Output total number of transactions account performed and a list of these transactions' information.
