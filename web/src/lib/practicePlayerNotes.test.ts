import { describe, expect, it } from 'vitest';
import { INLINE_ANNOTATION_LIMIT, chartAnnotationDisplay, nextRepeatCount, repeatLabel, journalKey, notesKey } from './practicePlayerNotes';
describe('practice chart notes and repeat labels', () => {
  it('uses inline notes through the limit and a bubble above it', () => {
    expect(chartAnnotationDisplay('Tag')).toBe('inline');
    expect(chartAnnotationDisplay('x'.repeat(INLINE_ANNOTATION_LIMIT))).toBe('inline');
    expect(chartAnnotationDisplay('x'.repeat(INLINE_ANNOTATION_LIMIT + 1))).toBe('bubble');
  });
  it('cycles from zero to infinity and back to ten', () => {
    expect(nextRepeatCount(0,-1)).toBe(0);
    expect(nextRepeatCount(10,1)).toBe(11);
    expect(nextRepeatCount(11,1)).toBe(11);
    expect(nextRepeatCount(11,-1)).toBe(10);
    expect(repeatLabel(11)).toBe('∞');
  });
  it('scopes stored chart and journal notes by account', () => {
    expect(notesKey('user1','chartA')).not.toBe(notesKey('user2','chartA'));
    expect(journalKey('user1')).not.toBe(journalKey('user2'));
  });
});
