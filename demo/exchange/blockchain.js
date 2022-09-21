async function getLastMasterBlockSeqNo(client) {
    return (await client.net.query({
        query: `
            query{
              blockchain{
                blocks(workchain:-1, last:1 ){
                  edges{
                    node{
                      seq_no
                    }
                  }
                }
              }
            }
        `
    })).result.data.blockchain.blocks.edges[0].node.seq_no
}

async function getLastMasterBlockSeqNoByTime(client, utime) {
    return (await client.net.query({
        query: `query MyQuery($utime: Int){
            blockchain {
                master_seq_no_range(time_end: $utime) { end }
            }
        }`,
        variables: {utime},
    })).result.data.blockchain.master_seq_no_range.end
}


module.exports = {
    getLastMasterBlockSeqNo,
    getLastMasterBlockSeqNoByTime,
};
