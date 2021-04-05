const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv').config({
     path: path.join(__dirname, '.env')
});

module.exports = {
    entry: [
        './src/main.ts'
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, '.upload/js')
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'awesome-typescript-loader'
            },
            {
                test: /lang\//,
                loader: '@alienfast/i18next-loader'
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            _config: JSON.stringify(dotenv.parsed)
        })
    ],
    resolve: {
        extensions: [
            '.ts',
            '.js'
        ]
    }
};
