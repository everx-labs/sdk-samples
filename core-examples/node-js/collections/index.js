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
        // Show accounts with top 20 balances
        const { result } = await client.net.query_collection({
            collection: "accounts",
            order: [{ path: "balance", direction: "DESC" }],
            limit: 20,
            result: "id balance",
        });
        console.log("Accounts with top 20 balances");
        for (const elem of result) {
            console.log(`${elem.id}\t${elem.balance}`);
        }
    }
    
    const oneDayAgoInSeconds = Math.floor((Date.now() - 24 * 3600 * 1000) / 1000);

    {
        console.log(
            "Show the number of the generated blocks for the last 24 hours (from %s)",
            new Date(oneDayAgoInSeconds * 1000)
        );
        // Show the number of the generated blocks for the last 24 hours
        const { values } = await client.net.aggregate_collection({
            collection: "blocks",
            filter: { gen_utime: { gt: oneDayAgoInSeconds } },
            fields: [
                {
                    field: "id",
                    fn: "COUNT",
                }
            ],
        });
        console.log("Result is:", values[0]);
    }
    {
        // Show top 10 balance_delta transactions over the last 24 hours

        console.log(
            "Top 10 balance_delta transactions over the last 24 hours (from %s)",
            new Date(oneDayAgoInSeconds * 1000)
        );
        const { result } = await client.net.query_collection({
            collection: "transactions",
            filter: { now: { gt: oneDayAgoInSeconds } },
            order: [
                { path: "balance_delta", direction: "DESC" },
                { path: "now", direction: "ASC" }
            ],
            limit: 10,
            result: "id balance_delta",
        });

        for (const elem of result) {
            console.log(`${elem.id}\t${elem.balance_delta}`);
        }
    }
    

    // Aggregation queries
    const arbitraryAddress = "0:2bb4a0e8391e7ea8877f4825064924bd41ce110fce97e939d3323999e1efbb13";
    const arbitraryCodeHash = "e2b60b6b602c10ced7ea8ede4bdf96342c97570a3798066f3fb50a4b2b27a208";

    {
        console.log("\nCalculating number of accounts with specified code_hash");
        const { values } = await client.net.aggregate_collection({
            collection: "accounts",
            filter: { code_hash: { eq: arbitraryCodeHash } },
            fields: [
                {
                    field: "id",
                    fn: "COUNT",
                },
            ],
        });
        console.log("Result is:", values[0]);
    }
    {
        console.log(
            "\nCalculating number of transactions of an account, please wait ..."
        );
        const { values } = await client.net.aggregate_collection({
            collection: "transactions",
            filter: { account_addr: { eq: arbitraryAddress } },
            fields: [
                {
                    field: "id",
                    fn: "COUNT",
                }
            ],
        });
        console.log("Result is:", values[0]);
    }

    {
        console.log("\nCalculating total value withdrawn from an account, please wait ...");
        const { values } = await client.net.aggregate_collection({
            collection: "messages",
            filter: { src: { eq: arbitraryAddress } },
            fields: [
                {
                    field: "value",
                    fn: "SUM",
                },
            ],
        });
        console.log("Result is:", values[0]);
    }

    {
        console.log("\nCalculating total value received by an account, please wait ...");
        const { values } = await client.net.aggregate_collection({
            collection: "messages",
            filter: { dst: { eq: arbitraryAddress } },
            fields: [
                {
                    field: "value",
                    fn: "SUM",
                },
            ],
        });
        console.log("Result is:", values[0]);
    }

    client.close();
}

main(client).catch(err => {
    console.error(err);
    process.exit(1);
});
