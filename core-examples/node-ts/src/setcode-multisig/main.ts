import { libNode } from '@eversdk/lib-node'
import { TonClient } from '@eversdk/core'
import * as SetcodeMultisigAbi from './multisig.abi.json'
import { getAccountBalance, guessSender, sleep } from '../utils'

const GQLS = [ process.env.GQLURL || '' ]

// base64 -i SetcodeMultisig.tvc
// eslint-disable-next-line max-len
const SETCODE_MULTISIG_TVC = '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'

async function main () {
    TonClient.useBinaryLibrary(libNode)
    const client = new TonClient({ network: { endpoints: GQLS } })

    const keypair = await client.crypto.generate_random_sign_keys()
    console.log('generated secret key:      ', keypair.secret)
    console.log('generated public key:      ', keypair.public)

    const { address } = await client.abi.encode_message({
        abi: { type: 'Contract', value: SetcodeMultisigAbi },
        deploy_set: { tvc: SETCODE_MULTISIG_TVC, initial_data: {} },
        signer: { type: 'Keys', keys: keypair }
    })

    console.log('generated wallet address:  ', address, '\n')
    console.log('please send >= 0.5 coins to wallet address, awaiting...')

    let balance = 0n

    while (true) {
        const res = await getAccountBalance(client, address)
        balance = res ? res.balance : 0n
        if (balance >= 5n * 10n ** 8n) break
        sleep(1000)
    }

    console.log('\nwallet balance (nanoever): ', balance.toString(10))

    const deploy = await client.processing.process_message({
        send_events: false,
        message_encode_params: {
            abi: { type: 'Contract', value: SetcodeMultisigAbi },
            deploy_set: { tvc: SETCODE_MULTISIG_TVC, initial_data: {} },
            call_set: {
                function_name: 'constructor',
                input: {
                    owners: [ `0x${keypair.public}` ],
                    reqConfirms: 0,
                    lifetime: 0
                }
            },
            signer: { type: 'Keys', keys: keypair },
            processing_try_index: 1
        }
    })

    console.log('deploy transaction id:     ', deploy.transaction.id)

    const guessedSender = await guessSender(client, address)
    console.log('guessed sender address:    ', guessedSender)

    const sendBack = await client.processing.process_message({
        send_events: false,
        message_encode_params: {
            address,
            abi: { type: 'Contract', value: SetcodeMultisigAbi },
            call_set: {
                function_name: 'sendTransaction',
                input: {
                    dest: guessedSender,
                    value: 0,
                    bounce: false,
                    flags: 64,
                    payload: ''
                }
            },
            signer: { type: 'Keys', keys: keypair },
            processing_try_index: 1
        }
    })

    console.log('send back transaction id:  ', sendBack.transaction.id)

    process.exit(0)
}

main()
