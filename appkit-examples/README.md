# EverX AppKit SDK samples

`appkit_examples` folder contains samples that use [AppKit - Everscale Javascript Application Kit](https://github.com/tonlabs/appkit-js) - package that is built over the [@eversdk/core](https://tonlabs.github.io/ever-sdk-js/) package and purposed to simplify writing applications on Everscale

- **[hello-wallet](./hello-wallet/)** - In this example  we learn how to deploy solidity contract `HelloWallet.sol` to [Evernode SE (local blockchain)](https://github.com/tonlabs/evernode-se), run its on-chain method and run its get-method.

- **[web-hello](./web-hello/)** - In this example we learn how to do the same things in WEB.

- **[multisig](./multisig/)** In this example you will learn how to deploy solidity [multisig contract `SafeMultisigWallet.sol`](https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig#multisignature-wallet) to [Developer Network](https://docs.everos.dev/ever-platform/reference/graphql-api/networks) and work with it.
  
- **[multisig-submit-tx](./multisig-submit-tx)** this is a simple sample of submitting transaction to multisig contract.
  
- **[query](./query/)** In this example you will learn how to query GraphQL API version, query account balance, wait for appearance of a message in blockchain, perform aggregation query, perform a batched query (multiple queries in one request).

- **[**listen-and-decode](./listen-and-decode/)** In this example we deploy "hello world" contract, subscribe for and decode its messages (including events).

- **[subscription](./subscription/)** In this example we use multisig wallet contract to send tokens from one wallet to another. You will learn how to subscribe to the new transactions and messages of an account.
  
- **[run_get](./run_get/)** In this example we connect to the elector contract written in FunC.
  
- **[signingBox](./signingBox/)** In this example we demonstrate how to avoid passing your keys to the library by using signingBox interface.

- **[transfer-with-comment](./transfer-with-comment/)** - This sample shows how to attach a comment to a multisig transfer and decode it (like Surf does).

- **[custom-giver](./custom-giver/)** - In this example we configure AppKit to use our own Giver.
