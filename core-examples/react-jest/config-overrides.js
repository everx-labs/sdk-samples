const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    webpack: function (config, env) {
        config.plugins.push(
            new CopyWebpackPlugin({
                patterns: [{ from: "./node_modules/@eversdk/lib-web/eversdk.wasm" }],
            })
        );
        return config;
    },
    jest: function (config) {
        config.transformIgnorePatterns = [
            "[/\\\\]node_modules[/\\\\](?!(@eversdk/lib-web))\\.(js|jsx|mjs|cjs|ts|tsx)$",
            "^.+\\.module\\.(css|sass|scss)$",
        ];
        return config;
    },
};
