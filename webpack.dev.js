const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// TODO: load on dev only
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const plugins = [
  new HtmlWebpackPlugin({
    template: './index.html'
  }),
  new CleanWebpackPlugin()
];

module.exports = merge(common, {
  mode: 'development',
  output: {
    path: `${__dirname}/prod/lib`
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './prod/dist'
  },
  plugins: plugins
});
