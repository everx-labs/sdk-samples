# TON Labs ASppKit SDK samples

`appkit_examples` folder contains samples that use [AppKit - Free TON Javascript Application Kit](https://github.com/tonlabs/appkit-js) - package that is built over the [@tonclient/core](https://tonlabs.github.io/ton-client-js/) package and purposed to simplify writing applications on Free TON

- **[hello-wallet](./hello-wallet/)** - In this example  we learn how to deploy solidity contract `HelloWallet.sol` to [TON OS SE (local blockchain)](https://github.com/tonlabs/tonos-se), run its on-chain method and run its get-method.
  
- **[multisig](./multisig/)** In this example you will learn how to deploy solidity [multisig contract `SafeMultisigWallet.sol`](https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig#multisignature-wallet) to [Developer Network](https://docs.ton.dev/86757ecb2/p/85c869-networks) and work with it. 
  
- [multisig-submit-tx](./multisig-submit-tx) this is a simple sample of submitting transaction to multisig contract.
  
- [query](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/query) In this example you will learn how to query GraphQL API version, query account balance, wait for appearance of a message in blockchain, perform aggregation query, perform a batched query (multiple queries in one request).

- [listen-and-decode](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/listen-and-decode) In this example we deploy "hello world" contract, subscribe for and decode its messages (including events).

- [subscription](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/subscription) In this example we use multisig wallet contract to send tokens from one wallet to another. You will learn how to subscribe to the new transactions and messages of an account.
  
- [run_get](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/run_get) In this example we connect to the elector contract written in FunC.
  
- [signingBox](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/signingBox) In this example we demonstrate how to avoid passing your keys to the library by using signingBox interface.

- [transfer-with-comment](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/transfer-with-comment) - This sample shows how to attach a comment to a multisig transfer and decode it (like Surf does).
