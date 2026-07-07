const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Termux/Android's per-user inotify watch limit is low and can't be raised
// without root (fs.inotify.max_user_watches is root-only writable there).
// Metro's file watcher was hitting that ceiling ("ENOSPC: System limit for
// number of file watchers reached") while crawling Expo CLI's own deeply
// nested internal copy of its dependencies (node_modules/expo/node_modules/
// @expo/cli/node_modules/**, e.g. prebuild-config's per-module plugin
// folders). That subtree is pure build tooling loaded directly by Node when
// `expo start` launches — it's never part of the app's own import graph, so
// excluding it from Metro's watch/crawl scope is safe and cuts the watched
// file count substantially.
const existingBlockList = config.resolver.blockList
  ? (Array.isArray(config.resolver.blockList) ? config.resolver.blockList : [config.resolver.blockList])
  : [];

config.resolver.blockList = [
  ...existingBlockList,
  /node_modules\/expo\/node_modules\/@expo\/cli\/.*/,
];

module.exports = config;
