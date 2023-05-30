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


    const msigABI: string =
        readFileSync(path.resolve(__dirname, "../contract/SetcodeMultisig.abi.json")).toString("utf8")

        const msigCode: string =
        readFileSync(path.resolve(__dirname, "../contract/SetcodeMultisig.code.boc")).toString("base64")

    // We need to know the future address of the wallet account,
    // because its balance must be positive for the contract to be deployed
    //
    // Future address can be calculated from code and data of the contract
    //
    // For solidity contracts of version up to ***
    // initial data consists of pubkey + all static contract variables
    // and can be packed like this:

    const initData = (await client.abi.encode_boc({
        params: [
            { name: "data", type: "map(uint64,uint256)" }
        ],
        data: {
            "data": {
                0: `0x`+keypair.public
            //  1: 1st-static-variable-value
            //  2: 2nd-static-variable-value
            },
        }
    })).boc;

    console.log('Init data', initData);

    // Lets construct the initial state of the contract
    const stateInit = (await client.boc.encode_state_init({
        code:msigCode,
        data:initData
    })).state_init;

    // Address is the TVM hash of the initial state + workchain id (we work in 0 workchain)
    const msigAddress = `0:`+(await client.boc.get_boc_hash({boc: stateInit})).hash;
    console.log('Address: ', msigAddress);


    console.log(`You can topup your wallet from dashboard at https://dashboard.evercloud.dev`)
    console.log(`Please send >= ${MINIMAL_BALANCE} tokens to ${msigAddress}`)
    console.log(`awaiting...`)

    // Blocking here, waiting for account balance changes.
    // It is assumed that at this time you go to dashboard.evercloud.dev
    // and replenish this account.
    let balance: number
    let accType: number
    for (; ;) {
        // The idiomatic way to send a request is to specify 
        // query and variables as separate properties.
        const getInfoQuery = `
                query getBalance($address: String!) {
                    blockchain {
                    account(address: $address) {
                            info {
                            balance
                            acc_type
                        }
                    }
                }
            }
            `
        const resultOfQuery: ResultOfQuery = await client.net.query({
            query: getInfoQuery,
            variables: { address: msigAddress }
        });
        const accountInfo = resultOfQuery.result.data.blockchain.account.info;


        const nanotokens = parseInt(accountInfo.balance, 16)
        accType = accountInfo.acc_type;
        if (nanotokens >= MINIMAL_BALANCE * 1e9) {
            balance = nanotokens / 1e9
            break
        }
        // TODO: rate limiting
        await sleep(1000)
    }
    console.log(`Account balance is: ${balance.toString(10)} tokens. Account type is ${accType}`)

    console.log(`Deploying wallet contract to address: ${msigAddress} and waiting for transaction...`)

    // Encode the body with constructor call
    let body = (await client.abi.encode_message_body({
        address: msigAddress,
        abi: { type: 'Json', value: msigABI },
        call_set: {       
            function_name: 'constructor',
            input: {
                owners: [`0x${keypair.public}`],
                reqConfirms: 1,
                lifetime: 3600 
            }
        },
        is_internal:false,
        signer:{type: 'Keys', keys: keypair}
    })).body;

    let deployMsg =  await client.boc.encode_external_in_message({
        dst: msigAddress,
        init: stateInit,
        body: body
    });

    let sendRequestResult = await client.processing.send_message({
        message: deployMsg.message,
        send_events: false
    });

    let transaction = (await client.processing.wait_for_transaction({
        abi: { type: 'Json', value: msigABI },
        message: deployMsg.message,
        shard_block_id: sendRequestResult.shard_block_id,
        send_events: false
    })).transaction;

    console.log('Contract deployed. Transaction hash', transaction?.id)
    assert.equal(transaction?.status, 3)
    assert.equal(transaction?.status_name, "finalized")

    //
    // 2.----------------------- Transfer tokens ------------------------
    // 
    // We send 0.5 tokens. Value is written in nanotokens
    const amount = 0.5e9
    const dest = "-1:7777777777777777777777777777777777777777777777777777777777777777"

    console.log('Sending 0.5 token to', dest)

    // If you want to add a comment to your transfer, create payload with it:

    const comment = (await client.abi.encode_boc({
        params: [
            { name: "op", type: "uint32" }, // operation
            { name: "comment", type: "bytes" }
        ],
        data: {
            "op": 0, // operation = 0 means comment
            "comment": Buffer.from("My comment").toString("hex"),
        }
    })).boc;

    // Encode the body with sendTransaction call and comment
    body = (await client.abi.encode_message_body({
        address: msigAddress,
        abi: { type: 'Json', value: msigABI },
        call_set: {      
            function_name: 'sendTransaction',
            input: {
                dest: dest,
                value: amount,
                bounce: false,
                flags: 64,
                payload: comment // specify "" if no payload is provided
            }
        },
        is_internal:false,
        signer:{type: 'Keys', keys: keypair}
    })).body;

    let msg =  await client.boc.encode_external_in_message({
        dst: msigAddress,
        body: body
    });

    sendRequestResult = await client.processing.send_message({
        message: msg.message,
        send_events: false
    });

    transaction = (await client.processing.wait_for_transaction({
        abi: { type: 'Json', value: msigABI },
        message: msg.message,
        shard_block_id: sendRequestResult.shard_block_id,
        send_events: false
    })).transaction;

    console.log('Transfer completed. Transaction hash', transaction?.id)
    assert.equal(transaction?.status, 3)
    assert.equal(transaction?.status_name, "finalized")

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


