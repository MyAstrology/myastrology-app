// URL.protocol polyfill for older Hermes builds (React Native < 0.79)
try {
  if (typeof URL !== 'undefined') {
    void new URL('https://test.com').protocol;
  }
} catch (e) {
  if (e && typeof e.message === 'string' && e.message.includes('not implemented')) {
    try {
      Object.defineProperty(URL.prototype, 'protocol', {
        get() {
          const m = typeof this.href === 'string'
            ? this.href.match(/^([a-zA-Z][a-zA-Z0-9+\-.]*):/i)
            : null;
          return m ? m[0] : '';
        },
        configurable: true,
        enumerable:   false,
      });
    } catch (_) {}
  }
}
