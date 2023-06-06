import React, {useContext, useEffect, useState} from "react"
import {
    KeyPair, TonClient,
} from "@eversdk/core"
import {TonClientContext} from "@/context/tonclient"

type HelloState = {
    version: string
    keys: KeyPair
}

async function createState(client: TonClient): Promise<HelloState> {
    return {
        version: (await client.client.version()).version,
        keys: await client.crypto.generate_random_sign_keys(),
    }
}

const Hello = () => {
    const [hello, setHello] = useState<HelloState>()
    const {client} = useContext(TonClientContext)
    useEffect(() => {
        (async () => {
            if (client) {
                setHello(await createState(client))
            }
        })()
    }, [client])

    return (
        <div>
            <p>TonClient Version: {hello?.version ?? "-"}</p>
            <p>Public Key: {hello?.keys.public ?? "-"}</p>
            <p>Secret Key: {hello?.keys.secret ?? "-"}</p>
        </div>
    )
}

// export default Demo

export default Hello
