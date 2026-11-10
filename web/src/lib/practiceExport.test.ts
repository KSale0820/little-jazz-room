import { describe, expect, it } from 'vitest';
import { practiceSessionsCsv } from './practiceExport';

describe('practice CSV export', () => {
  it('includes actual saved duration, routine and exercise data', () => {
    const csv = practiceSessionsCsv([{
      id: 's1', finishedAt: '2026-11-08T08:00:00Z', durationSeconds: 132,
      routineTitle: 'Morning "Swing"', routineId: 'r1', exerciseId: 'e1',
    }]);
    expect(csv).toContain('"2026-11-08T08:00:00Z"');
    expect(csv).toContain('"132","2.2"');
    expect(csv).toContain('"Morning ""Swing"""');
    expect(csv).toContain('"r1","e1"');
  });
  it('escapes spreadsheet formula-looking labels', () => {
    const csv = practiceSessionsCsv([{
      id: 's2', finishedAt: '2026-11-08T08:00:00Z', durationSeconds: 60,
      routineTitle: '=1+1',
    }]);
    expect(csv).toContain('"\'=1+1"');
  });
});
