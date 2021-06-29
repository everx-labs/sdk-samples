module.exports = {
    HelloWallet: {
        abi: {
            "ABI version": 2,
            "header": ["time", "expire"],
            "functions": [
                {
                    "name": "constructor",
                    "inputs": [
                    ],
                    "outputs": [
                    ]
                },
                {
                    "name": "renderHelloWorld",
                    "inputs": [
                    ],
                    "outputs": [
                        {"name":"value0","type":"bytes"}
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
                    "name": "getTimestamp",
                    "inputs": [
                    ],
                    "outputs": [
                        {"name":"value0","type":"uint256"}
                    ]
                },
                {
                    "name": "sendValue",
                    "inputs": [
                        {"name":"dest","type":"address"},
                        {"name":"amount","type":"uint128"},
                        {"name":"bounce","type":"bool"}
                    ],
                    "outputs": [
                    ]
                },
                {
                    "name": "timestamp",
                    "inputs": [
                    ],
                    "outputs": [
                        {"name":"timestamp","type":"uint32"}
                    ]
                }
            ],
            "data": [
            ],
            "events": [
            ]
        },
        tvc: "te6ccgECGQEAAuYAAgE0AwEBAcACAEPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgBCSK7VMg4wMgwP/jAiDA/uMC8gsWBQQYApAh2zzTAAGOEoECANcYIPkBWPhCIPhl+RDyqN7TPwH4QyG58rQg+COBA+iogggbd0CgufK0+GPTHwH4I7zyudMfAds8+Edu8nwJBgE6ItDXCwOpOADcIccA3CHXDR/yvCHdAds8+Edu8nwGAiggghBU1r0Yu+MCIIIQaLVfP7vjAgsHAiggghBoF+U1uuMCIIIQaLVfP7rjAgoIAlgw+EJu4wD4RvJzf/hm0fhC8uBl+EUgbpIwcN74Qrry4Gb4APgj+GrbPH/4ZwkTAUrtRNDXScIBio4acO1E0PQFcPhqgED0DvK91wv/+GJw+GNw+GbiFQFSMNHbPPhKIY4cjQRwAAAAAAAAAAAAAAAAOgX5TWDIzssfyXD7AN5/+GcVBFAgghAfnWSDuuMCIIIQNzEuRbrjAiCCEDtj1H664wIgghBU1r0YuuMCEhEPDAJsMNHbPCGOJyPQ0wH6QDAxyM+HIM6NBAAAAAAAAAAAAAAAAA1Na9GIzxbMyXD7AJEw4uMAf/hnDRMBAogOABRoZWxsb1dvcmxkA1Yw+EJu4wD6QZXU0dD6QN/XDX+V1NHQ03/f1wwAldTR0NIA39HbPOMAf/hnFRATAFT4RSBukjBw3vhCuvLgZvgAVHEgyM+FgMoAc89AzgH6AoBrz0DJcPsAXwMCQDD4Qm7jANH4RSBukjBw3vhCuvLgZvgA+CP4ats8f/hnFRMDeDD4Qm7jANHbPCGOKCPQ0wH6QDAxyM+HIM6NBAAAAAAAAAAAAAAAAAn51kg4zxbL/8lw+wCRMOLjAH/4ZxUUEwAo+Er4RvhD+ELIy//LP8oAyx/J7VQABPhKACjtRNDT/9M/0gDTH9H4avhm+GP4YgIK9KQg9KEYFwAWc29sIDAuNDYuMA0AAA==",
    }
}