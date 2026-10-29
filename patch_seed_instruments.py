#!/usr/bin/env python3
"""Add applicable_instruments to seed exercises and routines (root + web copy)."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PATHS = [ROOT / "jazz-seed-content.json", ROOT / "web" / "src" / "data" / "jazz-seed-content.json"]

ALL = ["All"]
PIANO_GUITAR = ["Piano", "Guitar"]
BASS = ["Bass"]
DRUMS = ["Drums"]
HORNS = ["Alto Saxophone", "Tenor Saxophone", "Trumpet"]

EXERCISE_INSTRUMENTS: dict[str, list[str]] = {
    "listen-form": ALL,
    "swing-2-4": ALL,
    "blues-scale": ALL,
    "chord-roots": ALL,
    "thirds-sevenths": ALL,
    "seventh-arpeggios": ALL,
    "chord-tone-solo": ALL,
    "question-answer": ALL,
    "blues-form": ALL,
    "shell-voicings": PIANO_GUITAR,
    "rhythm-variation": ["Drums", "Bass", "Piano"],
    "four-bar-lick": ALL,
    "walking-bass": BASS,
    "comping-space": PIANO_GUITAR,
    "one-chorus": ALL,
    "melody-by-ear": ALL,
    "listen-bass": ALL,
    "free-play": ALL,
    "blues-bb-forms": ALL,
    "rhythm-bridge": DRUMS,
    "bossa-minor": ALL,
    "major-minor-cycle": ALL,
    "modal-space": ALL,
    "songbook-form": ALL,
    "bright-swing": ALL,
    "minor-blues": ALL,
    "ballad-voice": PIANO_GUITAR + HORNS,
}

ROUTINE_INSTRUMENTS: dict[str, list[str]] = {
    "first-improv": ALL,
    "daily-warm-up": ALL,
    "12bar-blues": ALL,
    "ii-v-i-workout": ALL,
    "rhythm-time": ALL,
    "intermediate-solo": ALL,
    "walking-bass": BASS,
    "comping-basics": PIANO_GUITAR,
    "ear-training": ALL,
    "no-backing": ALL,
    "jazz-standards-starter": ALL,
    "first-minor-bossa": ALL,
    "rhythm-changes-starter": ALL,
    "forms-and-ballads": ALL,
}


def patch(data: dict) -> None:
    valid = set(data["instruments"]) | {"All"}
    for ex in data["exercises"]:
        apps = EXERCISE_INSTRUMENTS.get(ex["id"], ALL)
        ex["applicable_instruments"] = apps
        for a in apps:
            if a not in valid:
                raise ValueError(f"Invalid instrument {a} on exercise {ex['id']}")
    for rt in data["routines"]:
        apps = ROUTINE_INSTRUMENTS.get(rt["id"], ALL)
        rt["applicable_instruments"] = apps
        for a in apps:
            if a not in valid:
                raise ValueError(f"Invalid instrument {a} on routine {rt['id']}")


for path in PATHS:
    data = json.loads(path.read_text(encoding="utf-8"))
    patch(data)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("patched", path)
