# TON Labs SDK Samples

In this repository you will find examples of using official TON Labs Free TON SDKs.  
If it helped you, please give it a star:)


**Have a question? Get quick help in our channel:**

[![Channel on Telegram](https://img.shields.io/badge/chat-on%20telegram-9cf.svg)](https://t.me/ton_sdk) 

# Why you may need this repository?

- If you want to create your own DApp in Free TON, then SDK samples is a good place to start.  
  You can start with the very simple [hello application](/demo/hello-wallet) in Node.js.
  Or explore a more complex [Web application imitating p2p exchange](/demo/web_p2p_exchange).

- Explore new features. 
  We constantly update the repository with samples that use new SDK features.   

To get a deeper understanding dive into [SDK guides](https://docs.ton.dev/86757ecb2/p/783f9d-about-sdk) where you can find extensive explanations and descriptions of each step of DApp development on Free TON.

# Repository structure

`demo` folder contains demo samples that can be used as a quick start and also can be installed via [TONDEV](https://github.com/tonlabs/tondev#install-demo-project) .

`core_examples` folder contains samples demonstrating different core SDK functionality and is constantly replenished with samples with new core sdk features. At the moment only [@tonclient/core](https://github.com/tonlabs/ton-client-js) JS package samples are present. If you need Rust samples, leave us an issue and we will provide you with it.

`appkit_examples` folder contains samples that use [AppKit - Free TON Javascript Application Kit](https://github.com/tonlabs/appkit-js) - package that is built over the [@tonclient/core](https://tonlabs.github.io/ton-client-js/) package and purposed to simplify writing applications on Free TON

`nfc_card` folder contains examples of projects working with NFC Security Card using React-Native, Swift and Android SDKs.

# Installation

This repository contains submodules. So after cloning you have to:

```shell
git submodule init
git submodule update
```

# Full Documentation 
* [SDK guides](https://docs.ton.dev/86757ecb2/p/783f9d-about-sdk)
* [JavaScript API Reference](https://tonlabs.github.io/ton-client-js/)
* [Local Blockchain TONOS SE](https://github.com/tonlabs/tonos-se)
* [GraphQL API documentation](https://docs.ton.dev/86757ecb2/p/793337-ton-os-api)

## Source code
* [Javascript SDK](http://github.com/tonlabs/ton-client-js "JS common library")
* [Rust SDK (core library)](https://github.com/tonlabs/ton-sdk "SDK Core library")
