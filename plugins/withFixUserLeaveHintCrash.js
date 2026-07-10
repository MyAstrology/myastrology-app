const { withMainActivity } = require('@expo/config-plugins');

// React Native's own ReactActivityDelegate.onUserLeaveHint() can throw a
// NullPointerException (Objects.requireNonNull on its internal delegate)
// if the user backgrounds the app (home button, notification, incoming
// call, screen lock) while the JS bundle is still loading — a narrow
// startup race inside RN's own Java code, not caused by anything in this
// app's JS. Wrapping the super call in try/catch prevents the crash;
// there's nothing meaningful to notify JS about yet if React hasn't
// finished initializing.
const OVERRIDE_KT = `
  override fun onUserLeaveHint() {
    try {
      super.onUserLeaveHint()
    } catch (e: Exception) {
      // React wasn't ready yet (app backgrounded during startup) — ignore.
    }
  }
`;
const OVERRIDE_JAVA = `
  @Override
  public void onUserLeaveHint() {
    try {
      super.onUserLeaveHint();
    } catch (Exception e) {
      // React wasn't ready yet (app backgrounded during startup) — ignore.
    }
  }
`;

module.exports = function withFixUserLeaveHintCrash(config) {
  return withMainActivity(config, (config) => {
    const { language, contents } = config.modResults;
    if (contents.includes('onUserLeaveHint')) return config; // already patched
    const isKt = language === 'kt' || language === 'kotlin';
    const override = isKt ? OVERRIDE_KT : OVERRIDE_JAVA;
    const classMatch = contents.match(/class MainActivity[^{]*\{/);
    if (!classMatch) return config;
    const insertAt = classMatch.index + classMatch[0].length;
    config.modResults.contents =
      contents.slice(0, insertAt) + '\n' + override + contents.slice(insertAt);
    return config;
  });
};
