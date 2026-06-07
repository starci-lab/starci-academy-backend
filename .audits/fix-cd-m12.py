#!/usr/bin/env python3
"""
One-shot corrective cd-path normalizer for m12 file-upload bodies after the
backend/<lang> restructure. The generic fix-cd-format.py is too coarse: it
rewrites EVERY cd inside any block that contains an npm/go/mvn command, which
clobbers the frontend block (`cd frontend` + npm run dev) and the Playwright
block (`cd .playwright` + npx playwright). This script classifies each fenced
code block by its content and the comment lines inside it, then sets the right cd.

Rules (lang derived from bodies/<lang>/ folder name):
  - block contains `git clone`                      -> leave clone cd untouched (lesson dir)
  - block mentions playwright / .playwright          -> cd .playwright
  - block mentions vite / `npm run dev` / frontend   -> cd frontend
  - any other run/test block (npm/go/mvn/dotnet,     -> cd backend/<lang>
    or curl/powershell test against the backend)
Idempotent. Usage: python3 fix-cd-m12.py <bodies-or-contents-dir> [...]
"""
import os, re, sys

LANG_DIRS = ('0-typescript', '1-java', '2-csharp', '3-go')
CD_RE = re.compile(r'^(\s*)cd\s+(\S.*)$')


def classify_block(body_text):
    t = body_text.lower()
    if 'git clone' in t:
        return 'clone'
    if 'playwright' in t:
        return 'playwright'
    if 'npm run dev' in t or 'vite' in t or 'cd frontend' in t \
            or re.search(r'cd \S*/frontend', t):
        return 'frontend'
    return 'backend'


def fix_file(path):
    lang = os.path.basename(os.path.dirname(path))
    if lang not in LANG_DIRS:
        return 0
    with open(path, 'r', encoding='utf-8') as fh:
        lines = fh.readlines()

    out, i, n, changed = [], 0, len(lines), 0
    while i < n:
        line = lines[i]
        if line.lstrip().startswith('```'):
            block = [line]
            j = i + 1
            while j < n and not lines[j].lstrip().startswith('```'):
                block.append(lines[j]); j += 1
            if j < n:
                block.append(lines[j])
            kind = classify_block(''.join(block))
            if kind == 'clone':
                # Clone block must end at the lesson dir, not .../<lesson>/<lang>.
                for k in range(1, len(block) - 1):
                    m = CD_RE.match(block[k].rstrip('\n'))
                    if not m:
                        continue
                    indent, cur = m.group(1), m.group(2).strip()
                    stripped = re.sub(
                        r'/(?:backend/)?(?:0-typescript|1-java|2-csharp|3-go)$',
                        '', cur)
                    if stripped != cur:
                        block[k] = indent + 'cd ' + stripped + '\n'
                        changed += 1
            else:
                target = 'frontend' if kind == 'frontend' else \
                         '.playwright' if kind == 'playwright' else \
                         'backend/' + lang
                for k in range(1, len(block) - 1):
                    m = CD_RE.match(block[k].rstrip('\n'))
                    if not m:
                        continue
                    indent, cur = m.group(1), m.group(2).strip()
                    if cur != target:
                        block[k] = indent + 'cd ' + target + '\n'
                        changed += 1
            out.extend(block)
            i = j + 1
        else:
            out.append(line); i += 1

    if changed:
        with open(path, 'w', encoding='utf-8') as fh:
            fh.writelines(out)
    return changed


def main(dirs):
    tf = tl = 0
    for base in dirs:
        for root, _, files in os.walk(base):
            rp = root.replace(os.sep, '/') + '/'
            if 'node_modules' in rp or '/.git/' in rp or '/bodies/' not in rp:
                continue
            for f in files:
                if f.endswith('.md'):
                    c = fix_file(os.path.join(root, f))
                    if c:
                        tf += 1; tl += c
                        print(f'fixed ({c} cd-lines): {os.path.join(root, f)}')
    print(f'---- files changed: {tf}, cd-lines rewritten: {tl} ----')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('usage: fix-cd-m12.py <dir> [<dir>...]'); sys.exit(2)
    main(sys.argv[1:])
