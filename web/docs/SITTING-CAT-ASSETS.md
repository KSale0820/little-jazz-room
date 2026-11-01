# Approved sitting companion poses

Eight approved sitting-cat illustrations are installed as real PNG binary files in
`web/public/visuals/cats/approved-class-mvp/sitting/{id}.png`.

Use `VISUAL_ASSETS.cat.sittingFile(id)` (or `catSittingUrls(id)`) from
`web/src/assets/visualManifest.ts`. Valid IDs: `luna`, `milo`, `maple`,
`mochi`, `pepper`, `patches`, `chai`, `biscuit`.

Every asset is a 1024 x 1024 transparent PNG from the approved sitting-cat handoff.
The three originally JPEG sitting illustrations were converted to transparent PNGs
in the approved package. The repository copies preserve the supplied PNG bytes exactly.
They are separate from full-body, profile, close-up, and sleeping poses.
Do not substitute another variant or repaint the cats.

## Integrity (SHA-256 of original PNG bytes)

| Companion | SHA-256 |
| --- | --- |
| Biscuit | `544aa48be0e15a829c122be05a9f0ac24da250a2f054b1b8cee3b429c083b7d4` |
| Chai | `5a0894105ef732ee4299781a3009d82a46d5a341fd0f2797b7987df382e8833a` |
| Luna | `674d5fa8c84704736e1ce39d066d238b1bf41f1646838b56462255bd720b4ca1` |
| Maple | `dba8032a32248b66387224dbeac0fac6d9084098c8d0caf41aed519d4a040b36` |
| Milo | `65b53c96e68c5393fceec701d6b2345583f3011e83621c2414e189ad1112ca7d` |
| Mochi | `ea3083f4532a58f6ff43e19e5364bc5d92694e2c2fccaf7ac1cc0407025a00e4` |
| Patches | `7ccc8092d3fb1faa17f19fe2eb8b7dd1dba3a6a39edcae03fce5034e5a68b62f` |
| Pepper | `152a817cabaf49ba03a914e8b70cb20f4c7382b15fb16c425e5a3c393cb00d42` |

No screen UI changes are part of this asset-only PR.
