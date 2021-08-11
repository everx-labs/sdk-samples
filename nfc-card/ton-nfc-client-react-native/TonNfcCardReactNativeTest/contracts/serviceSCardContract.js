//
// This file was generated using TON Labs developer tools.
//

const abi = {
	"ABI version": 2,
	"header": ["pubkey", "time", "expire"],
	"functions": [
		{
			"name": "constructor",
			"inputs": [
				{"name":"cardSafeAddress","type":"address"},
				{"name":"lastShippingId","type":"uint128"}
			],
			"outputs": [
			]
		},
		{
			"name": "uploadCards",
			"inputs": [
				{"name":"batchId","type":"uint64"},
				{"components":[{"name":"sn","type":"uint192"},{"name":"data","type":"bytes"}],"name":"newCards","type":"tuple[]"}
			],
			"outputs": [
				{"name":"collisions","type":"uint8"}
			]
		},
		{
			"name": "updateCardState",
			"inputs": [
				{"name":"sn","type":"uint192"},
				{"name":"state","type":"uint8"}
			],
			"outputs": [
			]
		},
		{
			"name": "updateBatchState",
			"inputs": [
				{"name":"batchId","type":"uint64"},
				{"name":"state","type":"uint8"}
			],
			"outputs": [
			]
		},
		{
			"name": "initShipping",
			"inputs": [
				{"name":"userTrackingContract","type":"address"},
				{"name":"numCards","type":"uint32"},
				{"name":"payload","type":"cell"}
			],
			"outputs": [
			]
		},
		{
			"name": "linkCardToUser",
			"inputs": [
				{"name":"shippingId","type":"uint128"},
				{"name":"trackingNumber","type":"bytes"},
				{"name":"cards","type":"uint192[]"}
			],
			"outputs": [
			]
		},
		{
			"name": "finishVerificationCard",
			"inputs": [
				{"name":"sn","type":"uint192"},
				{"name":"isOk","type":"bool"},
				{"name":"data","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "updateShippingState",
			"inputs": [
				{"name":"shippingId","type":"uint128"},
				{"name":"state","type":"uint8"}
			],
			"outputs": [
			]
		},
		{
			"name": "setUserContractCode",
			"inputs": [
				{"name":"contractCode","type":"cell"},
				{"name":"initState","type":"cell"},
				{"name":"constructorId","type":"uint32"},
				{"name":"contractVersion","type":"uint16"}
			],
			"outputs": [
			]
		},
		{
			"name": "deployUserContract",
			"inputs": [
				{"name":"userPublicKey","type":"uint256"},
				{"name":"userId","type":"uint256"}
			],
			"outputs": [
				{"name":"value0","type":"address"}
			]
		},
		{
			"name": "getPublicKey",
			"inputs": [
			],
			"outputs": [
				{"name":"ownerKey","type":"uint256"}
			]
		},
		{
			"name": "getCard",
			"inputs": [
				{"name":"sn","type":"uint192"}
			],
			"outputs": [
				{"components":[{"name":"sn","type":"uint192"},{"name":"batchId","type":"uint64"},{"name":"data","type":"bytes"},{"name":"state","type":"uint8"},{"name":"uTracking","type":"address"},{"name":"shippingId","type":"uint128"}],"name":"card","type":"tuple"}
			]
		},
		{
			"name": "getBatch",
			"inputs": [
				{"name":"batchId","type":"uint64"}
			],
			"outputs": [
				{"components":[{"name":"id","type":"uint64"},{"name":"state","type":"uint8"},{"name":"qty","type":"uint32"},{"name":"generatedAt","type":"uint32"},{"name":"producedAt","type":"uint32"}],"name":"batch","type":"tuple"}
			]
		},
		{
			"name": "getUnusedCardsCount",
			"inputs": [
				{"name":"batchId","type":"uint64"}
			],
			"outputs": [
				{"name":"qty","type":"uint32"}
			]
		},
		{
			"name": "getWaitingCount",
			"inputs": [
			],
			"outputs": [
				{"name":"numShippings","type":"uint32"},
				{"name":"numCards","type":"uint32"}
			]
		},
		{
			"name": "getCardsByState",
			"inputs": [
				{"name":"state","type":"uint8"},
				{"name":"batchId","type":"uint64"}
			],
			"outputs": [
				{"components":[{"name":"sn","type":"uint192"},{"name":"batchId","type":"uint64"},{"name":"data","type":"bytes"},{"name":"state","type":"uint8"},{"name":"uTracking","type":"address"},{"name":"shippingId","type":"uint128"}],"name":"cardList","type":"tuple[]"}
			]
		},
		{
			"name": "getShippingList",
			"inputs": [
				{"name":"state","type":"uint8"}
			],
			"outputs": [
				{"components":[{"name":"id","type":"uint128"},{"name":"qty","type":"uint32"},{"name":"uTracking","type":"address"},{"name":"payload","type":"cell"}],"name":"shippingList","type":"tuple[]"}
			]
		},
		{
			"name": "getVersion",
			"inputs": [
			],
			"outputs": [
				{"name":"version","type":"uint16"}
			]
		},
		{
			"name": "upgradeCode",
			"inputs": [
				{"name":"newcode","type":"cell"},
				{"name":"version","type":"uint16"}
			],
			"outputs": [
			]
		}
	],
	"data": [
	],
	"events": [
		{
			"name": "TransferAccepted",
			"inputs": [
				{"name":"payload","type":"cell"},
				{"name":"shippingId","type":"uint128"}
			],
			"outputs": [
			]
		},
		{
			"name": "ChekAddress",
			"inputs": [
				{"name":"userContractAddress","type":"address"},
				{"name":"newUserContract","type":"address"}
			],
			"outputs": [
			]
		}
	]
};

const pkg = {
    abi,
    imageBase64: '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',
};

class ServiceSCardContract {
    /**
    * @param {TONClient} client
    * @param {string} address can be null if contract will be deployed
    * @param {TONKeyPairData} keys
    */
    constructor(client, address, keys) {
        this.client = client;
        this.address = address;
        this.keys = keys;
        this.package = pkg;
        this.abi = abi;
    }

    /**
     * @param {object} constructorParams
     * @param {string} constructorParams.cardSafeAddress (address)
     * @param {uint128} constructorParams.lastShippingId
     */
    async deploy(constructorParams) {
        if (!this.keys) {
            this.keys = await this.client.crypto.ed25519Keypair();
        }
        this.address = (await this.client.contracts.deploy({
            package: pkg,
            constructorParams,
            initParams: {},
            keyPair: this.keys,
        })).address;
    }

    /**
    * @param {string} functionName
    * @param {object} input
    * @return {Promise.<object>}
    */
    async run(functionName, input) {
        const result = await this.client.contracts.run({
            address: this.address,
            functionName,
            abi,
            input,
            keyPair: this.keys,
        });
        return result.output;
    }

   /**
    * @param {string} functionName
    * @param {object} input
    * @return {Promise.<object>}
    */
    async runLocal(functionName, input) {
        const result = await this.client.contracts.runLocal({
            address: this.address,
            functionName,
            abi,
            input,
            keyPair: this.keys,
        });
        return result.output;
    }

    /**
     * @typedef ServiceSCardContract_uploadCards
     * @type {object}
     * @property {number} collisions  (uint8)
     */

    /**
     * @param {object} params
     * @param {uint64} params.batchId
     * @param {tuple[]} params.newCards
     * @return {Promise.<ServiceSCardContract_uploadCards>}
     */
    uploadCards(params) {
        return this.run('uploadCards', params);
    }

    /**
     * @param {object} params
     * @param {uint64} params.batchId
     * @param {tuple[]} params.newCards
     * @return {Promise.<ServiceSCardContract_uploadCards>}
     */
    uploadCardsLocal(params) {
        return this.runLocal('uploadCards', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @param {number} params.state (uint8)
     */
    updateCardState(params) {
        return this.run('updateCardState', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @param {number} params.state (uint8)
     */
    updateCardStateLocal(params) {
        return this.runLocal('updateCardState', params);
    }

    /**
     * @param {object} params
     * @param {uint64} params.batchId
     * @param {number} params.state (uint8)
     */
    updateBatchState(params) {
        return this.run('updateBatchState', params);
    }

    /**
     * @param {object} params
     * @param {uint64} params.batchId
     * @param {number} params.state (uint8)
     */
    updateBatchStateLocal(params) {
        return this.runLocal('updateBatchState', params);
    }

    /**
     * @param {object} params
     * @param {string} params.userTrackingContract (address)
     * @param {number} params.numCards (uint32)
     * @param {cell} params.payload
     */
    initShipping(params) {
        return this.run('initShipping', params);
    }

    /**
     * @param {object} params
     * @param {string} params.userTrackingContract (address)
     * @param {number} params.numCards (uint32)
     * @param {cell} params.payload
     */
    initShippingLocal(params) {
        return this.runLocal('initShipping', params);
    }

    /**
     * @param {object} params
     * @param {uint128} params.shippingId
     * @param {bytes} params.trackingNumber
     * @param {uint192[]} params.cards
     */
    linkCardToUser(params) {
        return this.run('linkCardToUser', params);
    }

    /**
     * @param {object} params
     * @param {uint128} params.shippingId
     * @param {bytes} params.trackingNumber
     * @param {uint192[]} params.cards
     */
    linkCardToUserLocal(params) {
        return this.runLocal('linkCardToUser', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @param {bool} params.isOk
     * @param {bytes} params.data
     */
    finishVerificationCard(params) {
        return this.run('finishVerificationCard', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @param {bool} params.isOk
     * @param {bytes} params.data
     */
    finishVerificationCardLocal(params) {
        return this.runLocal('finishVerificationCard', params);
    }

    /**
     * @param {object} params
     * @param {uint128} params.shippingId
     * @param {number} params.state (uint8)
     */
    updateShippingState(params) {
        return this.run('updateShippingState', params);
    }

    /**
     * @param {object} params
     * @param {uint128} params.shippingId
     * @param {number} params.state (uint8)
     */
    updateShippingStateLocal(params) {
        return this.runLocal('updateShippingState', params);
    }

    /**
     * @param {object} params
     * @param {cell} params.contractCode
     * @param {cell} params.initState
     * @param {number} params.constructorId (uint32)
     * @param {number} params.contractVersion (uint16)
     */
    setUserContractCode(params) {
        return this.run('setUserContractCode', params);
    }

    /**
     * @param {object} params
     * @param {cell} params.contractCode
     * @param {cell} params.initState
     * @param {number} params.constructorId (uint32)
     * @param {number} params.contractVersion (uint16)
     */
    setUserContractCodeLocal(params) {
        return this.runLocal('setUserContractCode', params);
    }

    /**
     * @typedef ServiceSCardContract_deployUserContract
     * @type {object}
     * @property {string} value0  (address)
     */

    /**
     * @param {object} params
     * @param {string} params.userPublicKey (uint256)
     * @param {string} params.userId (uint256)
     * @return {Promise.<ServiceSCardContract_deployUserContract>}
     */
    deployUserContract(params) {
        return this.run('deployUserContract', params);
    }

    /**
     * @param {object} params
     * @param {string} params.userPublicKey (uint256)
     * @param {string} params.userId (uint256)
     * @return {Promise.<ServiceSCardContract_deployUserContract>}
     */
    deployUserContractLocal(params) {
        return this.runLocal('deployUserContract', params);
    }

    /**
     * @typedef ServiceSCardContract_getPublicKey
     * @type {object}
     * @property {string} ownerKey  (uint256)
     */

    /**
     * @return {Promise.<ServiceSCardContract_getPublicKey>}
     */
    getPublicKey() {
        return this.run('getPublicKey', {});
    }

    /**
     * @return {Promise.<ServiceSCardContract_getPublicKey>}
     */
    getPublicKeyLocal() {
        return this.runLocal('getPublicKey', {});
    }

    /**
     * @typedef ServiceSCardContract_getCard
     * @type {object}
     * @property {tuple} card 
     */

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @return {Promise.<ServiceSCardContract_getCard>}
     */
    getCard(params) {
        return this.run('getCard', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @return {Promise.<ServiceSCardContract_getCard>}
     */
    getCardLocal(params) {
        return this.runLocal('getCard', params);
    }

    /**
     * @typedef ServiceSCardContract_getBatch
     * @type {object}
     * @property {tuple} batch 
     */

    /**
     * @param {object} params
     * @param {uint64} params.batchId
     * @return {Promise.<ServiceSCardContract_getBatch>}
     */
    getBatch(params) {
        return this.run('getBatch', params);
    }

    /**
     * @param {object} params
     * @param {uint64} params.batchId
     * @return {Promise.<ServiceSCardContract_getBatch>}
     */
    getBatchLocal(params) {
        return this.runLocal('getBatch', params);
    }

    /**
     * @typedef ServiceSCardContract_getUnusedCardsCount
     * @type {object}
     * @property {number} qty  (uint32)
     */

    /**
     * @param {object} params
     * @param {uint64} params.batchId
     * @return {Promise.<ServiceSCardContract_getUnusedCardsCount>}
     */
    getUnusedCardsCount(params) {
        return this.run('getUnusedCardsCount', params);
    }

    /**
     * @param {object} params
     * @param {uint64} params.batchId
     * @return {Promise.<ServiceSCardContract_getUnusedCardsCount>}
     */
    getUnusedCardsCountLocal(params) {
        return this.runLocal('getUnusedCardsCount', params);
    }

    /**
     * @typedef ServiceSCardContract_getWaitingCount
     * @type {object}
     * @property {number} numShippings  (uint32)
     * @property {number} numCards  (uint32)
     */

    /**
     * @return {Promise.<ServiceSCardContract_getWaitingCount>}
     */
    getWaitingCount() {
        return this.run('getWaitingCount', {});
    }

    /**
     * @return {Promise.<ServiceSCardContract_getWaitingCount>}
     */
    getWaitingCountLocal() {
        return this.runLocal('getWaitingCount', {});
    }

    /**
     * @typedef ServiceSCardContract_getCardsByState
     * @type {object}
     * @property {tuple[]} cardList 
     */

    /**
     * @param {object} params
     * @param {number} params.state (uint8)
     * @param {uint64} params.batchId
     * @return {Promise.<ServiceSCardContract_getCardsByState>}
     */
    getCardsByState(params) {
        return this.run('getCardsByState', params);
    }

    /**
     * @param {object} params
     * @param {number} params.state (uint8)
     * @param {uint64} params.batchId
     * @return {Promise.<ServiceSCardContract_getCardsByState>}
     */
    getCardsByStateLocal(params) {
        return this.runLocal('getCardsByState', params);
    }

    /**
     * @typedef ServiceSCardContract_getShippingList
     * @type {object}
     * @property {tuple[]} shippingList 
     */

    /**
     * @param {object} params
     * @param {number} params.state (uint8)
     * @return {Promise.<ServiceSCardContract_getShippingList>}
     */
    getShippingList(params) {
        return this.run('getShippingList', params);
    }

    /**
     * @param {object} params
     * @param {number} params.state (uint8)
     * @return {Promise.<ServiceSCardContract_getShippingList>}
     */
    getShippingListLocal(params) {
        return this.runLocal('getShippingList', params);
    }

    /**
     * @typedef ServiceSCardContract_getVersion
     * @type {object}
     * @property {number} version  (uint16)
     */

    /**
     * @return {Promise.<ServiceSCardContract_getVersion>}
     */
    getVersion() {
        return this.run('getVersion', {});
    }

    /**
     * @return {Promise.<ServiceSCardContract_getVersion>}
     */
    getVersionLocal() {
        return this.runLocal('getVersion', {});
    }

    /**
     * @param {object} params
     * @param {cell} params.newcode
     * @param {number} params.version (uint16)
     */
    upgradeCode(params) {
        return this.run('upgradeCode', params);
    }

    /**
     * @param {object} params
     * @param {cell} params.newcode
     * @param {number} params.version (uint16)
     */
    upgradeCodeLocal(params) {
        return this.runLocal('upgradeCode', params);
    }

}

ServiceSCardContract.package = pkg;

module.exports = ServiceSCardContract;
