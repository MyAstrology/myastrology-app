const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow .html files to be treated as static assets (for local WebView)
config.resolver.assetExts.push('html');

module.exports = config;
