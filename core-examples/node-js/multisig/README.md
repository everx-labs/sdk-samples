# How to deploy your wallet and make a transfer

## Prerequisite

* Node.js >= [14.x installed](https://nodejs.org)
* Optional [Docker](https://docs.docker.com/desktop/#download-and-install) - if you want to use local blockchain TON OS SE

## Scenario

In this example we use [ton-client-js](https://github.com/tonlabs/ton-client-js) to deploy a [multisig contract](https://github.com/tonlabs/ton-labs-contracts/blob/master/solidity/safemultisig/) into the [Developer Network](https://net.ton.live/) and work with it. 

You can update the scripts to [work with other networks](https://docs.ton.dev/86757ecb2/p/85c869-networks), for example, with Free TON.

We will perform these steps:

1. Make preparations for deploy.
2. Deploy contract.
3. Transfer tokens.

Below we describe each of the steps in more detail.

## Make preparations

You can find the source code in `preparation.js`. In order to run it, use:

```sh
node preparation.js
```

In this step:

1. Generate a seed phrase based on a dictionary and number of words specified.
2. Use seed phrase to generate public and private key pair.
3. Write these in files.
4. Check the future contract address.

After the step 4 you will need to sponsor this address with tokens in your network before proceeding with `Deploy` instruction. If you work in Developer Network, you may ask for test tokens (so-called Rubies) in mobile TON Surf version.

## Deploy contract

You can find the source code in `deploy.js`. In order to run it, use:
                                         
```sh
node deploy.js
```

In this step we use the key pair to deploy the contract. Before performing this step you need to ensure you have
at least 0.5 tokens on your future wallet address.

## Transfer tokens

You can find the source code in `work-with-multisig.js`. In order to run it, use:
                                                     
```sh
node work-with-multisig.js
```

In this step we:

1. Get the custodians list.
2. Send a transaction to transfer 0.1 token to pre-defined address.
3. Output sent transaction information.

## Read and print the wallet's withdraws

You can find the source code in `print-messages.js`. In order to run it, use:
                                                     
```sh
node print-messages.js
```

In this step we read the wallet's withdraws (filter the account's internal outbound messages and paginate through them) and print them to the conlose.
