# Frontend Testing — garage

Use this skill when verifying UI behavior.

## Current Baseline
- `npm run build` runs TypeScript and Vite production build.
- No Vitest, React Testing Library, or Playwright suite exists yet.

## Verification Ladder
1. Run `npm run build` for all code changes.
2. Use a local Vite server for visual/browser checks when UI changes are meaningful.
3. Add Vitest for reusable logic or nontrivial component state.
4. Add Playwright when a real user workflow exists and should not regress.

## Smoke Areas
- Desktop and mobile rendering.
- No console errors.
- BugZero widget script does not break page load.
- Links, buttons, and forms work by keyboard and pointer.
