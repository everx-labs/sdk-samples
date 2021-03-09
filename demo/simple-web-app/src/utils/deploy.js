const run = require('./run')
const repeatWithPredicate = require('./repeatWithPredicate')

// :: address
const deploy = (client) => async ({
    abi,
    imageBase64,
    initParams,
    consParams,
    keys,
    value /* initial balance */,
    flags,
    payload,
    giver,
}) => {
    const message_encode_params = {
        abi: {
            type: 'Contract',
            value: abi,
        },
        deploy_set: {
            tvc: imageBase64,
            initial_data: initParams,
        },
        call_set: {
            function_name: 'constructor',
            input: consParams,
        },
        signer: {
            type: 'Keys',
            keys,
        },
    }
    const { address } = await client.abi.encode_message(message_encode_params)

    // Credit account
    await run(client)(giver, 'sendTransaction', {
        dest: address,
        value,
        bounce: false,
        ...(flags !== undefined ? { flags } : {}),
        ...(payload !== undefined ? { payload } : {}),
    })

    await repeatWithPredicate(() => client.processing.process_message({ send_events: false, message_encode_params }))
    return address
}
module.exports = deploy
