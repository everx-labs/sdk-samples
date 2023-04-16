import { TonClient } from '@eversdk/core'

type Maybe<T> = NonNullable<T> | undefined
interface AccountBalance { balance: bigint }
interface GuessSenderResult { address: string }

// eslint-disable-next-line no-promise-executor-return
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function getAccountBalance (
    c: TonClient,
    address: string
): Promise<Maybe<AccountBalance>> {
    const q = `query{blockchain{account(address:"${address}"){info{balance}}}}`
    const res = (await c.net.query({ query: q }))
    const { info } = res.result.data.blockchain.account

    if (!info || !info.balance) return undefined
    return { balance: BigInt(info.balance) }
}

async function guessSender (
    c: TonClient,
    address: string
): Promise<Maybe<GuessSenderResult>> {
    const q = `query{messages(filter:{dst:{
        eq:"${address}"
    },msg_type:{eq:0}}){src}}`

    const res = (await c.net.query({ query: q })).result.data.messages
    return res[res.length - 1].src ?? undefined
}

export type { Maybe }
export { AccountBalance, GuessSenderResult }
export { sleep, getAccountBalance, guessSender }
