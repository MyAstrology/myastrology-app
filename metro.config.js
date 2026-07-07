const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Termux/Android's per-user inotify watch limit is low and can't be raised
// without root (fs.inotify.max_user_watches is root-only writable there).
// Metro's file watcher was hitting that ceiling ("ENOSPC: System limit for
// number of file watchers reached") while crawling Expo CLI's own NESTED
// copy of its dependencies (node_modules/expo/node_modules/@expo/cli/
// node_modules/**, e.g. prebuild-config's per-module plugin folders —
// dozens of subfolders, one per Expo module). That nested node_modules is
// pure build tooling loaded directly by Node when `expo start` launches —
// never part of the app's own import graph — so excluding just that nested
// tree is safe. Note: this must NOT match @expo/cli/build/** — Metro's own
// default require runtime (@expo/cli/build/metro-require/require.js) lives
// there and IS read directly by Metro's dependency graph.
const existingBlockList = config.resolver.blockList
  ? (Array.isArray(config.resolver.blockList) ? config.resolver.blockList : [config.resolver.blockList])
  : [];

config.resolver.blockList = [
  ...existingBlockList,
  /node_modules\/expo\/node_modules\/@expo\/cli\/node_modules\/.*/,
];

module.exports = config;
