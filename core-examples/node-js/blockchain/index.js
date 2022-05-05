const { TonClient } = require("@eversdk/core");
const { libNode } = require("@eversdk/lib-node")

;(async () => {
    try {
        // Link the platform-dependable ever-sdk binary with the target Application in Typescript
        // This is a Node.js project, so we link the application with `libNode` binary
        // from `@eversdk/lib-node` package
        // If you want to use this code on other platforms, such as Web or React-Native,
        // use  `@eversdk/lib-web` and `@eversdk/lib-react-native` packages accordingly
        // (see README in  https://github.com/tonlabs/ever-sdk-js )
        TonClient.useBinaryLibrary(libNode);
        const client = new TonClient({
            network: {
                endpoints: [
                    "eri01.main.everos.dev",
                    "gra01.main.everos.dev",
                    "gra02.main.everos.dev",
                    "lim01.main.everos.dev",
                    "rbx01.main.everos.dev",
                ],
            },
        });

        // Get masterchain `seq_no` range for the last 3 days:
        const days = 3;
        const now = Math.trunc(Date.now() / 1000);
        let result = await client.net.query({
            query: `{
                      blockchain {
                        master_seq_no_range(
                            time_start: ${now - days * 24 * 60 * 60}
                            time_end: ${now}
                        ) {
                            start
                            end
                        }
                      }
                    }`,
        });

        const range = result.result.data.blockchain.master_seq_no_range;
        console.log(`Masterchain seq_no range for the last ${days} days: [${range.start}..${range.end}]`);

        /*
            Sample output:

            Masterchain seq_no range for the last 3 days: [14158087..14241248]
         */

        // Get the first key-block for the last 3 days:
        result = await client.net.query({
            query: `{
                      blockchain {
                        key_blocks(
                            seq_no: {
                                start: ${range.start}
                                end: ${range.end}
                            }
                            first: 1) {
                          edges {
                            node {
                              id
                              seq_no
                              hash
                              file_hash
                            }
                          }
                        }
                      }
                    }`,
        });

        console.log(`\nFist key-block for the last ${days} days:`);
        const keyBlock = result.result.data.blockchain.key_blocks.edges[0].node;
        console.log("seq_no:", keyBlock.seq_no);
        console.log("hash:", keyBlock.hash);
        console.log("file_hash:", keyBlock.file_hash);

        /*
            Sample output:

            Fist key-block for the last 3 days:
            seq_no: 14159649
            hash: 434a19f25cb0061a71d8bfcdecf43f5d074be8680e0cbdaa49c4f78079fe0748
            file_hash: 9e5a1b6a6dc8f0b58dee7d5b91d6cf3e66a88e3b91c09f18403e3be9d477f4bf
         */

        // Get workchain blocks for the last key-block:
        result = await client.net.query({
            query: `{
                      blockchain {
                        workchain_blocks(
                          master_seq_no: { 
                            start: ${keyBlock.seq_no},
                            end: ${keyBlock.seq_no + 1}
                          }
                        ) {
                          edges {
                            node {
                              workchain_id
                              shard
                              seq_no
                              hash
                              file_hash
                            }
                          }
                        }
                      }
                    }`,
        });

        console.log(`\nWorkchain blocks for the key-block with seq_no = ${keyBlock.seq_no}:`);

        for (const block of result.result.data.blockchain.workchain_blocks.edges) {
            const blockNode = block.node;
            console.log(
                `${blockNode.workchain_id}:${blockNode.shard}:${blockNode.seq_no}, hash: ${blockNode.hash}, file_hash: ${blockNode.file_hash}`,
            );
        }

        /*
            Sample output:

            Workchain blocks for the key-block with seq_no = 14159649:
            0:1800000000000000:20531085, hash: fd1bb08ae03a45ba83a72d2a7c7af72e897d557b2b1bd438d690ad5c64fd9a49, file_hash: 3318f2373b3ef2cd45fa55a734838a03b969607f5e5d141388d1c4a234c99cb4
            0:1800000000000000:20531086, hash: 2d65e9eedc28e72f960ce2d5451ad7defa8dfcf740ca1b2d17bad07d5c198ea4, file_hash: f02bb8ebe4abc66352f301ef55d0715df47a23fe6093009a6cbd77a4585ac696
            0:5800000000000000:20539059, hash: 390d90f019ee94ef59c3f9dc6f96ee02000ebd6cceba888401017ac6528d027a, file_hash: 2e6b1ab3e22228656b95e436b9c97f3b48a8bddbe6be134628be2136abcffb20
            0:5800000000000000:20539060, hash: c87c2582efc88cd377180e98655905cdb1ffc8c9a404e5e1650717d9a5462097, file_hash: 6edb57a512e39b6bcc909dd6c6cd513015295a09857c3db0b56ca6c595f9e47e
            0:6800000000000000:20570373, hash: d0df4087fd67a8df3697fc236547c91835bccdcc9046d8712611db0962ad1a0f, file_hash: 6a35c2774c5b175cd795d102c2521ff602c4043ebe777d52b4f12effc0d88c95
            0:a800000000000000:20584663, hash: d863926d1d8be71ff38d6ff9aea4e8cc2c713bd8fe3e820356b6b915996fcf06, file_hash: bc75298d14087d5fddbed3fe935168eb1864a076dec9bbcc4e96b9c45414a765
            0:0800000000000000:20585179, hash: de95c41692cbe203e149659c9b747b78f00b05b6089a5cb105ff02355bb7cded, file_hash: 0d3260512abd6725529ddc04a1d5b4fdab8cd843acf827bdccff606323674f1c
            0:2800000000000000:20586353, hash: 10936c511a836e53bdb287285b71961fec2c3efb3d3bb7025385917fba5bfed7, file_hash: 09c261aaa262bd7dc2fbfcfe4a802dabeced2c75af10c2acb6e70edad0e6f864
            0:f800000000000000:20586443, hash: a5f4b0cbecbc89b18b8ed9c44214eab81d056a20668f8fa77f76ef0dcd9595a8, file_hash: 0405c4277bf4b3237679ee61086052081d63041c225cdefcdfcf36bfe26f0e2a
            0:8800000000000000:20587996, hash: fe7ed440ede03501032f1e3c41737f5cb93322568fef2beb5d59ca64281c06a0, file_hash: c059bc3035c2aa6b2683b255a9e289f8c9d57514ff4fd8faf5224bd565debc6b
            0:8800000000000000:20587997, hash: a7fb62f6353db06bbb6559bb63cb897d1cbe45fb118b399c36bc4dd658a223b7, file_hash: 8258a50350642f57a69bd8cbf5a930c6a99fd5046fb69c6c830ae756792fa67c
            0:3800000000000000:20588497, hash: 23ddc4ade5476be591ae1d2e49e3415a09550c9b87a12921694b32b92b5b8592, file_hash: abc07ff56ac31f51354af78dbbfa0be0d748ff4033fed8ac76e13d44c5921166
            0:9800000000000000:20588872, hash: 32c3659f3df0a767f1a9bad2e5c376f2ff3aacf10ae57d5540e449567a14c87b, file_hash: a85cc8aa05284fe7d889673331ef9e5851a34c9f12ec0430797756e76473f87d
            0:9800000000000000:20588873, hash: 1488246cf729eb7f34fd316eb705373c6dd55c50fb5221bdd8678db7f07d9cc5, file_hash: 8cb67cd7c152da3891a707273fd6a8463d6f7540f8868d4b19d5e36d38938200
            0:d800000000000000:20589596, hash: 551a2dd1c29246a8b5be36f5007b96e3612cde78ccdac232c30abd57b9130985, file_hash: 16fc1e38467ff132ae9bb5a2ecad700de1a9280a437eabac14bf5f6b9c64a779
            0:d800000000000000:20589597, hash: c34a6f559cdc762010257d8378818e9798dd3bc1ca212fe4ee727ce6faf45a78, file_hash: 08a38b77f83b43b15c7158edeadf4496337316d4ea587e32c38042527f83e67a
            0:4800000000000000:20590985, hash: 84036418e04bd3b673b6cd7ed8a1a3470e66d3fa8ca0e1a17511f944ef9d5925, file_hash: dea5fa932b69817e747b5222cade7883333830343bfd37ed115bdb2f80bb67e3
            0:4800000000000000:20590986, hash: 674ce5b8df74e0f333e16202e35cf7dc0de9f00179917d6f44d7da1c8e321cee, file_hash: 3b825ae5fcb79a5993aba86c0feb918e95eca3317c4c571554870dcde0484f54
            0:7800000000000000:20591210, hash: 091e6e6d3e181d5d49ea76617963dfa37279315efe23a75ce07891eaef33e768, file_hash: 460a2dfce13335e877a07c0f61ea8d6192b68b4dddf924d9597c8ae8345b4267
            0:b800000000000000:20595790, hash: ac833950d2663773e249ab67ecdf0dcd71c0cda9d5c4b80bc569c01a4a179f97, file_hash: 5b63a2d7be91ecd47cccec90cf1fceff5ca6ec5ea3ea4ab1b77cb9959ff29ef1
            0:e800000000000000:20597119, hash: 86534cfad139a413ead25070b261b3beff862cdf20c0a7b2862adde7b1603013, file_hash: cdd2130b73a8b65ab4044ed155bdb1d6fe2a0fa6c335bcfdaaac3337380d0b85
            0:e800000000000000:20597120, hash: ce03ef324c7dffe7cb9869d0148d38454a06e57f358a585aa47810a0d56f6ee5, file_hash: afb1168e277c52a32e5a49e897615900aa884c1021a92a447643db505326c284
            -1:8000000000000000:14159649, hash: 434a19f25cb0061a71d8bfcdecf43f5d074be8680e0cbdaa49c4f78079fe0748, file_hash: 9e5a1b6a6dc8f0b58dee7d5b91d6cf3e66a88e3b91c09f18403e3be9d477f4bf
         */

        // Get workchain transactions with amount more than 1 token for the last key-block:
        result = await client.net.query({
            query: `{ 
                   blockchain {
                     workchain_transactions(
                       master_seq_no: {start: ${keyBlock.seq_no} end: ${keyBlock.seq_no + 1}}
                       min_balance_delta: 1000000000
                     ) {
                       edges {
                         node {
                           now_string
                           balance_delta(format: DEC) 
                           aborted
                         }
                       }
                     }
                   }
                 }`,
        });

        console.log(
            `\nWorkchain transactions for the key-block with seq_no = ${keyBlock.seq_no} and value more than 1 token:`,
        );

        for (const transaction of result.result.data.blockchain.workchain_transactions.edges) {
            const trans = transaction.node;
            console.log(
                `${trans.now_string}, balance change: ${trans.balance_delta}, aborted: ${trans.aborted}`,
            );
        }

        /*
            Sample output:

            Workchain transactions for the key-block with seq_no = 14159649 and value more than 1 token:
            2022-01-22 16:53:08.000, balance change: 3075000000, aborted: false
         */

        // Get elector transactions for the last key-block:
        result = await client.net.query({
            query: `{ 
                 blockchain {
                   account_transactions(
                     master_seq_no: {start: ${keyBlock.seq_no} end: ${keyBlock.seq_no + 1}}
                     account_address: "-1:3333333333333333333333333333333333333333333333333333333333333333"
                 ) {
                   edges {
                     node {
                       now_string
                       account_addr
                       balance_delta(format: DEC)
                       aborted
                     }
                   }
                 }
               }
             }`,
        });

        console.log(`\nElector transactions for the key-block with seq_no = ${keyBlock.seq_no}:`);

        for (const transaction of result.result.data.blockchain.account_transactions.edges) {
            const trans = transaction.node;
            console.log(
                `${trans.now_string}, account: ${trans.account_addr}, balance change: ${trans.balance_delta}, aborted: ${trans.aborted}`,
            );
        }

        /*
            Sample output:

            Elector transactions for the key-block with seq_no = 14159649:
            2022-01-22 16:53:08.000, account: -1:3333333333333333333333333333333333333333333333333333333333333333, balance change: -1073741824, aborted: false
            2022-01-22 16:53:08.000, account: -1:3333333333333333333333333333333333333333333333333333333333333333, balance change: 3075000000, aborted: false
         */

        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error("Network is inaccessible.");
        } else {
            console.error(error);
        }
        process.exit(1);
    }
})();
