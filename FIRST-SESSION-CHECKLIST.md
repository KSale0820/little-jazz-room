# Cursor first-session checklist (user performs only visual sign-off/console authorization)

1. Extract ZIP to a normal directory. In Cursor: **File → Open Folder** → `little-jazz-room`.
2. Cursor Agent: paste PROMPT 1 from `START-HERE.md`. Let Cursor edit/execute commands and build. Use an included model/plan usage; disable overages/top-ups; do not request Lovable.
3. Cursor must create `package.json` and React app files (not present in starter ZIP); do not expect `npm run dev` to work until Phase 1 is built.
4. At Phase 1 gate, open the local preview URL; review Home/Explore/Create/Practice/Profile; choose Milo then Pepper; inspect cats and the jazz room across lighting modes; verify readable chords and exercise text-only list.
5. Only after approving UI: create Supabase free project, create separate team users, disable open signup, give Cursor project URL/publishable key via `.env.local` (never secrets in chat). Cursor authors migrations; verify two-user RLS negative tests.
6. Continue Phase 3 and 4 prompts; connect GitHub and Cloudflare; verify one real public share link and independent remix on teammate's device.

If you lack time: accept preview-only Friends/Challenges/Badges/Stem controls. DO NOT accept fake routine saves, private-data leaks, or made-up audio functionality.
