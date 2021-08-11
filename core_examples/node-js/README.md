# TON Labs low-level SDK samples

In this repository you will find examples of using [TON SDK](https://github.com/tonlabs/TON-SDK/tree/master/docs):

- [cache](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/cache) - In this example we use ton-client-js to call tvm.run_tvm method using cached account BOC.
- [hello](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/hello) - In this example  we learn how to deploy solidity contract `Hello.sol` to TON OS SE (local blockchain), run its on-chain method and run its get-method.
- [listen-and-decode](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/listen-and-decode) In this example we deploy "hello world" contract and subscribe to related messages.
- [multisig](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/multisig) In this example we use ton-client-js to deploy solidity multisig contract `SafeMultisigWallet.sol` in to test net.ton.dev blockchain.
- [multisig-submit-tx](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/multisig-submit-tx) In this example we use ton-client-js to submit transaction to multisig contract.
- [query](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/query) In this example we use multisig wallet contract to send tokens from one wallet to another. You will learn how to query GraphQL API version, query account balance, wait for appearance of a message in blockchain, perform aggregation query,
perform a batched query (multiple queries in one request).
- [run_get](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/run_get) In this example we connect to a elector contract written in FunC.
- [signingBox](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/signingBox) In this example we demonstrate how to avoid passing your keys to the library by using signingBox interface.
- [subscription](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/subscription) In this example we use multisig wallet contract to send tokens from one wallet to another. You will learn how to subscribe to the new transactions and messages of an account.
- [transfer-with-comment](https://github.com/tonlabs/sdk-samples/tree/master/low-level/node-js/core-api/transfer-with-comment) - This sample shows how to attach a comment to a multisig transfer and decode it.
