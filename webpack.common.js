const webpack = require('webpack');
const libraryTarget = require('yargs').argv['output-library-target'];
const pkg = require('./package.json');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const libraryName = pkg.name;
const banner = `${pkg.name}
${pkg.description}\n
@version v${pkg.version}
@author ${pkg.author}
@homepage ${pkg.homepage}
@repository ${pkg.repository.url}`;

const plugins = [
    new webpack.BannerPlugin(banner),
    new CleanWebpackPlugin(),
];

module.exports = {
    entry: `${__dirname}/index.js`,
    output: {
        filename: `${libraryName}.js`,
        library: libraryName,
        libraryTarget: libraryTarget || 'umd',
        globalObject: '(typeof self !== \'undefined\' ? self : this)', // TODO Hack (for Webpack 4+) to enable create UMD build which can be required by Node without throwing error for window being undefined (https://github.com/webpack/webpack/issues/6522)
        umdNamedDefine: true
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: plugins
};
