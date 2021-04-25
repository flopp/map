const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const envPath = fs.existsSync(path.join(__dirname, '.env'))
    ? path.join(__dirname, '.env')
    : path.join(__dirname, '.env.sample');
const dotenv = require('dotenv').config({
    path: envPath,
});

module.exports = {
    entry: './src/main.ts',
    mode: 'development',
    devtool: 'source-map',
    optimization: {
        usedExports: true,
    },
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                bulma: {
                    test: /[\\/]node_modules[\\/]bulma[\\/]/,
                    priority: -5,
                    reuseExistingChunk: true,
                },
                leaflet: {
                    test: /[\\/]node_modules[\\/]leaflet[\\/]/,
                    priority: -5,
                    reuseExistingChunk: true,
                },
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    reuseExistingChunk: true,
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                },
            },
        },
    },
    module: {
        rules: [
            {
                test: /lang\//,
                exclude: /node_modules/,
                loader: '@alienfast/i18next-loader',
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                },
            },
            {
                test: /\.(scss|css)$/,
                use: [
                    process.env.NODE_ENV !== 'production'
                        ? 'style-loader'
                        : MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                test: /\.png$/,
                use: ['file-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    plugins: [
        new webpack.DefinePlugin({
            _config: JSON.stringify(dotenv.parsed),
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: '[name].[contenthash].css',
            chunkFilename: '[id].css',
        }),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'src/assets',
                    to: 'assets',
                },
                {
                    from: 'node_modules/feather-icons/dist/feather-sprite.svg',
                    to: 'assets',
                },
            ],
        }),
    ],
};
