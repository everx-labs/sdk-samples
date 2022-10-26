# Everscale SDK Samples

In this repository you will find examples of using official Everscale SDKs.
If it helped you, please give it a star:)


**Have a question? Get quick help in our channel:**

[![Channel on Telegram](https://img.shields.io/badge/chat-on%20telegram-9cf.svg)](https://t.me/ever\_sdk)

# Why you may need this repository?

- If you want to create your own DApp in Everscale, then SDK samples is a good place to start.
  You can start with the very simple [hello application](/demo/hello-wallet) in Node.js.
  Or explore a more complex [Web application imitating p2p exchange](/demo/web\_p2p\_exchange).

- Explore new features. 
  We constantly update the repository with samples that use new SDK features.   

To get a deeper understanding dive into [SDK guides](https://docs.everos.dev/ever-sdk/guides/work_with_contracts) where you can find extensive explanations and descriptions of each step of DApp development on Everscale.

# Repository structure

`demo` folder contains demo samples that can be used as a quick start and also can be installed via [everdev](https://github.com/tonlabs/everdev#install-demo-project) .

`core_examples` folder contains samples demonstrating different core SDK functionality and is constantly replenished with samples with new core sdk features. At the moment only [@eversdk/core](https://github.com/tonlabs/ever-sdk-js) JS package samples are present. If you need Rust samples, leave us an issue and we will provide you with it.

`appkit_examples` folder contains samples that use [AppKit - Everscale Javascript Application Kit](https://github.com/tonlabs/appkit-js) - package that is built over the [@eversdk/core](https://tonlabs.github.io/ever-sdk-js/) package and purposed to simplify writing applications on Everscale

`nfc_card` folder contains examples of projects working with NFC Security Card using React-Native, Swift and Android SDKs.

# Installation

This repository contains submodules. So after cloning you have to:

```shell
git submodule init
git submodule update
```

# Full Documentation 
* [SDK guides](https://docs.everos.dev/ever-sdk/guides/work_with_contracts)
* [JavaScript API Reference](https://tonlabs.github.io/ever-sdk-js/)
* [Local Blockchain Evernode SE](https://github.com/tonlabs/evernode-se)
* [GraphQL API documentation](https://docs.everos.dev/ever-platform/samples/graphql-samples/quick-start#api-documentation)

## Source code
* [Javascript SDK](http://github.com/tonlabs/ever-sdk-js "JS common library")
* [Rust SDK (core library)](https://github.com/tonlabs/ever-sdk "SDK Core library")
