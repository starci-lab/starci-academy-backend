"""Read-only survey of question ROOT vs bodies/<lang> fields.

A naive `^# (\\w+)` scan is WRONG here: question content embeds shell/YAML/Terraform
comment lines (`# NAME  ENDPOINTS  AGE`, `# TIMEOUT — no endpoints`) that look exactly
like DSL field headings. A real field heading is always followed immediately by either
the separator comment or a `## N` sub-block, so match on that instead.
"""
import os
import re
import glob
import collections

QDIRS = [d for d in glob.glob(".mount/data/courses/*/mock-interview/*/questions/*") if os.path.isdir(d)]
NORMAL = [d for d in QDIRS if not os.path.isdir(os.path.join(d, "bodies"))]
TRACK = [d for d in QDIRS if os.path.isdir(os.path.join(d, "bodies"))]

FIELD = re.compile(r"^# ([a-zA-Z][a-zA-Z0-9]*)\r?\n(?:<!-- @starci/seperator -->|## \d)", re.M)


def fields(path):
    try:
        return FIELD.findall(open(path, encoding="utf-8").read())
    except OSError:
        return []


counter = collections.Counter()
for d in NORMAL:
    for f in fields(os.path.join(d, "en.md")):
        counter[f] += 1

print(f"=== {len(NORMAL)} cau BINH THUONG - field THAT o root ===")
for k, v in counter.most_common():
    print(f"  {k}: {v}")

track_root = fields(os.path.join(TRACK[0], "en.md"))
track_body = fields(os.path.join(TRACK[0], "bodies", "0-typescript", "en.md"))
print(f"\n=== khuon 4-TRACK ===\n  root: {track_root}\n  body: {track_body}")

# proposed move set, corrected: code travels with the body, diagram stays at root
MOVE = {"prompt", "idealAnswer", "givenCode", "givenLang"}
root_after = sorted(f for f in counter if f not in MOVE)
print("\n=== SAU khi doi (rule da sua) ===")
print("  root 757 con lai:", root_after)
print("  root 228 khuon  :", sorted(set(track_root)))
extra = sorted(set(root_after) - set(track_root))
missing = sorted(set(track_root) - set(root_after))
print("  chi co o 757 :", extra)
print("  chi co o 228 :", missing)
