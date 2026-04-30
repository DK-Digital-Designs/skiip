# May 2026 Launch Baseline

Baseline captured on April 28, 2026 from branch `launch/may-2026-scope`, created from `staging` at `d34c7cfd3c92b4e04bde36f6b4502a2429fddd66`.

## Required Commands

| Command | Result | Notes |
| --- | --- | --- |
| `npm ci` in `app/` | Passed after approval | Initial sandbox run failed with Windows `EPERM` while cleaning/rebuilding `node_modules`; approved rerun succeeded. npm reported 6 vulnerabilities: 1 moderate and 5 high. |
| `npm run build` in `app/` | Passed | Vite production build completed successfully. |
| `npm run lint` in `app/` | Passed | ESLint completed with no reported errors. |
| `npm run test` in `app/` | Passed after approval | Initial sandbox run failed before tests because esbuild could not spawn. Approved rerun passed: 1 test file, 4 tests. |
| `npm run test:e2e` in `app/` | Passed after approval | Initial sandbox run failed because Playwright could not spawn. Approved rerun passed: 3 public smoke tests passed, 3 authenticated smoke tests skipped. |

## Baseline Follow-Up

- npm audit findings are baseline security debt and should be reviewed separately from the launch blocker fixes unless they map to a concrete launch risk.
- Authenticated e2e coverage remains skipped in the current baseline and should be revisited during staging account setup.
