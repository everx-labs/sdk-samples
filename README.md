# TON Labs SDK Samples

In this repository you will find examples of using official TON Labs Free TON SDKs.
If it helped you, please give it a star:)


**Have a question? Get quick help in our channel:**

[![Channel on Telegram](https://img.shields.io/badge/chat-on%20telegram-9cf.svg)](https://t.me/ton_sdk) 

# Why you may need this repository?

- If you want to create your own DApp in Free TON, then SDK samples is a good place to start.  
  You can start with the very simple [hello application](/demo/hello) in Node.js.
  Or explore a more complex [Web application imitating p2p exchange](/demo/simple-web-app).

- Explore new features. 
  We constantly update the repository with samples that use new features.   
  Find these samples in [examples](/examples) folder.

To get a deeper understanding dive into [SDK guides](https://docs.ton.dev/86757ecb2/p/783f9d-about-sdk) where you can find extensive explanations and descriptions of each step of DApp development on Free TON.

# Repository structure

`demo` folder contains demo samples that can be used as a quick start and also can be installed via [TONDEV](https://github.com/tonlabs/tondev).

`examples` folder contains samples demonstrating different sdk features using high-level SDK functions and is constantly replenished with samples with new sdk features. 
See news about new samples [here](https://docs.ton.dev/86757ecb2/p/6553fc-api-and-sdk)

`low level` folder contains samples working on low-level sdk functions, which may be useful to implement some complex use-cases.

`nfc_card` folder contains examples of projects working with NFC Security Card using React-Native, Swift and Android SDKs.

# Installation

This repository contains submodules. So after cloning you have to:

```shell
git submodule init
git submodule update
```

# Full Documentation 
* [SDK guides](https://docs.ton.dev/86757ecb2/p/783f9d-about-sdk)
* [SDK API Reference](https://github.com/tonlabs/TON-SDK/blob/master/docs/modules.md)
* [Local Blockchain TONOS SE](https://docs.ton.dev/86757ecb2/p/19d886-ton-os-se)
* [GraphQL API documentation](https://docs.ton.dev/86757ecb2/p/793337-ton-os-api)

## Source code
* [Javascript SDK](http://github.com/tonlabs/ton-client-js "JS common library")
* [Rust SDK (core library)](https://github.com/tonlabs/ton-sdk "SDK Core library")
