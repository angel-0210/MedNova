// ponytail: expo/metro-config handles npm-workspace monorepos out of the box since SDK 50.
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
