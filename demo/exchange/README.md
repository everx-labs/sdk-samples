# Integrate Free TON into exchange backend

In this example we demonstrate how to integrate Free TON into an exchange backend.

It covers such use-cases as: 
- wallet deploy 
- wallet deposit
- wallet withdraw
- sequential blockchain transactions reading
- sequential wallet transactions reading

**Attention!**
Note that the most recent API data can be present in an inconsistent
state. Usually this data relates to the last minute. The older
API data is always in consistent state.
 
Therefore, not to miss any data while reading you can specify the `endTime` option in correspondint methods.
Two minutes before now is enough to not miss anything.

We are currently working on a new feature to allow reliable recent data reading,
as soon as it is ready, there will be an announcement and this sample will be updated.
This is a high priority feature for us right now. 

## How to run the sample?

To run this sample you need to have a multisig wallet with positive balance,
already deployed to the [Developer Network](https://docs.ton.dev/86757ecb2/p/85c869-networks). Specify its private key and address at the launch.
It will be used to pay for deploy operation. 

If you already have Surf with tokens installed, you can use it. 
To get the private key of Surf wallet, run this:

```
npm tondev install -g
tondev signer add surfWallet "your seed phrase"
tondev signer info surfwallet
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

**To migrate from Developer Network to Free TON you need to update the endpoints specified in TonClient configuration
to Free TON endpoints.**

See the list of supported networks and endpoints here https://docs.ton.dev/86757ecb2/p/85c869-networks

## Install packages & run:

```sh
npm i
node index giverAddress giverPrivateKey
```
**Note: giver must be the multisig wallet.**
