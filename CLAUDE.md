# MyAstrology app — Expo/React Native repo (`myastrology/myastrology-app`)

Mobile app for the MyAstrology website (myastrology.in). Expo (SDK 54) +
React Native, React Navigation bottom tabs, Firebase (Auth + Firestore),
OneSignal push. Most calculator screens are **not** native React Native UI —
they're a `WebView` (`src/components/LocalWebView.js`) rendering a
JS-bundled copy of the website's calculator pages.

## Sibling repo — this is the important one to know

The website lives in a **separate repo**, `myastrology/services` (on disk
in this sandbox at `/home/user/services` when both are checked out). That
repo has the canonical, human-edited source for each calculator
(`kundali.html`, `match-making.html`, `panjika.html`, `namakaran.html`,
etc). This repo's `src/web-html/*.js` files are **hand-bundled JS-string
copies** of those pages (`kundali.js`, `match-making.js`, `panjika.js`,
`namakaran.js`, `numerology.js`, `prashna.js`, `result.js`,
`varshaphala.js`, plus `-print.js` variants for PDF export) — each is
effectively "that HTML page, serialized into a JS string the WebView
injects."

**Consequence: a fix made in the website repo's `.html` files does not
automatically apply here.** It has to be manually ported into the matching
`src/web-html/*.js` file. These bundles are large (multi-MB single-line
strings) — don't regenerate one from scratch to make a small change.
Instead: read the target bundle, find the *exact* source snippet
corresponding to the website-side fix, and do a precise string replacement
(a small Python/Node script doing `count() == 1` before `replace()` is a
good safety check), then verify the file still parses. See git history
(e.g. the mahadasha `.toFixed(1)` display fix, ported the same day across
both repos with matching commit messages) for the pattern to follow.

When asked to fix something in a calculator's *display/logic*, always ask:
does this same code exist in both repos? If yes, port to both, and say so
explicitly rather than fixing only the one you were pointed at.

## Structure

- `src/screens/` — one file per screen (`HomeScreen.js`, `KundaliScreen.js`,
  `RashifalScreen.js`, `AdminScreen.js`, `SettingsScreen.js`, etc.)
- `src/components/LocalWebView.js` — the shared WebView wrapper that loads
  a `web-html/*.js` bundle; screens like `KundaliScreen.js` are thin
  wrappers around this
- `src/navigation/menuItems.js` — single source of truth for the app's menu
  list, consumed by both the drawer (`AppHeader.js`) and `BottomTabs.js`
  (hidden tabs use `tabBarItemStyle:{display:'none'}` for screens reached
  only via the menu, not the visible tab bar)
- `src/context/UserContext.js` — local profile, persisted to AsyncStorage
  (not tied to login)
- `src/context/AuthContext.js` — Firebase Auth (Google Sign-In), wraps
  `onAuthStateChanged`; on first sign-in upserts a `users/{uid}` Firestore
  doc
- `src/theme/` — `colors.js`, `radii.js`, `shadows.js`, `spacing.js`,
  `typography.js` — shared design tokens, use these instead of hardcoding
  values in a screen
- `firestore.rules` — admin allowlist (by email) gates `AdminScreen.js`'s
  Firestore reads; both this file and the client-side check in
  `AdminScreen.js` need updating together if the allowlist changes
- OneSignal App ID must match the website's `js/push-init.js` exactly (both
  register against the same OneSignal app so the site's existing daily
  cron-posted notifications reach the app too, with zero new server code)

## Testing / verification in this sandbox

- **No `node_modules` here** (not installed in this sandbox) — cannot run
  the app, a bundler, or Metro locally. Verify JS edits by syntax-checking
  (e.g. a babel-based parse check) rather than running the app, and say so
  plainly rather than claiming to have tested it live.
- Native-module features (OneSignal push, Google Sign-In via
  `@react-native-google-signin`) cannot be exercised in Expo Go — they need
  a custom dev client (`eas build --profile development`). That build step
  has to happen on the user's own machine/Expo account; hand them the exact
  commands rather than attempting it here.

## Git / branches

This repo's history shows direct commits landing on `main` (not
feature-branch + merge) — match that pattern unless told otherwise, but
still confirm before pushing anything user-visible/hard-to-reverse (native
builds, Firestore rules changes, OneSignal config).

## Conventions

- Commit messages and in-app strings are Bengali; comments explain *why*
  (a constraint, a past bug, a platform quirk), not *what* — follow that
  pattern rather than adding narrative comments.

## Porting one inlined `src/*.js` into a bundle — the safe, verifiable way

`scripts/bundle-web-assets.js` inlines each website `<script src="src/x.js">`
as `<script>/*src/x.js*/\n…\n</script>` inside the exported string. So a
whole engine file can be swapped **without** regenerating the bundle and
losing the hand-applied patches:

1. `JSON.parse` the `export default "…"` body back into the HTML string.
2. Find `<script>/*src/match-making.js*/\n` and the next `\n</script>`.
3. Replace only what is between them with the website file's contents.
4. Re-emit `export default ${JSON.stringify(html)};` with the same header.

**Then prove the edit was local**: assert the prefix before the block and
the suffix after it are character-identical to the originals. And **prove
the result is right**: re-decode the bundle, pull the block out, run it in
a `vm` context (`{window:{}, module:{exports:{}}}` is enough for
`match-making.js`), and compare `match()` output against the website engine
over a sweep — 6,048 couples, zero differences, is what "ported" should
mean. `node --check` alone only proves it parses.

This worked because `src/match-making.js` is self-contained — it defines
its own `MM_TEXT`/`_mm()`, and with no overlay loaded `_mm()` returns the
Bengali thunk, so the i18n plumbing is inert in the app and the Bengali
output is byte-identical. Check that self-containment before using this on
another file; an engine that expects a helper defined elsewhere in the page
will fail silently at runtime, not at parse time.

⚠️ The page-level code (`_mmDoshaNashakHtml`, `_MM_DOSHA_NAME`, …) is a
**separate** hand-maintained copy without the `_mp()` wrappers. Swapping
the engine does not update it — new `doshaNashak` keys need their Bengali
names added there by hand, or the reader sees a raw key like `rashi`.
