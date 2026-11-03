import { beforeEach, describe, expect, it, vi } from 'vitest';

const memory = vi.hoisted(() => ({
  files: new Map<string, string | Uint8Array>(),
  failAppending: false,
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    convertFileSrc: (uri: string) => 'webview:' + uri,
  },
}));
vi.mock('@capacitor/filesystem', () => ({
  Directory: { LibraryNoCloud: 'LIBRARY_NO_CLOUD' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: {
    mkdir: async () => {},
    writeFile: async ({ path, data, encoding }: { path: string; data: string; encoding?: string }) => {
      memory.files.set(path, encoding ? data : Uint8Array.from(atob(data), char => char.charCodeAt(0)));
    },
    appendFile: async ({ path, data }: { path: string; data: string }) => {
      if (memory.failAppending) throw new Error('Device storage full');
      const prior = memory.files.get(path);
      if (!(prior instanceof Uint8Array)) throw new Error('Missing temp file');
      const chunk = Uint8Array.from(atob(data), char => char.charCodeAt(0));
      const next = new Uint8Array(prior.length + chunk.length);
      next.set(prior);
      next.set(chunk, prior.length);
      memory.files.set(path, next);
    },
    stat: async ({ path }: { path: string }) => {
      const file = memory.files.get(path);
      if (!(file instanceof Uint8Array)) throw new Error('Missing audio');
      return { size: file.byteLength };
    },
    rename: async ({ from, to }: { from: string; to: string }) => {
      const file = memory.files.get(from);
      if (!file) throw new Error('Missing temporary file');
      memory.files.delete(from);
      memory.files.set(to, file);
    },
    deleteFile: async ({ path }: { path: string }) => {
      if (!memory.files.delete(path)) throw new Error('File not found');
    },
    readdir: async ({ path }: { path: string }) => ({
      files: [...memory.files.keys()].filter(key => key.startsWith(path + '/'))
        .map(key => ({ name: key.slice(path.length + 1) })),
    }),
    readFile: async ({ path }: { path: string }) => {
      const file = memory.files.get(path);
      if (typeof file !== 'string') throw new Error('Missing sidecar');
      return { data: file };
    },
    getUri: async ({ path }: { path: string }) => ({ uri: 'file:///private/' + path }),
  },
}));

import { deleteRecording, importRecording, listRecordings, recordingPlaybackUrl } from './localRecordings';

beforeEach(() => {
  memory.files.clear();
  memory.failAppending = false;
});

describe('native recording file lifecycle (mock filesystem; not a device test)', () => {
  it('copies more than one chunk and reloads manifest without browser storage', async () => {
    const content = new Uint8Array(600 * 1024).fill(41);
    const file = new File([content], 'my-session.wav', { type: 'audio/wav' });
    const progress: number[] = [];
    const recorded = await importRecording(file, done => progress.push(done));
    expect(progress.length).toBe(3);
    expect(progress.at(-1)).toBe(file.size);
    const entries = await listRecordings();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ id: recorded.id, bytes: file.size, missing: false });
    expect((await listRecordings())[0].name).toBe('my-session.wav');
    expect(await recordingPlaybackUrl(entries[0])).toContain('/private/native-audio/imports/');
    await deleteRecording(entries[0]);
    expect(await listRecordings()).toEqual([]);
    expect(memory.files.size).toBe(0);
  });

  it('cleans up a failed partial copy and creates no metadata record', async () => {
    memory.failAppending = true;
    const file = new File([new Uint8Array(300 * 1024)], 'overflow.wav', { type: 'audio/wav' });
    await expect(importRecording(file)).rejects.toThrow(/storage full/);
    expect(memory.files.size).toBe(0);
    expect(await listRecordings()).toEqual([]);
  });

  it('flags missing data instead of claiming a playable recording', async () => {
    const file = new File([new Uint8Array(1024)], 'test.wav', { type: 'audio/wav' });
    const saved = await importRecording(file);
    memory.files.delete('native-audio/imports/' + saved.fileName);
    const [entry] = await listRecordings();
    expect(entry.missing).toBe(true);
    await expect(recordingPlaybackUrl(entry)).rejects.toThrow(/missing/);
    await deleteRecording(entry);
    expect(await listRecordings()).toEqual([]);
  });

  it('rejects unsupported file types without writing bytes', async () => {
    await expect(importRecording(new File(['no'], 'document.txt', { type: 'text/plain' })))
      .rejects.toThrow(/audio recording/);
    expect(memory.files.size).toBe(0);
  });
});
