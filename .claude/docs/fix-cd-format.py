#!/usr/bin/env python3
"""Normalize `cd` lines in lesson body code blocks to the agreed convention:
  - CLONE/setup block (contains `git clone`)  -> `cd <repo>/<lesson>`        (lesson dir, strip /backend/<lang>)
  - RUN/startup block (npm install / nest start / mvn / dotnet / go run)      -> `cd backend/<lang>` (relative)
Lang is derived from the body folder name (bodies/<lang>/{vi,en}.md).
Idempotent. Usage: python3 .claude/docs/fix-cd-format.py <dir> [<dir> ...]
"""
import os, re, sys

# Detect ANY build/install/run command so every such block requires a cd-first (check content meaningfully).
RUN_RE = re.compile(
    r'npm (?:install|ci|run|start)\b|pnpm |yarn |nest start|'
    r'mvn |\./mvnw|gradle|'
    r'dotnet (?:run|watch|restore|build|test)\b|'
    r'go (?:run|build|mod|test)\b'
)
CD_RE  = re.compile(r'^(\s*)cd\s+(\S.*)$')
# "thư mục bài học" Source link must point to the LESSON dir, NOT backend/<lang>.
# Strip /backend/<lang> (and a bare /<lang>) anywhere on lines that reference the lesson folder link.
LANG_SEG = r'(?:0-typescript|1-java|2-csharp|3-go)'
SRCLINK_LINE_RE = re.compile(r'thư mục bài học|tree/main')
SRCLINK_STRIP_RE = re.compile(r'/backend/' + LANG_SEG + r'|/' + LANG_SEG + r'(?=[)`/\s]|$)')

def fix_file(path):
    lang = os.path.basename(os.path.dirname(path))  # e.g. 0-typescript
    if lang not in ('0-typescript', '1-java', '2-csharp', '3-go'):
        return 0
    with open(path, 'r', encoding='utf-8') as fh:
        lines = fh.readlines()

    out, i, n, changed = [], 0, len(lines), 0
    while i < n:
        line = lines[i]
        if line.lstrip().startswith('```'):
            # collect this fenced block
            block = [line]
            j = i + 1
            while j < n and not lines[j].lstrip().startswith('```'):
                block.append(lines[j]); j += 1
            if j < n:
                block.append(lines[j])  # closing fence
            body = ''.join(block)
            is_clone = 'git clone' in body
            is_run = bool(RUN_RE.search(body))
            has_cd = False
            # rewrite existing cd lines inside the block (skip the fence lines at [0] and [-1])
            for k in range(1, len(block) - 1):
                m = CD_RE.match(block[k].rstrip('\n'))
                if not m:
                    continue
                has_cd = True
                indent, target = m.group(1), m.group(2).strip()
                new = None
                if is_clone and not is_run:
                    # strip /backend/<lang>... -> lesson dir only
                    new = re.sub(r'/backend/[^/\s]+.*$', '', target)
                elif is_run:
                    new = 'backend/' + lang
                if new is not None and new != target:
                    block[k] = indent + 'cd ' + new + '\n'
                    changed += 1
            # INSERT cd-first when a RUN block has NO cd at all (e.g. C# dotnet restore / watch run)
            if is_run and not is_clone and not has_cd:
                fence = block[0]
                fi = fence[:len(fence) - len(fence.lstrip())]
                block.insert(1, fi + 'cd backend/' + lang + '\n')
                changed += 1
            out.extend(block)
            i = j + 1
        else:
            # Prose line: fix the "thư mục bài học" Source link -> lesson dir (strip backend/<lang> or /<lang>)
            if SRCLINK_LINE_RE.search(line):
                new_line = SRCLINK_STRIP_RE.sub('', line)
                if new_line != line:
                    line = new_line; changed += 1
            out.append(line); i += 1

    if changed:
        with open(path, 'w', encoding='utf-8') as fh:
            fh.writelines(out)
    return changed

def main(dirs):
    total_files, total_lines = 0, 0
    for base in dirs:
        for root, _, files in os.walk(base):
            if 'node_modules' in root or os.sep + '.git' in root or '/bodies/' not in (root.replace(os.sep, '/') + '/'):
                continue
            for f in files:
                if f.endswith('.md'):
                    c = fix_file(os.path.join(root, f))
                    if c:
                        total_files += 1; total_lines += c
                        print(f'fixed ({c} cd-lines): {os.path.join(root, f)}')
    print(f'---- files changed: {total_files}, cd-lines rewritten: {total_lines} ----')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('usage: python3 fix-cd-format.py <dir> [<dir>...]'); sys.exit(2)
    main(sys.argv[1:])
