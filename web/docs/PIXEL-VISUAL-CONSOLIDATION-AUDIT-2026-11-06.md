# Branch consolidation and visual regression review — 2026-11-06

## Decision
Keep `class-demo-2026-10-31` (functional baseline) and `integration/clean-pixel-themes` (pixel candidate). Keep `master` temporarily because it is currently GitHub's default branch; change the repository default to the intended retained branch before deleting `master`. Do not merge PR #59 into the demo until owner visual approval.

## What the audit found
- All 81 branch names were inventoried; 78 are retirement candidates after excluding the two requested branches and current default `master`.
- Git ancestry alone overstates missing work. Samples of divergent pixel branches have **byte-identical final CSS** in integration: `feature/pixel-studio-v3-stage-motifs-rebased` (motifs), `feature/polished-pixel-songbook-motifs` (charts), `feature/cozy-pixel-practice-legibility` (Practice), and `fix/cozy-pixel-tuner-contrast` (Metronome).
- Compact routine exercise summaries, beginner lesson content, and the iOS microphone privacy plist are already present in integration.
- `web/docs/CLEAN-PIXEL-STATUS.md` says V3 includes 19 approved color PNG motifs and placements from #74/#76/#77, but has not received final visual approval. Its claim that the PR was 'not deployed' predates a preview/staging deployment on November 6.
- Current `CleanPixelMotifPlacements.css` uses small 23–58px accents, and some are only 35–56% opaque; thus updates can exist in code but be visually inconspicuous. Original page geometry was preserved by design.
- V3 deliberately replaced the eight visible companion choices with Luna, Milo and Maple, and the owner acceptance issue #75 specifically flags inadequate black/orange/white Luna calico fidelity.
- Distinct feature branches for recording, timing, account isolation, and guided lessons have divergent history. A nonzero ahead count is NOT proof of a missing capability. Do not bulk-merge old files over newer implementations; perform scoped behavioral tests before retiring these histories.

## Visual acceptance blockers (not yet implemented by this PR)
1. Compare exact-commit full-screen captures against approved V2/V3 PR #62–#77 artifacts, especially Practice, Tracks, Chart Library, Routine Library, Progress, Tuner, Metronome, and Profile at 390×844 and 375×667.
2. Distinguish true missing motif imports and broken image URLs from present-but-too-small/low-opacity motifs; restore any intended approved full-color asset where absent rather than increasing decoration indiscriminately.
3. Verify Luna's corrected calico sprites, and inspect all three selectable cats on both palettes and Cat Mode settings.
4. Keep the navigation, chart grid, timing controls, recording architecture, and data. No blind wholesale CSS replacement or restoration of obsolete backgrounds.
5. Confirm the deployed preview SHA and branch match screenshots before owner signoff; separate a visual correction PR from functionality changes.

## Exact remote branches proposed for deletion (after review)
**Important:** This is a deletion plan, not authorization that branches have already been deleted. Preserve useful unique work via a reviewed targeted PR first.

- `App-v1`
- `App-v2`
- `assets/final-approved-visuals`
- `assets/seven-sleeping-cat-poses`
- `audit/demo-branch-integrity-2026-11-03`
- `charts/eight-standards`
- `class-demo-exhaustive-qa-2026-11-01`
- `class-demo-functional-qa`
- `class-demo-g01`
- `class-demo-integration-2026-11-02`
- `class-demo-metronome-background-2026-11-02`
- `class-demo-navigation-fixes-2026-11-01`
- `class-demo-p01`
- `class-demo-p02-in-session-tools-2026-11-01`
- `class-demo-p02`
- `class-demo-p04-tuner-background-css-2026-11-02`
- `class-demo-routines`
- `class-demo-sitting-assets`
- `class-demo-t01`
- `class-demo-tools`
- `cursor/audit-cleanup-port-c4e2`
- `cursor/home-refine-screenshots-c4e2`
- `docs/open-pr-audit-2026-11-03`
- `feature/approved-pixel-motifs-19`
- `feature/auth-account-isolation`
- `feature/character-art-standardization`
- `feature/clean-pixel-assets`
- `feature/clean-pixel-assets-batch-2`
- `feature/clean-pixel-cat-placements`
- `feature/clean-pixel-charts`
- `feature/clean-pixel-home-legacy`
- `feature/clean-pixel-motifs-v2`
- `feature/clean-pixel-routines`
- `feature/clean-pixel-screens`
- `feature/clean-pixel-tools-progress`
- `feature/cozy-pixel-charts-refreshed`
- `feature/cozy-pixel-charts-routines`
- `feature/cozy-pixel-practice-legibility`
- `feature/cozy-pixel-tools-progress`
- `feature/cozy-pixel-tools-refreshed`
- `feature/custom-exercise-editing`
- `feature/interactive-chart-builder`
- `feature/interactive-home-room`
- `feature/native-audio-foundation`
- `feature/pixel-studio-motif-placements`
- `feature/pixel-studio-v3-stage-motifs-rebased`
- `feature/polished-pixel-songbook-motifs`
- `feature/practice-completion`
- `feature/practice-first-navigation`
- `feature/recorded-backing-tracks-foundation-2026-11-03`
- `feature/voice-pitch-trail-tuner`
- `fix/approved-p02-recording-chart-sync-2026-11-03`
- `fix/beginner-exercise-lessons`
- `fix/beginner-routines-search-builder`
- `fix/clean-pixel-cascade-rebased`
- `fix/clean-pixel-unfinished-page-cascade`
- `fix/clean-pixel-visual-cascade`
- `fix/cozy-pixel-tuner-contrast`
- `fix/current-account-isolation`
- `fix/current-custom-exercise-editing`
- `fix/current-session-completion`
- `fix/guided-practice-teaching-ui`
- `fix/ios-tuner-microphone-permission`
- `fix/p04-tuner-cat-size-clipping-2026-11-03`
- `fix/practice-player-audio-controls-redesign`
- `fix/practice-player-timing-controls`
- `fix/routine-exercise-summaries`
- `fix/safari-sustained-pitch-capture`
- `fix/web-tuner-iphone-safari-input`
- `integration/chart-routine-player-2026-11-03-current`
- `integration/chart-routine-player-2026-11-03-v2`
- `integration/chart-routine-player-2026-11-03-v3`
- `integration/chart-routine-shared-player-2026-11-03`
- `integration/ios-tuner-privacy-current-2026-11-03`
- `integration/pr39-clean-rebase-2026-11-03`
- `qa/approved-p04-tool-artwork-viewport-2026-11-03`
- `qa/current-mobile-cross-screen-regression`
- `qa/post-merge-42-43-2026-11-03`

## Special case: default branch
`master` must not be deleted as GitHub's current default. First change the default branch to `class-demo-2026-10-31` (if desired), verify project/Vercel branch settings, then retire `master` separately.

## PR scope
This PR is a conservative audit and a reproducible deletion manifest only; it does **not** claim visual fixes are implemented, all unique commits are merged, or the preview is owner-approved. Functional work should be imported only if actual missing behavior is demonstrated.