const { withGradleProperties } = require('@expo/config-plugins');

// The Gradle daemon keeps crashing mid-build ("Could not receive a message
// from the daemon") on EAS's free-tier build machine — this project
// autolinks many native modules at once (Firebase, OneSignal, WebView,
// navigation, etc.), and raising just the heap size wasn't enough, which
// points to total host memory pressure from multiple concurrent
// workers/daemons rather than one JVM hitting its own ceiling. So instead of
// only asking for a bigger heap, this also turns off the persistent daemon
// (removes the daemon-connection failure mode entirely) and caps
// parallelism to keep peak memory usage down.
const OVERRIDES = {
  'org.gradle.jvmargs': '-Xmx2560m -XX:MaxMetaspaceSize=768m',
  'org.gradle.daemon': 'false',
  'org.gradle.parallel': 'false',
  'org.gradle.workers.max': '1',
};

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (config) => {
    const keys = Object.keys(OVERRIDES);
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && keys.includes(item.key))
    );
    for (const key of keys) {
      config.modResults.push({ type: 'property', key, value: OVERRIDES[key] });
    }
    return config;
  });
};
