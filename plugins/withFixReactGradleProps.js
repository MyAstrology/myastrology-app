const { withAppBuildGradle } = require('@expo/config-plugins');

// "enableBundleCompression" was removed from the React Native Gradle
// plugin's `react {}` extension in RN 0.74+ (this project is on 0.78), but
// it still ends up in the generated android/app/build.gradle on EAS's build
// server — likely template/version drift since this project has no
// lockfile pinning exact dependency versions. Whatever the source, Gradle
// fails immediately with "Could not set unknown property
// 'enableBundleCompression'" before the real build even starts, so this
// strips the line during prebuild regardless of where it came from.
module.exports = function withFixReactGradleProps(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = config.modResults.contents
        .split('\n')
        .filter((line) => !/enableBundleCompression/.test(line))
        .join('\n');
    }
    return config;
  });
};
