#!/usr/bin/env python3
"""Fast, local, dependency-free validation of the Little Jazz Room starter suite.
Does not verify browser interactions, Supabase RLS, actual audio processing, or art quality.
"""
from __future__ import annotations
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent
ERRORS: list[str] = []

def require(ok: bool, message: str) -> None:
    if not ok:
        ERRORS.append(message)

seed = json.loads((ROOT / 'jazz-seed-content.json').read_text(encoding='utf-8'))
cats = json.loads((ROOT / 'jazz-cat-assets' / 'cats.json').read_text(encoding='utf-8'))
roles = json.loads((ROOT / 'CAT-JAZZ-IDENTITIES.json').read_text(encoding='utf-8'))
require((ROOT / 'APPROVED-VISUAL-REFERENCE.png').exists(), 'Final approved visual reference is missing.')
require(len(roles) == 8 and {c['id'] for c in roles} == {c['id'] for c in cats}, 'Cat jazz-role roster mismatch.')
cat_ids = {c['id'] for c in cats}
require(len(cat_ids) == len(cats) == 8, 'Expected eight uniquely identified cats.')
for cat in cats:
    require((ROOT / 'jazz-cat-assets' / (cat['id'] + '.svg')).exists(), 'Missing SVG for ' + cat['id'])
require('luna' in cat_ids, 'Default cat Luna missing.')
for cat in cats:
    require(bool(cat.get('instrument')), 'Missing instrument role for ' + cat['id'])

instruments = seed['instruments']
require(len(instruments) == 7, 'Expected seven initial instruments.')
exercises = {e['id']: e for e in seed['exercises']}
require(len(exercises) == len(seed['exercises']) == 27, 'Missing/duplicated starter exercises.')
charts = {c['id']: c for c in seed['charts']}
require(len(charts) == len(seed['charts']) == 11, 'Expected eleven distinct original educational charts.')

for chart in seed['charts']:
    bars = chart['bars']
    require(len(bars) in (4, 12, 16, 32), f"Unexpected bars for chart {chart['id']}.")
    require([b['number'] for b in bars] == list(range(1, len(bars) + 1)), f"Unordered bars: {chart['id']}")
    for b in bars:
        events = b['events']
        require(bool(events), f"No chord in {chart['id']} bar {b['number']}")
        positions = sorted((ev['beat'], ev['beat'] + ev['duration_beats']) for ev in events)
        require(positions[0][0] == 1 and positions[-1][1] == 5, f"Missing beats: {chart['id']} bar {b['number']}")
        require(all(positions[i][1] == positions[i + 1][0] for i in range(len(positions)-1)), f"Overlapping/gapped chord events in {chart['id']} bar {b['number']}")
        for ev in events:
            require(ev['root'] in {'C','Db','D','Eb','E','F','F#','Gb','G','Ab','A','Bb','B'}, f"Unexpected root {ev['root']}")
            require(ev['quality'] in {'maj7','m7','7','dim7','m7b5','7alt','sus7','major','minor'}, f"Unexpected chord quality {ev['quality']}")
for ex in seed['exercises']:
    require(bool(ex['instructions'].strip()), f"Missing exercise instructions: {ex['id']}")
    require(ex['duration_minutes'] > 0, f"Missing recommended duration: {ex['id']}")
    require(ex.get('chart_id') is None or ex['chart_id'] in charts, f"Unknown chart for {ex['id']}")
    apps = ex.get('applicable_instruments') or []
    require(isinstance(apps, list) and len(apps) > 0, f"Missing applicable_instruments: {ex['id']}")
    for a in apps:
        require(a == 'All' or a in instruments, f"Invalid applicable_instruments on {ex['id']}: {a}")

routines = {r['id']:r for r in seed['routines']}
require(len(routines) == len(seed['routines']) == 14, 'Expected fourteen unique starter routines.')
for r in seed['routines']:
    actual = sum(s['duration_minutes'] for s in r['steps'])
    require(actual == r['duration_minutes'], f"Incorrect total duration: {r['id']} expected {r['duration_minutes']}, got {actual}")
    require(all(st['exercise_id'] in exercises for st in r['steps']), f"Unknown exercise in {r['id']}")
    apps = r.get('applicable_instruments') or []
    require(isinstance(apps, list) and len(apps) > 0, f"Missing applicable_instruments: {r['id']}")
    for a in apps:
        require(a == 'All' or a in instruments, f"Invalid applicable_instruments on {r['id']}: {a}")
for p in seed['paths']:
    require(all(rid in routines for rid in p['sessions']), f"Undefined path routine in {p['id']}")
require(len({q['id'] for q in seed['charts']}) == len(seed['charts']), 'Duplicate chart IDs.')
for item in seed.get('repertoire_guides',[]):
    require(item['practice_chart_id'] in charts, f"Orphan repertoire chart: {item['standard']}")
    require(item['relationship']=='harmonic_form_study_not_exact_song_chart', 'Repertoire guide must not imply exact copyrighted song chart.')
require(seed['initial_recordings'] == [], 'Do not bundle audio without verified usage rights.')

# Check inline preview script syntax. Chromium is blocked in this execution environment;
# an actual browser acceptance check remains a Cursor requirement.
class ScriptCollector(HTMLParser):
    def __init__(self): super().__init__();self.scripts=[];self.in_script=False
    def handle_starttag(self,tag,attrs):
        if tag == 'script' and not dict(attrs).get('src'):self.in_script=True;self.scripts.append('')
    def handle_endtag(self,tag):
        if tag=='script':self.in_script=False
    def handle_data(self,data):
        if self.in_script:self.scripts[-1]+=data
p=ScriptCollector()
p.feed((ROOT/'jazz-jazz-chart-ui-preview.html').read_text(encoding='utf-8'))
require(bool(p.scripts), 'Preview HTML has no inline JS.')
if shutil.which('node') and p.scripts:
    with tempfile.TemporaryDirectory() as td:
        for idx,script in enumerate(p.scripts):
            file=Path(td)/f'preview_{idx}.js';file.write_text(script, encoding='utf-8')
            result=subprocess.run(['node','--check',str(file)],capture_output=True,text=True)
            require(result.returncode==0, f'Invalid preview JavaScript: {result.stderr[:500]}')
if shutil.which('python'):
    res=subprocess.run(['python',str(ROOT/'verify-static-cat-structure.py')],cwd=ROOT,capture_output=True,text=True)
    require(res.returncode==0, f'Cat structure validator failed: {res.stderr or res.stdout}')

if ERRORS:
    print('STARTER SUITE FAILURES:')
    for e in ERRORS: print(' - '+e)
    raise SystemExit(1)
print(f"PASS: {len(cats)} cats; {len(exercises)} exercises; {len(routines)} routines; {len(charts)} charts; {len(seed['paths'])} paths; inline JavaScript syntax.")
print('NOT TESTED HERE: browser interactions, actual anatomy appearance, Supabase permissions, production build, deployment.')
