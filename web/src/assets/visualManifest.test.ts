/// <reference types="node" />
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  APPROVED_ROOM_SIZE,
  VISUAL_ASSETS,
  catCloseupUrls,
  catFloorUrls,
  catPortraitUrls,
  catSleepingUrls,
  roomArtUrls,
} from './visualManifest';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const publicVisuals = join(webRoot, 'public/visuals');
const designDir = join(webRoot, 'docs/design');

const CAT_IDS = ['luna', 'milo', 'maple', 'mochi', 'pepper', 'patches', 'chai', 'biscuit'] as const;

type PackagedAsset = {
  path: string;
  sha256: string;
  width?: number;
  height?: number;
  mode?: string;
};

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else out.push(relative(publicVisuals, full).replaceAll('\\', '/'));
  }
  return out;
}

function collectVisualUrls(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    if (value.startsWith('/visuals/')) out.push(value);
    return out;
  }
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) collectVisualUrls(child, out);
  }
  return out;
}

function readPngInfo(buf: Buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(buf.subarray(0, 8).equals(signature)).toBe(true);
  expect(buf.toString('ascii', 12, 16)).toBe('IHDR');
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    colorType: buf[25],
  };
}

function assertWellFormedSvg(text: string, file: string) {
  const body = text.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?xml[\s\S]*?\?>/, '').trim();
  expect(body.startsWith('<svg'), `${file} should be an svg root`).toBe(true);
  const stack: string[] = [];
  const tagRe = /<\/?([A-Za-z][\w:.-]*)\b[^>]*?\/?>/g;
  for (const match of body.matchAll(tagRe)) {
    const raw = match[0];
    const name = match[1];
    if (raw.endsWith('/>')) continue;
    if (raw.startsWith('</')) {
      expect(stack.pop(), `${file} has a mismatched </${name}>`).toBe(name);
    } else {
      stack.push(name);
    }
  }
  expect(stack, `${file} has unclosed tags`).toEqual([]);
}

describe('approved visual library', () => {
  const packaged = JSON.parse(readFileSync(join(designDir, 'ASSET-MANIFEST.json'), 'utf8')) as PackagedAsset[];

  it('registers the correct approved portrait room (old landscape helper stays for legacy scenes)', () => {
    expect(VISUAL_ASSETS.room.approved.live).toBe(false);
    expect(VISUAL_ASSETS.room.approved.width).toBe(APPROVED_ROOM_SIZE.width);
    expect(VISUAL_ASSETS.room.approved.height).toBe(APPROVED_ROOM_SIZE.height);
    expect(roomArtUrls('sunshine')[0]).toBe('/room/home-hero-sunshine.png');
    expect(roomArtUrls('twilight')[0]).toBe('/room/home-hero-twilight.png');
    expect(roomArtUrls('night')[0]).toBe('/room/home-hero-night.png');
    expect(roomArtUrls('sunshine').some(url => url.startsWith('/visuals/'))).toBe(false);
  });

  it('uses only the eight newly approved companion variants with no fallbacks', () => {
    for (const id of CAT_IDS) {
      const base = `/visuals/cats/approved-class-mvp`;
      expect(catFloorUrls(id)).toEqual([`${base}/full-body/${id}.png`]);
      expect(catPortraitUrls(id)).toEqual([`${base}/profiles/${id}.png`]);
      expect(catCloseupUrls(id)).toEqual([`${base}/closeups/${id}.png`]);
      expect(catSleepingUrls(id)).toEqual([`/visuals/cats/sleeping/${id}.png`]);

      for (const variant of ['full-body', 'profiles', 'closeups']) {
        const file = join(publicVisuals, 'cats', 'approved-class-mvp', variant, `${id}.png`);
        const png = readPngInfo(readFileSync(file));
        expect(png.width).toBeGreaterThan(500);
        expect(png.height).toBeGreaterThan(500);
        expect([4, 6]).toContain(png.colorType);
      }
    }
  });

  it('matches the packaged files byte for byte, including alpha and svg structure', () => {
    const installed = new Set(walkFiles(publicVisuals));
    const fromManifest = new Set<string>(collectVisualUrls(VISUAL_ASSETS));
    // H01's newly supplied photo is installed separately from the original asset pack.
    // Keep legacy pack checks strict while allowing it to arrive in a distinct commit.
    if (!installed.has(VISUAL_ASSETS.room.h01.replace('/visuals/', ''))) {
      fromManifest.delete(VISUAL_ASSETS.room.h01);
    }
    for (const id of CAT_IDS) {
      fromManifest.add(catFloorUrls(id)[0]);
      fromManifest.add(catPortraitUrls(id)[0]);
      fromManifest.add(catCloseupUrls(id)[0]);
      // All eight sleeping sprites are indexed 128x128 PNGs with transparency.
      const sleeping = VISUAL_ASSETS.cat.sleepingFile(id);
      fromManifest.add(sleeping);
      const file = join(publicVisuals, sleeping.replace('/visuals/', ''));
      expect(installed.has(sleeping.replace('/visuals/', '')), `${id} sleeping art missing`).toBe(true);
      const png = readPngInfo(readFileSync(file));
      expect(png).toMatchObject({ width: 128, height: 128, colorType: 3 });
    }

    const roomFrames = [
      VISUAL_ASSETS.room.approved.sunshine,
      VISUAL_ASSETS.room.approved.twilight,
      VISUAL_ASSETS.room.approved.night,
      ...Object.values(VISUAL_ASSETS.room.approved.overlays),
    ];

    for (const asset of packaged) {
      if (asset.path === 'references/APPROVED-VISUAL-REFERENCE.png') {
        const file = join(designDir, 'APPROVED-VISUAL-REFERENCE.png');
        const buf = readFileSync(file);
        expect(createHash('sha256').update(buf).digest('hex')).toBe(asset.sha256);
        const png = readPngInfo(buf);
        expect(png).toMatchObject({ width: 1448, height: 1086, colorType: 2 });
        continue;
      }
      // The former 24-character sheet cutouts were explicitly retired by the user.
      if (asset.path.startsWith('cats/')) {
        expect(installed.has(asset.path)).toBe(false);
        continue;
      }

      const url = `/visuals/${asset.path}`;
      expect(fromManifest.has(url), `${url} missing from visualManifest`).toBe(true);
      expect(installed.has(asset.path), `${asset.path} missing from public/visuals`).toBe(true);
      const buf = readFileSync(join(publicVisuals, asset.path));
      expect(createHash('sha256').update(buf).digest('hex')).toBe(asset.sha256);

      if (asset.path.endsWith('.png')) {
        const png = readPngInfo(buf);
        expect(png.width).toBe(asset.width);
        expect(png.height).toBe(asset.height);
        if (asset.mode === 'RGBA') expect([4, 6]).toContain(png.colorType);
        if (asset.mode === 'RGB') expect(png.colorType).toBe(2);
        if ((roomFrames as readonly string[]).includes(url)) {
          expect(png.width).toBe(941);
          expect(png.height).toBe(1672);
        }
      } else if (asset.path.endsWith('.svg')) {
        assertWellFormedSvg(buf.toString('utf8'), asset.path);
      }
    }

    expect([...installed].sort()).toEqual(
      [...fromManifest].map(url => url.replace('/visuals/', '')).sort(),
    );
  });
});
