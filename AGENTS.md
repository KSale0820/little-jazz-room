# Little Jazz Room: contributor instructions

Application root: `web/`. React 19, TypeScript, Vite, React Router, existing localStorage and optional Supabase. Inspect the current implementation before changing behavior.

## Clean Pixel theme integration

For theme work, **read `web/docs/CLEAN-PIXEL-THEMES.md` first**. It defines:
- Current authority: `class-demo-2026-10-31`, preserving live routes, control positions, chart notation, audio, state and saved data.
- Integration branch: `integration/clean-pixel-themes`. Do not merge this into the demo branch, master, or deploy without owner approval.
- Exclusive file ownership for controller, screen styling agent and pixel assets agent.
- Semantic CSS colors, `useAppearance()` preference contract, decorative-only Cat Mode, and QA requirements.

Do not revive obsolete October Home artwork, navigation or placeholder audio. No new animations, features, frameworks, paid services or unrelated PR merges.

Changes should be small PRs targeting the rolling integration branch. Keep avatar, companion choice, rewards, achievements and saved progress independent of Cat Mode. Build and test from `web/`; record regression vs known baseline failures.
