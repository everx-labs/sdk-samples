const currency = require('currency.js')

const blockchain = require('./blockchain')
const { clickHandler, log } = require('./helpers')
const { isValidPublicKey, fromNano } = require('./utils')

const isModerator = false // Moderator UI is not implemented for simplicity

const table = ({ queryParams, client, wallet }) => ({
    offers: [],
    populate: async (containerElem) => {
        const {
            buyerPlacesDeposit,
            buyerClaimsTransfer,
            buyerDiscardsOffer,
            getOffers,
            // moderatorDoesTransfer,
            sellerDiscardsOffer,
            sellerDoesTransfer,
        } = blockchain(client)

        const walletKeys = wallet.signer.keys

        const offers = await getOffers(queryParams)

        if (JSON.stringify(offers) === JSON.stringify(this.offers)) {
            return // No changes
        }

        // Clear table
        while (containerElem.firstChild) containerElem.removeChild(containerElem.lastChild)

        this.offers = offers
        this.offers.forEach((r) => {
            const tr = document.createElement('tr')
            const addCol = (x = '') => {
                const td = document.createElement('td')
                if (typeof x === 'string') {
                    td.innerHTML = x
                } else {
                    td.appendChild(x)
                }
                return tr.appendChild(td)
            }

            const xs = [
                currency(fromNano(r.balance), { precision: 9 }).toString(),
                currency(fromNano(r.depositAmount), { precision: 9 }).toString(),
                currency(r.fiatAmount).toString(),
                r.fiatCurrency.toString(),
                r.text,
            ]

            xs.forEach(addCol)

            // Add buttons
            const container = addCol()
            const addButton = (text, fn, ...args) => {
                const btn = document.createElement('button')
                btn.innerHTML = text
                btn.onclick = () => clickHandler(text, () => fn(...args))
                container.appendChild(btn)
            }

            const isMyBuy = r.buyerPubkey === walletKeys.public
            const isDepositPaid = isValidPublicKey(r.buyerPubkey)
            const isMyOffer = r.sellerPubkey === walletKeys.public

            addButton('i', log, 'The offer', JSON.stringify(r, null, 2))

            if (isModerator) {
                // addButton('Transfer to buyer', moderatorDoesTransfer, r.id, moderKeys, true)
                // addButton('Transfer to seller', moderatorDoesTransfer, r.id, moderKeys, false)
            } else if (isMyOffer) {
                if (isDepositPaid) {
                    addButton('setDiscardFlag', sellerDiscardsOffer, r.id, walletKeys)
                    addButton('Transfer', sellerDoesTransfer, r.id, walletKeys)
                } else {
                    addButton('Discard', sellerDiscardsOffer, r.id, walletKeys)
                }
            } else if (isMyBuy) {
                addButton('Discard', buyerDiscardsOffer, r.id, walletKeys)
                addButton('SetTransferRequestFlag', buyerClaimsTransfer, r.id, walletKeys)
            } else if (!isDepositPaid) {
                addButton('Send deposit', buyerPlacesDeposit, {
                    dest: r.id,
                    value: r.depositAmount,
                    wallet,
                })
            }

            containerElem.appendChild(tr)
        })
    },
})

module.exports = table
