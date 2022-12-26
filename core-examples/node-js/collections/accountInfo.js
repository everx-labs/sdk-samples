const { TonClient } = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node");


// Link the platform-dependable ever-sdk binary with the target Application in Typescript
// This is a Node.js project, so we link the application with `libNode` binary
// from `@eversdk/lib-node` package
// If you want to use this code on other platforms, such as Web or React-Native,
// use  `@eversdk/lib-web` and `@eversdk/lib-react-native` packages accordingly
// (see README in  https://github.com/tonlabs/ever-sdk-js )
TonClient.useBinaryLibrary(libNode);

// Create a project on https://dashboard.evercloud.dev and
// pass its Development Network HTTPS endpoint as an argument:
const HTTPS_DEVNET_ENDPOINT = process.argv[2];

if (HTTPS_DEVNET_ENDPOINT === undefined) {
    throw new Error("HTTPS endpoint required");
}

const client = new TonClient({
    network: {
        endpoints: [HTTPS_DEVNET_ENDPOINT],
    },
});

async function main(client) {
    {
        const query = await client.net.query_collection({
            collection: "accounts",
            filter: {
              id: { eq: "0:597081d5dfaf8f9a3bffbc354d5bab4bb200be9b675000b06a631a3301d6ae97" }
            },
            result: "acc_type balance"
          });
        console.log("Account info");
        console.log(query);
    }

    client.close();
}

main(client).catch(err => {
    console.error(err);
    process.exit(1);
});
