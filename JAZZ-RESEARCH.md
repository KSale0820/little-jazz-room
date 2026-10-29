# Little Jazz Room — jazz practice and chord-chart research

**Researched:** October 28, 2026. All references are for **musical conventions and feature analysis**, not permissions to copy copyrighted iReal Pro artwork, proprietary chart libraries, or commercial recordings.

## Research conclusions → specific UI decisions

1. **Jazz chord changes are measures, not instrument chord fingerings.** iReal Pro's chart protocol normally uses 16 horizontal cells and 4 measures/system; cells/spaces encode chord durations. A jazz blues is commonly 12 bars; many standards are 32 bars, often AABA or ABAC. Put measures, sections, repeats, one or two chords per bar, chorus progress, and bar highlighting in the default **Chords** display. Use *textual* jazz chord symbols; fretboard boxes belong to optional instrument teaching views, not the default.
2. **A practice player needs musically meaningful controls.** iReal Pro provides count-in, looping selected bars, repetition count, start at selected bar, playhead highlighting, key/tempo controls, optionally automatic tempo increases and cycling keys. Create original interactions around the same *needs* but keep accurate labeling of playable recorded audio vs chart-only affordances.
3. **Horn transposition is separate from playback key.** Trumpet / tenor sax normally read B♭ written pitch; alto sax reads E♭ written pitch. Concert F sounds while a B♭ player reads G; an E♭ player reads D. This visual transformation can be implemented for notation without altering recording audio. Transpose chord spellings musically and handle flats/sharps appropriately; do not claim playback transposition.
4. **Real rhythm sections and subtraction matter.** Berklee's practice materials supply complete recordings and "No Melody", "No Piano", "No Drums", etc. Musicians want to mute their own instrument, listen to a rhythm section that breathes, and practice comping vs soloing. Model recording with original mixed file plus optional synchronized piano/bass/drums/melody stems. A mix cannot be individually muted without genuine separation/stems.
5. **Backing tracks AND metronome-only work are useful.** Community musicians report that a backing band provides harmonic context, but metronome on beats 2 and 4 helps build independent time feel. Make "No backing / Metronome / Recorded band" practice modes; don't force audio on custom exercises.
6. **Practice should prescribe a task, not only play a track.** Seed exercises: ii–V–I thirds/sevenths and guide tones; 12-bar jazz blues in F; one chorus chord-tone solo; swing/2-and-4; 4-bar transcription; learn a head by ear; rhythm-only; comping; and reflective listening. Short routines sequence warmup → changes/guide tones → improv play-along → notes.
7. **Notation rendering choices.** A CSS/SVG chord grid does not require a notation library. For optional full engraved MusicXML scores later, OpenSheetMusicDisplay is a current browser renderer; it **does not offer a finished general audio-player engine**. Make score view optional; never draw fake music staves and notes when the source is only a chord progression.

## Important market nuance / accessibility

- iReal Pro introduced professionally **recorded jazz drums**; don't present it as purely synthetic playback. Little Jazz Room's future recording-oriented differentiator is synchronized *full band* stems with shareable guided routines. See https://www.irealpro.com/news/real-drums-and-windows-beta/ .
- Some musicians specifically seek real-player recordings and instrument-removal, while others want metronome-only practice; individual Reddit threads aren't a statistically representative survey. See https://www.reddit.com/r/Jazz/comments/1usa9nk/real_backing_tracks/ and https://www.reddit.com/r/jazzguitar/comments/1it7e3o .
- Protect phone usability: 390px portrait viewport, chart two bars/row when necessary, 44px minimum tap targets where possible, accessible keyboard controls, no autoplay.
- A copyrighted recording downloaded temporarily from YouTube should **not** be included in public builds without appropriate reuse rights. Provide `audio_asset_id` references with source/license/creator and removal support; exercises/routines work even after removal.

## External sources (first-party and pedagogy first)

- iReal Pro Custom Chord Chart Protocol: https://www.irealpro.com/ireal-pro-custom-chord-chart-protocol/
- iReal Pro Chord Spacing: https://www.irealpro.com/learn/chart-layout/
- iReal Pro Chord Symbols: https://www.irealpro.com/learn/chord-symbols/
- iReal Pro Playback: https://www.irealpro.com/learn/play-a-song/
- iReal Pro Transposing Instruments: https://www.irealpro.com/learn/transposition/
- iReal Pro Advanced Practice: https://www.irealpro.com/learn/advanced-practicing-techniques/
- iReal Pro Mixer: https://www.irealpro.com/learn/customize-your-backing-tracks/
- Berklee practice audio and transposed lead sheets: https://college.berklee.edu/admissions/undergraduate/practiceexercises
- University of Iowa jazz form notes: https://pressbooks.uiowa.edu/twentieth-and-twenty-first-century-music/chapter/jazz/
- Jazz standard forms: https://pressbooks.pub/harmonyandmusicianshipwithsolfege/chapter/form-in-jazz-standards/
- OpenSheetMusicDisplay official repository: https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
- Reddit musician feedback (2025): https://www.reddit.com/r/jazzguitar/comments/1it7e3o
- Reddit real backing tracks (2026): https://www.reddit.com/r/Jazz/comments/1usa9nk/real_backing_tracks/
- Reddit piano-less accompaniment (2026): https://www.reddit.com/r/Jazz/comments/1uqh00y/learning_jazz_on_piano_and_need_specific/

**Nuance:** Reddit threads are individual musician reports, not representative survey data. Be careful with iReal Pro's chart protocol: learn the grid conventions, **do not copy its layouts/assets/source**, and use original song-free exercises; never claim iReal Pro endorsement or compatibility without testing and permission.

## Further practice research — October 28 update

See `PRACTICE-CURRICULUM.md` for details and preloaded data. Berklee's practice materials explicitly provide ensemble-minus-instrument tracks; its practice course emphasizes skills gaps and time-sensitive plans. Learn Jazz Standards suggests a progression from melody and chord-tone maps to guide-tone maps, solo composition and improvising. Working musicians raise two concrete problems: full-chart readability and small/fiddly tempo controls. Discussions also indicate different uses for recorded accompaniment versus metronome-only practice. Competitor Quartet already supports real recording manipulation, so a claim that *real audio alone* is unique would be inaccurate. Our likely differentiation is guided practice and shareable routines tightly integrated with recording-oriented mixing.

References: https://college.berklee.edu/admissions/undergraduate/practiceexercises , https://college.berklee.edu/courses/psij-332 , https://www.learnjazzstandards.com/ljs-podcast/ljs-260-7-steps-for-improvising-over-jazz-standards-from-scratch/ , https://www.jazzguitar.be/forum/recording-music-software/104307-quartet-app-2.html , https://www.quartetapp.com/help/ , https://www.reddit.com/r/jazzguitar/comments/1it7e3o
