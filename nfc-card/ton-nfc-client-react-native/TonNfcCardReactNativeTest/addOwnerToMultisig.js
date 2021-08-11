const utils = require('./utils')

const addOwnerToMultisig = async ({ ton, multisig, ownersPKs /* array of custodian's PK */ }) => {
    const { imageBase64 } = multisig.package

    const { codeBase64 } = await ton.contracts.getCodeFromImage({ imageBase64 })
    const { hash } = await ton.contracts.getBocHash({ bocBase64: codeBase64 })

    const { output } = await utils.run(ton)(multisig, 'submitUpdate', {
        codeHash: `0x${hash}`,
        owners: ownersPKs.map((k) => `0x${k}`),
        reqConfirms: ownersPKs.length,
    })
    const { updateId } = output

    await utils.run(ton)(multisig, 'executeUpdate', { updateId, code: codeBase64 })
}

module.exports = addOwnerToMultisig