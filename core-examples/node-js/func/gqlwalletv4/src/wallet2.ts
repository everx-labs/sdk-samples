import { libNode } from '@eversdk/lib-node'
import {
    builderOpBitString, builderOpCell,
    builderOpInteger, TonClient, builderOpCellBoc, builderOpAddress, ResultOfEncodeExternalInMessage
} from '@eversdk/core'

const u = (size: number, x: number | bigint) => {
    if (size === 256) {
        return builderOpBitString(`x${BigInt(x).toString(16).padStart(64, '0')}`)
    }
    return builderOpInteger(size, x)
}

const u1 = (x: number | bigint) => u(1, x)
const u8 = (x: number | bigint) => u(8, x)
const u32 = (x: number | bigint) => u(32, x)
const u64 = (x: number | bigint) => u(64, x)
const u128 = (x: number | bigint) => u(128, x)
const u256 = (x: number | bigint) => u(256, x)
const b0 = u(1, 0n)
const b1 = u(1, 1n)
const bits = x => builderOpBitString(x)
const bytes = x => bits(x.toString('hex'))
const nulldict = b0

interface ContractWalletV4Options {
    workchain: number;
    publicKey: string;
    subwalletId: number;
}

class WalletV4 {
    // eslint-disable-next-line max-len
    public code = Buffer.from('B5EE9C72410214010002D4000114FF00F4A413F4BCF2C80B010201200203020148040504F8F28308D71820D31FD31FD31F02F823BBF264ED44D0D31FD31FD3FFF404D15143BAF2A15151BAF2A205F901541064F910F2A3F80024A4C8CB1F5240CB1F5230CBFF5210F400C9ED54F80F01D30721C0009F6C519320D74A96D307D402FB00E830E021C001E30021C002E30001C0039130E30D03A4C8CB1F12CB1FCBFF1011121302E6D001D0D3032171B0925F04E022D749C120925F04E002D31F218210706C7567BD22821064737472BDB0925F05E003FA403020FA4401C8CA07CBFFC9D0ED44D0810140D721F404305C810108F40A6FA131B3925F07E005D33FC8258210706C7567BA923830E30D03821064737472BA925F06E30D06070201200809007801FA00F40430F8276F2230500AA121BEF2E0508210706C7567831EB17080185004CB0526CF1658FA0219F400CB6917CB1F5260CB3F20C98040FB0006008A5004810108F45930ED44D0810140D720C801CF16F400C9ED540172B08E23821064737472831EB17080185005CB055003CF1623FA0213CB6ACB1FCB3FC98040FB00925F03E20201200A0B0059BD242B6F6A2684080A06B90FA0218470D4080847A4937D29910CE6903E9FF9837812801B7810148987159F31840201580C0D0011B8C97ED44D0D70B1F8003DB29DFB513420405035C87D010C00B23281F2FFF274006040423D029BE84C600201200E0F0019ADCE76A26840206B90EB85FFC00019AF1DF6A26840106B90EB858FC0006ED207FA00D4D422F90005C8CA0715CBFFC9D077748018C8CB05CB0222CF165005FA0214CB6B12CCCCC973FB00C84014810108F451F2A7020070810108D718FA00D33FC8542047810108F451F2A782106E6F746570748018C8CB05CB025006CF165004FA0214CB6A12CB1FCB3FC973FB0002006C810108D718FA00D33F305224810108F459F2A782106473747270748018C8CB05CB025005CF165003FA0213CB6ACB1F12CB3FC973FB00000AF400C9ED54696225E5', 'hex')

    public address: string = ''

    public stateInit: string = ''

    public client: TonClient

    public options: ContractWalletV4Options

    constructor (client: TonClient, options: ContractWalletV4Options) {
        this.client = client
        this.options = options
    }

    public async buildStateInit () {
        const data = (await this.client.boc.encode_boc({
            builder: [
                u32(0n),                       // stored_seqno
                u32(this.options.subwalletId), // stored_subwallet
                u256(BigInt(`0x${this.options.publicKey}`)), // public_key
                nulldict                       // plugins
            ]
        })).boc

        this.stateInit = (await this.client.boc.encode_boc({
            builder: [
                b0, b0, b1, b1, nulldict,
                builderOpCellBoc(this.code.toString('base64')),
                builderOpCellBoc(data)
            ]
        })).boc

        this.address = `0:${(await this.client.boc.get_boc_hash({ boc: this.stateInit })).hash}`
    }

    public async buildSimpleSend (
        msgSeqno: number,
        value: bigint,
        to: string,
        bounce: boolean,
        privateKey: string
    ): Promise<ResultOfEncodeExternalInMessage> {
        const sizeVUI = Math.ceil(Math.log2(16))
        const sizeBytesVUI = Math.ceil((value.toString(2).length) / 8)
        const sizeBitsVUI = sizeBytesVUI * 8

        const validUntil = ~~(Date.now() / 1000) + 3600

        const biba = () => [
            u32(this.options.subwalletId), // subwallet_id
            u32(validUntil),               // valid_until
            u32(msgSeqno),                 // msg_seqno
            u8(0),                         // op: simple send
            u8(3),                         // mode
            
        ]

        const messageBody =  (await this.client.boc.encode_boc({ builder: biba() })).boc

        const signSecret = await this.client
            .crypto.nacl_sign_keypair_from_secret_key({ secret: privateKey })

        const { signature } = await this.client
            .crypto.nacl_sign_detached({
                unsigned: Buffer.from(
                    (await this.client.boc.get_boc_hash({ boc: messageBody })).hash,
                    'hex'
                ).toString('base64'),
                secret: signSecret.secret
            })

        const tb = biba()
        tb.unshift(bytes(signature))
        // console.log(tb)

        const dbody = (await this.client.boc.encode_boc({ builder: tb })).boc

        const extMsg = await this.client.boc.encode_external_in_message({
            dst: this.address,
            init: msgSeqno === 0 ? this.stateInit : undefined,
            body: dbody
        })

        return extMsg
    }
}
const ENDPOINTS = [
    'https://devnet.evercloud.dev/1b9cc796b28a48bb9cef97cc2ed9a304/graphql'
]

async function main () {
    TonClient.useBinaryLibrary(libNode)
    const client = new TonClient({ network: { endpoints: ENDPOINTS } })

    // eslint-disable-next-line max-len
    const mnemonic = 'galaxy promote aerobic pact engine prepare unaware cage mango slow day host crisp bright worth sustain breeze update cricket shine traffic exist term loan'
    const keypair = await client.crypto.mnemonic_derive_sign_keys({
        phrase: mnemonic,
        dictionary: 0,
        word_count: 24
    })

    const wallet = new WalletV4(client, {
        workchain: 0,
        publicKey: keypair.public,
        subwalletId: 698983191 + 11
    })

    await wallet.buildStateInit()

    console.log(`address: ${wallet.address}`)

    const extmsg = await wallet.buildSimpleSend(
        0,
        1_000_000n,
        '0:9ebec743687fc1cd97f3ca66871d87f0fb8bbe54627e67d1c321afc6c741392f',
        false,
        keypair.secret
    )
    

    console.log(`sending... (${extmsg.message_id})`)
    const res = await client.processing
        .send_message({ message: extmsg.message, send_events: false })
        console.log(res)

try {
    await client.processing.wait_for_transaction({
        message: extmsg.message,
        shard_block_id: res.shard_block_id,
        send_events: false
    })
}
catch(error){
    console.error(error);
}

    process.exit(0)
}

if (require.main === module) {
    main()
}
