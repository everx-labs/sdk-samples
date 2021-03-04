const getBalance = (client) => (address) =>
    client.net
        .query_collection({
            collection: 'accounts',
            filter: {
                id: { eq: address },
            },
            result: 'balance',
        })
        .then((x) => x.result[0].balance)
        .catch(() => {
            throw Error(`Account with address ${address} NOT found`)
        })
module.exports = getBalance
