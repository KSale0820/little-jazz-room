# Four objective acceptance gates — Sunday Nov 1, 2026

## Phase 1 — UI and local functionality
- [ ] Vite + React + TypeScript app runs; lint/typecheck/build pass. Five screens, light layout, mobile 390px + desktop screens checked, no horizontal scrolling or dead controls.
- [ ] UI closely resembles `APPROVED-VISUAL-REFERENCE.png`, with airy minimal typography, original pixel icons, jazz equipment; text-only exercise rows and category options.
- [ ] Interactive large Home room objects and visible fallback buttons work; daily goal/streak, Start, Today's Practice, Quick Access and long-term goal all present.
- [ ] SAME cat-free room layout in Sunshine/Twilight/Night; Auto local clock and override work; 8 selected cats persist and stay anatomically consistent. One displayed selected cat, not baked-in duplicate. Jazz roles legible in chooser; instruments not fused to extra limbs. Focused notation remains cat-free.
- [ ] Eleven structured educational chord charts selectable, measure layout and bar/beat/split bar correct; B♭/E♭ written pitch works. The chart for each exercise comes from `chart_id`, not a global default. Mark study forms as not exact licensed standards.
- [ ] 27 exercises, 14 routines, 3 paths actually load; create/edit local exercise, create/reorder local routine, practice timer work. Preview-only features clearly labeled.
- [ ] `python validate_suite.py` passes and browser clicks are exercised (not only syntax check).

## Phase 2 — Team authentication / Supabase safety
- [ ] Free Supabase migration applied, URL and publishable key configured safely. RLS explicit and tested across users A/B plus anonymous.
- [ ] Owner precreates two DISTINCT team accounts; email/password signin/logout and session persistence work. No self-signup at UI **or auth API** level. No Google OAuth/SMTP required.
- [ ] Cat choice and private progress remain isolated across accounts (including switching users without reloading), and persist after a fresh login.

## Phase 3 — Public/private sharing, independent remix
- [ ] A creates & saves custom exercise, constructs ordered routine, refreshes and data survives.
- [ ] Anonymous can see public routine and study charts but NEVER private content or unlisted via normal SELECT.
- [ ] B remixes A's public routine; A edits/deletes original; B's copy remains independently editable with creator credit.
- [ ] Unlisted link requires tested unguessable capability token + sanitized read; otherwise disabled Preview, not an insecure shortcut.

## Phase 4 — Practice and free deployment
- [ ] Timer start/pause/resume/skip/finish updates real persisted sessions; progress updates after refresh. No unearned streak pressure.
- [ ] No audio track is acceptable; every unavailable audio feature is disabled/Preview, not deceptive.
- [ ] Keyboard, focus, no-console-error, small phone, reduced-motion and cross-browser checks; no separate cat appearing on chart or accidental sound.
- [ ] Cloudflare Pages build opens on teammate phone; separate login, share URL, refresh deep links all tested. `DEMO_STATUS.md` truthfully lists Working / Preview / Blocked.

**Priorities if behind:** first polished five-screen UI and cats/charts; next secure PUBLIC/PRIVATE sharing; next time/progress; only after this unlisted; finally optional gamification, extra cosmetics, social previews. Never drop privacy tests to save time. User must explicitly approve Phase 1 design before continuing.
