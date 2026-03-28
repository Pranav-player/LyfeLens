const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolve a canonical path for three.js
const threeDir = path.resolve(__dirname, 'node_modules/three');

// 1. extraNodeModules: makes any `require('three')` in npm packages point to our single copy
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  three: threeDir,
};

// 2. resolveRequest: catch ALL 'three' imports at module resolution time
//    and redirect them to the single canonical copy — even if it comes from
//    inside @react-three/fiber or any other nested package.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three' || moduleName.startsWith('three/')) {
    const subPath = moduleName.startsWith('three/')
      ? moduleName.slice('three'.length)
      : '';
    return {
      filePath: path.resolve(threeDir, subPath || 'index.js'),
      type: 'sourceFile',
    };
  }
  // Default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
