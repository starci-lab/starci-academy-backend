"""Audit every coding problem against the real Judge0 (VPS), all 5 languages,
and record per-language proof into each problem's `.e2e/<lang>/` folder.

For each problem under coding-problems/sets, extract every reference solution and
every case (example + testcases), submit batches to Judge0, require status
Accepted (id=3) for every case in every language, and write an `.e2e` proof file.
"""
import base64
import datetime
import json
import os
import time
import urllib.request

BASE = "https://judge0.academy.starci.org"
ROOT = os.path.join(".gitrefs", "data", "coding-problems", "sets")
TOKEN = open(os.path.join(".mount", "terraform", "judge0-auth-token.key"),
             encoding="utf-8").read().strip()
LANG_IDS = {"python": 71, "javascript": 63, "typescript": 74, "java": 62, "cpp": 54}
DELIM = "<!-- @starci/seperator -->"
TODAY = datetime.date.today().isoformat()


def b64(s):
    return base64.b64encode(s.encode("utf-8")).decode("ascii")


def unb64(s):
    return base64.b64decode(s).decode("utf-8", "replace") if s else ""


def api(path, method="GET", body=None, _retries=20):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    for attempt in range(_retries):
        req = urllib.request.Request(BASE + path, data=data, method=method)
        req.add_header("X-Auth-Token", TOKEN)
        if data:
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (503, 502, 429) and attempt < _retries - 1:
                wait = min(10 * (attempt + 1), 60)
                print(f"  [retry {attempt+1}/{_retries}] HTTP {e.code} - queue busy, waiting {wait}s...",
                      flush=True)
                time.sleep(wait)
                continue
            raise


def parse(path):
    lines = open(path, encoding="utf-8").read().split("\n")
    section = idx = sub = None
    sol, example, testcases, scalars = {}, {}, {}, {}
    i, n = 0, len(lines)
    while i < n:
        line = lines[i]
        if line.startswith("# "):
            section, idx, sub = line[2:].strip(), None, None
            if section in ("timeLimitMs", "memoryLimitKb", "title", "difficulty",
                           "domain") and i + 1 < n:
                scalars[section] = lines[i + 1].strip()
        elif line.startswith("## "):
            idx, sub = line[3:].strip(), None
        elif line.startswith("### "):
            sub = line[4:].strip()
            if sub == "lang" and section == "solutions":
                sol.setdefault(idx, {})["lang"] = lines[i + 1].strip() if i + 1 < n else ""
                i += 2
                continue
        elif line == DELIM:
            j = i + 1
            buf = []
            while j < n and lines[j] != DELIM:
                buf.append(lines[j])
                j += 1
            content = "\n".join(buf)
            if section == "solutions" and sub == "content":
                sol.setdefault(idx, {})["content"] = content
            elif section == "example":
                example.setdefault(idx, {})[sub] = content
            elif section == "testcases":
                testcases.setdefault(idx, {})[sub] = content
            i = j
        i += 1
    return sol, example, testcases, scalars


def code_for(sol, lang):
    for v in sol.values():
        if v.get("lang") == lang:
            return v.get("content", "")
    return None


def ordered_cases(d):
    return [d[k] for k in sorted(d.keys(), key=lambda x: int(x))]


BATCH_CHUNK = 5  # max submissions per batch call the VPS allows


def judge(lang_id, code, allc, cpu_s, mem_kb):
    subs = [{
        "language_id": lang_id,
        "source_code": b64(code),
        "stdin": b64(inp),
        "expected_output": b64(exp),
        "cpu_time_limit": cpu_s,
        "memory_limit": mem_kb,
    } for inp, exp in allc]
    # Submit in chunks to stay within the VPS batch limit.
    tokens = []
    for i in range(0, len(subs), BATCH_CHUNK):
        chunk = subs[i:i + BATCH_CHUNK]
        chunk_tokens = [x["token"] for x in api(
            "/submissions/batch?base64_encoded=true", "POST", {"submissions": chunk})]
        tokens.extend(chunk_tokens)
        if i + BATCH_CHUNK < len(subs):
            time.sleep(1)  # brief pause between chunks
    qs = ",".join(tokens)
    for _ in range(120):
        res = api(f"/submissions/batch?base64_encoded=true&tokens={qs}"
                  "&fields=token,status,time,memory,compile_output,stderr")["submissions"]
        if all(s["status"]["id"] > 2 for s in res):
            return res
        time.sleep(1.5)
    return res


def write_e2e(pdir, lang, lang_id, meta, n_example, res, allc):
    e2e_dir = os.path.join(pdir, ".e2e", lang)
    os.makedirs(e2e_dir, exist_ok=True)
    accepted = all(r["status"]["id"] == 3 for r in res)
    status_slug = "accepted" if accepted else "failed"
    rows = []
    max_t = max((float(r.get("time") or 0) for r in res), default=0)
    max_m = max((int(r.get("memory") or 0) for r in res), default=0)
    for i, r in enumerate(res):
        kind = "example" if i < n_example else "hidden"
        rows.append(f"| {i} | {kind} | {r['status']['description']} | "
                    f"{r.get('time') or '-'} | {r.get('memory') or '-'} |")
    body = f"""# Judge0 audit — {meta['title']} · {lang}

- Problem: `{meta['domain']}/{meta['slug']}` ({meta['difficulty']})
- Language: **{lang}** (Judge0 language_id {lang_id})
- Endpoint: {BASE}
- Date: {TODAY}
- Limits: cpu {meta['cpu_s']}s · memory {meta['mem_kb']} KB
- Verdict: **{'ACCEPTED' if accepted else 'FAILED'}** \
({sum(1 for r in res if r['status']['id'] == 3)}/{len(res)} cases)
- Max time: {max_t}s · Max memory: {max_m} KB

| case | type | status | time(s) | mem(KB) |
|------|------|--------|---------|---------|
{chr(10).join(rows)}

> Generated by `scratch/judge0_audit.py` — real Judge0 submission of the reference
> solution (`# solutions` block) for `{lang}` against example + hidden testcases.
"""
    with open(os.path.join(e2e_dir, f"judge0-{status_slug}.md"), "w",
              encoding="utf-8", newline="\n") as f:
        f.write(body)
    return accepted


def main():
    import sys
    filters = sys.argv[1:]  # optional substring filters (slug/domain); empty = all
    problems = []
    for s in sorted(os.listdir(ROOT)):
        pdir = os.path.join(ROOT, s, "problems")
        if os.path.isdir(pdir):
            for p in sorted(os.listdir(pdir)):
                rel = f"{s}/{p}"
                if filters and not any(f in rel for f in filters):
                    continue
                problems.append(os.path.join(pdir, p))

    overall = True
    for pd in problems:
        sol, example, testcases, scalars = parse(os.path.join(pd, "en.md"))
        ex = ordered_cases(example)
        tc = ordered_cases(testcases)
        allc = [(c.get("input", ""), c.get("output", "")) for c in ex + tc]
        n_example = len(ex)
        cpu_s = max(1, round(int(scalars.get("timeLimitMs", "2000")) / 1000))
        mem_kb = int(scalars.get("memoryLimitKb", "262144"))
        meta = {
            "title": scalars.get("title", ""),
            "domain": scalars.get("domain", ""),
            "difficulty": scalars.get("difficulty", ""),
            "slug": os.path.basename(pd),
            "cpu_s": cpu_s,
            "mem_kb": mem_kb,
        }
        name = os.path.relpath(pd, ROOT).replace("\\", "/")
        parts = []
        for lang, lid in LANG_IDS.items():
            code = code_for(sol, lang)
            if not code:
                parts.append(f"{lang}=NO_CODE")
                continue
            res = judge(lid, code, allc, cpu_s, mem_kb)
            ok = write_e2e(pd, lang, lid, meta, n_example, res, allc)
            if not ok:
                overall = False
                bad = next(i for i, r in enumerate(res) if r["status"]["id"] != 3)
                co = unb64(res[bad].get("compile_output")) or unb64(res[bad].get("stderr"))
                parts.append(f"{lang}=FAIL(#{bad}:{res[bad]['status']['description']}"
                             f" {co.strip()[:60]})")
            else:
                parts.append(f"{lang}=AC")
        print(f"{name} ({len(allc)} cases): " + "  ".join(parts))
    print("\nJUDGE0 RESULT:", "ALL ACCEPTED" if overall else "FAILURES FOUND")
    print("E2E proofs written under each problem's .e2e/<lang>/")


if __name__ == "__main__":
    main()
