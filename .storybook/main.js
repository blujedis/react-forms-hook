const { resolve, join } = require("path");


module.exports = {

  stories: ["../src/**/*.story.tsx", "../src/**/story.tsx"],

  // Add any Storybook addons you want here: https://storybook.js.org/addons/
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-actions'
  ],

  webpackFinal: async (config) => {

    config.module.rules.push({
      test: /\.scss$/,
      use: ["style-loader", "css-loader", "sass-loader"],
      include: resolve(__dirname, "../")
    });

    config.module.rules.push({

      test: /\.(ts|tsx)$/,
      loader: require.resolve("babel-loader"),
      options: {
        presets: [["react-app", { flow: false, typescript: true }]]
      }

    });

    config.resolve.extensions.push(".ts", ".tsx");

    return config;

  }

};
