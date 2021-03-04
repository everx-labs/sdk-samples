const abi = {
	"ABI version": 2,
	"header": ["pubkey", "time", "expire"],
	"functions": [
		{
			"name": "constructor",
			"inputs": [
				{"name":"pubkey","type":"uint256"},
				{"name":"sellerWallet","type":"address"},
				{"name":"amount","type":"uint16"},
				{"name":"currency","type":"bytes"},
				{"name":"deposit","type":"uint256"},
				{"name":"text","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "sellerDiscardsOffer",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "sellerDoesTransfer",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "buyerPlacesDeposit",
			"inputs": [
				{"name":"buyerPubkey","type":"uint256"}
			],
			"outputs": [
			]
		},
		{
			"name": "buyerClaimsTransfer",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "buyerDiscardsOffer",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "moderatorDoesTransfer",
			"inputs": [
				{"name":"flag","type":"bool"}
			],
			"outputs": [
			]
		},
		{
			"name": "getOfferState",
			"inputs": [
			],
			"outputs": [
				{"name":"fiatAmount","type":"uint16"},
				{"name":"depositAmount","type":"uint256"},
				{"name":"fiatCurrency","type":"bytes"},
				{"name":"text","type":"bytes"},
				{"name":"sellerPubkey","type":"uint256"},
				{"name":"sellerWallet","type":"address"},
				{"name":"buyerPubkey","type":"uint256"},
				{"name":"buyerWallet","type":"address"},
				{"name":"sellerClaimsDiscardTs","type":"uint64"},
				{"name":"buyerClaimsTransferTs","type":"uint64"}
			]
		}
	],
	"data": [
	],
	"events": [
	]
}; const imageBase64 = "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"; module.exports = {abi, imageBase64}
