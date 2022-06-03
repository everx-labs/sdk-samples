async function getLastMasterBlockSeqNoByTime(client, utime) {
    return (
        await client.net.query({
            query: `query MyQuery($utime: Int){
            blockchain {
                master_seq_no_range(time_end: $utime) { end }
            }
        }`,
            variables: { utime },
        })
    ).result.data.blockchain.master_seq_no_range.end
}

module.exports = {
    getLastMasterBlockSeqNoByTime,
}
