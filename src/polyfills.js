// URL property setter polyfill for Hermes (React Native)
// Hermes defines URL properties as getter-only. Expo's getManifestBaseUrl
// assigns url.protocol and url.pathname in strict mode — which throws TypeError.
// We add no-op setters for all standard URL mutable properties.
if (typeof URL !== 'undefined' && URL.prototype) {
  const props = ['protocol','username','password','host','hostname','port','pathname','search','hash'];
  props.forEach(function(prop) {
    const desc = Object.getOwnPropertyDescriptor(URL.prototype, prop);
    if (desc && typeof desc.get === 'function' && !desc.set) {
      try {
        Object.defineProperty(URL.prototype, prop, {
          get: desc.get,
          set(_v) {},
          configurable: true,
          enumerable: desc.enumerable !== false,
        });
      } catch (_e) {}
    }
  });
}
