import type { RoomItemId } from './achievementModel';
import { isItemVisible, type RoomCatName, type RoomCatPose, type RoomPreferences } from './roomStore';

/** Editor-approved 1706×922 placements (November 12). Keep exact positions and layer order. */
export const ROOM_CANVAS = { width: 1706, height: 922 } as const;
export const ROOM_ATLAS = { width: 1536, height: 1581, url: '/achievements/room-decor-atlas.webp' } as const;
export type RoomCategory = 'Cats' | 'Furniture' | 'Plants' | 'Music' | 'Lighting';
export interface RoomArtItem {
  id: RoomItemId;
  label: string;
  category: RoomCategory;
  x: number; y: number; width: number; height: number;
  rotation: number;
  atlas?: { x: number; y: number; width: number; height: number };
  catImage?: string;
  spriteImage?: string;
}
export const ROOM_ART: readonly RoomArtItem[] = [
  { id: 'curtain-left', label: "Left Curtain", category: 'Furniture', x: 11, y: 13, width: 216, height: 611, rotation: 0, atlas: { x: 3, y: 3, width: 216, height: 611 } },
  { id: 'curtain-right', label: "Right Curtain", category: 'Furniture', x: 416, y: 126, width: 153, height: 472, rotation: 0, atlas: { x: 3, y: 617, width: 153, height: 472 } },
  { id: 'wall-shelves', label: "", category: 'Furniture', x: 446, y: 12, width: 1212, height: 506, rotation: 0, atlas: { x: 222, y: 3, width: 1212, height: 506 } },
  { id: 'jazz-portraits', label: "Jazz Portraits", category: 'Music', x: 615, y: 157, width: 265, height: 125, rotation: 0, atlas: { x: 3, y: 1353, width: 265, height: 125 } },
  { id: 'wall-shelf-plants', label: "Hanging Plants", category: 'Plants', x: 970, y: 119, width: 325, height: 185, rotation: 0, atlas: { x: 792, y: 1092, width: 325, height: 185 } },
  { id: 'cat-toys', label: "Cat Toys", category: 'Cats', x: 1364, y: 95, width: 252, height: 100, rotation: -0.85, atlas: { x: 957, y: 1353, width: 252, height: 100 } },
  { id: 'wall-guitar', label: "Guitar", category: 'Music', x: 676, y: 298, width: 85, height: 190, rotation: 0, atlas: { x: 704, y: 1092, width: 85, height: 190 } },
  { id: 'bookshelf-plants', label: "Bookshelf Plants", category: 'Plants', x: 1394, y: 278, width: 205, height: 125, rotation: -0.22, atlas: { x: 271, y: 1353, width: 205, height: 125 } },
  { id: 'bookshelf-trumpet', label: "Trumpet", category: 'Music', x: 1438, y: 402, width: 165, height: 58, rotation: 0, atlas: { x: 622, y: 1481, width: 165, height: 58 } },
  { id: 'bookshelf-books', label: "Music Books", category: 'Music', x: 1393, y: 474, width: 224, height: 97, rotation: 0, atlas: { x: 1212, y: 1353, width: 224, height: 97 } },
  { id: 'bookshelf-cat', label: "Sleeping Cat", category: 'Cats', x: 1410, y: 604, width: 198, height: 101, rotation: 1.94, atlas: { x: 756, y: 1353, width: 198, height: 101 } },
  { id: 'piano-plant', label: "Piano Plant", category: 'Plants', x: 869, y: 268, width: 160, height: 211, rotation: 0, atlas: { x: 541, y: 1092, width: 160, height: 211 } },
  { id: 'piano-lamp', label: "Piano Lamp", category: 'Lighting', x: 1032, y: 272, width: 103, height: 114, rotation: 0, spriteImage: '/achievements/piano-lamp-no-halo.png', atlas: { x: 650, y: 1353, width: 103, height: 114 } },
  { id: 'piano-busts', label: "Jazz Busts", category: 'Music', x: 1146, y: 270, width: 168, height: 117, rotation: 0, atlas: { x: 479, y: 1353, width: 168, height: 117 } },
  { id: 'piano-sheet-music', label: "Sheet Music", category: 'Music', x: 963, y: 401, width: 228, height: 97, rotation: 0, atlas: { x: 3, y: 1481, width: 228, height: 97 } },
  { id: 'cat-tree', label: "Cat Tree", category: 'Furniture', x: 505, y: 400, width: 172, height: 308, rotation: 0, atlas: { x: 1089, y: 617, width: 172, height: 308 } },
  { id: 'couch', label: "Couch", category: 'Furniture', x: 68, y: 505, width: 545, height: 326, rotation: 0, atlas: { x: 359, y: 617, width: 545, height: 326 } },
  { id: 'sofa-pillows', label: "Pillows & Blanket", category: 'Furniture', x: 116, y: 541, width: 355, height: 258, rotation: 1.98, atlas: { x: 3, y: 1092, width: 355, height: 258 } },
  { id: 'cat-tree-sleeping-cat', label: "Sleeping Cat", category: 'Cats', x: 516, y: 332, width: 142, height: 82, rotation: 0, atlas: { x: 234, y: 1481, width: 142, height: 82 } },
  { id: 'upright-bass', label: "Upright Bass", category: 'Music', x: 713, y: 309, width: 197, height: 432, rotation: 0, atlas: { x: 159, y: 617, width: 197, height: 432 } },
  { id: 'bench-cushion', label: "Bench Cushion", category: 'Furniture', x: 955, y: 582, width: 240, height: 81, rotation: 1.15, atlas: { x: 379, y: 1481, width: 240, height: 81 } },
  { id: 'ottoman', label: "Ottoman", category: 'Furniture', x: 528, y: 699, width: 273, height: 151, rotation: 0, atlas: { x: 1120, y: 1092, width: 273, height: 151 } },
  { id: 'music-stand', label: "Music Stand", category: 'Music', x: 1284, y: 498, width: 179, height: 314, rotation: 0, atlas: { x: 907, y: 617, width: 179, height: 314 } },
  { id: 'side-table', label: "Side Table", category: 'Furniture', x: 60, y: 622, width: 177, height: 249, rotation: 0, atlas: { x: 361, y: 1092, width: 177, height: 249 } },
  { id: 'luna-sitting', label: "Luna", category: 'Cats', x: 1141, y: 387, width: 135, height: 176, rotation: 0.04, catImage: '/visuals/cats/clean-pixel/luna-sitting.png' },
  { id: 'luna', label: "Luna", category: 'Cats', x: 316, y: 562, width: 233, height: 150, rotation: 0, catImage: '/visuals/cats/clean-pixel/luna-sleeping.png' },
  { id: 'milo', label: "Milo", category: 'Cats', x: 1036, y: 109, width: 131, height: 164, rotation: 0, catImage: '/visuals/cats/clean-pixel/milo-sitting.png' },
  { id: 'milo-sleeping', label: "Milo", category: 'Cats', x: 968, y: 514, width: 217, height: 126, rotation: 0, catImage: '/visuals/cats/clean-pixel/milo-sleeping.png' },
  { id: 'maple', label: "Maple", category: 'Cats', x: 535, y: 540, width: 190, height: 236, rotation: 0, catImage: '/visuals/cats/clean-pixel/maple-sitting.png' },
  { id: 'maple-sleeping', label: "Maple", category: 'Cats', x: 1366, y: 150, width: 261, height: 155, rotation: 0, catImage: '/visuals/cats/clean-pixel/maple-sleeping.png' },
] as const;
/** Pose variants share one per-cat visibility setting, so two poses can never render together. */
export const ROOM_CAT_ITEMS = {
  luna: { main: 'luna', sitting: 'luna-sitting', sleeping: 'luna' },
  milo: { main: 'milo', sitting: 'milo', sleeping: 'milo-sleeping' },
  maple: { main: 'maple', sitting: 'maple', sleeping: 'maple-sleeping' },
} as const satisfies Record<RoomCatName, { main: RoomItemId; sitting: RoomItemId; sleeping: RoomItemId }>;

export function catNameForRoomItem(id: RoomItemId): RoomCatName | null {
  for (const name of ['luna', 'milo', 'maple'] as const) {
    if (ROOM_CAT_ITEMS[name].sitting === id || ROOM_CAT_ITEMS[name].sleeping === id)
      return name;
  }
  return null;
}

export function catPoseItem(name: RoomCatName, pose: RoomCatPose): RoomItemId {
  return ROOM_CAT_ITEMS[name][pose];
}

export function shouldRenderRoomItem(
  id: RoomItemId,
  unlocked: readonly RoomItemId[],
  preferences: RoomPreferences,
  previewAll = false,
): boolean {
  const cat = catNameForRoomItem(id);
  if (cat) {
    const group = ROOM_CAT_ITEMS[cat];
    const pose = preferences.catPoses?.[cat] ?? 'sitting';
    if (id !== group[pose]) return false;
    return previewAll || (unlocked.includes(group.main) && isItemVisible(group.main, preferences));
  }
  return previewAll || (unlocked.includes(id) && isItemVisible(id, preferences));
}
