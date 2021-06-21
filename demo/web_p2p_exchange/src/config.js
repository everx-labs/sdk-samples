/*
 * Contracts ABI and code.
 * You hardly need to change the following values
 */
const SAFE_MSIG_PACKAGE = require('./ton-contracts/SafeMultisigWallet.package')
const OFFER_PACKAGE = require('./ton-contracts/Offer.package')
const GIVER_PACKAGE = require('./ton-contracts/giver.package')

/*
 * Change TON_ENDPOINTS if you do not use TON OS SE
 */
const TON_ENDPOINTS = ['http://0.0.0.0'] // or ['net1.ton.dev', 'net5.ton.dev']
const TON_MESSAGE_PROCESSING_TIMEOUT = 60000
const TON_MESSAGE_RETRIES_COUNT = 5

/*
 * Change next 3 lines if you do not use TON OS SE and have your own giver contract
 */
const GIVER_ADDRESS = '0:b5e9240fc2d2f1ff8cbb1d1dee7fb7cae155e5f6320e585fcc685698994a19a5'
const GIVER_PUBLIC_KEY = '2ada2e65ab8eeab09490e3521415f45b6e42df9c760a639bcf53957550b25a16'
const GIVER_SECRET_KEY = '172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3'

/*
 * Change the following value if the offer contract has been modified and recompiled
 */
const OFFER_CONTRACT_CODE_HASH = 'd4f02afd27b2dac96acf3b21cde89fdb390ff18a35bc8fbff8fa87434f61f06f'

const WALLET_INITIAL_VALUE = 20 * 1e9 // Buyer and Seller wallets will be deployed with this balance

module.exports = {
    clientParams: {
        network: {
            endpoints: TON_ENDPOINTS,
            message_retries_count: TON_MESSAGE_RETRIES_COUNT,
        },
        abi: {
            message_processing_timeout: TON_MESSAGE_PROCESSING_TIMEOUT,
        },
    },
    walletInitialValue: WALLET_INITIAL_VALUE,
    contracts: {
        walletContract: {
            package: SAFE_MSIG_PACKAGE,
        },

        offerContract: {
            package: OFFER_PACKAGE,
            codeHash: OFFER_CONTRACT_CODE_HASH,
        },

        giverContract: {
            address: GIVER_ADDRESS,
            package: GIVER_PACKAGE,
            keyPair: {
                public: GIVER_PUBLIC_KEY,
                secret: GIVER_SECRET_KEY,
            },
        },
    },
}
