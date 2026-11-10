import type { PracticeSessionRecord } from '../types/content';

// Quote CSV values and prevent spreadsheet formula interpretation of user-supplied labels.
function cell(value: string | number | undefined): string {
  const raw = String(value ?? '');
  const safe = /^[=+@\-\t\r\n]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replace(/"/g, '""') + '"';
}

export function practiceSessionsCsv(sessions: readonly PracticeSessionRecord[]): string {
  const rows: (string | number | undefined)[][] = [
    ['Finished at (ISO)', 'Duration (seconds)', 'Duration (minutes)', 'Routine', 'Routine ID', 'Exercise ID'],
    ...sessions.map(s => [
      s.finishedAt, s.durationSeconds, Math.round(s.durationSeconds / 60 * 100) / 100,
      s.routineTitle, s.routineId, s.exerciseId,
    ]),
  ];
  return '\uFEFF' + rows.map(row => row.map(value => cell(value)).join(',')).join('\r\n') + '\r\n';
}

export function downloadPracticeSessionsCsv(sessions: readonly PracticeSessionRecord[]): void {
  const blob = new Blob([practiceSessionsCsv(sessions)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'little-jazz-room-practice.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
