# TON Labs low-level SDK samples

`core_examples` folder contains samples demonstrating different core SDK functionality and is constantly replenished with samples with new core sdk features. 
`node-js` folder contains samples running on Node.js that use [@tonclient/core and @tonclient/node-lib](https://github.com/tonlabs/ton-client-js) JS packages. 


- **[hello-wallet](./hello-wallet/)** - In this example  we learn how to deploy solidity contract `HelloWallet.sol` to [TON OS SE (local blockchain)](https://github.com/tonlabs/tonos-se), run its on-chain method and run its get-method.

- **[web-hello](./web-hello/)** - In this example we learn how to do the same things in WEB.

- **[multisig](./multisig/)** In this example you will learn how to deploy solidity [multisig contract `SafeMultisigWallet.sol`](https://github.com/tonlabs/ton-labs-contracts/tree/master/solidity/safemultisig#multisignature-wallet) to [Developer Network](https://docs.ton.dev/86757ecb2/p/85c869-networks) and work with it. 
  
- **[multisig-submit-tx](./multisig-submit-tx/)** this is a simple sample of submitting transaction to multisig contract.
  
- **[multisig-payload](./multisig-payload/)** this is a sample demonstrating how to generate payload with order to deposit ordinary stake in depool and stake with it from multisignature wallet.
  
- **[query](./query/)** In this example you will learn how to query GraphQL API version, query account balance, wait for appearance of a message in blockchain, perform aggregation query, perform a batched query (multiple queries in one request).
  
- **[query_transaction_tree](./query_transaction_tree/)** In this example you will learn how to query transaction tree, triggered by the specified message.

- **[listen-and-decode](./listen-and-decode/)** In this example we deploy "hello world" contract, subscribe for and decode its messages (including events).

- **[subscription](./subscription/)** In this example we use multisig wallet contract to send tokens from one wallet to another. You will learn how to subscribe to the new transactions and messages of an account.
  
- **[run_executor](./run_executor/)** In this example we demonstrate contract deploy/call emulation, fees estimation.
  
- **[run_get](./run_get/)** In this example we connect to the elector contract written in FunC.
  
- **[signingBox](./signingBox/)** In this example we demonstrate how to avoid passing your keys to the library by using signingBox interface.

- **[transfer-with-comment](./transfer-with-comment/)** - This sample shows how to attach a comment to a multisig transfer and decode it (like Surf does).

- **[cell-builder](./cell-builder/)** - In this example you will learn how to encode your data into bag-of-cells.

- **[codehash](./codehash/)** - In this example you will learn how to calculate hash of account's code.
  
- **[encryption-box](./encryption-box/)** - In this example you will learn how to register and use encryption, implemeted on your side, from sdk. This feature is needed by debot browser developers. 

- **[cache](./cache/)** - In this example you will learn how to use cached account BOC in tvm.run_tvm method to increase speed of tvm execution.
