var path = require('path');
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
    resolve: {
        extensions: [
            '.ts',
            '.js'
        ]
    }
};
