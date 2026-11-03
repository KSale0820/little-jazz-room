import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Detect the actual iOS app configuration mistake that prevented native
// microphone permission: NSMicrophoneUsageDescription nested under UIScene.
describe('iOS tuner microphone permission', () => {
  it('declares microphone usage exactly once at the root of Info.plist', () => {
    const plist = readFileSync(new URL('../../ios/App/App/Info.plist', import.meta.url), 'utf8');
    const tokens = plist.match(/<dict>|<\/dict>|<key>[^<]+<\/key>/g) ?? [];
    let depth = 0;
    let count = 0;
    for (const token of tokens) {
      if (token === '<dict>') depth++;
      else if (token === '</dict>') depth--;
      else if (token === '<key>NSMicrophoneUsageDescription</key>') {
        expect(depth).toBe(1);
        count++;
      }
    }
    expect(count).toBe(1);
    expect(depth).toBe(0);
    expect(plist).toContain('Use the microphone to detect musical notes while tuning.');
  });
});
