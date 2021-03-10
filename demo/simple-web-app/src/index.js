/* eslint-disable no-console */

const currency = require('currency.js')
const { TonClient } = require('@tonclient/core')
const { libWeb } = require('@tonclient/lib-web')

const table = require('./table')
const blockchain = require('./blockchain')
const { contracts, clientParams } = require('./config')
const { clickHandler, exec, $, $val } = require('./helpers')
const { utf8ToHex, fromNano, sleep, toNano } = require('./utils')

const WALLET_INITIAL_VALUE = 20 * 1e9

const main = async () => {
    TonClient.useBinaryLibrary(libWeb)
    const client = new TonClient(clientParams)
    const { deployOffer, deployWallet, genKeyPair, getContractBalance } = blockchain(client)

    // :: {walletAddress, walletKeys} | undefined
    const deployUserWallet = async (amount) =>
        exec('Deploy wallet', async () => {
            const walletKeys = await genKeyPair()
            const walletAddress = await deployWallet({ value: amount, keys: walletKeys })
            return { walletKeys, walletAddress }
        })

    const getBalance = async (walletAddress) => {
        const balance = await getContractBalance(walletAddress)
        return currency(fromNano(parseInt(balance)))
    }
    const checkOfferParams = () => {
        if (!$val('tokens_amount') || !$val('tokens_deposit') || !$val('fiat_amount') || !$val('fiat_currency')) {
            alert('Deposit, Amount, Currency are required')
            return false
        }
        return true
    }

    const submitOffer = async (walletAddress, walletKeys) => {
        const params = {
            value: toNano($val('tokens_amount')),
            deposit: toNano($val('tokens_deposit')),
            amount: $val('fiat_amount'),
            currency: utf8ToHex($val('fiat_currency')),
            text: utf8ToHex([$val('bank_details'), $val('other_details')].join(';')),
            sellerWalletKeys: walletKeys,
            sellerWalletAddress: walletAddress,
        }
        return deployOffer(params)
    }

    const { walletAddress, walletKeys } = await deployUserWallet(WALLET_INITIAL_VALUE).then((result) => {
        if (result === undefined) {
            throw Error('The app is not configured correctly. Have you tried "npm run test"?')
        }
        return result
    })

    const offersTab = table({
        client,
        walletAddress,
        walletKeys,
        queryParams: {
            hash: contracts.offerContract.codeHash,
            min: 1,
            limit: 10,
        },
    })

    const updateBalance = async () => {
        $('wallet_balance').innerHTML = await getBalance(walletAddress)
    }

    $('wallet_address').innerHTML = walletAddress
    $('balance_btn').onclick = () => clickHandler('Update balance', updateBalance)
    $('offer_btn').onclick = () =>
        checkOfferParams() && clickHandler('Submit offer', () => submitOffer(walletAddress, walletKeys))

    $('update_interval_block').hidden = false
    while (true) {
        await offersTab
            .populate($('table_offers'))
            .then(updateBalance)
            .catch(console.log)
            .finally(() => sleep(parseInt($('update_interval').value, 10) * 1000))
    }
}

main().catch(console.log)
