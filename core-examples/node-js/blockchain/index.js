const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");

(async () => {
    try {
        // Link the platform-dependable TON-SDK binary with the target Application in Typescript
        // This is a Node.js project, so we link the application with `libNode` binary 
        // from `@tonclient/lib-node` package
        // If you want to use this code on other platforms, such as Web or React-Native,
        // use  `@tonclient/lib-web` and `@tonclient/lib-react-native` packages accordingly
        // (see README in  https://github.com/tonlabs/ton-client-js )
        TonClient.useBinaryLibrary(libNode);
        client = new TonClient({
            network: {
                endpoints: ["main.ton.dev"]
            }
        });

        // Get last key-block:
        let result = (await client.net.query({
            query: '{blockchain {key_blocks(last: 1) {' +
                'edges {node {id seq_no hash file_hash}}}}}'
        }));

        console.log(`Last key-block:`)
        const keyBlock = result.result.data.blockchain.key_blocks.edges[0].node;
        console.log('seq_no:', keyBlock.seq_no)
        console.log('hash:', keyBlock.hash)
        console.log('file_hash:', keyBlock.file_hash)

        /*
            Sample output:

            Last key-block:
            seq_no: 14078870
            hash: e33b0843d217f5e3ecdfd220cf5652ab774a168cc8f29eb53381d53ccdca7f79
            file_hash: 24187972626ebf5f33015b3017412f362cbe96d840fd5d7d71a8afa6f8c34c37
         */

        // Get workchain blocks for the last key-block:
        result = (await client.net.query({
            query: `{blockchain {workchain_blocks(master_seq_no: {start: ${keyBlock.seq_no} end: ${keyBlock.seq_no + 1}}) {` +
                'edges {node {workchain_id shard seq_no hash file_hash}}}}}'
        }));

        console.log(`\nWorkchain blocks for the key-block with seq_no = ${keyBlock.seq_no}:`)

        for (block of result.result.data.blockchain.workchain_blocks.edges) {
            const blockNode = block.node;
            console.log(`${blockNode.workchain_id}:${blockNode.shard}:${blockNode.seq_no}, hash: ${blockNode.hash}, file_hash: ${blockNode.file_hash}`)
        }

        /*
            Sample output:

            Workchain blocks for the key-block with seq_no: 14078870
            0:1800000000000000:20440973, hash: 8d90a4123e8dec06ef2d40e289c5c29be72879e7664d727ae585b0285ef54f0d, file_hash: 145faac5c33176b11791eb8e01c9ddb7391743e1e3a705ebdde1a10d4e8ad841
            0:5800000000000000:20448865, hash: bbbd1619cf8b235a9e4b0e8b1e8439a75f71fbd2d40fcca027afd4854642cf66, file_hash: 1219f0cc184eb8980263ffde45920b1edfd8c1e1e382d4dfdf2f1ce4f78fe558
            0:6800000000000000:20480153, hash: 9760c6d4368bf4a03432b3e5a1cf0a794db3de37ba9034bdf8d6de84cff2c317, file_hash: e53fe4a2e8de836fba77edad025d24c33d36239746ad2298d8a38c68ab10dbb9
            0:a800000000000000:20494441, hash: 92ec22b2c9633a3cf130927f9256a801762689bcf822f2ec952bbe8c6e2f3bb8, file_hash: 235909f480455ec115a200fa7b5c91d95ab94099076c00137a012caef605bde9
            0:0800000000000000:20494984, hash: 79b1036f47c69922018b81c14b6ba5c61d04b294d7853c5b952fbefba3f393db, file_hash: ed296fd5cdf48419cabb82e70495f440544172056edc6aa96d2ec212c12c9cbb
            0:2800000000000000:20496070, hash: 12f634d2ae7432402c327666473e90d392ecdd58839a54402b3ec14de6c79f55, file_hash: f3fe27a331abe702a77103dd858e1e895ba586e347991ef1633ae1ff3f681135
            0:f800000000000000:20496396, hash: 49e2d51fb6ee3901aa572947bdfbdc45166e1db8d2dff0ce9beba29780b7b1e9, file_hash: 8d6406cf8170b4f8ecbaf2c89168e0deeaa7ce4bc7f0dda8951af790dc14b25c
            0:8800000000000000:20497839, hash: f3f107dbc46a696849c0487284491ce9d0e6c934152da94542334fd7e4ee7275, file_hash: bf64f068d738c31750c6a25ba446f5293a00581605d3b7f73f8e6a48443b4689
            0:3800000000000000:20498191, hash: 82128dcb7ace37b99add2ca2f3a747b4106f9ab5430e2856b605b2b24875518f, file_hash: a43d2adac81cf352afee438520f0d2d95d8d7c0edef57b070fdba0e8a5041e17
            0:9800000000000000:20498687, hash: 1ee4e103de4934fea4d97b3d4936b0ae226437889a47c6a3f5ad3674201d08a5, file_hash: 188da068f3d46767d30629b48cdde0af3d609a29198a16a3b3a87521c5b484f0
            0:d800000000000000:20499438, hash: 5810b5065d57d4534e254d461529d744d982fb4b97e56f2cb4ac7bc412445029, file_hash: 7f7011d166c0c521ad13b4e757764163676290c2ef40f453867fcdd753ca84b8
            0:d800000000000000:20499439, hash: f2b0386d1699dc167c7a7604bd79e226d576e2edae992d51f3660ce1fd2fe288, file_hash: 25f2c0ca57f5530b5bb21ee3d2b694d614c1fb72c0cae7ea3d9f83933433e72b
            0:4800000000000000:20500772, hash: 76c97935b0a45570f16e5390f1a80eaba10421ca1c534251d1e8728d353d5729, file_hash: f91b5bd95eb6c7e03c1bf9a8d2d1267297e3dab5e3c2bc741a519dde9b7f62d6
            0:7800000000000000:20500821, hash: 39f6584c35391cda72ac73fff9927dc7d97d46e4029833b14cedef40b3901fbb, file_hash: 7a71242a7f7a662ac8ef9b733bd2bb171db15bd2d79b78c06c372f9b5664ef2f
            0:c800000000000000:20502821, hash: fb3139397119f8239cbd424625104ab76de839de7e44cd84f754c70ee059efca, file_hash: bbe4b4cbb582056927dfb3b5a9e34f5dda67bef9c02418df5d0727ba8c7f9a6d
            0:b800000000000000:20505618, hash: 2fff6ad7a5268450ad4181d273615024b7f537e9aa1515da0d97c36bea698750, file_hash: 1a8dd37701740827306a3709fe72e187251662d20ec80abb33c48c3231f6b264
            0:e800000000000000:20506918, hash: 432c86eeb58a610ccef970b9a877ea02652559804bd255460a87ca88a986e317, file_hash: 53649e01d025ff4b613b063c42a248fda3b9e78277c26142ce7ba367839bacb8
            -1:8000000000000000:14078870, hash: e33b0843d217f5e3ecdfd220cf5652ab774a168cc8f29eb53381d53ccdca7f79, file_hash: 24187972626ebf5f33015b3017412f362cbe96d840fd5d7d71a8afa6f8c34c37
         */

        // Get workchain transactions with amount more than 1 token for the last key-block:
        result = (await client.net.query({
            query: `{blockchain {workchain_transactions(master_seq_no: {start: ${keyBlock.seq_no} end: ${keyBlock.seq_no + 1}} min_balance_delta: 1000000000) {` +
                'edges {node {now_string balance_delta(format: DEC) aborted}}}}}'
        }));

        console.log(`\nWorkchain transactions for the key-block with seq_no = ${keyBlock.seq_no} and value more than 1 token:`)

        for (transaction of result.result.data.blockchain.workchain_transactions.edges) {
            const trans = transaction.node;
            console.log(`${trans.now_string}, balance change: ${trans.balance_delta}, aborted: ${trans.aborted}`)
        }

        /*
            Sample output:

            Workchain transactions for the key-block with seq_no = 14078870 and value more than 1 token:
            2022-01-19 18:20:36.000, balance change: 2762500000, aborted: false
         */

        // Get elector transactions for the last key-block:
        result = (await client.net.query({
            query: `{blockchain {account_transactions(master_seq_no: {start: ${keyBlock.seq_no} end: ${keyBlock.seq_no + 1}} account_address: "-1:3333333333333333333333333333333333333333333333333333333333333333") {` +
                'edges {node {now_string account_addr balance_delta(format: DEC) aborted}}}}}'
        }));

        console.log(`\nElector transactions for the key-block with seq_no = ${keyBlock.seq_no}:`)

        for (transaction of result.result.data.blockchain.account_transactions.edges) {
            const trans = transaction.node;
            console.log(`${trans.now_string}, account: ${trans.account_addr}, balance change: ${trans.balance_delta}, aborted: ${trans.aborted}`)
        }

        /*
            Sample output:

            Elector transactions for the key-block with seq_no = 14078870:
            2022-01-19 18:20:36.000, account: -1:3333333333333333333333333333333333333333333333333333333333333333, balance change: 0, aborted: false
            2022-01-19 18:20:36.000, account: -1:3333333333333333333333333333333333333333333333333333333333333333, balance change: 2762500000, aborted: false
         */

        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error(`Network is inaccessible.`);
        } else {
            console.error(error);
        }
    }
})();
