import type { Exercise, ExerciseLesson, Routine, RoutineStep } from '../types/content';

/**
 * Structured, instrument-agnostic beginner lessons.
 * Note names below are CONCERT PITCH. Players of transposing instruments should use
 * their chart's transposition setting when following written notes.
 *
 * Intentionally separate from the legacy seed JSON: it lets lesson-writing and
 * routine-builder work proceed in parallel without modifying persisted IDs.
 */
type LessonCopy = Pick<Exercise, 'title' | 'description'> & { lesson: ExerciseLesson };

const lesson = (
  title: string, description: string, learningOrder: number, goal: string,
  steps: string[], listenFor: string, success: string, terminologyHelp: string,
  catPrompts: string[]
): LessonCopy => ({ title, description, lesson: {
  goal, steps, listenFor, success, terminologyHelp, catPrompts, learningOrder
} });

export const beginnerLessonCopy: Record<string, LessonCopy> = {
  'swing-2-4': lesson(
    'Feel the Swing Beat', 'Find a steady beat and make it swing.', 1,
    'Keep a steady four-beat count and feel beats 2 and 4.',
    [
      'Tap your foot and count aloud: 1, 2, 3, 4. Repeat four times at a relaxed speed.',
      'Keep tapping all four beats, but clap only when you say 2 and 4. A metronome set near 70 BPM can help.',
      'Play two notes on each beat: make the first slightly longer than the second, then leave them even again.',
      'Return to clapping 2 and 4 for eight measures without speeding up.'
    ],
    'Your claps fall in the same places, even when the notes change.',
    'You can clap beats 2 and 4 for eight measures without losing count.',
    'Swing is a gently uneven long-short feel between pairs of eighth notes. BPM means beats per minute.',
    ['Feel the beat before adding more notes.', 'Keep those claps steady on two and four.']
  ),
  'listen-form': lesson(
    'Hear the Parts of a Blues', 'Learn how to recognize the shape of a blues.', 2,
    'Notice the three four-measure sections of a 12-measure blues.',
    [
      'Open the F blues chart. Count four steady beats for each measure (a small box in the chart).',
      'Count measures 1 through 4, then clap once as you begin measure 5.',
      'Count measures 5 through 8, clap as measure 9 begins, and finish through measure 12.',
      'Start again at measure 1. If you have music to listen to, follow along; otherwise counting works.'
    ],
    'The blues feels like three groups of four measures that lead back to the beginning.',
    'You can count all 12 measures and find 1, 5, and 9 without starting over.',
    'A measure (or bar) holds a group of beats. A four-measure phrase is one part of the form; one complete trip around all 12 measures is a chorus.',
    ['Four measures at a time is plenty.', 'Can you hear when the next section begins?']
  ),
  'blues-form': lesson(
    'Count Through a 12-Bar Blues', 'Follow a repeating blues chart without getting lost.', 3,
    'Know where you are in all 12 measures of the F blues.',
    [
      'Open the F blues chart. Point to measure 1 and count four beats: 1, 2, 3, 4.',
      'Move your finger one measure after each four-beat count, until you reach measure 12.',
      'Notice B♭7 at measure 5. Later, measures 11 and 12 use quicker chord changes to lead back to the start.',
      'Count the 12 measures again and return to measure 1 without pausing.'
    ],
    'The change at measure 5 and the busy ending in measures 11–12 help signal where you are.',
    'You can count from measure 1 to 12 and land back on measure 1 in time.',
    'The 12-bar blues is a repeating 12-measure song form. The last measures leading back to the top are often called a turnaround.',
    ['Keep your place one measure at a time.', 'The turnaround leads you right back home.']
  ),
  'chord-roots': lesson(
    'Find the First Note of Each Chord', 'Hear how the bass notes move when the chords change.', 4,
    'Play or sing the starting note, called the root, of each chord.',
    [
      'Find the first three measures of the F blues chart: F7, B♭7, F7.',
      'Play F on beat 1 of measure 1, B♭ on beat 1 of measure 2, and F on beat 1 of measure 3.',
      'In measure 4, play C on beat 1 for Cm7, then F on beat 3 for F7.',
      'Sing F, B♭, F, C, F, then play them again while keeping the four-beat count.'
    ],
    'The starting note changes with each chord, especially when the harmony moves to B♭.',
    'You can sing and play the first five roots in the right places without looking away from the beat.',
    'A chord is a group of notes played together or heard as one harmony. The root is the note named by the chord symbol: F for F7.',
    ['Start with one note per chord.', 'Hear how the root changes at the next measure.']
  ),
  'seventh-arpeggios': lesson(
    'Play the Notes of Each Chord', 'Learn four notes that make common jazz chords.', 5,
    'Play the notes of three seventh chords one at a time.',
    [
      'Play Dm7 as D–F–A–C, going up slowly. Then play C–A–F–D going down.',
      'Play G7 as G–B–D–F, then F–D–B–G.',
      'Play Cmaj7 as C–E–G–B, then B–G–E–C.',
      'Repeat Dm7, G7, Cmaj7 in order. Keep every note clear, even if you need to slow down.'
    ],
    'Minor, dominant, and major seventh chords sound different, even though each has four notes.',
    'You can play all three groups of four notes up and down without a wrong note at a slow tempo.',
    'Playing a chord one note at a time is an arpeggio. m7 means minor seventh; 7 means dominant seventh; maj7 means major seventh.',
    ['Four clear notes are better than four rushed notes.', 'Listen to how each chord has its own color.']
  ),
  'thirds-sevenths': lesson(
    'Practice the Important Notes in Each Chord', 'Connect chords with only two notes each.', 6,
    'Use the 3rd and 7th of each chord to hear the changes.',
    [
      'Play the notes F and C for Dm7. If you play one note at a time, play F then C.',
      'Move to B and F for G7, then E and B for Cmaj7.',
      'Try to keep the shared note still while moving the other note a tiny distance: C to B, then F to E.',
      'Repeat the three chords slowly four times. You can play the pair together or one note after another.'
    ],
    'The chords change smoothly, with some notes staying the same and others moving one small step.',
    'You can move Dm7 → G7 → Cmaj7 four times while hearing each chord change.',
    'A chord’s 3rd and 7th are called guide tones. Moving voices smoothly is voice leading; ii–V–I is a common three-chord jazz sequence.',
    ['Play just the two important notes.', 'Listen for the notes that barely move.']
  ),
  'blues-scale': lesson(
    'Play and Explore the F Blues Scale', 'Use a small set of notes to invent a phrase.', 7,
    'Learn the F blues scale and make a short melody with it.',
    [
      'Play these concert-pitch notes slowly upward: F, A♭, B♭, B, C, E♭, F.',
      'Play them back down: F, E♭, C, B, B♭, A♭, F. Repeat once with an even beat.',
      'Make a short question using F–A♭–B♭, then a short answer using C–E♭–F.',
      'Play your two phrases over the first two measures of the F blues at a comfortable speed.'
    ],
    'The A♭ and B notes add a bluesy pull toward the surrounding notes.',
    'You can play the scale up and down, then invent two recognizable phrases without losing the beat.',
    'A scale is a set of notes for building melodies. The blues scale has a characteristic sound; A♭ and E♭ mean A-flat and E-flat.',
    ['These seven notes can say a lot.', 'Leave a little space between your musical ideas.']
  ),
  'question-answer': lesson(
    'Play a Musical Question and Answer', 'Make two phrases sound like a conversation.', 8,
    'Create a short phrase, pause, and answer it.',
    [
      'Use the F blues notes F, A♭, B♭, B, C, and E♭ to make a simple two-measure melody.',
      'Try F–A♭–C as your question. Leave two beats of silence at the end of the second measure.',
      'Answer in the next two measures with C–B♭–A♭–F, ending on F.',
      'Change one rhythm or note and repeat three times. Keep each answer related to its question.'
    ],
    'Your second phrase should sound connected to the first, with silence making the response clear.',
    'You can play three question-and-answer pairs with an intentional pause.',
    'Call and response is a musical conversation. A phrase is a short musical thought.',
    ['A pause is part of the music.', 'Answer the phrase rather than starting over.']
  ),
  'chord-tone-solo': lesson(
    'Make a Solo from Chord Notes', 'Use notes that belong to the chord under you.', 9,
    'Create short melodies using notes from the current chord.',
    [
      'Start with the first three measures of the F blues chart: F7, B♭7, F7.',
      'For F7, choose from F–A–C–E♭. For B♭7, choose from B♭–D–F–A♭.',
      'Play two or three of those notes as a phrase. Change your note choices when the chart switches chords.',
      'Repeat measures 1–3 until comfortable, then move through the full chart using at least each chord’s named root.'
    ],
    'Notes from the current chord feel settled; changing the notes with the chord makes the solo follow the music.',
    'You can play a short phrase on F7, switch to B♭7, and return to F7 without stopping.',
    'Improvising means making music as you play. Chord tones are notes inside the current chord; a full 12-measure round is a chorus.',
    ['Let the chord tell you which notes to try.', 'Switch notes when the harmony moves.']
  ),
  'free-play': lesson(
    'Play Freely for Three Minutes', 'Practice turning simple ideas into your own music.', 10,
    'Experiment with one small musical idea without worrying about mistakes.',
    [
      'Choose only three notes, such as F, A♭, and C.',
      'Play them in any order for about 30 seconds. Keep a relaxed beat or play without a metronome.',
      'Try the same notes with a pause, a new rhythm, or a different order.',
      'Keep exploring until the time ends, then say or write down one sound you liked.'
    ],
    'Notice the rhythms and pauses you naturally return to.',
    'You have made two different versions of an idea and can name one part you want to keep.',
    'Improvisation is making musical choices in the moment. There is no single correct phrase.',
    ['Pick a tiny idea and play with it.', 'Notice one sound you want to remember.']
  ),
  'listen-bass': lesson(
    'Listen for the Low Notes', 'Hear how low notes help you follow chord changes.', 11,
    'Recognize the starting notes of a simple bass line.',
    [
      'If you have a recording you may use, listen to its bass part. Otherwise play low F, B♭, F, C slowly on your own instrument.',
      'Hum just the low notes, one at a time. You do not need to match every passing note.',
      'Tap four beats per note and notice when the low pitch changes.',
      'Sing the four notes back and then find them on your instrument.'
    ],
    'The lowest part often makes the chord change easier to hear.',
    'You can recognize and sing back four bass notes in sequence.',
    'A bass line is the sequence of low notes that supports the chords. A root is the chord’s starting note.',
    ['Follow the low notes for now.', 'Hear when the bass changes direction.']
  ),
  'melody-by-ear': lesson(
    'Learn a Short Melody by Listening', 'Find a melody on your instrument without reading it.', 12,
    'Sing a short phrase and find its notes by ear.',
    [
      'Play or ask someone to play a simple four-note phrase slowly, such as C–D–E–G.',
      'Look away from the keys or notes. Sing or hum the phrase back twice.',
      'Find the notes by trying them on your instrument, one at a time. Adjust until the phrase matches.',
      'Once it feels familiar, play the same shape starting on G: G–A–B–D.'
    ],
    'Your played phrase should sound like the one you just sang, including its rhythm.',
    'You can sing and replay the four-note phrase without reading it.',
    'Learning by ear means finding sounds through listening instead of written music. Starting the same pattern on another note is transposition.',
    ['Sing it before you find it.', 'Find the first note, then listen for the next.']
  ),
  'walking-bass': lesson(
    'Play a Walking Bass Line', 'Connect chord roots with one low note per beat.', 13,
    'Play four steady notes in each measure to lead into the next chord.',
    [
      'Use the first three measures of the F blues: F7, B♭7, F7. Count 1, 2, 3, 4.',
      'In measure 1, play F–A–C–B, one note per beat. B leads down one half step to the next root, B♭.',
      'In measure 2, play B♭–D–F–E, one note per beat. E leads up one half step to F in measure 3.',
      'Keep going into measure 3 on F, repeating the first two measures until all beats feel even.'
    ],
    'The last note of each measure points toward the next chord before it arrives.',
    'You can connect F7 → B♭7 → F7 at four steady notes per measure.',
    'Walking bass means a bass line with roughly one note per beat. An approach note is a note one small step above or below the target.',
    ['Walk one steady step at a time.', 'Aim your last note toward the next chord.']
  ),
  'blues-bb-forms': lesson(
    'Follow the Chords in B♭ Blues', 'Practice recognizing a blues in a new key.', 14,
    'Follow the first three chords of B♭ blues and find their roots and 3rds.',
    [
      'Open the B♭ blues chart. The first three measures are B♭7, E♭7, and B♭7.',
      'Play the roots B♭, E♭, B♭ on beat 1 of each measure.',
      'Now play each chord’s 3rd: D for B♭7 and G for E♭7. Alternate the roots and 3rds slowly.',
      'Count the full 12-measure chart, returning to B♭ at the next repeat.'
    ],
    'The move from B♭7 to E♭7 sounds similar to the F blues, just starting on different notes.',
    'You can find B♭7 and E♭7 and their 3rds while keeping track of the measures.',
    'The key tells you which pitch feels like home. Moving the same blues pattern to a new key is transposition.',
    ['Same blues shape, different starting note.', 'Hear when the chords move away from home.']
  ),
  'minor-blues': lesson(
    'Try a Blues with a Minor Sound', 'Compare blues melodies with the chords in C minor.', 15,
    'Hear the minor-blues mood and follow changes near the end.',
    [
      'Open the C minor blues chart. Play C–E♭–F–G–B♭ slowly, then return to C. These are C minor pentatonic notes.',
      'Play those five notes as short phrases over the first four measures; begin with C when Cm7 appears.',
      'At measure 9 (A♭7), try A♭–C–E♭–G♭. At measure 10 (G7), try G–B–D–F.',
      'Play through measures 9–12 once more, listening for the move back to Cm7 at measure 11.'
    ],
    'The A♭7 and G7 chords in measures 9–10 create a stronger pull back toward C minor.',
    'You can play the five-note minor pattern and recognize the two chord changes near the ending.',
    'Minor describes a darker type of harmony. Pentatonic means five notes; chord tones are the notes that make up each chord.',
    ['Hear how minor blues feels different.', 'Those last changes lead back to C minor.']
  ),
  'bossa-minor': lesson(
    'Connect Chords in a Gentle Bossa', 'Play chord changes with a calm, even rhythm.', 16,
    'Practice the C minor bossa chart without rushing the changes.',
    [
      'Open the 16-measure C minor bossa chart. Count four comfortable beats per measure.',
      'For Cm7 in measures 1–2, play C–E♭–G–B♭ slowly. For Fm7 in measures 3–4, play F–A♭–C–E♭.',
      'Play only the 3rd and 7th next: Cm7 uses E♭ and B♭; Fm7 uses A♭ and E♭.',
      'Loop measures 1–4, then try measures 9–12 using the roots E♭, A♭, D♭, D♭. Keep all eighth notes even.'
    ],
    'The rhythm stays gentle and even while the chords shift underneath.',
    'You can move from Cm7 to Fm7 on time, then identify the roots in measures 9–12.',
    'Bossa nova is a Brazilian-influenced groove with straighter eighth notes than swing. The 3rd and 7th of a chord are guide tones.',
    ['Keep the rhythm calm and even.', 'You can change chords without rushing.']
  ),
  'major-minor-cycle': lesson(
    'Hear the Move from Major to Minor', 'Recognize how a chord sequence changes mood.', 17,
    'Find the roots through an eight-measure chord sequence.',
    [
      'Open the major-to-minor study. Read the first eight chord roots in order: A, D, G, C, F♯, B, E, E.',
      'Play one root on beat 1 of each measure while counting 1, 2, 3, 4.',
      'When comfortable, play the 3rd and 7th for D7 (F♯ and C) and Gmaj7 (B and F♯).',
      'Repeat measures 1–8 and notice when G major moves toward E minor.'
    ],
    'G major can feel brighter, while the arrival on E minor has a different, more reflective quality.',
    'You can play all eight roots in order and hear the arrival on E minor without losing the beat.',
    'Major and minor are two common chord sounds. The 3rd and 7th help define a chord, and moving between them smoothly is voice leading.',
    ['Start with the roots; add details later.', 'Hear the change when E minor arrives.']
  ),
  'modal-space': lesson(
    'Repeat a Two-Note Musical Idea', 'Learn how repetition and space make a melody.', 18,
    'Keep a short two-note phrase recognizable as the harmony moves.',
    [
      'Open the 16-measure two-center modal chart. For measures 1–8, use the notes D and F to make a short rhythm.',
      'Repeat the rhythm three times, leaving at least one beat of silence after each phrase.',
      'At measures 9–12, move both notes up one half step to E♭ and G♭, keeping the same rhythm.',
      'When Dm7 returns in measure 13, return to D and F. Try the whole 16-measure form.'
    ],
    'The rhythm sounds familiar even though the notes rise and then return.',
    'You can play the two-note idea through the change at measure 9 and back at measure 13.',
    'A motif is a short repeated musical idea. Modal practice focuses on a tonal area for longer spans; a semitone is the smallest step between adjacent piano keys.',
    ['Two notes can make a strong idea.', 'Keep the same shape when the notes move up.']
  )
};

const routineCopy: Record<string, Pick<Routine, 'title' | 'description'>> = {
  'daily-warm-up': {
    title: 'Daily Jazz Warm-Up',
    description: 'First feel beats 2 and 4, then play the notes of three chords, and finish with free play.'
  },
  'first-improv': {
    title: 'Make Your First Jazz Solo',
    description: 'Follow a 12-measure blues, learn a few useful notes, and trade musical questions and answers before playing freely.'
  },
  '12bar-blues': {
    title: 'Learn a 12-Bar Blues',
    description: 'Hear the three four-measure sections, count the chart, find chord roots, and make short blues phrases.'
  },
  'ii-v-i-workout': {
    title: 'Connect Three Common Jazz Chords',
    description: 'Play Dm7, G7, and Cmaj7 one note at a time, then connect the most important notes smoothly (called ii–V–I).'
  },
  'rhythm-time': {
    title: 'Keep a Steady Swing Beat',
    description: 'Clap on beats 2 and 4, make small musical phrases, and play while staying on the beat.'
  },
  'walking-bass': {
    title: 'Walking Bass: Start with Four Beats',
    description: 'Find chord roots and play one low note per beat to connect the first chords of the F blues.'
  },
  'ear-training': {
    title: 'Practice Hearing Chord Changes',
    description: 'Hear where a blues section begins, sing the starting notes of chords, and listen for low notes.'
  },
  'no-backing': {
    title: 'Practice Without a Backing Track',
    description: 'Keep time by yourself, follow a 12-measure blues, and finish with a few minutes of free playing.'
  },
  'jazz-standards-starter': {
    title: 'Get Comfortable with Jazz Song Forms',
    description: 'Count musical sections, find the changes in B♭ blues, and listen for a shift from major to minor.'
  },
  'first-minor-bossa': {
    title: 'Start Playing a Gentle Minor Bossa',
    description: 'Find the beat in a relaxed bossa rhythm, then follow the notes that guide the chord changes.'
  },
  'intermediate-solo': {
    title: 'Develop Longer Jazz Solos',
    description: 'Transcribe a short phrase by ear, vary a rhythmic motif, and target guide tones through complete choruses.'
  },
  'comping-basics': {
    title: 'Comp with Space and Purpose',
    description: 'Practice spare chord accompaniment, clean voice leading, and varied rhythmic responses.'
  },
  'rhythm-changes-starter': {
    title: 'Follow the Form of Rhythm Changes',
    description: 'Count AABA sections, isolate the bridge, and practice voice leading through its dominant chords.'
  },
  'forms-and-ballads': {
    title: 'Study Song Forms and Ballad Harmony',
    description: 'Compare ABAC sections, play smooth guide-tone connections, and develop spacious modal motifs.'
  }
};

/** Apply lesson copy without changing IDs, durations, charts, or persisted references. */
export function withBeginnerLesson(exercise: Exercise): Exercise {
  const copy = exercise.level === 'Beginner' ? beginnerLessonCopy[exercise.id] : undefined;
  if (!copy) return exercise;
  const { goal, steps, listenFor, success, terminologyHelp } = copy.lesson;
  // Legacy clients and Supabase snapshots continue reading the single instructions field.
  const instructions = [
    'Goal: ' + goal,
    ...steps.map((step, index) => (index + 1) + '. ' + step),
    'Listen for: ' + listenFor,
    'Ready to move on when: ' + success,
    'Jazz term: ' + terminologyHelp
  ].join('\n');
  return { ...exercise, ...copy, instructions };
}

export function withBeginnerRoutineCopy(routine: Routine): Routine {
  const copy = routineCopy[routine.id];
  if (!copy) return routine;
  // Repair two presets accidentally labeled Beginner despite intermediate-only steps.
  // Original IDs, chart links, number of steps and durations stay stable.
  const steps: RoutineStep[] = routine.id === '12bar-blues'
    ? routine.steps.map(step => step.exercise_id === 'one-chorus' ? { ...step, exercise_id: 'question-answer' } : step)
    : routine.id === 'rhythm-time'
      ? routine.steps.map(step => step.exercise_id === 'rhythm-variation' ? { ...step, exercise_id: 'question-answer' } : step)
      : routine.steps;
  return { ...routine, ...copy, steps };
}

/** Return structured lessons in a beginner-first learning order. */
export function orderedBeginnerLessons(exercises: Exercise[]): Exercise[] {
  return exercises
    .filter(exercise => exercise.level === 'Beginner' && exercise.lesson)
    .sort((a, b) => (a.lesson!.learningOrder - b.lesson!.learningOrder));
}

/**
 * Older custom/cloud exercises do not have a lesson object. Use this before
 * displaying structured lesson UI; fall back to exercise.instructions when null.
 */
export function getStructuredLesson(exercise: Exercise): ExerciseLesson | null {
  const lesson = exercise.lesson;
  if (!lesson || !lesson.goal || !lesson.steps?.length) return null;
  return lesson;
}
