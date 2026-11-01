# Agent Handoff: Fix Bottom Navigation Practice Icon

## Context and authority

- Repository: `KSale0820/little-jazz-room`
- Working branch: `class-demo-2026-10-31`; PR: [#7](https://github.com/KSale0820/little-jazz-room/pull/7)
- Current visual state: H01 (Home) and all eight sleeping-companion screenshots are **approved by the project owner**.
- This handoff covers **one final visual defect only**: the Practice icon in the four-tab bottom navigation is incorrect.
- Keep PR #7 open; do not merge it as part of this task. The branch is a class MVP, not a redesign opportunity.

## Diagnosed cause

`web/src/components/AppShell.tsx` renders the bottom four tabs with `<PixelIcon route={route} />`. The Practice route is `/practice`.

`web/src/components/PixelIcon.tsx` currently renders an **inline SVG path** for `route === 'practice'`, even though the repo already ships the intended approved pixel icon:

- `web/public/visuals/icons/nav-practice.svg`
- `VISUAL_ASSETS.icons.nav.practice` in `web/src/assets/visualManifest.ts`

The same `PixelIcon` component already uses a CSS mask for the approved **Explore** icon, honoring the active/inactive `currentColor` styling. The Practice SVG is already present and uses `fill="currentColor"`. Use the existing asset; **do not redraw or generate an icon**.

## Task

1. On `class-demo-2026-10-31`, inspect `PixelIcon.tsx`, the existing `nav-practice.svg`, and the latest H01 browser screenshot.
2. Change `PixelIcon` so the Practice route uses `VISUAL_ASSETS.icons.nav.practice` as a CSS mask, following the existing Explore icon pattern. For example, register `practice` in `NAV_FILES` and use the mask branch for both `explore` and `practice`. Remove or leave unused the stale inline Practice path, without affecting other routes.
3. Preserve color inheritance, the 23px icon footprint, and active/inactive styling. Confirm the Practice nav item still navigates to `/practice`.
4. Add a focused test if helpful. Do not change any other icon, screen, route, cat sprite, room illustration, layout, content, or feature.

## Acceptance checklist

- Bottom tabs remain **Home | Tracks | Practice | Progress**, in that order.
- Practice displays the **approved** `nav-practice.svg` icon instead of the incorrect inline musical-note path.
- Both active and inactive states remain legible and correctly colored.
- No overlap or visual regression at **390×844** and **375×667**.
- Run `cd web && npm run build && npm test`.
- Run existing Home Playwright/browser checks; the branch workflow `.github/workflows/class-demo-home.yml` captures screenshots. Include both viewport screenshots of the updated Practice tab in the PR discussion (or an artifact link).
- Commit the narrowly scoped change to PR #7 and report SHA, test results, and before/after screenshot.

## Explicit non-goals

Do not regenerate artwork or modify approved H01 screenshots, companions (Luna, Milo, Maple, Mochi, Pepper, Patches, Chai, Biscuit), room composition, bottom-tab labels, or navigation routes. Do not merge PR #7. If GitHub reports a merge conflict or a separate blocker, report it rather than expanding this icon-only task.

## Approval note

The project owner has verbally approved the complete H01 design and eight-companion gallery. A GitHub-formal approval review could not be submitted through the repository author's own connected account (GitHub rejects self-approval); this handoff does **not** claim an official `APPROVED` PR review.
