const CopyWebpackPlugin = require('copy-webpack-plugin')
/** @type {import("next").NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["@eversdk/lib-web"],

    webpack(config) {
        config.output.webassemblyModuleFilename = "./eversdk.wasm"
        config.experiments = {asyncWebAssembly: true}
        config.plugins = [new CopyWebpackPlugin({
            patterns: [{from: './node_modules/@eversdk/lib-web/eversdk.wasm'}],
        }), ...config.plugins]
        return config
    },
}

module.exports = nextConfig
