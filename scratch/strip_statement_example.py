"""Remove the redundant Example block embedded in `# statement`.

Each problem's `# statement` ends with a `:::muted` Example/Ví dụ label + a fenced
code block — duplicating the structured `# example` field (which the FE already
renders separately and uses as a public sample). Strip the in-statement copy.
Scope-strict: only inside the `# statement` delimited block. Idempotent.
"""
import os

ROOT = os.path.join(".gitrefs", "data", "coding-problems", "sets")
DELIM = "<!-- @starci/seperator -->"
LABELS = {"Example", "Ví dụ"}


def strip_file(path):
    lines = open(path, encoding="utf-8").read().split("\n")
    out, i, n, changed = [], 0, len(lines), False
    in_stmt = stmt_open = False
    while i < n:
        line = lines[i]
        if line.strip() == "# statement":
            in_stmt = True
            out.append(line)
            i += 1
            continue
        if in_stmt and line == DELIM:
            stmt_open = not stmt_open
            if not stmt_open:
                in_stmt = False
            out.append(line)
            i += 1
            continue
        # inside statement body: detect the Example muted label
        if (stmt_open and line == ":::muted"
                and i + 2 < n and lines[i + 1].strip() in LABELS
                and lines[i + 2].strip() == ":::"):
            j = i + 3
            while j < n and lines[j].strip() == "":   # blank lines before fence
                j += 1
            if j < n and lines[j].lstrip().startswith("```"):  # fenced example
                j += 1
                while j < n and not lines[j].lstrip().startswith("```"):
                    j += 1
                if j < n:
                    j += 1  # consume closing fence
            while j < n and lines[j].strip() == "":   # trailing blanks
                j += 1
            # drop trailing blanks already emitted, keep one before the delimiter
            while out and out[-1].strip() == "":
                out.pop()
            out.append("")
            i = j
            changed = True
            continue
        out.append(line)
        i += 1
    if changed:
        open(path, "w", encoding="utf-8", newline="\n").write("\n".join(out))
    return changed


def main():
    n = 0
    for s in sorted(os.listdir(ROOT)):
        pd = os.path.join(ROOT, s, "problems")
        if not os.path.isdir(pd):
            continue
        for p in sorted(os.listdir(pd)):
            for fn in ("en.md", "vi.md"):
                fp = os.path.join(pd, p, fn)
                if os.path.exists(fp) and strip_file(fp):
                    n += 1
    print(f"{n} files updated")


if __name__ == "__main__":
    main()
