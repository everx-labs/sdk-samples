/* eslint-disable consistent-return */

const getLocal = (client) => async (contract, fnName, input = {}) => {
    const { address } = contract
    const abi = {
        type: 'Contract',
        value: contract.package.abi,
    }

    const [account, message] = await Promise.all([
        // If error occured, it could be a NETWORK error or an application-level error, let it bubble
        client.net
            .query_collection({
                collection: 'accounts',
                filter: {
                    id: { eq: address },
                },
                result: 'boc',
            })
            .then((x) => {
                if (!x.result[0]) {
                    throw Error(`Account with address ${address} NOT found`)
                } else {
                    return x.result[0].boc
                }
            }),

        // If error occured, let it bubble, this is a programming error
        client.abi
            .encode_message({
                abi,
                address,
                call_set: {
                    function_name: fnName,
                    input,
                },
                signer: {
                    type: 'None',
                },
            })
            .then((x) => x.message),
    ])

    // If error occured, let it bubble, this is a programming error
    return client.tvm
        .run_tvm({
            message,
            account,
            abi,
        })
        .then((x) => x.decoded.output)
}
module.exports = getLocal
