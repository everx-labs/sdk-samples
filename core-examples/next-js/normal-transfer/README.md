## Next Js Token Transfer Example

In this example we demonstrate how to transfer tokens from one contract to another.
This guide will walk you through the installation process, handling the WebAssembly (WASM) file, and transferring tokens between wallets.

The Everscale SDK is a comprehensive library designed for DApp development on TVM-based blockchains. This includes chains such as Everscale, TON, Venom Blockchain, Gosh, and others.

## Features

- Transfer tokens from one contract to another.
- Generate a wallet address using the public key.
- Generate a new keypair.

## Before running the example

- Create a project on [dashboard.evercloud.dev](https://dashboard.evercloud.dev/register) if you don't have one.

- Remember, you'll need an endpoint to run the code. You can create a new endpoint or use an existing one for a particular blockchain. This endpoint must be passed in `pages/index.tsx` `line no 18` when running the example.

- To transfer tokens from one wallet to another, you will need a `keypair`. You can either generate a new one or export it from your wallet.

## Getting Started

### 1. Installation

```bash
npm install
# or
yarn install
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm d
```

### 2. Handling the WASM file

The WASM file is a crucial part for the client side. Each time you install or update your node modules using `npm i` or `yarn install`, perform the following steps:

- Navigate to your `node_modules/@eversdk/lib-web` directory.
- Find the `eversdk.wasm` file.
- Copy this file.
- Paste it into the public directory of your project.
- This process ensures that the `WASM` file is always up-to-date. It is necessary to follow this process only when you run npm i; otherwise, the SDK will function properly with the existing WASM file.

### 4. Configuring the Next.js Configuration File

In order to ensure that the Everscale SDK works smoothly with your Next.js project, you need to configure your Next.js settings appropriately.

Here is an example of how your next.config.js file should look:

```js
/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@eversdk/lib-web'],
  webpack(config) {
    config.output.webassemblyModuleFilename = './public/eversdk.wasm';
    config.experiments = { asyncWebAssembly: true };
    return config;
  },
};

module.exports = nextConfig;
```

### 3. Transferring Tokens

With everSDK, you can transfer tokens between wallets seamlessly.

## TechStack

- [EverSDK/Core](https://www.npmjs.com/package/@eversdk/core)
- [EverSDK/lib-web](https://www.npmjs.com/package/@eversdk/lib-web)
- [EverScale Standalone](https://www.npmjs.com/package/everscale-standalone-client)
