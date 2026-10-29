# Final cross-conversation feature coverage (Oct 28, 2026)

**Status below describes intended Cursor delivery, not completed React functionality.** This ZIP is a reference + starter-code suite; user-facing implementation is built in Cursor.

| User requirement | Decision and approved spec | Sunday commitment |
|---|---|---|
| Light clean cozy app | All pages light ivory/sage, airy, less busy; pixel artwork/functional clarity | Working five-screen UI |
| Home room | Large interactive illustrated room with multiple jazz instruments and accessible fallback buttons | Working clickable objects |
| Time-of-day visual | Auto sunshine/twilight/night, manual override; unchanged room composition | Working visual states |
| Home sections | Daily goal, streak, main Start Practicing, Today's Practice, 3 Quick Access tiles, long-term goal progress | Working UI (data-dependent pieces honestly labeled) |
| Eight jazz cats | Selectable Luna, Milo, Maple, Mochi, Pepper, Patches, Chai, Biscuit, different builds/ages, distinct jazz roles | Working chooser and persisted selection |
| Cat jazz vibe | Minimal cool jazz aesthetic; Milo sunglasses, Pepper neckerchief, Biscuit headphones; piano/sax/bass/drums/trumpet/guitar/vocals/turntables | Character identity/visual QA; accessory sprites as available |
| Cat anatomy | One head, two ears/eyes, four anatomically plausible paws, one tail, proper faces; no malformed pose sheets | Tagged SVGs included; full visual QA Cursor gate |
| Cat animation | Gentle breathing/bob only; reduced motion; no random/incorrect pose changes | Working minimal motion |
| Cat positions | Chosen sprite on Home/Profile; optional tiny lower Practice companion hidden in Focus | Working placements without fixed-cat background |
| Main navigation | Home, Explore, Create, Practice, Profile, touch friendly | Working |
| Pixel icons | Navigation and quick actions pixel style; no icons on exercises or category tiles | Working visual styling |
| Explore content | Search and filter community routines/exercises by instrument/level, text-only skill categories | Working seeded search/filter and public browse |
| Starter curriculum | Seven instrument options; 27 original actionable exercises, 14 timed routines, 3 practice paths | Seeded and navigable |
| Jazz standards content | 11 original educational common-form charts (4/12/16/32 bars), not exact protected lead sheets | All 11 real structural charts |
| Jazz chart notation | 2/4-measure grid, sections, repeats, selected bar, beat-aware split measures, loops, concert vs B♭/E♭ written keys | Working chart display/notation; audio sync only when assets exist |
| Practice modes | Switchable Chords/Player, optional Focus, no-fake metronome/backing modes | Working timer/controls and honest media states |
| Exercise editor | User creates title, category, instrument, difficulty, detailed instructions, repetitions/time, optional BPM/key/chord chart, privacy | Working editor/storage |
| Routine builder | Name, goal, level, ordered exercise steps, reorder, drafts, visibility, duplicate/remix | Working core workflow |
| Community sharing | Public searchable, private owner-only, unlisted capability links where audited, creator attribution, save/remix independent snapshots | Public/private working; unlisted only if secure tests pass |
| Team accounts | Owner + teammates only, pre-created email/password in Supabase; no open signup, Google OAuth or paid email | Working with two accounts, tested privacy |
| Practice progress | Persistent completed sessions, daily/weekly minutes, non-punitive streak, history calendar, long-term goals | Working baseline progress; extras Preview where needed |
| Gamification | Gentle rewards, badges, cosmetic accessories without guilt or excessive clutter | UI previews acceptable |
| Friends and challenges | Browse/challenge previews, optional friend achievements UI | Preview only |
| Recording-based audio | Eventually legally licensed real mixed recordings & synchronized stems, future replace/delete and mixer | Data model + no-audio path; never fake functionality |
| Key/tempo and isolation | Professional pitch/time shifting, stem separation, instrument fade; uploaded recordings | Preview / deferred |
| Practice recording | Private recording/replay when implemented; no false save/play UI | Preview / deferred |
| Cost/hosting | No incremental spending; Vite React TS, Supabase Free, GitHub Free, Cloudflare Pages Free, existing Cursor/ChatGPT | Working deployment once built |
| Documentation and tests | One authoritative prompt, user visual approval Phase 1, static data checks, Supabase positive/negative access tests, production QA | Cursor reports real test evidence and honest blockers |

**No scope expansion without corresponding time:** Anything not needed to safely complete routine creation, sharing, jazz chart study, basic practice, companion selection or deployment must not delay Sunday.
