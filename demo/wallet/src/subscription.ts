import { libNode } from '@eversdk/lib-node'
import { TonClient } from '@eversdk/core'
import assert from 'node:assert/strict';

TonClient.useBinaryLibrary(libNode)

const endpoint = process.env.ENDPOINT
assert.ok(endpoint,
    "An endpoint is required. You can find it when creating a project at https://dashboard.evercloud.dev"
)
// List of account to subscribe
const addressList = [
    "-1:3333333333333333333333333333333333333333333333333333333333333333",
    "0:40e593373fd9c972162812878ea1976ebaffe2bff030c637df2c08826cf1583b"
]

async function main() {
    try {
        const client = new TonClient({ network: { endpoints: [endpoint] } })

        const queryText = `
            subscription my($list: [String!]!){
                transactions(
                    filter: {account_addr: { in: $list }}
                ) {
                    id
                    account_addr
                    balance_delta
                }
            }`

        // use `client.net.unsubscribe({ handle })` to close subscription
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { handle } = await client.net.subscribe(
            {
                subscription: queryText,
                variables: { list: addressList }
            },
            responseHandler,
        );
        console.log("Subscribed to transactions of accounts:", JSON.stringify(addressList))
        console.log("Press CTRL+C to interrupt it")

    } catch (error) {
        if (error.code === 504) {
            console.error('Network is inaccessible.');
        } else {
            console.error(error);
        }
        process.exit(1);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function responseHandler(params: any, responseType: number) {
    // Tip: Always wrap the logic inside responseHandler in a try-catch block
    // or you will be surprised by non-informative errors due to the context
    // in which the handler is executed
    try {
        if (responseType === 100 /* GraphQL data received */) {
            if (params?.result) {
                console.log(params.result);
            }

        } else {
            // See full list of error codes here:
            // https://docs.everos.dev/ever-sdk/reference/types-and-methods/mod_net#neterrorcode
            console.error(params, responseType);
        }
    } catch (err) {
        console.log(err);
    }
}

main()
