/**
 * On-device prototype only. The input is provided by the OS file picker;
 * bytes never reach Supabase, fetch(), or any server.
 *
 * Files live under LibraryNoCloud (iOS) / app-private files (Android).
 * Android automatic device backup must be disabled in AndroidManifest.
 */
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

export type LocalRecording = {
  id: string;
  name: string;
  mime: string;
  bytes: number;
  importedAt: string;
  fileName: string;
};
export type RecordingOnDevice = LocalRecording & { missing: boolean };

const folder = 'native-audio/imports';
const location = Directory.LibraryNoCloud;
const blockSize = 256 * 1024;
const maxBytes = 250 * 1024 * 1024;
const validId = /^[0-9a-f-]{36}$/i;
const supportedExtensions = new Set(['wav', 'mp3', 'm4a', 'aac', 'aif', 'aiff', 'flac', 'ogg', 'caf']);

export function assertNativeAudioStorage(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Private audio import requires the installed iOS or Android app.');
  }
}

function base64(bytes: Uint8Array): string {
  let text = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    text += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(text);
}

function safeId(id: string): string {
  if (!validId.test(id)) throw new Error('Invalid recording ID');
  return id;
}

async function prepare(): Promise<void> {
  try {
    await Filesystem.mkdir({ directory: location, path: folder, recursive: true });
  } catch (error) {
    // mkdir is also called when the directory already exists.
    const message = String(error).toLowerCase();
    if (!message.includes('exist')) throw error;
  }
}

function extensionFor(file: File): string {
  const suffix = file.name.split('.').at(-1)?.toLowerCase() ?? '';
  if (supportedExtensions.has(suffix)) return suffix;
  if (file.type.startsWith('audio/')) return 'bin';
  throw new Error('Choose an audio recording (WAV, MP3, M4A, AAC, AIFF, FLAC, OGG or CAF).');
}

export async function importRecording(
  file: File,
  onProgress?: (written: number, total: number) => void,
): Promise<LocalRecording> {
  assertNativeAudioStorage();
  const suffix = extensionFor(file);
  if (file.size < 1 || file.size > maxBytes) {
    throw new Error('Recording must be between 1 byte and 250 MiB (prototype limit).');
  }
  await prepare();
  const id = crypto.randomUUID();
  const fileName = id + '.' + suffix;
  const tempName = fileName + '.part';
  const filePath = folder + '/' + fileName;
  const temporaryPath = folder + '/' + tempName;
  const record: LocalRecording = {
    id, name: file.name.slice(0, 240), mime: file.type || 'application/octet-stream',
    bytes: file.size, importedAt: new Date().toISOString(), fileName,
  };
  let renamed = false;
  try {
    for (let offset = 0; offset < file.size; offset += blockSize) {
      const chunk = new Uint8Array(await file.slice(offset, offset + blockSize).arrayBuffer());
      const options = { directory: location, path: temporaryPath, data: base64(chunk) };
      if (offset === 0) await Filesystem.writeFile(options);
      else await Filesystem.appendFile(options);
      onProgress?.(Math.min(offset + chunk.byteLength, file.size), file.size);
    }
    const stat = await Filesystem.stat({ directory: location, path: temporaryPath });
    if (stat.size !== file.size) throw new Error('Copy size mismatch. Import cancelled.');
    await Filesystem.rename({ directory: location, from: temporaryPath, to: filePath });
    renamed = true;
    await Filesystem.writeFile({
      directory: location, path: folder + '/' + id + '.json',
      encoding: Encoding.UTF8, data: JSON.stringify(record),
    });
    return record;
  } catch (error) {
    await Filesystem.deleteFile({ directory: location, path: temporaryPath }).catch(() => {});
    if (renamed) {
      await Filesystem.deleteFile({ directory: location, path: filePath }).catch(() => {});
    }
    throw new Error('Audio import failed. Check free space and try again. ' + String(error));
  }
}


/** Clear a force-quit import's orphaned temporary bytes on next lab launch. */
export async function discardInterruptedImports(): Promise<number> {
  assertNativeAudioStorage();
  await prepare();
  const entries = await Filesystem.readdir({ directory: location, path: folder });
  let removed = 0;
  for (const item of entries.files) {
    const id = item.name.split('.')[0];
    if (!validId.test(id) || !item.name.endsWith('.part')) continue;
    try {
      await Filesystem.deleteFile({ directory: location, path: folder + '/' + item.name });
      removed++;
    } catch {
      // Recoverable on a subsequent launch; do not hide intact recordings.
    }
  }
  return removed;
}

export async function listRecordings(): Promise<RecordingOnDevice[]> {
  assertNativeAudioStorage();
  await prepare();
  const contents = await Filesystem.readdir({ directory: location, path: folder });
  const records: RecordingOnDevice[] = [];
  for (const entry of contents.files) {
    if (!validId.test(entry.name.slice(0, -5)) || !entry.name.endsWith('.json')) continue;
    try {
      const response = await Filesystem.readFile({
        directory: location, path: folder + '/' + entry.name, encoding: Encoding.UTF8,
      });
      if (typeof response.data !== 'string') continue;
      const parsed = JSON.parse(response.data) as LocalRecording;
      if (parsed.id + '.json' !== entry.name ||
          !parsed.fileName.startsWith(parsed.id + '.')) continue;
      let missing = false;
      try {
        const stat = await Filesystem.stat({ directory: location, path: folder + '/' + parsed.fileName });
        missing = stat.size !== parsed.bytes;
      } catch { missing = true; }
      records.push({ ...parsed, missing });
    } catch {
      // A torn/corrupt sidecar must not hide other intact imports.
    }
  }
  return records.sort((a, b) => b.importedAt.localeCompare(a.importedAt));
}

export async function recordingPlaybackUrl(record: RecordingOnDevice): Promise<string> {
  assertNativeAudioStorage();
  safeId(record.id);
  if (record.missing || !record.fileName.startsWith(record.id + '.')) {
    throw new Error('Recording file is missing or incomplete.');
  }
  const uri = await Filesystem.getUri({ directory: location, path: folder + '/' + record.fileName });
  return Capacitor.convertFileSrc(uri.uri);
}

export async function deleteRecording(record: RecordingOnDevice): Promise<void> {
  assertNativeAudioStorage();
  safeId(record.id);
  if (!record.fileName.startsWith(record.id + '.')) throw new Error('Invalid file path');
  // Delete data before the index, so a failed deletion remains visible as missing.
  await Filesystem.deleteFile({ directory: location, path: folder + '/' + record.fileName })
    .catch(async () => {
      if (!record.missing) throw new Error('Unable to delete audio file.');
    });
  await Filesystem.deleteFile({ directory: location, path: folder + '/' + record.id + '.json' });
}
