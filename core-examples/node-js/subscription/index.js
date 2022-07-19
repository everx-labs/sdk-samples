const { TonClient } = require("@eversdk/core")
const { libNode } = require("@eversdk/lib-node")

const { fetch } = require("./fetch")
const { Subscriber, Events } = require("./Subscriber")

TonClient.useBinaryLibrary(libNode)

/*
 * To configure an Everos client, it needs to pass API endpoints as parameters.
 * You can find all public EVER OS API endpoints
 * here: https://docs.everos.dev/ever-sdk/reference/ever-os-api/networks
 * This sample uses the Developer Network endpoints:
 */
const client = new TonClient({
    network: {
        endpoints: [
            "https://eri01.net.everos.dev",
            "https://rbx01.net.everos.dev",
            "https://gra01.net.everos.dev",
        ],
    },
})

const sampleQuery = {
    collection: "messages",
    filter: {
        dst: {
            eq: "-1:3333333333333333333333333333333333333333333333333333333333333333",
        },
    },
    result: "id src",
}

/* This function handles incoming messages */
function processMessage(message) {
    console.log(message)
}

async function main() {
    /*
     * In this example we count subscription failures IN A ROW and if their
     * number exceeds failsLimit, we stop the subscription as not working.
     */
    const failsLimit = 2
    let failsCnt = 0

    /* Subscriber is an even emitter */
    const subscriber = new Subscriber(client, sampleQuery)

    subscriber.on(Events.DATA, (data) => {
        failsCnt = 0
        processMessage(data)
    })

    subscriber.on(Events.RECONNECTED, () => {
        if (failsCnt <= failsLimit) {
            /*
             * A reconnect has occurred. To prevent message lost fetch all messages
             * from the time of the failure until now.
             *
             * Note that there is a period of time when the SDK tried to reconnect,
             * so the actual disconnect happened some time before we got the error.
             *
             * It is your decision to determine the point in the past from which you
             * will start reading messages.
             */
            const from = Date.now() - 60000
            /* Please note that the process of receiving messages by fetching and
             * by subscription overlaps in time,so the messages must be deduplicated.
             */
            fetch(client, sampleQuery, from).then(processMessage)
        }
    })

    subscriber.on(Events.ERROR, async (params) => {
        failsCnt++
        console.error(params)
        if (failsCnt > failsLimit) {
            subscriber.removeAllListeners()
            await subscriber.unsubscribe()
            client.close()
        }
    })

    await subscriber.subscribe()
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
