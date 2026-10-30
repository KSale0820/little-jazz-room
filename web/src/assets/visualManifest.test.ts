/// <reference types="node" />
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  APPROVED_ROOM_SIZE,
  VISUAL_ASSETS,
  catCloseupUrl,
  catFloorUrl,
  catPortraitUrl,
  catPortraitUrls,
  catSpriteUrl,
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

  it('keeps the live room on the landscape heroes', () => {
    expect(VISUAL_ASSETS.room.approved.live).toBe(false);
    expect(VISUAL_ASSETS.room.approved.width).toBe(APPROVED_ROOM_SIZE.width);
    expect(VISUAL_ASSETS.room.approved.height).toBe(APPROVED_ROOM_SIZE.height);
    expect(roomArtUrls('sunshine')[0]).toBe('/room/home-hero-sunshine.png');
    expect(roomArtUrls('twilight')[0]).toBe('/room/home-hero-twilight.png');
    expect(roomArtUrls('night')[0]).toBe('/room/home-hero-night.png');
    expect(roomArtUrls('sunshine').some(url => url.startsWith('/visuals/'))).toBe(false);
  });

  it('maps the eight cat ids to full-body, profile, and close-up art', () => {
    for (const id of CAT_IDS) {
      expect(catFloorUrl(id)).toBe(`/visuals/cats/full-body/${id}.png`);
      expect(catPortraitUrl(id)).toBe(`/visuals/cats/profiles/${id}.png`);
      expect(catPortraitUrls(id)).toEqual([`/visuals/cats/profiles/${id}.png`]);
      expect(catCloseupUrl(id)).toBe(`/visuals/cats/closeups/${id}.png`);
      expect(catSpriteUrl(id)).toBe(`/jazz-cat-assets/${id}.svg`);
      expect(catPortraitUrls(id).some(url => url.endsWith('.svg'))).toBe(false);
    }
  });

  it('matches the packaged files byte for byte, including alpha and svg structure', () => {
    const installed = new Set(walkFiles(publicVisuals));
    const fromManifest = new Set<string>(collectVisualUrls(VISUAL_ASSETS));
    for (const id of CAT_IDS) {
      fromManifest.add(catFloorUrl(id));
      fromManifest.add(catPortraitUrl(id));
      fromManifest.add(catCloseupUrl(id));
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
      if (asset.path === 'cats/README.txt' || asset.path === 'cats/verification.json') {
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
