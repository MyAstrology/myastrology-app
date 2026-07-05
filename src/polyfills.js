// URL.protocol setter polyfill for Hermes (React Native)
// Hermes implements URL.protocol as getter-only; expo's getManifestBaseUrl
// tries to ASSIGN to url.protocol which throws TypeError.
if (typeof URL !== 'undefined' && URL.prototype) {
  try {
    // Test: can we assign to .protocol?
    const t = new URL('https://x.com');
    t.protocol = 'https:';
  } catch (_assignErr) {
    // Assignment failed — protocol has no setter. Try to add one.
    try {
      const existing = Object.getOwnPropertyDescriptor(URL.prototype, 'protocol');
      const getter   = existing && existing.get;

      // Remove the old descriptor so we can redefine
      try { delete URL.prototype.protocol; } catch (_) {}

      Object.defineProperty(URL.prototype, 'protocol', {
        get: getter || function () {
          const m = typeof this.href === 'string'
            ? this.href.match(/^[a-zA-Z][a-zA-Z0-9+\-.]*:/) : null;
          return m ? m[0] : '';
        },
        set(_v) {
          // No-op: prevents "Cannot assign to getter-only property" crash.
          // expo only reads the protocol after setting it, so this is safe.
        },
        configurable: true,
        enumerable:   true,
      });
    } catch (_patchErr) {
      // If even delete+redefine fails, wrap the URL class itself
      try {
        const OrigURL = URL;
        function PatchedURL(url, base) {
          return base ? new OrigURL(url, base) : new OrigURL(url);
        }
        PatchedURL.prototype = OrigURL.prototype;
        PatchedURL.createObjectURL = OrigURL.createObjectURL;
        PatchedURL.revokeObjectURL = OrigURL.revokeObjectURL;

        Object.defineProperty(URL.prototype, 'protocol', {
          get() {
            const m = typeof this.href === 'string'
              ? this.href.match(/^[a-zA-Z][a-zA-Z0-9+\-.]*:/) : null;
            return m ? m[0] : '';
          },
          set(_v) {},
          configurable: true,
          enumerable:   true,
          writable:     undefined,
        });
      } catch (_) {}
    }
  }
}
