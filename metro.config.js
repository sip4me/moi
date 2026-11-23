// Adds .woff2 so the web build can ship small, subset web fonts (see assets/fonts and src/app/_layout.tsx).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('woff2');

module.exports = config;
