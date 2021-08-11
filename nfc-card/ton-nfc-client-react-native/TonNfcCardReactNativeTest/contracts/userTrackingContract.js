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
				{"name":"serviceKey","type":"uint256"},
				{"name":"userData","type":"address"},
				{"name":"userId","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "setEncryptionPublicKey",
			"inputs": [
				{"name":"encryptionPublicKey","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "setShippingAddress",
			"inputs": [
				{"name":"shippingAddress","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "createShipping",
			"inputs": [
				{"name":"shippingId","type":"uint128"},
				{"name":"numCards","type":"uint32"},
				{"name":"orderId","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "saveShippingTrack",
			"inputs": [
				{"name":"shippingId","type":"uint128"},
				{"name":"trackingNumber","type":"bytes"},
				{"name":"cards","type":"uint192[]"}
			],
			"outputs": [
			]
		},
		{
			"name": "updateShippingTrack",
			"inputs": [
				{"name":"shippingId","type":"uint128"},
				{"name":"status","type":"uint8"}
			],
			"outputs": [
			]
		},
		{
			"name": "requestAuthVector",
			"inputs": [
				{"name":"sn","type":"uint192"}
			],
			"outputs": [
			]
		},
		{
			"name": "setAuthVector",
			"inputs": [
				{"name":"sn","type":"uint192"},
				{"name":"authVector","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "requestCheckIntegrity",
			"inputs": [
				{"name":"sn","type":"uint192"},
				{"name":"H2","type":"uint256"},
				{"name":"H3","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "finishCheckIntegrity",
			"inputs": [
				{"name":"sn","type":"uint192"},
				{"name":"data","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "markCardAsActive",
			"inputs": [
				{"name":"sn","type":"uint192"}
			],
			"outputs": [
			]
		},
		{
			"name": "requestRecoveryRegistration",
			"inputs": [
				{"name":"request","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "requestUpdateConfirmation",
			"inputs": [
				{"name":"request","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "send2FA",
			"inputs": [
				{"name":"code2FA","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "updateRecoveryStatus",
			"inputs": [
				{"name":"status","type":"uint8"}
			],
			"outputs": [
			]
		},
		{
			"name": "finishRecoveryRegistration",
			"inputs": [
				{"name":"response","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "finishUpdateConfirmation",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "stopRecovery",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "getEncryptionPublicKey",
			"inputs": [
			],
			"outputs": [
				{"name":"encryptionPublicKey","type":"uint256"}
			]
		},
		{
			"name": "getShippingAddress",
			"inputs": [
			],
			"outputs": [
				{"name":"shippingAddress","type":"bytes"}
			]
		},
		{
			"name": "getAuthVector",
			"inputs": [
				{"name":"sn","type":"uint192"}
			],
			"outputs": [
				{"name":"authVector","type":"bytes"}
			]
		},
		{
			"name": "getShipmentById",
			"inputs": [
				{"name":"shippingId","type":"uint128"}
			],
			"outputs": [
				{"components":[{"name":"orderId","type":"uint256"},{"name":"cards","type":"uint192[]"},{"name":"status","type":"uint8"},{"name":"updatedAt","type":"uint32"},{"name":"trackingNumber","type":"bytes"}],"name":"shipment","type":"tuple"}
			]
		},
		{
			"name": "getShipmentByOrder",
			"inputs": [
				{"name":"orderId","type":"uint256"}
			],
			"outputs": [
				{"components":[{"name":"orderId","type":"uint256"},{"name":"cards","type":"uint192[]"},{"name":"status","type":"uint8"},{"name":"updatedAt","type":"uint32"},{"name":"trackingNumber","type":"bytes"}],"name":"shipment","type":"tuple"}
			]
		},
		{
			"name": "getCards",
			"inputs": [
			],
			"outputs": [
				{"components":[{"name":"status","type":"uint8"},{"name":"data","type":"bytes"}],"name":"cards","type":"tuple[]"}
			]
		},
		{
			"name": "getRecoveryData",
			"inputs": [
			],
			"outputs": [
				{"name":"recoveryData","type":"bytes"}
			]
		},
		{
			"name": "getRecoveryStatus",
			"inputs": [
			],
			"outputs": [
				{"name":"recoveryStatus","type":"uint8"}
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
			"name": "getOwnerKey",
			"inputs": [
			],
			"outputs": [
				{"name":"ownerKey","type":"uint256"}
			]
		},
		{
			"name": "getRecoveryMode",
			"inputs": [
			],
			"outputs": [
				{"name":"recoveryMode","type":"uint8"}
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
		{"key":1,"name":"m_version","type":"uint16"}
	],
	"events": [
		{
			"name": "RequiredShippingAddress",
			"inputs": [
				{"name":"shippingId","type":"uint128"}
			],
			"outputs": [
			]
		},
		{
			"name": "InitedShipping",
			"inputs": [
				{"name":"shippingId","type":"uint128"},
				{"name":"numCards","type":"uint32"}
			],
			"outputs": [
			]
		},
		{
			"name": "RequestedShippingAddress",
			"inputs": [
				{"name":"shippingId","type":"uint128"},
				{"name":"shippingAddress","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "ReceivedTrackingNumber",
			"inputs": [
				{"name":"shippingId","type":"uint128"},
				{"name":"trackingNumber","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "RequestedAuthVector",
			"inputs": [
				{"name":"sn","type":"uint192"}
			],
			"outputs": [
			]
		},
		{
			"name": "ReceivedAuthVector",
			"inputs": [
				{"name":"sn","type":"uint192"},
				{"name":"authVector","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "RequestedCheckIntegrity",
			"inputs": [
				{"name":"sn","type":"uint192"},
				{"name":"H2","type":"uint256"},
				{"name":"H3","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "ActivatedCard",
			"inputs": [
				{"name":"sn","type":"uint192"}
			],
			"outputs": [
			]
		},
		{
			"name": "ValidatedCard",
			"inputs": [
				{"name":"sn","type":"uint192"}
			],
			"outputs": [
			]
		},
		{
			"name": "RequestedRecoveryRegistration",
			"inputs": [
				{"name":"request","type":"bytes"},
				{"name":"encryptionPublicKey","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "RequestedUpdateConfirm",
			"inputs": [
				{"name":"request","type":"bytes"},
				{"name":"encryptionPublicKey","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "RequestedAccountRecovery",
			"inputs": [
				{"name":"request","type":"bytes"},
				{"name":"encryptionPublicKey","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "Sent2FA",
			"inputs": [
				{"name":"code2FA","type":"bytes"},
				{"name":"encryptionPublicKey","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "UpdatedRecoveryStatus",
			"inputs": [
				{"name":"recoveryStatus","type":"uint8"},
				{"name":"retriesLeft","type":"uint8"}
			],
			"outputs": [
			]
		},
		{
			"name": "FinishedRecoveryRegistration",
			"inputs": [
				{"name":"recoveryData","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "FinishedUpdateConfirm",
			"inputs": [
				{"name":"encryptionPublicKey","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "StoppedRecovery",
			"inputs": [
				{"name":"encryptionPublicKey","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "BannedRecoveryTill",
			"inputs": [
				{"name":"bannedTill","type":"uint32"}
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

class UserTrackingContract {
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
     * @param {string} constructorParams.serviceKey (uint256)
     * @param {string} constructorParams.userData (address)
     * @param {string} constructorParams.userId (uint256)
     * @param {object} initParams
     * @param {number} initParams.m_version (uint16)
     */
    async deploy(constructorParams, initParams) {
        if (!this.keys) {
            this.keys = await this.client.crypto.ed25519Keypair();
        }
        this.address = (await this.client.contracts.deploy({
            package: pkg,
            constructorParams,
            initParams,
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
     * @param {object} params
     * @param {string} params.encryptionPublicKey (uint256)
     */
    setEncryptionPublicKey(params) {
        return this.run('setEncryptionPublicKey', params);
    }

    /**
     * @param {object} params
     * @param {string} params.encryptionPublicKey (uint256)
     */
    setEncryptionPublicKeyLocal(params) {
        return this.runLocal('setEncryptionPublicKey', params);
    }

    /**
     * @param {object} params
     * @param {bytes} params.shippingAddress
     */
    setShippingAddress(params) {
        return this.run('setShippingAddress', params);
    }

    /**
     * @param {object} params
     * @param {bytes} params.shippingAddress
     */
    setShippingAddressLocal(params) {
        return this.runLocal('setShippingAddress', params);
    }

    /**
     * @param {object} params
     * @param {uint128} params.shippingId
     * @param {number} params.numCards (uint32)
     * @param {string} params.orderId (uint256)
     */
    createShipping(params) {
        return this.run('createShipping', params);
    }

    /**
     * @param {object} params
     * @param {uint128} params.shippingId
     * @param {number} params.numCards (uint32)
     * @param {string} params.orderId (uint256)
     */
    createShippingLocal(params) {
        return this.runLocal('createShipping', params);
    }

    /**
     * @param {object} params
     * @param {uint128} params.shippingId
     * @param {bytes} params.trackingNumber
     * @param {uint192[]} params.cards
     */
    saveShippingTrack(params) {
        return this.run('saveShippingTrack', params);
    }

    /**
     * @param {object} params
     * @param {uint128} params.shippingId
     * @param {bytes} params.trackingNumber
     * @param {uint192[]} params.cards
     */
    saveShippingTrackLocal(params) {
        return this.runLocal('saveShippingTrack', params);
    }

    /**
     * @param {object} params
     * @param {uint128} params.shippingId
     * @param {number} params.status (uint8)
     */
    updateShippingTrack(params) {
        return this.run('updateShippingTrack', params);
    }

    /**
     * @param {object} params
     * @param {uint128} params.shippingId
     * @param {number} params.status (uint8)
     */
    updateShippingTrackLocal(params) {
        return this.runLocal('updateShippingTrack', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     */
    requestAuthVector(params) {
        return this.run('requestAuthVector', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     */
    requestAuthVectorLocal(params) {
        return this.runLocal('requestAuthVector', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @param {bytes} params.authVector
     */
    setAuthVector(params) {
        return this.run('setAuthVector', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @param {bytes} params.authVector
     */
    setAuthVectorLocal(params) {
        return this.runLocal('setAuthVector', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @param {string} params.H2 (uint256)
     * @param {string} params.H3 (uint256)
     */
    requestCheckIntegrity(params) {
        return this.run('requestCheckIntegrity', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @param {string} params.H2 (uint256)
     * @param {string} params.H3 (uint256)
     */
    requestCheckIntegrityLocal(params) {
        return this.runLocal('requestCheckIntegrity', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @param {bytes} params.data
     */
    finishCheckIntegrity(params) {
        return this.run('finishCheckIntegrity', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @param {bytes} params.data
     */
    finishCheckIntegrityLocal(params) {
        return this.runLocal('finishCheckIntegrity', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     */
    markCardAsActive(params) {
        return this.run('markCardAsActive', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     */
    markCardAsActiveLocal(params) {
        return this.runLocal('markCardAsActive', params);
    }

    /**
     * @param {object} params
     * @param {bytes} params.request
     */
    requestRecoveryRegistration(params) {
        return this.run('requestRecoveryRegistration', params);
    }

    /**
     * @param {object} params
     * @param {bytes} params.request
     */
    requestRecoveryRegistrationLocal(params) {
        return this.runLocal('requestRecoveryRegistration', params);
    }

    /**
     * @param {object} params
     * @param {bytes} params.request
     */
    requestUpdateConfirmation(params) {
        return this.run('requestUpdateConfirmation', params);
    }

    /**
     * @param {object} params
     * @param {bytes} params.request
     */
    requestUpdateConfirmationLocal(params) {
        return this.runLocal('requestUpdateConfirmation', params);
    }

    /**
     * @param {object} params
     * @param {bytes} params.code2FA
     */
    send2FA(params) {
        return this.run('send2FA', params);
    }

    /**
     * @param {object} params
     * @param {bytes} params.code2FA
     */
    send2FALocal(params) {
        return this.runLocal('send2FA', params);
    }

    /**
     * @param {object} params
     * @param {number} params.status (uint8)
     */
    updateRecoveryStatus(params) {
        return this.run('updateRecoveryStatus', params);
    }

    /**
     * @param {object} params
     * @param {number} params.status (uint8)
     */
    updateRecoveryStatusLocal(params) {
        return this.runLocal('updateRecoveryStatus', params);
    }

    /**
     * @param {object} params
     * @param {bytes} params.response
     */
    finishRecoveryRegistration(params) {
        return this.run('finishRecoveryRegistration', params);
    }

    /**
     * @param {object} params
     * @param {bytes} params.response
     */
    finishRecoveryRegistrationLocal(params) {
        return this.runLocal('finishRecoveryRegistration', params);
    }

    /**
     */
    finishUpdateConfirmation() {
        return this.run('finishUpdateConfirmation', {});
    }

    /**
     */
    finishUpdateConfirmationLocal() {
        return this.runLocal('finishUpdateConfirmation', {});
    }

    /**
     */
    stopRecovery() {
        return this.run('stopRecovery', {});
    }

    /**
     */
    stopRecoveryLocal() {
        return this.runLocal('stopRecovery', {});
    }

    /**
     * @typedef UserTrackingContract_getEncryptionPublicKey
     * @type {object}
     * @property {string} encryptionPublicKey  (uint256)
     */

    /**
     * @return {Promise.<UserTrackingContract_getEncryptionPublicKey>}
     */
    getEncryptionPublicKey() {
        return this.run('getEncryptionPublicKey', {});
    }

    /**
     * @return {Promise.<UserTrackingContract_getEncryptionPublicKey>}
     */
    getEncryptionPublicKeyLocal() {
        return this.runLocal('getEncryptionPublicKey', {});
    }

    /**
     * @typedef UserTrackingContract_getShippingAddress
     * @type {object}
     * @property {bytes} shippingAddress 
     */

    /**
     * @return {Promise.<UserTrackingContract_getShippingAddress>}
     */
    getShippingAddress() {
        return this.run('getShippingAddress', {});
    }

    /**
     * @return {Promise.<UserTrackingContract_getShippingAddress>}
     */
    getShippingAddressLocal() {
        return this.runLocal('getShippingAddress', {});
    }

    /**
     * @typedef UserTrackingContract_getAuthVector
     * @type {object}
     * @property {bytes} authVector 
     */

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @return {Promise.<UserTrackingContract_getAuthVector>}
     */
    getAuthVector(params) {
        return this.run('getAuthVector', params);
    }

    /**
     * @param {object} params
     * @param {uint192} params.sn
     * @return {Promise.<UserTrackingContract_getAuthVector>}
     */
    getAuthVectorLocal(params) {
        return this.runLocal('getAuthVector', params);
    }

    /**
     * @typedef UserTrackingContract_getShipmentById
     * @type {object}
     * @property {tuple} shipment 
     */

    /**
     * @param {object} params
     * @param {uint128} params.shippingId
     * @return {Promise.<UserTrackingContract_getShipmentById>}
     */
    getShipmentById(params) {
        return this.run('getShipmentById', params);
    }

    /**
     * @param {object} params
     * @param {uint128} params.shippingId
     * @return {Promise.<UserTrackingContract_getShipmentById>}
     */
    getShipmentByIdLocal(params) {
        return this.runLocal('getShipmentById', params);
    }

    /**
     * @typedef UserTrackingContract_getShipmentByOrder
     * @type {object}
     * @property {tuple} shipment 
     */

    /**
     * @param {object} params
     * @param {string} params.orderId (uint256)
     * @return {Promise.<UserTrackingContract_getShipmentByOrder>}
     */
    getShipmentByOrder(params) {
        return this.run('getShipmentByOrder', params);
    }

    /**
     * @param {object} params
     * @param {string} params.orderId (uint256)
     * @return {Promise.<UserTrackingContract_getShipmentByOrder>}
     */
    getShipmentByOrderLocal(params) {
        return this.runLocal('getShipmentByOrder', params);
    }

    /**
     * @typedef UserTrackingContract_getCards
     * @type {object}
     * @property {tuple[]} cards 
     */

    /**
     * @return {Promise.<UserTrackingContract_getCards>}
     */
    getCards() {
        return this.run('getCards', {});
    }

    /**
     * @return {Promise.<UserTrackingContract_getCards>}
     */
    getCardsLocal() {
        return this.runLocal('getCards', {});
    }

    /**
     * @typedef UserTrackingContract_getRecoveryData
     * @type {object}
     * @property {bytes} recoveryData 
     */

    /**
     * @return {Promise.<UserTrackingContract_getRecoveryData>}
     */
    getRecoveryData() {
        return this.run('getRecoveryData', {});
    }

    /**
     * @return {Promise.<UserTrackingContract_getRecoveryData>}
     */
    getRecoveryDataLocal() {
        return this.runLocal('getRecoveryData', {});
    }

    /**
     * @typedef UserTrackingContract_getRecoveryStatus
     * @type {object}
     * @property {number} recoveryStatus  (uint8)
     */

    /**
     * @return {Promise.<UserTrackingContract_getRecoveryStatus>}
     */
    getRecoveryStatus() {
        return this.run('getRecoveryStatus', {});
    }

    /**
     * @return {Promise.<UserTrackingContract_getRecoveryStatus>}
     */
    getRecoveryStatusLocal() {
        return this.runLocal('getRecoveryStatus', {});
    }

    /**
     * @typedef UserTrackingContract_getVersion
     * @type {object}
     * @property {number} version  (uint16)
     */

    /**
     * @return {Promise.<UserTrackingContract_getVersion>}
     */
    getVersion() {
        return this.run('getVersion', {});
    }

    /**
     * @return {Promise.<UserTrackingContract_getVersion>}
     */
    getVersionLocal() {
        return this.runLocal('getVersion', {});
    }

    /**
     * @typedef UserTrackingContract_getOwnerKey
     * @type {object}
     * @property {string} ownerKey  (uint256)
     */

    /**
     * @return {Promise.<UserTrackingContract_getOwnerKey>}
     */
    getOwnerKey() {
        return this.run('getOwnerKey', {});
    }

    /**
     * @return {Promise.<UserTrackingContract_getOwnerKey>}
     */
    getOwnerKeyLocal() {
        return this.runLocal('getOwnerKey', {});
    }

    /**
     * @typedef UserTrackingContract_getRecoveryMode
     * @type {object}
     * @property {number} recoveryMode  (uint8)
     */

    /**
     * @return {Promise.<UserTrackingContract_getRecoveryMode>}
     */
    getRecoveryMode() {
        return this.run('getRecoveryMode', {});
    }

    /**
     * @return {Promise.<UserTrackingContract_getRecoveryMode>}
     */
    getRecoveryModeLocal() {
        return this.runLocal('getRecoveryMode', {});
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

UserTrackingContract.package = pkg;

module.exports = UserTrackingContract;
