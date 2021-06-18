const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const plugins = [
  new CleanWebpackPlugin(),
  new webpack.SourceMapDevToolPlugin({
    filename: '[name].js.map'
  })
];

module.exports = merge(common, {
  output: {
    path: `${__dirname}/prod/dist`
  },
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          sourceMap: true,
          keep_fnames: false,
          keep_classnames: true
        }
      })
    ]
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  plugins: plugins
});
