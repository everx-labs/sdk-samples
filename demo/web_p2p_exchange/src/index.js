/* eslint-disable no-console */

const { libWeb } = require('@tonclient/lib-web')
const { TonClient } = require('@tonclient/core')
const currency = require('currency.js')

const table = require('./table')
const blockchain = require('./blockchain')
const { clickHandler, exec, $, $val } = require('./helpers')
const { utf8ToHex, fromNano, sleep, toNano } = require('./utils')
const {
    clientParams,
    walletInitialValue,
    contracts: { offerContract },
} = require('./config')

const main = async () => {
    TonClient.useBinaryLibrary(libWeb)
    TonClient.defaultConfig = clientParams

    const { deployOffer, deployWallet } = blockchain(TonClient.default)

    const wallet = await exec('Deploy wallet', async () => deployWallet(walletInitialValue))
    if (!wallet) throw Error('The app is not configured correctly. Have you tried "npm run test"?')

    const submitOffer = async () => {
        const value = $val('tokens_amount')
        const deposit = $val('tokens_deposit')
        const amount = $val('fiat_amount')
        const currency = $val('fiat_currency')
        const details = $val('bank_details')
        if (!value || !deposit || !amount || !currency || !details) {
            throw Error('Deposit, Amount, Currency, bank details are required')
        }
        return deployOffer({
            value: toNano(value),
            deposit: toNano(deposit),
            amount,
            currency: utf8ToHex(currency),
            text: utf8ToHex([details, $val('other_details')].join(';')),
            wallet,
        })
    }
    const offersTable = table({
        client: TonClient.default,
        queryParams: {
            hash: offerContract.codeHash,
            min: 1,
            limit: 10,
        },
        wallet,
    })

    const updateBalance = async () => {
        wallet.refresh()
        const info = await wallet.getAccount()
        $('wallet_balance').innerHTML = currency(fromNano(parseInt(info.balance)))
    }

    $('wallet_address').innerHTML = await wallet.getAddress()
    $('balance_btn').onclick = () => clickHandler('Update balance', updateBalance)
    $('offer_btn').onclick = () => clickHandler('Submit offer', () => submitOffer())

    $('update_interval_block').hidden = false
    while (true) {
        await offersTable
            .populate($('table_offers'))
            .then(updateBalance)
            .catch(console.log)
            .finally(() => sleep(parseInt($('update_interval').value, 10) * 1000))
    }
}

main().catch(console.log)
