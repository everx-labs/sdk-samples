//
// This file was generated using TON Labs developer tools.
//

const abi = {
	"ABI version": 2,
	"header": ["time"],
	"functions": [
		{
			"name": "constructor",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "touch",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "sayHello",
			"inputs": [
			],
			"outputs": [
				{"name":"value0","type":"uint256"}
			]
		}
	],
	"data": [
	],
	"events": [
	]
};

const pkg = {
    abi,
    imageBase64: 'te6ccgECEwEAAl4AAgE0BgEBAcACAgPPIAUDAQHeBAAD0CAAQdgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAIm/wD0pCAiwAGS9KDhiu1TWDD0oQkHAQr0pCD0oQgAAAIBIAwKAf7/fyHtRNAg10nCAY4U0//TP9MA1wv/+Gp/+GH4Zvhj+GKOG/QFcPhqcAGAQPQO8r3XC//4YnD4Y3D4Zn/4YeLTAAGfgQIA1xgg+QFY+EL5EPKo3tM/AY4e+EMhuSCfMCD4I4ED6KiCCBt3QKC53pL4Y+CANPI02NMfAfAB+EduCwAIkvI83gIBIA4NAN29Rar5/8ILdHHnaiaBBrpOEAxwpp/+mf6YBrhf/8NT/8MPwzfDH8MUcN+gK4fDU4AMAgegd5XuuF//wxOHwxuHwzP/ww8W98I3k5uPwzaPwAfBH8NXwhZGX//CHnhZ/8I2eFgHwlAOX/5PaqP/wzwCASAQDwCFu3MS5F+EFujhftRNDT/9M/0wDXC//4an/4Yfhm+GP4Yt7R+AD4I/hq+ELIy//4Q88LP/hGzwsA+EoBy//J7VR/+GeAIBIBIRAOe4GmaP/wgt0cL9qJoaf/pn+mAa4X//DU//DD8M3wx/DFvaPwlZEXuAAAAAAAAAAAAAAAACGeLQQgIaZo/wQhAAAAAWORlj5Fnhf+A58DnieS4/YAYYH/HC/whZGX//CHnhZ/8I2eFgHwlAOX/5Paqbz/8M8ABy3HAi0NYCMdIAMNwhxwCS8jvgIdcNH5LyPOFTEZLyO+HBAyKCEP////28sZLyPOAB8AH4R26S8jze',
};

class HelloContract {
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
     */
    async deploy() {
        if (!this.keys) {
            this.keys = await this.client.crypto.ed25519Keypair();
        }
        this.address = (await this.client.contracts.deploy({
            package: pkg,
            constructorParams: {},
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
     */
    touch() {
        return this.run('touch', {});
    }

    /**
     */
    touchLocal() {
        return this.runLocal('touch', {});
    }

    /**
     * @typedef HelloContract_sayHello
     * @type {object}
     * @property {string} value0  (uint256)
     */

    /**
     * @return {Promise.<HelloContract_sayHello>}
     */
    sayHello() {
        return this.run('sayHello', {});
    }

    /**
     * @return {Promise.<HelloContract_sayHello>}
     */
    sayHelloLocal() {
        return this.runLocal('sayHello', {});
    }

}

HelloContract.package = pkg;

module.exports = HelloContract;
