// URL.protocol setter polyfill for Hermes (React Native)
// Expo's getManifestBaseUrl assigns url.protocol in strict mode.
// Hermes defines URL.prototype.protocol as getter-only (no setter).
// In strict mode this throws TypeError — so we add a no-op setter.
if (typeof URL !== 'undefined' && URL.prototype) {
  const desc = Object.getOwnPropertyDescriptor(URL.prototype, 'protocol');
  if (desc && typeof desc.get === 'function' && !desc.set) {
    try {
      Object.defineProperty(URL.prototype, 'protocol', {
        get: desc.get,
        set(_v) {},
        configurable: true,
        enumerable: desc.enumerable !== false,
      });
    } catch (_e) {}
  }
}
