# Popular jazz standard-derived harmony study catalog

## Key distinction: practice studies are NOT official lead sheets

The 11 **playable, structured chord-only study charts** in `jazz-seed-content.json` are authored for educational practice of common harmonic forms. Some are **inspired by forms or progressions associated with frequently called standards**; they are not licensed song transcriptions and must not be presented as exact versions of the named songs. No lyrics, melody, backing recording, proprietary notation or copied lead-sheet layout is supplied. Users can add rights-cleared exact tune charts later with source/license metadata.

Music research supporting repertoire choice:
- University jazz curriculum: https://www.elon.edu/u/academics/arts-and-sciences/jazz-studies/list-of-common-jazz-jam-session-tunes/
- London session call-list analysis (2038 calls, 160 sessions; not universally representative): https://standardrepertoire.com/pages/the-top-25-jazz-standards.html
- ColaJazz musician's short common-standards list: https://www.southcarolinapublicradio.org/show/rapp-on-jazz/2025-09-25/rapp-on-jazz-top-10-jazz-standards
- U.S. Copyright Office harmonization guidance: https://www.copyright.gov/comp3/docs/compendium-122214.pdf

## Sunday preload: 11 studies

| Name (educational study) | Bars | Associated common standards (NOT actual charts) | Learning goal |
|---|---:|---|---|
| 12-Bar Jazz Blues in F | 12 | Blues in F, e.g. Billie’s Bounce | Jazz-blues turnarounds and split measures |
| ii–V–I in C | 4 | Harmonic building block of many standards | Guide tones and dominant resolution |
| Jazz Blues in B♭ | 12 | Blue Monk, C Jam Blues | 12-bar blues chorus and chord tones |
| Rhythm Changes in B♭ | 32 AABA | I Got Rhythm, Oleo, Anthropology | Bridge and A sections |
| Minor Bossa in C Minor | 16 | Blue Bossa | Minor ii–V and temporary key centers |
| Major-to-Minor ii–V Cycle | 16 | Autumn Leaves | Relative major/minor functional changes |
| Two-Center Modal Study in D | 16 | So What, Impressions | Modal motifs and space |
| Songbook Changes in C | 32 ABAC | All of Me | Repeated song forms and secondary dominants |
| Bright Swing in C | 32 AABA | Take the A Train, Satin Doll | Eight-bar sections and bridge |
| Minor Jazz Blues in C | 12 | Mr. P.C., Equinox | Major vs minor blues |
| Ballad Turnarounds in E♭ | 16 | Misty, Body and Soul | Slow guide tones and gentle resolutions |

The new chart data also contains `related_standards` and `representation: original_common_form_study_not_song_transcription`, so the UI can label them clearly. `repertoire_guides` maps standard names to a **suggested practice form only**, not a playable official tune. Do not display a named standard as a chart's title unless licensed/verified.

## UI + implementation

- Add a lightweight `Charts` entry under Explore or Practice (avoid sixth primary nav tab). Let users filter **Blues, ii–V, AABA, ABAC, Bossa, Modal, Ballad**, and search by chart title or associated standard.
- Default screen still highlights a small number of curated routines, not an 11-chart wall. All seeded charts are accessible without login.
- An accessible chart selector is available in Practice. Select chart → actual semantic bars/metadata/time signature/key update; never keep showing the same F blues. Keep selected bar in range when switching.
- On phone render **2 bars per row** (or a dedicated readable 4-bar mode with controlled horizontal scroll); desktop 4 per row. For 32 bars, consider a dedicated Full Chart mode and larger tap targets; use true semantic chord events and labels.
- Switching written part for B♭ or E♭ instruments transposes **notation**, not recorded playback. Preserve musical key distinctions and chord quality. Test F♯/G♭ enharmonics.
- Each new study has a linked exercise and guided practice instructions; 4 additional seed routines provide a starting path.
- Source text should say `Original jazz harmony study · resembles common standard form` and the chart metadata lists repertoire associations separately. No fake 'official iReal Pro chart' or copyrighted song melody/recording.
- Tests: 11 unique IDs, 4/12/16/32-bar grids, beat coverage, 27 exercises referencing existing charts or null, 14 correct-duration routines; section markers for AABA/ABAC; chart selector actually changes the display.

## Later (not Sunday)

Import exact authorized MusicXML/lead sheets, record label/arranger permissions, rightsholder-approved catalog, mark arrangement variants, and verify alternate chord substitutions. Do not assume the chord-only study is the definitive chart for a copyrighted standard.
