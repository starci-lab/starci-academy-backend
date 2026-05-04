"""
Normalize markdown lesson tests:
  (1) Indent lines under - Bước / - Step with +2 spaces when missing (list-safe).
  (2) Inside ```json fences under list indent, bump root keys `  "k":` -> `    "k":`.

Run from repo root: python scripts/normalize_lesson_test_step_indent.py
Optional argv: space-separated roots relative to .mount/data/courses (default: fullstack + scoped SD).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / ".mount" / "data" / "courses"

DEFAULT_ROOTS = [
    BASE / "0-fullstack-mastery",
    BASE / "1-system-design-mastery" / "modules" / "0-fundamentals-of-system-design",
    BASE
    / "1-system-design-mastery"
    / "modules"
    / "1-microservices-kubernetes-fundamentals"
    / "contents"
    / "0-monolith-vs-microservices",
    BASE
    / "1-system-design-mastery"
    / "modules"
    / "1-microservices-kubernetes-fundamentals"
    / "contents"
    / "1-introduction-to-kubernetes",
]

STEP_START = re.compile(r"^(- Bước \d+:.*|- Step \d+:.*)$")
ROOT_JSON_KEY = re.compile(r'^  ("(?:[^"\\]|\\.)*":)')


def ends_step_body(line: str) -> bool:
    if STEP_START.match(line):
        return True
    if line.startswith("#### "):
        return True
    if line.startswith("*Kết luận") or line.startswith("*Conclusion"):
        return True
    return False


def indent_step_content(text: str) -> str:
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    i = 0
    n = len(lines)
    while i < n:
        raw = lines[i]
        line_no_nl = raw.rstrip("\r\n")
        nl = raw[len(line_no_nl) :]
        out.append(raw)
        if STEP_START.match(line_no_nl):
            i += 1
            while i < n:
                L = lines[i]
                L_core = L.rstrip("\r\n")
                L_nl = L[len(L_core) :]
                if L_core.strip() == "":
                    out.append("  " + L_nl if L_nl else "  \n")
                    i += 1
                    continue
                if ends_step_body(L_core):
                    break
                if len(L_core) >= 2 and L_core[0:2] == "  ":
                    out.append(L)
                else:
                    out.append("  " + L_core + L_nl)
                i += 1
            continue
        i += 1
    return "".join(out)


def fix_json_root_keys_in_list_fences(text: str) -> str:
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.lstrip()
        prefix_len = len(line) - len(line.lstrip(" "))
        if stripped.startswith("```json") and prefix_len >= 2:
            out.append(line)
            i += 1
            while i < n:
                inner = lines[i]
                istripped = inner.lstrip()
                if istripped.startswith("```") and not istripped.startswith("```json"):
                    out.append(inner)
                    i += 1
                    break
                core = inner.rstrip("\r\n")
                nl = inner[len(core) :]
                if ROOT_JSON_KEY.match(core):
                    out.append("  " + core + nl)
                else:
                    out.append(inner)
                i += 1
            continue
        out.append(line)
        i += 1
    return "".join(out)


def normalize_file(text: str) -> str:
    return fix_json_root_keys_in_list_fences(indent_step_content(text))


def collect_roots(argv: list[str]) -> list[Path]:
    if argv:
        return [(BASE / a).resolve() for a in argv]
    return DEFAULT_ROOTS


def main() -> int:
    roots = collect_roots(sys.argv[1:])
    changed: list[Path] = []
    for root in roots:
        if not root.exists():
            print("MISSING", root, file=sys.stderr)
            continue
        for path in sorted(root.rglob("*.md")):
            if path.name not in ("vi.md", "en.md"):
                continue
            if "/challenges/" in path.as_posix():
                continue
            old = path.read_text(encoding="utf-8")
            new = normalize_file(old)
            if new != old:
                path.write_text(new, encoding="utf-8", newline="\n")
                changed.append(path)

    print(f"Normalized {len(changed)} files")
    for p in changed:
        print(p.relative_to(BASE.parent.parent))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
