# Warnings & Deprecation Fixes Summary

## Issues Fixed

### 1. **Dotenv "injected env (5) from .env" Logging**

**Problem:** The dotenv package was logging verbose debug information about environment variable injection:

```
Γùç injected env (5) from .env // tip: Γùê encrypted .env [www.dotenvx.com]
```

**Root Cause:** The `config()` function from dotenv was being called without disabling debug mode, causing it to log all injected environment variables.

**Solution:** Pass `{ debug: false }` option to the `config()` function to suppress debug logging.

**File Modified:** `src/main/index.ts`

```typescript
// Before:
config()

// After:
config({ debug: false })
```

**Impact:** Eliminates noisy debug output while still loading environment variables correctly.

---

### 2. **Node.js Punycode Deprecation Warning**

**Problem:** Node.js was emitting a deprecation warning:

```
(node:14904) [DEP0040] DeprecationWarning: The `punycode` module is deprecated.
Please use a userland alternative instead.
```

**Root Cause:** The `punycode` module is deprecated in Node.js 15+. It's being used transitively through:

- `eslint` → `ajv` → `uri-js` → `punycode`

This is a known issue with older versions of these packages. The punycode module is only used during development (ESLint validation) and not in production.

**Solution:** Suppress deprecation warnings in production builds by setting `process.noDeprecation = true`.

**File Modified:** `src/main/index.ts`

```typescript
// Suppress Node.js deprecation warnings for transitive dependencies
// (punycode is used by eslint/ajv/uri-js but is deprecated in Node.js)
if (process.env.NODE_ENV === 'production') {
  process.noDeprecation = true
}
```

**Impact:** Eliminates deprecation warnings in production builds while keeping them visible in development for awareness.

---

### 3. **Native Module Loading Verbose Logging**

**Problem:** The native Rust module was logging its load path every time it was loaded:

```
[native] Rust module loaded from E:\Projects\UnrealLauncher\native\dist\index
```

**Root Cause:** The `getNative()` function was unconditionally logging the module path, which is verbose and unnecessary in production.

**Solution:** Only log the native module path in development mode to reduce production noise.

**File Modified:** `src/main/utils/native.ts`

```typescript
// Before:
console.log('[native] Rust module loaded from', getNativeModulePath())

// After:
if (process.env.NODE_ENV === 'development') {
  console.log('[native] Rust module loaded from', getNativeModulePath())
}
```

**Impact:** Cleaner production logs while maintaining debug visibility in development.

---

## Summary of Changes

| Issue                 | File                       | Change                                             | Impact                          |
| --------------------- | -------------------------- | -------------------------------------------------- | ------------------------------- |
| Dotenv logging        | `src/main/index.ts`        | Added `debug: false` to config()                   | Eliminates env injection logs   |
| Punycode deprecation  | `src/main/index.ts`        | Added `process.noDeprecation = true` in production | Suppresses deprecation warnings |
| Native module logging | `src/main/utils/native.ts` | Conditional logging based on NODE_ENV              | Cleaner production logs         |

## Build Status

✅ No TypeScript compilation errors
✅ All changes are backward compatible
✅ Production builds will be significantly quieter

## Testing Recommendations

1. **Development Build:** Run `npm run dev` and verify:
   - Native module loading message appears (expected)
   - No dotenv debug logs appear
   - Punycode warnings may still appear (expected in dev)

2. **Production Build:** Run `npm run build` and verify:
   - No dotenv debug logs
   - No punycode deprecation warnings
   - No native module loading messages
   - Application functions normally

3. **Environment Variables:** Verify that all environment variables from `.env` are still loaded correctly:
   - `VITE_APP_VERSION`
   - `VITE_DISCORD_WEBHOOK_URL`
   - `VITE_DISCORD_INVITE_URL`
   - `VITE_GITHUB_REPO_URL`
   - `VITE_KOFI_URL`

---

## Notes

- The punycode deprecation is a transitive dependency issue. A long-term solution would be to update `eslint`, `ajv`, and `uri-js` to newer versions that don't depend on punycode, but this is not critical since it only affects development builds.
- The `process.noDeprecation` flag only affects production builds, allowing developers to see deprecation warnings during development if needed.
- All logging changes maintain the ability to debug issues while reducing noise in normal operation.
