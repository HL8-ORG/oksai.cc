const { composePlugins, withNx } = require('@nx/webpack');

module.exports = composePlugins(withNx(), (config) => {
  // Disable license-webpack-plugin which causes issues
  config.plugins = (config.plugins || []).filter(
    (plugin) => plugin.constructor.name !== 'LicenseWebpackPlugin'
  );

  return {
    ...config,
    node: {
      ...config.node,
      __dirname: false,
      __filename: false,
    },
  };
});
