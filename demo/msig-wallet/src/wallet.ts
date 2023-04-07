import { libNode } from '@eversdk/lib-node'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { TonClient, ResultOfQuery, ParamsOfEncodeMessage, ResultOfEncodeMessage, ResultOfProcessMessage } from '@eversdk/core'
import assert from 'node:assert/strict';

TonClient.useBinaryLibrary(libNode)

const endpoint = process.env.ENDPOINT
assert.ok(endpoint,
    "An endpoint is required. You can find it when creating a project at https://dashboard.evercloud.dev"
)
const client = new TonClient({ network: { endpoints: [endpoint] } })

// To run this test, you need to send at least this amount in tokens to the specified account
const MINIMAL_BALANCE = 1

async function main(client: TonClient) {
    // 
    // 1. ------------------ Deploy multisig wallet --------------------------------
    // 
    // Generate a key pair for the wallet to be deployed
    const keypair = await client.crypto.generate_random_sign_keys();

    // TODO: Save generated keypair!
    console.log('Generated wallet keys:', JSON.stringify(keypair))
    console.log('Do not forget to save the keys!')

    // To deploy a wallet we need its TVC and ABI files
    const msigTVC: string =
        readFileSync(path.resolve(__dirname, "../contract/SetcodeMultisig.tvc")).toString("base64")
    const msigABI: string =
        readFileSync(path.resolve(__dirname, "../contract/SetcodeMultisig.abi.json")).toString("utf8")

    // We need to know the future address of the wallet account,
    // because its balance must be positive for the contract to be deployed
    // Future address can be calculated by encoding the deploy message.
    // https://docs.everos.dev/ever-sdk/reference/types-and-methods/mod_abi#encode_message

    const messageParams: ParamsOfEncodeMessage = {
        abi: { type: 'Json', value: msigABI },
        deploy_set: { tvc: msigTVC, initial_data: {} },
        signer: { type: 'Keys', keys: keypair },
        processing_try_index: 1
    }

    const encoded: ResultOfEncodeMessage = await client.abi.encode_message(messageParams)

    const msigAddress = encoded.address

    console.log(`You can topup your wallet from dashboard at https://dashboard.evercloud.dev`)
    console.log(`Please send >= ${MINIMAL_BALANCE} tokens to ${msigAddress}`)
    console.log(`awaiting...`)

    // Blocking here, waiting for account balance changes.
    // It is assumed that at this time you go to dashboard.evercloud.dev
    // and replenish this account.
    let balance: number
    for (; ;) {
        // The idiomatic way to send a request is to specify 
        // query and variables as separate properties.
        const getBalanceQuery = `
                query getBalance($address: String!) {
                    blockchain {
                    account(address: $address) {
                            info {
                            balance
                        }
                    }
                }
            }
            `
        const resultOfQuery: ResultOfQuery = await client.net.query({
            query: getBalanceQuery,
            variables: { address: msigAddress }
        })

        const nanotokens = parseInt(resultOfQuery.result.data.blockchain.account.info?.balance, 16)
        if (nanotokens > MINIMAL_BALANCE * 1e9) {
            balance = nanotokens / 1e9
            break
        }
        // TODO: rate limiting
        await sleep(1000)
    }
    console.log(`Account balance is: ${balance.toString(10)} tokens`)

    console.log(`Deploying wallet contract to address: ${msigAddress} and waiting for transaction...`)

    // This function returns type `ResultOfProcessMessage`, see: 
    // https://docs.everos.dev/ever-sdk/reference/types-and-methods/mod_processing#process_message
    let result: ResultOfProcessMessage = await client.processing.process_message({
        message_encode_params: {
            ...messageParams,  // use the same params as for `encode_message`,
            call_set: {        // plus add `call_set`
                function_name: 'constructor',
                input: {
                    owners: [`0x${keypair.public}`],
                    reqConfirms: 0,
                    lifetime: 0
                }
            },
        },
        send_events: false,
    })
    console.log('Contract deployed. Transaction hash', result.transaction?.id)
    assert.equal(result.transaction?.status, 3)
    assert.equal(result.transaction?.status_name, "finalized")

    //
    // 2.----------------------- Transfer tokens ------------------------
    // 
    // We send 0.5 tokens. Value is written in nanotokens
    const amount = 0.5e9
    const dest = "-1:7777777777777777777777777777777777777777777777777777777777777777"

    console.log('Sending 0.5 token to', dest)

    result = await client.processing.process_message({
        message_encode_params: {
            address: msigAddress,
            ...messageParams, // use the same params as for `encode_message`,
            call_set: {       // plus add `call_set`
                function_name: 'sendTransaction',
                input: {
                    dest: dest,
                    value: amount,
                    bounce: false,
                    flags: 64,
                    payload: ''
                }
            },
        },
        send_events: false, // do not send intermidate events
    })
    console.log('Transfer completed. Transaction hash', result.transaction?.id)
    assert.equal(result.transaction?.status, 3)
    assert.equal(result.transaction?.status_name, "finalized")

    //
    // 3.----------------- Read all wallet transactions -----------------------
    // 
    const accountQuery = `
        query getTransactions($address: String!, $cursor: String, $count: Int) {
            blockchain {
                account(address: $address) {
                    transactions(
                        first: $count, 
                        after: $cursor,
                        allow_latest_inconsistent_data: true
                    ) {
                        edges {
                            node { hash }
                        }
                        pageInfo { 
                            endCursor
                            hasNextPage
                        }
                    }
                }
            }
        }`

    // Pagination connection pattern requires a cursor, that will be set latter
    let cursor: string = undefined

    // In this example, we want the query to return 2 items per page.
    const itemsPerPage = 2

    for (; ;) {
        const queryResult: ResultOfQuery = await client.net.query({
            query: accountQuery,
            variables: {
                address: msigAddress,
                count: itemsPerPage,
                cursor
            }
        });
        const transactions = queryResult.result.data.blockchain.account.transactions;

        for (const edge of transactions.edges) {
            console.log("Transaction hash:", edge.node.hash);
        }
        if (transactions.pageInfo.hasNextPage === false) {
            break;
        }
        // To read next page we initialize the cursor:
        cursor = transactions.pageInfo.endCursor;
        // TODO: rate limiting
        await sleep(1000);
    }

}

main(client)
    .then(() => {
        process.exit(0)
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    })



// This helper function is used for limiting request rate
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }


