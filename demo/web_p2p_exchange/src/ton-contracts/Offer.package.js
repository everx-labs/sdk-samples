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
}; const imageBase64 = "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"; module.exports = {abi, imageBase64, tvc: imageBase64}
