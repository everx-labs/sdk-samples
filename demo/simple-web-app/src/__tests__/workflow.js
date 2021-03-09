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
const client = new TonClient(cfg.clientParams)

const seller = {}
const buyer = {}
const offer = {
    params: () => ({
        value: OFFER_AMOUNT,
        deposit: OFFER_DEPOSIT,
        amount: OFFER_FIAT_AMOUNT,
        currency: utf8ToHex(OFFER_FIAT_CURRENCY),
        text: utf8ToHex(OFFER_TEXT),
        sellerWalletKeys: seller.walletKeys,
        sellerWalletAddress: seller.walletAddress,
    }),
}
const {
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
} = blockchain(client)

beforeAll(async () => {
    seller.walletKeys = await genKeyPair()
    buyer.walletKeys = await genKeyPair()
})

test('Deploying seller and buyer wallets', async () => {
    seller.walletAddress = await deployWallet({
        value: WALLET_INITIAL_VALUE,
        keys: seller.walletKeys,
    })
    expect(isValidAddress(seller.walletAddress)).toBeTruthy()

    buyer.walletAddress = await deployWallet({
        value: WALLET_INITIAL_VALUE,
        keys: buyer.walletKeys,
    })
    expect(isValidAddress(buyer.walletAddress)).toBeTruthy()
})

test('Deploying offer contract', async () => {
    offer.address = await deployOffer(offer.params())
    expect(isValidAddress(offer.address)).toBeTruthy()

    const offerContractBalance = await getContractBalance(offer.address)
    expect(isNear(offerContractBalance, OFFER_AMOUNT)).toBeTruthy()
})

describe('Discarding an offer', () => {
    test('Seller tries to discard an offer', async () => {
        await expect(
            sellerDiscardsOffer(offer.address, seller.walletKeys), //
        ).resolves.not.toThrow()
    })
    test('Checking that all tokens was transfered back to the seller wallet', async () => {
        // Checking wallet balance during 1 minute
        let sellerWalletBalance
        for (let i = 0; i < 10; i++) {
            sellerWalletBalance = await getContractBalance(seller.walletAddress)
            if (isNear(sellerWalletBalance, WALLET_INITIAL_VALUE)) break
            await sleep(6000)
        }
        expect(isNear(sellerWalletBalance, WALLET_INITIAL_VALUE)).toBeTruthy()
    })
})

describe('Deploing ANOTHER offer contract', () => {
    test('Seller deploys an offer contract', async () => {
        offer.address = await deployOffer(offer.params())
        expect(isValidAddress(offer.address)).toBeTruthy()
    })

    test.skip('Buyer finds the offer and tries to discard it (very long test due to repeated attempts)', async () => {
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

        await expect(buyerDiscardsOffer(thisOffer.id, buyer.walletKeys)).rejects.toMatchObject({
            data: { exit_code: 101 },
        })
    })
})

describe('Buyer starts purchase', () => {
    test('Deposit placement', async () => {
        await expect(
            buyerPlacesDeposit({
                walletAddress: buyer.walletAddress,
                walletKeys: buyer.walletKeys,
                dest: offer.address,
                value: OFFER_DEPOSIT,
            }),
        ).resolves.not.toThrow()
    })
    test('Get offer state', async () => {
        let state
        for (let i = 0; i < 10; i++) {
            state = await getOfferByAddress(offer.address)
            if (buyer.walletKeys.public === state.buyerPubkey && buyer.walletAddress === state.buyerWallet) {
                break
            }
            await sleep(6000)
        }

        expect(buyer.walletKeys.public).toEqual(state.buyerPubkey)
        expect(buyer.walletAddress).toEqual(state.buyerWallet)
        expect(state.depositAmount).toEqual(OFFER_DEPOSIT)
        expect(state.text).toEqual(OFFER_TEXT)
    })
})

describe('Buyer paid fiat money and asks for tokens', () => {
    let now
    test("Setting 'buyerClaimsTransferTs' timestamp", async () => {
        await expect(
            buyerClaimsTransfer(offer.address, buyer.walletKeys), //
        ).resolves.not.toThrow()
        now = Math.floor(Date.now() / 1000)
    })

    test("Getting 'buyerClaimsTransferTs' timestamp", async () => {
        let buyerClaimsTransferTs
        for (let i = 0; i < 10; i++) {
            ;({ buyerClaimsTransferTs } = await getOfferByAddress(offer.address))
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
            sellerDiscardsOffer(offer.address, seller.walletKeys), //
        ).resolves.not.toThrow()
        now = Math.floor(Date.now() / 1000)
    })

    test("Getting 'sellerClaimsDiscardTs' timestamp", async () => {
        let sellerClaimsDiscardTs
        for (let i = 0; i < 10; i++) {
            ;({ sellerClaimsDiscardTs } = await getOfferByAddress(offer.address))
            if (sellerClaimsDiscardTs > 0) break
            await sleep(6000)
        }
        expect(Math.abs(sellerClaimsDiscardTs - now)).toBeLessThan(60) // less than 1 min
    })
})

describe('Moderator takes decission', () => {
    test('Moderator sends all tokens to the Buyer', async () => {
        await expect(
            moderatorDoesTransfer(offer.address, moderKeys, true), //
        ).resolves.not.toThrow()
    })

    test('Check the Buyer balance is increased', async () => {
        let buyerWalletBalance
        for (let i = 0; i < 10; i++) {
            buyerWalletBalance = await getContractBalance(buyer.walletAddress)
            if (isNear(buyerWalletBalance, WALLET_INITIAL_VALUE + OFFER_AMOUNT)) break
            await sleep(6000)
        }

        expect(isNear(buyerWalletBalance, WALLET_INITIAL_VALUE + OFFER_AMOUNT)).toBeTruthy()
    })
})

afterAll(async () => {
    client.close()
})
