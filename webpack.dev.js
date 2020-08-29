//TODO: load on dev only
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
var path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const plugins = [
    new HtmlWebpackPlugin({
        template: './index.html', 
    }),
];

module.exports = merge(common, {
    mode: 'development',
    output: {
        path: `${__dirname}/prod/lib`,
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: path.join(__dirname, 'prod/dist'),
    },
    plugins: plugins
});
