const repeatWithPredicate = require('./repeatWithPredicate')

const run = (client) => async (contract, function_name, input = {}, keys) => {
    const { address } = contract

    let signer

    if (keys !== undefined) {
        signer = {
            type: 'Keys',
            keys,
        }
    } else if (contract.keyPair) {
        signer = {
            type: 'Keys',
            keys: contract.keyPair,
        }
    } else {
        signer = {
            type: 'None',
        }
    }

    const params = {
        send_events: false,
        message_encode_params: {
            address,
            abi: {
                type: 'Contract',
                value: contract.package.abi,
            },
            call_set: {
                function_name,
                input,
            },
            signer,
        },
    }
    return repeatWithPredicate(() => client.processing.process_message(params))
}
module.exports = run
