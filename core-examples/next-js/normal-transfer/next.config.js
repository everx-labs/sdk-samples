/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@eversdk/lib-web'],
  webpack(config) {
    config.output.webassemblyModuleFilename = './public/eversdk.wasm';
    config.experiments = { asyncWebAssembly: true };
    return config;
  },
};

module.exports = nextConfig;
