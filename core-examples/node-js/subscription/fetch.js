/*
 * This is a stub for fetching messages.
 * See a working example of fetching messages from some point in time and moving forward until now
 * here: https://github.com/tonlabs/sdk-samples/blob/master/core-examples/node-js/pagination
 */

// eslint-disable-next-line no-unused-vars
async function fetch(client, query, from) {
    console.log("Fetching all messages from %d to now", from)
    return []
}

module.exports = { fetch }
