const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Termux/Android's per-user inotify watch limit is low and can't be raised
// without root (fs.inotify.max_user_watches is root-only writable there).
// Metro's file watcher kept hitting that ceiling ("ENOSPC: System limit for
// number of file watchers reached") crawling different huge, tooling-only
// subtrees inside node_modules/expo/node_modules/** one at a time
// (@expo/cli's own nested deps, then @react-native/debugger-frontend's
// bundled Chrome DevTools UI — thousands of files, only used by the "open
// debugger" dev tool, never part of the app bundle). Rather than block
// individual subfolders as each one surfaces, block the whole nested
// node_modules/expo/node_modules/** tree, with a single carved-out
// exception for the one file Metro's own default config actually reads
// from it directly: @expo/cli/build/metro-require/require.js (the bundle's
// require() runtime — blocking it breaks the build with a
// "Failed to get the SHA-1 for" error).
const existingBlockList = config.resolver.blockList
  ? (Array.isArray(config.resolver.blockList) ? config.resolver.blockList : [config.resolver.blockList])
  : [];

config.resolver.blockList = [
  ...existingBlockList,
  /node_modules\/expo\/node_modules\/(?!@expo\/cli\/build\/).*/,
];

module.exports = config;
