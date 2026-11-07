# Practice-time companion unlocks & Progress calendar (November 2026)

## Companion roster and milestones
The owner-approved roster remains **Luna, Milo, Maple**. No retired character art or unapproved new characters are restored.

- **Luna:** free / selected by default.
- **Milo:** unlocked after **60 cumulative minutes** of logged completed sessions.
- **Maple:** unlocked after **300 cumulative minutes** of logged completed sessions.

Cumulative time is computed from non-negative duration **seconds** in real saved sessions, then rounded **down once** at the total, to prevent many short sessions from falsely granting a milestone. The chooser shows locked characters (grayscale with minutes remaining) and disables selection until earned. No new poses or artwork.

Prior selections are retained even if saved history cannot be loaded. Earned unlocks are cached per account in `little-jazz-room:unlocked-companions:v1:<account-key>`; updates are monotonic and do not reset on session loss/refresh. Current visible selections and all eight legacy identity records remain supported for existing storage and rewards. The three-choice visible roster remains unchanged. Unlocks are earned on session completion and survive normal reloading. These are earned UI flags, **not security/paid entitlements**. Cat Mode is independent.

## Calendar
Moved the **existing** practice calendar from Profile/Settings to Progress, after the current-week chart and before Recent Sessions. It uses real logged session dates and durations, grouped by **local calendar day**, with month navigation, accessible dates, today's border and practiced-day color. No duplicated calendar in Settings.

## Boundaries
- No new database tables, migrations, framework changes, external services, route changes, audio behavior, or extra animations.
- Both existing Light / near-black Dark modes supported via semantic tokens.
- No merge to master/demo branch and no production deployment in this PR. A Vercel **preview** is safe to review.
- Verified with `practiceCalendar.test.ts`, `companionUnlocks.test.ts`, existing test suite and clean-pixel mobile matrix.
