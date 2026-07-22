// The CI matrix installs dependencies with Bun but runs the test suite under
// Node.js (via vitest's `#!/usr/bin/env node` shebang), so every Node version in
// the matrix is genuinely exercised. This guard fails loudly if the suite ever
// starts running under the Bun runtime instead, which would silently make the
// Node version matrix meaningless.
test('runs under the Node.js runtime, not Bun', () => {
  expect(typeof (globalThis as { Bun?: unknown }).Bun).toBe('undefined');
  expect(process.versions.node).toBeTruthy();
});
