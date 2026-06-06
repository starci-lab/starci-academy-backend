#!/usr/bin/env python3
"""
v2-gate.py — CHEAP deterministic gate for V2 content (run in-pass, NOT LLM re-review).
Usage: python3 docs/v2-gate.py <contents-dir> [<contents-dir> ...]
Checks (all near-free grep/parse):
  1. VN comment in en.md code fences           (§4.6 ruling: en.md code = English-only)
  2. cross-lang HTTP status parity PER FLOW     (§4.4: same status per 2.1.5.N flow across langs)
  3. submission # score == 100                  (§9.6)
  4. agnostic lesson root: no "4 language tabs"  (single-track infra)
  5. structural: separator parity even, no `### N.` step-heading, no bare code fence, EN<->VI sep mirror
  6. red-flag forced-lang phrase (info only)     (§2 applicability)
Exit code = number of BLOCKING issues (0 = pass).
"""
import os, re, glob, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

SEP = "<!-- @starci/seperator -->"
FENCE = re.compile(r'^(```+)([^\s`]*)\s*$')
VIET = re.compile(r'[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]', re.I)
REDFLAG = re.compile(r'mô phỏng|giả lập|phải register thủ công|không có decorator')

COMMENT = re.compile(r'^\s*(//|#|\*|/\*|<!--|--\s)')  # comment-start markers (multi-lang)
def fenced_vn(t):
    """Count VI ONLY in code COMMENTS (not in string-literal DATA — §4.6: don't translate JSON/data)."""
    ins = False; n = 0
    for l in t.split("\n"):
        if FENCE.match(l): ins = not ins; continue
        if not ins or not VIET.search(l): continue
        # comment line, OR trailing ` // ...VI...` after code
        if COMMENT.match(l) or re.search(r'(//|#)[^"\']*[àáảãạ-ỹđÀ-Ỹ]', l, re.I):
            n += 1
    return n

def bare_fences(t):
    ins = False; b = 0
    for l in t.split("\n"):
        m = FENCE.match(l)
        if m:
            if not ins:
                ins = True
                if not m.group(2): b += 1
            else: ins = False
    return b

def status_per_flow(t):
    """status code per 2.1.5.N flow heading, ordered."""
    flows = []
    cur = None
    for l in t.split("\n"):
        if re.match(r'^#{4,6}\s*2\.1\.5\.\d', l):
            cur = None; flows.append(None); idx = len(flows) - 1
        m = re.search(r'HTTP (\d{3})', l)
        if m and flows and flows[-1] is None:
            flows[-1] = m.group(1)
    return tuple(f for f in flows if f)

def main(dirs):
    block = 0
    for base in dirs:
        modtag = base.split('/modules/')[1].split('/')[0] if '/modules/' in base else base
        for lesson in sorted(glob.glob(base + "/*")):
            if not os.path.isdir(lesson): continue
            ln = modtag + "/" + os.path.basename(lesson)
            bodies = sorted(glob.glob(lesson + "/bodies/*"))
            agnostic = any("0-agnostic" in b for b in bodies)
            flowmap = {}
            for b in bodies:
                vi, en = b + "/vi.md", b + "/en.md"
                bn = os.path.basename(b)
                if os.path.exists(vi):
                    tv = open(vi, encoding="utf-8").read()
                    flowmap[bn] = status_per_flow(tv)
                    if tv.count(SEP) % 2: print(f"!! {ln} {bn}/vi.md sep-odd"); block += 1
                    if sum(1 for l in tv.split("\n") if re.match(r'^### [123]\. ', l)): print(f"!! {ln} {bn}/vi.md badStepH3"); block += 1
                    if bare_fences(tv): print(f"!! {ln} {bn}/vi.md bareFence"); block += 1
                    if REDFLAG.search(tv): print(f"~  {ln} {bn}/vi.md red-flag forced-lang (info)")
                if os.path.exists(en):
                    te = open(en, encoding="utf-8").read()
                    n = fenced_vn(te)
                    if n: print(f"!! {ln} {bn}/en.md VN-in-code:{n}"); block += 1
                    if os.path.exists(vi) and te.count(SEP) != tv.count(SEP): print(f"!! {ln} {bn} sep-mirror vi={tv.count(SEP)} en={te.count(SEP)}"); block += 1
            if not agnostic and len(flowmap) > 1:
                vals = list(flowmap.values())
                mn = min(len(v) for v in vals)
                # value-conflict = same flow index, different status across langs (BLOCK)
                conflict = any(len({v[i] for v in vals}) > 1 for i in range(mn))
                if conflict:
                    print(f"!! {ln} HTTP-status VALUE conflict (same flow ≠ status): {flowmap}"); block += 1
                elif len({len(v) for v in vals}) > 1:
                    print(f"~  {ln} HTTP-status flow-COUNT differs (shared flows agree; info): {flowmap}")
            # repo URL consistency: all langs in a lesson must reference the SAME StarCi repo
            repos = set()
            for b in bodies:
                for loc in ("vi.md", "en.md"):
                    p = b + "/" + loc
                    if os.path.exists(p):
                        repos |= set(re.findall(r'(?:fullstack|system-design)-mastery-module-\d+-[a-z0-9-]+?(?=\.git|/|\)|`|\s|$)', open(p, encoding="utf-8").read()))
            repos = {r for r in repos if not r.endswith("-")}
            if len(repos) > 1:
                print(f"!! {ln} MULTIPLE StarCi repos referenced (should be 1): {sorted(repos)}"); block += 1
            for sub in glob.glob(lesson + "/challenges/*/submissions/0/en.md"):
                m = re.search(r'# score\s*\n' + re.escape(SEP) + r'\s*\n(\d+)', open(sub, encoding="utf-8").read())
                if m and m.group(1) != "100": print(f"!! {ln} submission score={m.group(1)}!=100"); block += 1
        if "kubernetes" in base or "agnostic" in base:
            for f in glob.glob(base + "/*/vi.md") + glob.glob(base + "/*/en.md"):
                if re.search(r'tab.{0,12}ngôn ngữ|tabs below|TypeScript, Java, C#, Go', open(f, encoding="utf-8").read()):
                    print(f"!! {modtag} agnostic-root 4-lang-tab: {os.path.basename(os.path.dirname(f))}"); block += 1
    print(f"\nBLOCKING={block} (0=pass; '~'=info)")
    return block

if __name__ == "__main__":
    sys.exit(min(main(sys.argv[1:] or ["."]), 250))
