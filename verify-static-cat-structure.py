"""Mechanical *idle sprite* structural QA, not a substitute for visual pose review.
Run: python verify-static-cat-structure.py
"""
from pathlib import Path
from xml.etree import ElementTree as ET
import json
ROOT = Path(__file__).parent
ASSETS = ROOT / 'jazz-cat-assets'
roster = json.loads((ASSETS / 'cats.json').read_text())
expected = {'head': 1, 'ear': 2, 'paw': 4, 'tail': 1, 'eye': 2}
assert len(roster) == 8 and len({c['id'] for c in roster}) == 8, 'Expected 8 unique cats'
for cat in roster:
    root = ET.parse(ASSETS / f"{cat['id']}.svg").getroot()
    actual = {name:len(root.findall(f".//*[@data-anatomy='{name}']")) for name in expected if name != 'eye'}
    actual['eye'] = len(root.findall(".//*[@data-face='eye']"))
    assert actual == expected, f"{cat['id']}: {actual} != {expected}"
    assert (ASSETS / f"{cat['id']}.png").exists(), f"PNG missing: {cat['id']}"
    print(f"PASS static structure: {cat['id']}")
print('PASS eight static sprites. Manual checks still required for anatomy and animation.')
