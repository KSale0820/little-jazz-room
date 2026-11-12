# Approved routine skill icons

These 24 user-provided pixel icons are stored as one compact, **transparent PNG sprite** to avoid loading a separate image for each routine card.

- File: `routine-icons-sprite.png`
- Format: PNG, indexed transparency
- Dimensions: **192 × 128 px** (6 columns × 4 rows)
- Tile: **32 × 32 px**
- Optimized for crisp rendering at the routine card's 32px icon slot
- Mapping logic and atlas coordinates: `web/src/lib/routinePixelIcons.ts`
- Source artwork: the approved individual pixel icons uploaded in the Jazz review conversation on November 11, 2026

## Sprite order (left to right, top to bottom)

| Row | Column 1 | Column 2 | Column 3 | Column 4 | Column 5 | Column 6 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Warm-Ups | Arpeggios | Rhythm | Scales | Tempo | Chords |
| 2 | Tone & Intonation | ii–V–I | Voicings | Comping | 12-Bar Blues | Standards |
| 3 | Chord Connections | Melody | Improvisation | Soloing | Phrasing | Call & Response |
| 4 | Ear Training | Listening | Transcription | Repetition | Ensemble Skills | Focused Practice |

The routine cards use a real, named icon for each detected practice skill. User-created and community routines use the same mapping, with **Focused Practice** as the fallback when no skill can be inferred. All imagery is present in the sprite, not temporary placeholder glyphs.
