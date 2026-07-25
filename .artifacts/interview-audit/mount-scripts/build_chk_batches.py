"""Extract every question's checklist into batch files for classification.

Ten questions per batch so one agent call covers ten questions instead of one, and each
batch file holds ONLY the checkpoint texts — the checkpoints are self-contained
declarative statements, so classifying their dimension needs neither the prompt nor the
given code. Agents read their own batch file, so the workflow args stay a list of ints.
"""
import glob
import json
import os
import re

SEP = re.escape("<!-- @starci/seperator -->")
OUT = ".artifacts/interview-audit/mount-scripts/_chk_batches"
BATCH = 10


def checklist_items(text):
    """Reads the `# checklist` block's `## N` values, anchored on the separator grammar."""
    match = re.search(
        rf"^# checklist\r?\n(.*?)(?=^# [a-zA-Z][a-zA-Z0-9]*\r?\n(?:{SEP}|## \d))",
        text, re.S | re.M,
    )
    if not match:
        return []
    return [s.strip() for s in re.findall(rf"{SEP}\s*\n(.*?)\n{SEP}", match.group(1), re.S)]


def rubric_dimensions(text):
    """Existing `[dimension]` tags on the rubric — a free prior for the classifier."""
    match = re.search(
        rf"^# rubric\r?\n(.*?)(?=^# [a-zA-Z][a-zA-Z0-9]*\r?\n(?:{SEP}|## \d))",
        text, re.S | re.M,
    )
    if not match:
        return []
    out = []
    for item in re.findall(rf"{SEP}\s*\n(.*?)\n{SEP}", match.group(1), re.S):
        tag = re.match(r"\[(\w+)\]", item.strip())
        if tag:
            out.append(tag.group(1))
    return sorted(set(out))


questions = []
for d in sorted(glob.glob(".mount/data/courses/*/mock-interview/*/questions/*")):
    if not os.path.isdir(d):
        continue
    text = open(os.path.join(d, "en.md"), encoding="utf-8").read()
    items = checklist_items(text)
    if not items:
        continue
    questions.append({
        "folder": d.replace("\\", "/").replace(".mount/data/", ""),
        "dimensionsSeen": rubric_dimensions(text),
        "checkpoints": items,
    })

os.makedirs(OUT, exist_ok=True)
for old in glob.glob(f"{OUT}/batch_*.json"):
    os.remove(old)

batches = [questions[i:i + BATCH] for i in range(0, len(questions), BATCH)]
for i, batch in enumerate(batches):
    json.dump(
        {"batchIndex": i, "questions": batch},
        open(f"{OUT}/batch_{i}.json", "w", encoding="utf-8"),
        ensure_ascii=False,
    )

sizes = [os.path.getsize(f"{OUT}/batch_{i}.json") for i in range(len(batches))]
print("questions with a checklist:", len(questions))
print("total checkpoints:", sum(len(q["checkpoints"]) for q in questions))
print("batches:", len(batches), f"({BATCH} questions each)")
print("batch file size: min", min(sizes), "avg", sum(sizes) // len(sizes), "max", max(sizes), "bytes")
json.dump(list(range(len(batches))), open(f"{OUT}/_indices.json", "w"))
