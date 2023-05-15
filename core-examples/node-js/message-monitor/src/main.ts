import path from "node:path"
import { readFileSync } from "node:fs"
import { libNode } from "@eversdk/lib-node"
import { TonClient, MonitorFetchWaitMode } from "@eversdk/core"

TonClient.useBinaryLibrary(libNode)

// Create a project on https://dashboard.evercloud.dev and pass
// the Development Network HTTPS endpoint as a parameter:
const HTTPS_DEVNET_ENDPOINT = process.argv[2]

if (HTTPS_DEVNET_ENDPOINT === undefined) {
    throw new Error("HTTPS endpoint required")
}

const client = new TonClient({
    network: { endpoints: [HTTPS_DEVNET_ENDPOINT] },
})

const CONTRACT_ADDRESS =
    "0:435fcf8a845e46a4c8184adbc9eb0fcede6667022de7ed2470a2f28846171e1c"
const CONTRACT_KEYS = {
    public: "2ada2e65ab8eeab09490e3521415f45b6e42df9c760a639bcf53957550b25a16",
    secret: "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3",
}
const CONTRACT_ABI = readFileSync(
    path.resolve(__dirname, "../contract/MyContract.abi.json"),
).toString("utf8")

/*
 * Use case #1:
 *  I want to send 100 messages by 10 messages per second
 *  and get their processing status AS SOON as possible
 *
 * Use case #2:
 *  I want to send 100 messages, by 10 messages per second
 * and only get their status when ALL messages have been processed.
 */

const TOTAL_NUMBER_OF_MESSAGES = 100
const SEND_INTERVAL_SECONDS = 1
const BATCH_SIZE = 10

// The message is valid (can be processed by validators) no longer that 90 seconds after creation.
const EXP_TIMEOUT_SECONDS = 90

async function main(client: TonClient) {
    log("Starting use case #1")
    let queueName = "queue_1"

    await sendMessages(queueName) // We are waiting for sending only the first batch of messages.

    let resultsCounter = 0
    while (resultsCounter < TOTAL_NUMBER_OF_MESSAGES) {
        const result = await client.processing.fetch_next_monitor_results({
            queue: queueName,
            wait_mode: MonitorFetchWaitMode.AtLeastOne,
        })

        for (const elem of result.results) {
            resultsCounter++
            const processTime = Date.now() - elem.user_data.timestamp
            log(
                `Result: message processed in ${processTime} ms.`,
                elem.error || `Status: ${elem.status}`,
            )
        }
        /* If you're interested, you can call the `get_monitor_info` function, which
         * returns how many messages in a queue do not have final status yet ("unresolved")
         * When `wait_mode = MonitorFetchWaitMode.AtLeastOne`, property "resolved" is always equals to 0
         */
        const monitorInfo = await client.processing.get_monitor_info({
            queue: queueName,
        })
        log("monitor_info", monitorInfo)
    }
    log("End of use case #1, all results received\n")

    log("Starting use case #2")

    queueName = "queue_2"
    await sendMessages(queueName) // We are waiting for sending only the first batch of messages.

    const result = await client.processing.fetch_next_monitor_results({
        queue: queueName,
        wait_mode: MonitorFetchWaitMode.All,
    })

    for (const elem of result.results) {
        const processTime = Date.now() - elem.user_data.timestamp
        log(
            `Result: message processed in ${processTime} ms.`,
            elem.error || `Status: ${elem.status}`,
        )
    }
    log(
        result.results.length === TOTAL_NUMBER_OF_MESSAGES
            ? `End of use case #2, all results received`
            : `Error occured, expected ${TOTAL_NUMBER_OF_MESSAGES}, received ${result.results.length}`,
    )
}

async function sendMessages(queueName: string, sentMessagesCounter = 0) {
    try {
        const messages = await createBatch(BATCH_SIZE)
        await client.processing.send_messages({
            messages,
            monitor_queue: queueName,
        })
        sentMessagesCounter += BATCH_SIZE
        log(
            `${sentMessagesCounter} messages of ${TOTAL_NUMBER_OF_MESSAGES} was sent`,
        )
    } catch (err) {
        log(err)
    }
    if (sentMessagesCounter < TOTAL_NUMBER_OF_MESSAGES) {
        setTimeout(
            sendMessages,
            SEND_INTERVAL_SECONDS * 1000,
            queueName,
            sentMessagesCounter,
        )
    }
}

async function createBatch(batchSize: number) {
    const batch = []
    while (batch.length < batchSize) {
        const now = Date.now()
        const expire = Math.floor(now / 1000) + EXP_TIMEOUT_SECONDS
        const boc = (
            await client.abi.encode_message({
                address: CONTRACT_ADDRESS,
                abi: { type: "Json", value: CONTRACT_ABI },
                call_set: {
                    function_name: "touch",
                    header: {
                        time: BigInt(now),
                        expire,
                    },
                },
                signer: { type: "Keys", keys: CONTRACT_KEYS },
                processing_try_index: 1,
            })
        ).message

        // Assure that generatated BOC is unique
        if (batch.findIndex(m => m.boc === boc) === -1) {
            batch.push({
                boc,
                wait_until: expire,
                user_data: { timestamp: now },
            })
        }
    }
    return batch
}

main(client)
    .then(() => {
        process.exit(0)
    })
    .catch(error => {
        console.error(error)
        process.exit(1)
    })

// Pretty print function
function log(...x: unknown[]) {
    console.log(new Date(), ...(Array.isArray(x) ? x : [x]))
}
