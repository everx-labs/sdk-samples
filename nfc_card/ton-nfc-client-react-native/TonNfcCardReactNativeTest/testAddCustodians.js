const { TONClient } = require('ton-client-node-js')

const { run, deploy } = require('./utils')
const {
    networks,
    contracts: { multisig },
} = require('./config')

const exit = (message, code) => {
    console.log(message)
    process.exit(code || 1)
}

;(async () => {
    try {
        const ton = await TONClient.create(networks.ton)
        const custodianA = {}
        const custodianB = {}
        const custodianC = {}
        const custodianD = {}

        custodianA.keyPair = await ton.crypto.ed25519Keypair()
        custodianB.keyPair = await ton.crypto.ed25519Keypair()
        custodianC.keyPair = await ton.crypto.ed25519Keypair()
        custodianD.keyPair = await ton.crypto.ed25519Keypair()

        const ownersPKs = [custodianA.keyPair.public]

        // 1. тест деплоит мульитсиг  с 1 кастодианом  (A)
        multisig.address = await deploy(ton)(
            { ...multisig, ...custodianA },
            {
                owners: ownersPKs.map((k) => `0x${k}`),
                reqConfirms: 1,
            },
        ).catch(exit)

        console.log('OK, multisig with custodian A deployed', ownersPKs)

        const reqConfirms = 2
        const { imageBase64 } = multisig.package
        const { codeBase64 } = await ton.contracts.getCodeFromImage({ imageBase64 })
        const { hash } = await ton.contracts.getBocHash({ bocBase64: codeBase64 })

        // 2.  потом добавляет второго,  (B)
        {
            ownersPKs.push(custodianB.keyPair.public)

        
            const { output } = await run(ton)({ ...multisig, ...custodianA }, 'submitUpdate', {
                codeHash: `0x${hash}`,
                owners: ownersPKs.map((k) => `0x${k}`),
                reqConfirms,
            })
            const { updateId } = output

            await run(ton)({ ...multisig, ...custodianA }, 'executeUpdate', { updateId, code: codeBase64 })
            console.log('OK, now custodians are: A B', ownersPKs)
        }

        // 3. Потом добавляет третьего  (С)
        {
            ownersPKs.push(custodianC.keyPair.public)

            //  Эту транзу засабмитил custodianB
            const { output } = await run(ton)({ ...multisig, ...custodianB }, 'submitUpdate', {
                codeHash: `0x${hash}`,
                owners: ownersPKs.map((k) => `0x${k}`),
                reqConfirms,
            })
            const { updateId } = output

            // Подтвердил и выполнил custodianA
            await run(ton)({ ...multisig, ...custodianA }, 'confirmUpdate', { updateId })
            await run(ton)({ ...multisig, ...custodianB }, 'executeUpdate', { updateId, code: codeBase64 })

            console.log('OK, now custodians are: A B C', ownersPKs)
        }

        // 4. Потом например кастодиан А и B добавляют вместо С  нового кастоиана D,
        {
            ownersPKs.pop() // remove custodianC

            ownersPKs.push(custodianD.keyPair.public)

            //  Эту транзу засабмитил custodianA
            const { output } = await run(ton)({ ...multisig, ...custodianA }, 'submitUpdate', {
                codeHash: `0x${hash}`,
                owners: ownersPKs.map((k) => `0x${k}`),
                reqConfirms,
            })
            const { updateId } = output

            // Подтвердил и выполнил custodianB
            await run(ton)({ ...multisig, ...custodianB }, 'confirmUpdate', { updateId })
            await run(ton)({ ...multisig, ...custodianB }, 'executeUpdate', { updateId, code: codeBase64 })

            console.log('OK, now custodians are: A B D, custodianC excluded', ownersPKs)
        }
        exit('Test finished', 0)
    } catch (e) {
        exit(e)
    }
})()