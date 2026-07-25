"""Prepare exampleResults regeneration inputs for the 228 mis-generated questions.

The old exampleResults were written against a prompt/givenCode that had been fabricated at
the question root, so they answer a question the learner never sees. They are regenerated
from the REAL body instead.

Coverage is decided HERE, not by the model: level 1 covers every checkpoint, and each
lower level drops more of them (cheapest non-critical first, so a level loses its
peripheral credit before its must-hit points, and the bottom levels miss critical ones).
The score then falls straight out of the band arithmetic, which means the printed score
and the answer text cannot disagree — the old pipeline scored the text after the fact and
routinely produced nulls and non-monotonic ladders.
"""
import glob
import json
import os
import re
import sys

SEP = re.escape("<!-- @starci/seperator -->")
MS = ".artifacts/interview-audit/mount-scripts"
LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 228
CRITICAL_MISS_SCORE_CAP = 60

# fraction of TOTAL band each level should land near
LEVEL_TARGETS = [1.0, 0.8, 0.5, 0.2, 0.0]


def checkpoints_of(text):
    """Reads the nested `# checklist` block into {text, dimension, critical, scoreBand}."""
    block = re.search(
        rf"^# checklist\r?\n(.*?)(?=^# [a-zA-Z][a-zA-Z0-9]*\r?\n(?:{SEP}|## \d))",
        text, re.S | re.M,
    )
    if not block:
        return []
    out = []
    for chunk in re.split(r"^## \d+\s*$", block.group(1), flags=re.M)[1:]:
        def field(name):
            m = re.search(rf"### {name}\r?\n{SEP}\r?\n(.*?)\r?\n{SEP}", chunk, re.S)
            return m.group(1).strip() if m else None
        out.append({
            "text": field("text") or "",
            "dimension": field("dimension"),
            "critical": (field("critical") or "false") == "true",
            "scoreBand": int(field("scoreBand") or 0),
        })
    return out


def coverage_sets(points):
    """Picks which checkpoint indices each level covers, dropping cheapest-first."""
    total = sum(p["scoreBand"] for p in points) or 100
    # drop order: non-critical before critical, smallest band first within each group
    drop_order = sorted(
        range(len(points)),
        key=lambda i: (points[i]["critical"], points[i]["scoreBand"]),
    )
    sets = []
    for target in LEVEL_TARGETS:
        covered = set(range(len(points)))
        for index in drop_order:
            if sum(points[i]["scoreBand"] for i in covered) / total <= target:
                break
            covered.discard(index)
        sets.append(sorted(covered))
    return sets


def score_for(points, covered):
    """Mirrors MockInterviewGradingService.scoreFromCheckpoints exactly."""
    hit = set(covered)
    score = sum(p["scoreBand"] for i, p in enumerate(points) if i in hit)
    if any(p["critical"] and i not in hit for i, p in enumerate(points)):
        score = min(score, CRITICAL_MISS_SCORE_CAP)
    return max(0, min(100, score))


todo = json.load(open(f"{MS}/_mount_todo_705_skipped.json", encoding="utf-8"))
items = []
for entry in todo:
    folder = entry["folder"]
    en = f".mount/data/{folder}/en.md"
    if not os.path.exists(en):
        continue
    points = checkpoints_of(open(en, encoding="utf-8").read())
    if len(points) < 3:
        continue
    bodies = sorted(glob.glob(f".mount/data/{folder}/bodies/*"))
    if not bodies:
        continue
    sets = coverage_sets(points)
    items.append({
        "folder": folder,
        "bodyPath": bodies[0].replace("\\", "/").replace(".mount/data/", ""),
        "checkpoints": [p["text"] for p in points],
        "coverage": sets,
        "scores": [score_for(points, s) for s in sets],
    })
    if len(items) >= LIMIT:
        break

os.makedirs(f"{MS}/_example_inputs", exist_ok=True)
for old in glob.glob(f"{MS}/_example_inputs/*.json"):
    os.remove(old)
for i, item in enumerate(items):
    json.dump(item, open(f"{MS}/_example_inputs/q_{i}.json", "w", encoding="utf-8"), ensure_ascii=False)

print("questions prepared:", len(items))
print("score ladders (first 5):")
for item in items[:5]:
    print("  ", item["scores"], "from", len(item["checkpoints"]), "checkpoints")
non_monotonic = [i for i, it in enumerate(items) if any(
    it["scores"][k] < it["scores"][k + 1] for k in range(4))]
print("non-monotonic ladders (must be 0):", len(non_monotonic))
json.dump(list(range(len(items))), open(f"{MS}/_example_indices.json", "w"))
