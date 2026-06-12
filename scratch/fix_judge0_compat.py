"""Make coding-problem reference code Judge0-compatible.

- TypeScript (tsc 3.7.4, old target/lib): prepend `// @ts-nocheck` so type-checking
  is skipped; Node 12 runtime supplies require/Array.fill/Math.trunc/Map at runtime.
- Python (3.8.1): PEP 585 builtin generics (`list[int]`, `dict[...]`) crash at def
  time; prepend `from __future__ import annotations` so annotations stay lazy.

Only touches code blocks under `# starterCodes` / `# solutions` for those two langs.
Idempotent.
"""
import os

ROOT = os.path.join(".gitrefs", "data", "coding-problems", "sets")
DELIM = "<!-- @starci/seperator -->"
PEP585 = ("list[", "dict[", "set[", "tuple[")


def fix_file(path):
    lines = open(path, encoding="utf-8").read().split("\n")
    out, j, n, changed = [], 0, len(lines), False
    section = cur_lang = None
    content_pending = False
    while j < n:
        line = lines[j]
        if line.startswith("# "):
            section, cur_lang, content_pending = line[2:].strip(), None, False
        elif line.startswith("## "):
            cur_lang, content_pending = None, False
        elif line.strip() == "### lang":
            cur_lang = lines[j + 1].strip() if j + 1 < n else None
        elif line.strip() == "### content":
            content_pending = True
        out.append(line)
        if (line == DELIM and content_pending
                and section in ("starterCodes", "solutions")):
            # capture the block (until the closing delimiter) for decisions
            k = j + 1
            block = []
            while k < n and lines[k] != DELIM:
                block.append(lines[k])
                k += 1
            body = "\n".join(block)
            ins = []
            if cur_lang == "typescript" and not body.lstrip().startswith("// @ts-nocheck"):
                ins = ["// @ts-nocheck"]
            elif (cur_lang == "python" and any(p in body for p in PEP585)
                  and "from __future__ import annotations" not in body):
                ins = ["from __future__ import annotations", ""]
            if ins:
                out.extend(ins)
                changed = True
            content_pending = False
        j += 1
    if changed:
        open(path, "w", encoding="utf-8", newline="\n").write("\n".join(out))
    return changed


def main():
    n = 0
    for s in sorted(os.listdir(ROOT)):
        pdir = os.path.join(ROOT, s, "problems")
        if not os.path.isdir(pdir):
            continue
        for p in sorted(os.listdir(pdir)):
            en = os.path.join(pdir, p, "en.md")
            if os.path.exists(en) and fix_file(en):
                print("fixed:", os.path.relpath(en, ROOT).replace("\\", "/"))
                n += 1
    print(f"\n{n} files updated")


if __name__ == "__main__":
    main()
