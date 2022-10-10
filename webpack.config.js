const path = require("path");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

const { styles } = require("@ckeditor/ckeditor5-dev-utils");

module.exports = {
  devtool: "source-map",
  performance: { hints: false },

  entry: "./src/th-ckeditor.js",

  output: {
    // The name under which the editor will be exported.
    library: "CKSource",

    path: path.resolve(__dirname, "build"),
    filename: "th-ckeditor.js",
    libraryTarget: "umd",
    libraryExport: "default",
  },

  optimization: {
    minimize: true,
    minimizer: [new TerserWebpackPlugin()],
  },

  plugins: [new CompressionPlugin()],

  module: {
    rules: [
      {
        test: /\.svg$/,
        use: ["raw-loader"],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader",
            options: {
              injectType: "singletonStyleTag",
              attributes: {
                "data-cke": true,
              },
            },
          },
          {
            loader: "css-loader",
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: styles.getPostCssConfig({
                themeImporter: {
                  themePath: require.resolve("@ckeditor/ckeditor5-theme-lark"),
                },
                minify: true,
              }),
            },
          },
        ],
      },
    ],
  },
};
