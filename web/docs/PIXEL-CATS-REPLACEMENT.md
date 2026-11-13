# Pixel cat replacement (Luna, Milo, Maple)

Updated the class-demo companion artwork for **Luna**, **Milo**, and **Maple** only.

Six source PNGs are copied without alteration from `feature/achievements-pixel-room-2026-11-12` at `web/public/visuals/cats/clean-pixel/{id}-{sitting|sleeping}.png`.
The source sprites measure 1254 × 1254 px, RGBA.

The six new files replace:
- `approved-class-mvp/sitting/{luna,milo,maple}.png`
- `approved-class-mvp/full-body/{luna,milo,maple}.png`
- `approved-class-mvp/profiles/{luna,milo,maple}.png`
- `approved-class-mvp/closeups/{luna,milo,maple}.png`
- `sleeping/{luna,milo,maple}.png`

All four standing/portrait/close-up/sitting presentations use each cat's new sitting sprite; sleeping presentations use the new sleeping sprite. This is intentional because no distinct new close-up/profile/full-body images were supplied.

`visualManifest.ts` remains the single central resolver. Existing identity IDs, selected companion data, unlock thresholds and room positions are unchanged. Other five cat illustrations are untouched. Do not add legacy fallbacks for these three cats.
