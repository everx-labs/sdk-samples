/* eslint-disable no-console */
/* eslint-disable no-extra-semi */

const { TonClient } = require('@tonclient/core')
const { libNode } = require('@tonclient/lib-node')

const blockchain = require('../blockchain')
const { isNear, sleep, isValidAddress, utf8ToHex } = require('../utils')
const cfg = require('../config')

const moderKeys = {
    public: 'a0aee23f3f4572fb9c664713e67f72fbbf1dcc72ca4891b9a0d07432aad83d8c',
    secret: 'c91aa87253d05fb79a5432ef38e004d25f0064d936e9da3b951f8c8e90a6a53f',
}

const WALLET_INITIAL_VALUE = 50 * 1e9 // 50 crystal

const OFFER_AMOUNT = 40 * 1e9 // in nanotokens
const OFFER_DEPOSIT = 2 * 1e9

const OFFER_FIAT_AMOUNT = 1000
const OFFER_FIAT_CURRENCY = 'EUR'
const OFFER_TEXT = 'SWIFT CHASUS33AEG, Lithuania, acc #1234567890, David Mills. Only fast transfers'

TonClient.useBinaryLibrary(libNode)
TonClient.defaultConfig = cfg.clientParams

const client = TonClient.default

let buyer
let seller
let offer

const offerParams = () => ({
    value: OFFER_AMOUNT,
    deposit: OFFER_DEPOSIT,
    amount: OFFER_FIAT_AMOUNT,
    currency: utf8ToHex(OFFER_FIAT_CURRENCY),
    text: utf8ToHex(OFFER_TEXT),
    wallet: seller,
})

const {
    buyerClaimsTransfer,
    buyerDiscardsOffer,
    buyerPlacesDeposit,
    deployOffer,
    deployWallet,
    getOfferByAddress,
    getOffers,
    moderatorDoesTransfer,
    sellerDiscardsOffer,
} = blockchain(client)

test('Deploying seller and buyer wallets', async () => {
    seller = await deployWallet(WALLET_INITIAL_VALUE)
    expect(isValidAddress(await seller.getAddress())).toBeTruthy()

    buyer = await deployWallet(WALLET_INITIAL_VALUE)
    expect(isValidAddress(await buyer.getAddress())).toBeTruthy()
})

test('Deploying offer contract', async () => {
    offer = await deployOffer(offerParams())
    expect(isValidAddress(await offer.getAddress())).toBeTruthy()

    const { balance } = await offer.getAccount()
    expect(isNear(balance, OFFER_AMOUNT)).toBeTruthy()
})

describe('Discarding an offer', () => {
    test('Seller tries to discard an offer', async () => {
        await expect(
            sellerDiscardsOffer(await offer.getAddress(), seller.signer.keys), //
        ).resolves.not.toThrow()
    })

    test('Checking that all tokens was transfered back to the seller wallet', async () => {
        // Checking wallet balance during 1 minute
        let balance
        for (let i = 0; i < 10; i++) {
            seller.refresh()
            ;({ balance } = await seller.getAccount())
            if (isNear(balance, WALLET_INITIAL_VALUE)) break
            await sleep(6000)
        }
        expect(isNear(balance, WALLET_INITIAL_VALUE)).toBeTruthy()
    })
})

describe('Deploing ANOTHER offer contract', () => {
    test('Seller deploys an offer contract', async () => {
        offer = await deployOffer(offerParams())
        expect(isValidAddress(await offer.getAddress())).toBeTruthy()
    })

    test('Buyer finds the offer and tries to discard it', async () => {
        let thisOffer
        for (let i = 0; i < 10; i++) {
            const results = await getOffers({
                min: 30,
                max: 50,
                hash: cfg.contracts.offerContract.codeHash,
            })

            thisOffer = results.find((r) => r.id === offer.address)
            if (thisOffer) break
            await sleep(6000)
        }

        expect(thisOffer).toBeTruthy()
        expect(thisOffer.text).toEqual(OFFER_TEXT)

        await expect(buyerDiscardsOffer(thisOffer.id, buyer.signer.keys)).rejects.toMatchObject({
            data: { exit_code: 101 },
        })
    })
})

describe('Buyer starts purchase', () => {
    test('Deposit placement', async () => {
        await expect(
            buyerPlacesDeposit({
                dest: offer.address,
                value: OFFER_DEPOSIT,
                wallet: buyer,
            }),
        ).resolves.not.toThrow()
    })
    test('Get offer state', async () => {
        let state
        const buyerWalletAddress = await buyer.getAddress()
        for (let i = 0; i < 10; i++) {
            state = await getOfferByAddress(await offer.getAddress())
            if (buyer.signer.keys.public === state.buyerPubkey && buyerWalletAddress === state.buyerWallet) {
                break
            }
            await sleep(6000)
        }

        expect(buyer.signer.keys.public).toEqual(state.buyerPubkey)
        expect(await buyer.getAddress()).toEqual(state.buyerWallet)
        expect(state.depositAmount).toEqual(OFFER_DEPOSIT)
        expect(state.text).toEqual(OFFER_TEXT)
    })
})

describe('Buyer paid fiat money and asks for tokens', () => {
    let now
    test("Setting 'buyerClaimsTransferTs' timestamp", async () => {
        await expect(
            buyerClaimsTransfer(await offer.getAddress(), buyer.signer.keys), //
        ).resolves.not.toThrow()
        now = Math.floor(Date.now() / 1000)
    })

    test("Getting 'buyerClaimsTransferTs' timestamp", async () => {
        let buyerClaimsTransferTs
        for (let i = 0; i < 10; i++) {
            ;({ buyerClaimsTransferTs } = await getOfferByAddress(await offer.getAddress()))
            if (buyerClaimsTransferTs > 0) break
            await sleep(6000)
        }
        expect(Math.abs(buyerClaimsTransferTs - now)).toBeLessThan(60) // less than 1 min
    })
})

describe('Seller did not recieve fiat money and wants to discard the offer', () => {
    let now
    test("Setting 'sellerDiscardsOfferTs' timestamp", async () => {
        await expect(
            sellerDiscardsOffer(await offer.getAddress(), seller.signer.keys), //
        ).resolves.not.toThrow()
        now = Math.floor(Date.now() / 1000)
    })

    test("Getting 'sellerClaimsDiscardTs' timestamp", async () => {
        let sellerClaimsDiscardTs
        for (let i = 0; i < 10; i++) {
            ;({ sellerClaimsDiscardTs } = await getOfferByAddress(await offer.getAddress()))
            if (sellerClaimsDiscardTs > 0) break
            await sleep(6000)
        }
        expect(Math.abs(sellerClaimsDiscardTs - now)).toBeLessThan(60) // less than 1 min
    })
})

describe('Moderator takes decission', () => {
    test('Moderator sends all tokens to the Buyer', async () => {
        await expect(
            moderatorDoesTransfer(await offer.getAddress(), moderKeys, true), //
        ).resolves.not.toThrow()
    })

    test('Check the Buyer balance is increased', async () => {
        let balance
        for (let i = 0; i < 10; i++) {
            ;({ balance } = await buyer.getAccount())
            if (isNear(balance, WALLET_INITIAL_VALUE + OFFER_AMOUNT)) break
            await sleep(6000)
        }

        expect(isNear(balance, WALLET_INITIAL_VALUE + OFFER_AMOUNT)).toBeTruthy()
    })
})

afterAll(async () => {
    client.close()
})
