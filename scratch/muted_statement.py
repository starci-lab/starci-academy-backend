"""Convert `## <label>` section headings inside the `# statement` block of every
coding problem into `:::muted` callouts (matching challenge/task body style).

Scope-strict: only lines BETWEEN the statement block's opening and closing
`<!-- @starci/seperator -->`. Never touches `## N` index markers elsewhere
(tags/starterCodes/solutions/example/testcases) or the H1 title. Idempotent.
"""
import os

ROOT = os.path.join(".gitrefs", "data", "coding-problems", "sets")
DELIM = "<!-- @starci/seperator -->"


def transform(path):
    lines = open(path, encoding="utf-8").read().split("\n")
    out = []
    in_stmt = False        # inside the # statement section (after its header)
    stmt_open = False      # inside the delimited body of the statement
    changed = False
    i, n = 0, len(lines)
    while i < n:
        line = lines[i]
        if line.strip() == "# statement":
            in_stmt = True
            out.append(line)
            i += 1
            continue
        if in_stmt and line == DELIM:
            if not stmt_open:
                stmt_open = True          # opening delimiter of statement body
            else:
                stmt_open = False         # closing delimiter -> statement done
                in_stmt = False
            out.append(line)
            i += 1
            continue
        # a new top-level "# field" header ends the statement region defensively
        if in_stmt and not stmt_open and line.startswith("# "):
            in_stmt = False
        if stmt_open and line.startswith("## "):
            label = line[3:].strip()
            out.append(":::muted")
            out.append(label)
            out.append(":::")
            changed = True
            i += 1
            continue
        out.append(line)
        i += 1
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
            for fn in ("en.md", "vi.md"):
                fp = os.path.join(pdir, p, fn)
                if os.path.exists(fp) and transform(fp):
                    n += 1
    print(f"{n} files updated")


if __name__ == "__main__":
    main()
