import { Capacitor } from '@capacitor/core';
import {
  deleteRecording, discardInterruptedImports, importRecording, listRecordings, recordingPlaybackUrl,
  type RecordingOnDevice,
} from './localRecordings';
import { StemTransport } from './stemTransport';

function element<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error('Missing lab element: ' + id);
  return value as T;
}
const environment = element<HTMLParagraphElement>('environment');
const importStatus = element<HTMLParagraphElement>('import-status');
const imports = element<HTMLDivElement>('imports');
const audio = element<HTMLAudioElement>('recording-player');
const stemStatus = element<HTMLParagraphElement>('stem-status');
const stemControls = element<HTMLDivElement>('stem-controls');
const seek = element<HTMLInputElement>('seek');
const loop = element<HTMLInputElement>('loop');
const transport = new StemTransport();

environment.textContent = Capacitor.isNativePlatform()
  ? 'Native ' + Capacitor.getPlatform() + '. Files are saved privately on this device.'
  : 'Web preview: generated stems work; file imports require the installed native app.';

async function refreshImports(): Promise<void> {
  imports.replaceChildren();
  if (!Capacitor.isNativePlatform()) return;
  try {
    const entries = await listRecordings();
    if (!entries.length) imports.textContent = 'No local recordings.';
    for (const record of entries) {
      const item = document.createElement('div');
      item.className = 'item';
      const title = document.createElement('div');
      title.textContent = record.name + ' (' + (record.bytes / 1048576).toFixed(1) + ' MiB)' +
        (record.missing ? ' — file missing or incomplete' : '');
      item.append(title);
      const playButton = document.createElement('button');
      playButton.textContent = 'Play offline';
      playButton.disabled = record.missing;
      playButton.onclick = () => void playImport(record);
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = () => void removeImport(record);
      item.append(playButton, deleteButton);
      imports.append(item);
    }
  } catch (error) {
    importStatus.textContent = 'Could not read private recordings: ' + String(error);
  }
}
async function playImport(record: RecordingOnDevice): Promise<void> {
  try {
    audio.pause();
    audio.src = await recordingPlaybackUrl(record);
    await audio.play(); // user-initiated gesture
    importStatus.textContent = 'Playing on-device: ' + record.name;
  } catch (error) { importStatus.textContent = 'Playback failed: ' + String(error); }
}
async function removeImport(record: RecordingOnDevice): Promise<void> {
  try {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    await deleteRecording(record);
    importStatus.textContent = 'Deleted from this device.';
    await refreshImports();
  } catch (error) { importStatus.textContent = 'Delete failed: ' + String(error); }
}
element<HTMLInputElement>('file').onchange = async event => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  input.disabled = true;
  try {
    const item = await importRecording(file, (done, total) => {
      importStatus.textContent = 'Copying on device: ' + Math.round(done / total * 100) + '%';
    });
    importStatus.textContent = 'Imported locally: ' + item.name;
    await refreshImports();
  } catch (error) {
    importStatus.textContent = String(error);
  } finally {
    input.value = '';
    input.disabled = false;
  }
};

function redraw(): void {
  const state = transport.status();
  stemStatus.textContent =
    (state.playing ? 'Playing' : 'Paused') + ' at ' + state.position.toFixed(2) +
    ' / ' + state.length + ' s. Scheduled start skew: ' +
    (state.scheduledSkewMs === null ? 'not scheduled' : state.scheduledSkewMs.toFixed(3) + ' ms') +
    '. Audible drift: NOT MEASURED.';
  if (document.activeElement !== seek) seek.value = String(state.position);
  if (stemControls.children.length !== state.stems.length) {
    stemControls.replaceChildren();
    state.stems.forEach((stem, index) => {
      const group = document.createElement('div');
      group.className = 'item';
      const label = document.createElement('label');
      label.textContent = stem.label + ' volume';
      const volume = document.createElement('input');
      volume.type = 'range'; volume.min = '0'; volume.max = '1'; volume.step = '.05';
      volume.value = String(stem.volume);
      volume.oninput = () => transport.setStemVolume(index, Number(volume.value));
      label.append(volume);
      const mute = document.createElement('label');
      const checked = document.createElement('input');
      checked.type = 'checkbox'; checked.checked = stem.muted;
      checked.onchange = () => transport.setStemMuted(index, checked.checked);
      mute.append(checked, document.createTextNode(' Mute'));
      group.append(label, mute);
      stemControls.append(group);
    });
  }
}
element<HTMLButtonElement>('start').onclick = async () => {
  try { await transport.play(); redraw(); }
  catch (error) { stemStatus.textContent = 'Audio unavailable: ' + String(error); }
};
element<HTMLButtonElement>('pause').onclick = () => { transport.pause(); redraw(); };
element<HTMLButtonElement>('reset').onclick = async () => {
  transport.pause();
  transport.seek(0);
  try { await transport.play(); } catch (error) { stemStatus.textContent = String(error); }
  redraw();
};
seek.onchange = () => transport.seek(Number(seek.value));
loop.onchange = () => {
  try { transport.setLoop(loop.checked ? { start: 2, end: 6 } : null); }
  catch (error) { stemStatus.textContent = String(error); }
};
audio.addEventListener('error', () => {
  importStatus.textContent = 'Decoder error. This codec may not be supported on this device.';
});
document.addEventListener('visibilitychange', () => {
  // No claim to run while locked. Suspend on background to avoid stale transport
  // and require an explicit user gesture to restart.
  if (document.hidden) transport.pause();
});
window.addEventListener('pagehide', () => { void transport.close(); });
window.setInterval(redraw, 200);
redraw();
void discardInterruptedImports().then(removed => {
  if (removed) importStatus.textContent = 'Cleaned up ' + removed + ' interrupted import(s).';
  return refreshImports();
}).catch(error => { importStatus.textContent = String(error); });
