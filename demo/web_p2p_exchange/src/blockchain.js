/* eslint-disable consistent-return */

const buffer = require('buffer')
const { prop, path, last } = require('ramda')
const { Account } = require('@tonclient/appkit')
const { signerKeys } = require('@tonclient/core')

const { add0x, strip0x, toNano, hexToUtf8 } = require('./utils')
const {
    contracts: { offerContract, walletContract, giverContract },
} = require('./config')

if (globalThis && !globalThis.Buffer) {
    globalThis.Buffer = buffer.Buffer
}

module.exports = (client) => {
    const withOffer = (address, fn, input, keys) => {
        const offer = new Account(offerContract.package, { address })
        return offer.run(fn, input, { signer: { type: 'Keys', keys } })
    }
    const sellerDiscardsOffer = (address, keys) => withOffer(address, 'sellerDiscardsOffer', {}, keys)

    const sellerDoesTransfer = (address, keys) => withOffer(address, 'sellerDoesTransfer', {}, keys)

    const buyerDiscardsOffer = (address, keys) => withOffer(address, 'buyerDiscardsOffer', {}, keys)

    const buyerClaimsTransfer = (address, keys) => withOffer(address, 'buyerClaimsTransfer', {}, keys)

    const moderatorDoesTransfer = (address, keys, toBuyer) =>
        withOffer(address, 'moderatorDoesTransfer', { flag: toBuyer }, keys)

    const buyerPlacesDeposit = async ({ dest, value, wallet }) => {
        const message_encode_params = {
            abi: {
                type: 'Contract',
                value: offerContract.package.abi,
            },
            is_internal: true,
            call_set: {
                function_name: 'buyerPlacesDeposit',
                input: { buyerPubkey: add0x(wallet.signer.keys.public) },
            },
            signer: {
                type: 'None',
            },
        }

        const { body } = await client.abi.encode_message_body(message_encode_params)
        return wallet.run('sendTransaction', {
            dest,
            value,
            bounce: true,
            flags: '65',
            payload: body,
        })
    }

    // :: address
    const deployOffer = async ({ value, amount, deposit, currency, text, wallet }) => {
        const offer = new Account(offerContract.package, {
            signer: {
                type: 'Keys',
                keys: await client.crypto.generate_random_sign_keys(),
            },
        })

        const address = await offer.getAddress()

        // Credit account
        await wallet.run('sendTransaction', {
            dest: address,
            value,
            bounce: false,
            flags: '65',
            payload: '',
        })

        await offer.deploy({
            initInput: {
                amount,
                deposit,
                currency,
                text,
                pubkey: add0x(wallet.signer.keys.public),
                sellerWallet: await wallet.getAddress(),
            },
        })
        return offer
    }

    const giverFn = async (dest, value) => {
        const giver = new Account(giverContract.package, {
            address: giverContract.address,
            signer: signerKeys(giverContract.keyPair),
        })
        return giver.run('sendTransaction', { dest, value, bounce: false })
    }

    const deployWallet = async (value) => {
        const signer = signerKeys(await client.crypto.generate_random_sign_keys())
        const wallet = new Account(walletContract.package, { signer })

        const walletAddress = await wallet.getAddress()

        await wallet.deploy({
            initFunctionName: 'constructor',
            initInput: {
                owners: [add0x(signer.keys.public)],
                reqConfirms: 1,
            },
            useGiver: { address: giverContract.address, sendTo: () => giverFn(walletAddress, value) },
        })
        return wallet
    }

    // :: String -> Object
    const getOfferState = async (address) => {
        const offer = new Account(offerContract.package, { address })
        const state = await offer.runLocal('getOfferState', {}).then(path(['decoded', 'output']))
        await offer.free()

        if (!state) return {}

        const parsed = {
            fiatAmount: parseInt(state.fiatAmount),
            fiatCurrency: hexToUtf8(state.fiatCurrency),
            depositAmount: parseInt(state.depositAmount),
            text: hexToUtf8(state.text),
            sellerPubkey: strip0x(state.sellerPubkey),
            buyerPubkey: strip0x(state.buyerPubkey),
        }
        return Object.assign(state, parsed)
    }

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
        getOfferByAddress,
        getOffers,
        moderatorDoesTransfer,
        sellerDiscardsOffer,
        sellerDoesTransfer,
    }
}
