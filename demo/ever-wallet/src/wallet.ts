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
    // 1. ------------------ Deploy ever-wallet --------------------------------
    // 
    // Generate a key pair for the wallet to be deployed
    const keypair = await client.crypto.generate_random_sign_keys();

    // TODO: Save generated keypair!
    console.log('Generated wallet keys:', JSON.stringify(keypair))
    console.log('Do not forget to save the keys!')

    // To deploy a wallet we need its code and ABI files
    const everWalletCode: string =
        readFileSync(path.resolve(__dirname, "../contract/Wallet.code.boc")).toString("base64")
    const everWalletABI: string =
        readFileSync(path.resolve(__dirname, "../contract/everWallet.abi.json")).toString("utf8")

        const initData = (await client.abi.encode_boc({
            params: [
                { name: "publicKey", type: "uint256" },
                { name: "timestamp", type: "uint64" }
            ],
            data: {
                "publicKey": `0x`+keypair.public,
                "timestamp": 0
            }
        })).boc;

        console.log('Init data', initData);
    

    const stateInit = (await client.boc.encode_state_init({
        code:everWalletCode,
        data:initData
    })).state_init;

    const everWalletAddress = `0:`+(await client.boc.get_boc_hash({boc: stateInit})).hash;
    console.log('Address: ', everWalletAddress);



    console.log(`You can topup your wallet from dashboard at https://dashboard.evercloud.dev`)
    console.log(`Please send >= ${MINIMAL_BALANCE} tokens to ${everWalletAddress}`)
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
            variables: { address: everWalletAddress }
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



    console.log(`Making first transfer+deploy from ever-wallet contract to address: -1:7777777777777777777777777777777777777777777777777777777777777777 and waiting for transaction...`)
// Here we construct body by ABI
// and then add state init to the message for deploy
  
    let body = (await client.abi.encode_message_body({
        address: everWalletAddress,
        abi: { type: 'Json', value: everWalletABI },
        call_set: {      
            function_name: 'sendTransaction',
            input: {
                dest: '-1:7777777777777777777777777777777777777777777777777777777777777777',
                value: '1000000000', // amount in nano EVER
                bounce: false,
                flags: 3,
                payload: ''
            }
        },
        is_internal:false,
        signer:{type: 'Keys', keys: keypair}
    })).body;

    let deployAndTransferMsg =  await client.boc.encode_external_in_message({
        dst: everWalletAddress,
        init: stateInit,
        body: body
    });

    let sendRequestResult = await client.processing.send_message({
        message: deployAndTransferMsg.message,
        send_events: false
    });

    let transaction = (await client.processing.wait_for_transaction({
        abi: { type: 'Json', value: everWalletABI },
        message: deployAndTransferMsg.message,
        shard_block_id: sendRequestResult.shard_block_id,
        send_events: false
    })).transaction;


    console.log('Contract deployed. Transaction hash', transaction.id)
    assert.equal(transaction.status, 3)
    assert.equal(transaction.status_name, "finalized")

    //
    // 3.----------------- Make simple transfer -----------------------
    // 

    console.log(`Making simple transfer from ever-wallet contract to address: -1:7777777777777777777777777777777777777777777777777777777777777777 and waiting for transaction...`)
      
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


        // encode message body by ever-wallet ABI
         body = (await client.abi.encode_message_body({
            address: everWalletAddress,
            abi: { type: 'Json', value: everWalletABI },
            call_set: {      
                function_name: 'sendTransaction',
                input: {
                    dest: '-1:7777777777777777777777777777777777777777777777777777777777777777',
                    value: '1000000000', // amount in units (nano)
                    bounce: false,
                    flags: 3,
                    payload: comment // specify "" if no payload is provided
                }
            },
            is_internal:false,
            signer:{type: 'Keys', keys: keypair}
        })).body;
    
        let transferMsg =  await client.boc.encode_external_in_message({
            dst: everWalletAddress,
            body: body
        });
    
        sendRequestResult = await client.processing.send_message({
            message: transferMsg.message,
            send_events: false
        });
    
        transaction = (await client.processing.wait_for_transaction({
            abi: { type: 'Json', value: everWalletABI },
            message: transferMsg.message,
            shard_block_id: sendRequestResult.shard_block_id,
            send_events: false
        })).transaction;
    
    
        console.log('Contract deployed. Transaction hash', transaction.id)
        assert.equal(transaction.status, 3)
        assert.equal(transaction.status_name, "finalized")

    //
    // 4.----------------- Read all wallet transactions -----------------------
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
                address: everWalletAddress,
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


