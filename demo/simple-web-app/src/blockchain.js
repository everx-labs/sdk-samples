/* eslint-disable consistent-return */

const buffer = require('buffer')
const { prop, last } = require('ramda')

const { add0x, strip0x, deploy, toNano, hexToUtf8, getBalance, getLocal, run } = require('./utils')
const {
    contracts: { giver, offerContract, walletContract },
} = require('./config')

if (globalThis && !globalThis.Buffer) {
    globalThis.Buffer = buffer.Buffer
}

module.exports = (client) => {
    const genKeyPair = () => client.crypto.generate_random_sign_keys()

    const getContractBalance = getBalance(client)

    const sellerDiscardsOffer = (address, keys) =>
        run(client)({ ...offerContract, address }, 'sellerDiscardsOffer', {}, keys)

    const sellerDoesTransfer = (address, keys) =>
        run(client)({ ...offerContract, address }, 'sellerDoesTransfer', {}, keys)

    const buyerDiscardsOffer = (address, keys) =>
        run(client)({ ...offerContract, address }, 'buyerDiscardsOffer', {}, keys)

    const buyerClaimsTransfer = (address, keys) =>
        run(client)({ ...offerContract, address }, 'buyerClaimsTransfer', {}, keys)

    const moderatorDoesTransfer = (address, keys, toBuyer) =>
        run(client)({ ...offerContract, address }, 'moderatorDoesTransfer', { flag: toBuyer }, keys)

    const buyerPlacesDeposit = async ({ dest, value, walletAddress, walletKeys }) => {
        const message_encode_params = {
            abi: {
                type: 'Contract',
                value: offerContract.package.abi,
            },
            is_internal: true,
            call_set: {
                function_name: 'buyerPlacesDeposit',
                input: { buyerPubkey: add0x(walletKeys.public) },
            },
            signer: {
                type: 'None',
            },
        }

        const { body } = await client.abi.encode_message_body(message_encode_params)

        return run(client)(
            { ...walletContract, address: walletAddress },
            'sendTransaction',
            {
                dest,
                value,
                bounce: true,
                flags: '65',
                payload: body,
            },
            walletKeys,
        )
    }

    const deployOffer = async ({ value, amount, deposit, currency, text, sellerWalletAddress, sellerWalletKeys }) => {
        const { abi, imageBase64 } = offerContract.package

        const address = await deploy(client)({
            abi,
            imageBase64,
            consParams: {
                amount,
                deposit,
                currency,
                text,
                pubkey: add0x(sellerWalletKeys.public),
                sellerWallet: sellerWalletAddress,
            },
            keys: await genKeyPair(),
            value,
            flags: '65',
            payload: '',
            giver: {
                ...walletContract,
                address: sellerWalletAddress,
                keyPair: sellerWalletKeys,
            },
        })
        return address
    }

    const deployWallet = async ({ value, keys }) => {
        const { abi, imageBase64 } = walletContract.package
        const address = deploy(client)({
            abi,
            imageBase64,
            consParams: {
                owners: [add0x(keys.public)],
                reqConfirms: 1,
            },
            keys,
            value,
            giver,
        })

        return address
    }

    // :: String -> Object
    const getOfferState = (address) =>
        getLocal(client)({ ...offerContract, address }, 'getOfferState', {}).then((offer) => {
            if (!offer) return {}
            const parsed = {
                fiatAmount: parseInt(offer.fiatAmount),
                fiatCurrency: hexToUtf8(offer.fiatCurrency),
                depositAmount: parseInt(offer.depositAmount),
                text: hexToUtf8(offer.text),
                sellerPubkey: strip0x(offer.sellerPubkey),
                buyerPubkey: strip0x(offer.buyerPubkey),
            }
            return Object.assign(offer, parsed)
        })

    // :: String -> Object | undefined
    const getOfferByAddress = async (address) => {
        const offer = await client.net
            .query_collection({
                collection: 'accounts',
                filter: {
                    id: { eq: address },
                },
                result: 'id balance',
            })
            .then((x) => x.result[0])

        if (offer) {
            const balance = parseInt(offer.balance)
            const details = await getOfferState(offer.id)
            Object.assign(offer, { balance }, details)
            return offer
        }
    }

    // :: {Numeric?, Numeric?, String, Numeric?} -> [Offer?]
    const getOffers = async ({ min, max, hash, limit }) => {
        const filter = {
            code_hash: { eq: hash },
            acc_type_name: { eq: 'Active' },
        }

        if (min !== undefined || max !== undefined) {
            filter.balance = {
                ...(min !== undefined ? { ge: toNano(min).toString(10) } : {}),
                ...(max !== undefined ? { le: toNano(max).toString(10) } : {}),
            }
        }

        let offers = []

        let lastPaid = Math.ceil(Date.now() / 1000)
        do {
            const records = await client.net
                .query_collection({
                    collection: 'accounts',
                    filter: {
                        ...filter,
                        last_paid: { lt: lastPaid },
                    },
                    order: [{ path: 'last_paid', direction: 'DESC' }],
                    result: 'id balance last_paid',
                })
                .then(prop('result'))

            offers = offers.concat(records)

            if (limit && offers.length >= limit) {
                offers = offers.slice(0, limit)
                break
            }

            lastPaid = prop('last_paid', last(records))
        } while (lastPaid)

        for (const offer of offers) {
            const details = await getOfferState(offer.id)
            const balance = parseInt(offer.balance)
            Object.assign(offer, { balance }, details)
        }
        return offers
    }

    return {
        buyerClaimsTransfer,
        buyerDiscardsOffer,
        buyerPlacesDeposit,
        deployOffer,
        deployWallet,
        genKeyPair,
        getContractBalance,
        getOfferByAddress,
        getOffers,
        moderatorDoesTransfer,
        sellerDiscardsOffer,
        sellerDoesTransfer,
    }
}
