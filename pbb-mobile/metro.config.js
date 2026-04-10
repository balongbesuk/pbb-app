const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// EXPLICITLY MAKE SURE RESOLVER SEES ASSETS
// Sometimes withNativeWind can override or have bugs with default asset handling
config.resolver.assetExts = [...config.resolver.assetExts, "png", "jpg", "jpeg", "gif", "ttf", "otf", "webp"];

module.exports = withNativeWind(config, { input: "./global.css" });
