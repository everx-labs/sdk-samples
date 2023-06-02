import '@/styles/globals.css'
import type {AppProps} from 'next/app'
import {TonClientContextProvider} from "@/context/tonclient"
import {ClientConfig} from "@eversdk/core"

export default function App({Component, pageProps}: AppProps) {
    const config: ClientConfig = {
        network: {
            endpoints: ["http://localhost"]
        }
    }

    return <TonClientContextProvider config={config}><Component {...pageProps} /></TonClientContextProvider>
}
