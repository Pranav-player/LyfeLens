const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force a single copy of three.js to prevent the
// "Multiple instances of Three.js being imported" warning,
// which breaks @react-three/fiber's useFrame clock and animations.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  three: path.resolve(__dirname, 'node_modules/three'),
};

module.exports = config;
