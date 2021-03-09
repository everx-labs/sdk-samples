const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    devServer: {
        contentBase: path.join(__dirname, './web'),
        compress: true,
        port: 4000,
        disableHostCheck: true,
        historyApiFallback: true,
    },
    entry: path.join(__dirname, './index.js'),
    output: {
        path: path.join(__dirname, './web'),
        publicPath: '/',
        filename: '[name].bundle.js',
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: './node_modules/@tonclient/lib-web/tonclient.wasm' },
            ],
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: false,
            debug: true,
        }),
    ],
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                include: [
                    path.resolve('index.js'),
                    path.resolve(__dirname, './node_modules/webpack-dev-server'),
                    path.resolve(__dirname, './node_modules/@tonclient/core'),
                    path.resolve(__dirname, './node_modules/@tonclient/lib-web'),
                ],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.node$/,
                use: 'node-loader',
            },
        ],
    },
    resolve: {
        alias: {
            util: false,
            fs: false,
            stream: false,
            module: false,
            path: false,
            constants: false,
        },
        fallback: {
            assert: require.resolve("assert/")
        },
        extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.ts', '.tsx', '.js', '.jsx', '.json', '.json5', '.node', '.wasm'],
    },
};
