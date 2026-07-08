const { withGradleProperties } = require('@expo/config-plugins');

// The Gradle daemon crashed mid-build ("Could not receive a message from the
// daemon") on EAS's default free-tier build machine — the default 2048m
// heap isn't enough headroom to compile this project's several native
// modules (Firebase, OneSignal, etc.) in one Gradle invocation. Raising the
// heap here (applied during prebuild, since android/gradle.properties is
// regenerated on every EAS build) gives the daemon more room before OOM.
module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (config) => {
    const key = 'org.gradle.jvmargs';
    config.modResults = config.modResults.filter(
      (item) => !(item.type === 'property' && item.key === key)
    );
    config.modResults.push({
      type: 'property',
      key,
      value: '-Xmx3072m -XX:MaxMetaspaceSize=1024m',
    });
    return config;
  });
};
