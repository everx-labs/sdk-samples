# Integrate Everscale into exchange backend

In this example we demonstrate how to integrate EVER OS into an exchange backend.

It covers such use-cases as: 
- wallet deploy 
- wallet deposit
- wallet withdraw
- cursor-based pagination read all transactions related to this wallet
- cursor-based pagination read all blockchain transactions

## How to run the sample?

To run this sample you need to have a multisig wallet with positive balance,
already deployed to the [Developer Network](https://docs.everos.dev/ever-sdk/reference/ever-os-api/networks). Specify its private key and address at the launch.
It will be used to pay for deploy operation. 

If you already have Surf with tokens installed, you can use it. 
To get the private key of Surf wallet, run this:

```
npm install -g everdev
everdev signer add surfWallet "your seed phrase"
everdev signer info surfwallet
```

You will see your key pair. Copy the private key. 
```
{
    "name": "surfWallet",
    "description": "",
    "keys": {
        "public": "18420ae44c632c8cec01701726102ad1605ae0179d185b12fe42a43cc7e56e97",
        "secret": "50c88c6da18a9b1d4b0651f11495452da8c09d5b8468fbf5b4a3f97c9f1d43b8"
    }
}
```

Read about multisig wallet here https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig
See example on how to deploy it here https://github.com/tonlabs/sdk-samples/tree/master/core-examples/node-js/multisig

**To migrate from Developer Network to Everscale you need to update the endpoints specified in TonClient configuration
to Everscale endpoints.**

See the list of supported networks and endpoints here https://docs.everos.dev/ever-sdk/reference/ever-os-api/networks

## Install packages & run:

```sh
npm i
node index giverAddress giverPrivateKey
```
**Note: giver must be the multisig wallet.**
