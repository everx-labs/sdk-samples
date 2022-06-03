const { print, sleep } = require('../utils')

const TITLE = 'All accounts with their balances'

const query = `query MyQuery( $last_id: String, $count: Int) {
    accounts(
        filter: {
            id: { gt: $last_id }
            balance: { ne: null }
        }
        orderBy: [{ path: "id", direction: ASC }]
        limit: $count
    ) {
        id
        balance
    }
}`

async function allAccounts(client, { itemsPerPage, pagesLimit }) {
    const variables = {
        count: itemsPerPage,
        last_id: null,
    }

    for (let pageNum = 1; ; pageNum++) {
        const response = await client.net.query({ query, variables })

        const results = response.result.data.accounts

        if (results.length) {
            print(TITLE, pageNum, results)
        } else {
            console.log('These are all accounts')
            break
        }
        if (pageNum === pagesLimit) {
            console.log('Page limit reached')
            break
        }

        // Move cursor
        variables.last_id = results[results.length - 1].id

        // Don't send API requests too aggressively
        await sleep(200)
    }
}

module.exports = allAccounts
