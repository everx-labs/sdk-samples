async function getLastBlockSeqNo(
    client,
) {
    return (await client.net.query({
        query: `
            {
                blockchain{
                    blocks(last: 1) {
                        edges {
                            node {
                                seq_no
                            }
                        }
                    }
                }
            }`,
    })).result.data.blockchain.blocks.edges[0].node.seq_no
}


module.exports = {
    getLastBlockSeqNo,
};
