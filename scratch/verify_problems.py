"""Independent verifier for authored coding problems.

Parses each problem en.md, extracts the python + javascript reference solutions
and all cases (example + testcases), runs them, and compares stdout to expected.
"""
import os
import subprocess
import sys
import tempfile

DELIM = "<!-- @starci/seperator -->"
ROOT = os.path.join(".gitrefs", "data", "coding-problems", "sets")


def parse(path):
    lines = open(path, encoding="utf-8").read().split("\n")
    section = idx = sub = None
    sol = {}        # idx -> {lang, content}
    example = {}    # idx -> {input, output}
    testcases = {}  # idx -> {input, output}
    i, n = 0, len(lines)
    while i < n:
        line = lines[i]
        if line.startswith("# "):
            section, idx, sub = line[2:].strip(), None, None
        elif line.startswith("## "):
            idx, sub = line[3:].strip(), None
        elif line.startswith("### "):
            sub = line[4:].strip()
            if sub == "lang" and section == "solutions":
                val = lines[i + 1].strip() if i + 1 < n else ""
                sol.setdefault(idx, {})["lang"] = val
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
    return sol, example, testcases


def code_for(sol, lang):
    for v in sol.values():
        if v.get("lang") == lang:
            return v.get("content", "")
    return None


def run(cmd, code, stdin, suffix):
    with tempfile.NamedTemporaryFile("w", suffix=suffix, delete=False, encoding="utf-8") as f:
        f.write(code)
        tmp = f.name
    try:
        # Send raw LF bytes (no Windows CRLF translation) to mimic Judge0/Linux stdin.
        p = subprocess.run(cmd + [tmp], input=stdin.encode("utf-8"),
                           capture_output=True, timeout=20)
        return (p.stdout.decode("utf-8", "replace"),
                p.stderr.decode("utf-8", "replace"))
    finally:
        os.unlink(tmp)


def run_java(code, stdin):
    d = tempfile.mkdtemp()
    src = os.path.join(d, "Main.java")
    open(src, "w", encoding="utf-8").write(code)
    c = subprocess.run(["javac", src], capture_output=True, text=True, timeout=60)
    if c.returncode != 0:
        return "", "COMPILE:" + c.stderr.strip().split("\n")[0][:120]
    p = subprocess.run(["java", "-cp", d, "Main"], input=stdin.encode("utf-8"),
                       capture_output=True, timeout=20)
    return p.stdout.decode("utf-8", "replace"), p.stderr.decode("utf-8", "replace")


def cases(example, testcases):
    out = []
    for d in (example, testcases):
        for k in sorted(d.keys(), key=lambda x: int(x)):
            out.append((d[k].get("input", ""), d[k].get("output", "")))
    return out


def norm(s):
    return "\n".join(ln.rstrip() for ln in s.rstrip("\n").split("\n")).rstrip()


def verify(problem_dir):
    en = os.path.join(problem_dir, "en.md")
    sol, example, testcases = parse(en)
    allc = cases(example, testcases)
    results = {}
    for lang, cmd, suffix in (("python", [sys.executable], ".py"),
                              ("javascript", ["node"], ".js"),
                              ("java", None, None)):
        code = code_for(sol, lang)
        if not code:
            results[lang] = ("NO_CODE", [])
            continue
        fails = []
        for n_, (inp, exp) in enumerate(allc):
            stdin = inp if inp.endswith("\n") or inp == "" else inp + "\n"
            if lang == "java":
                stdout, stderr = run_java(code, stdin)
            else:
                stdout, stderr = run(cmd, code, stdin, suffix)
            if stderr.strip():
                fails.append((n_, repr(inp), "ERR:" + stderr.strip().split(chr(10))[-1][:80]))
            elif norm(stdout) != norm(exp):
                fails.append((n_, repr(inp)[:40], f"got={norm(stdout)!r} exp={norm(exp)!r}"))
        results[lang] = ("OK" if not fails else "FAIL", fails)
    return len(allc), results


def main():
    problems = []
    for s in sorted(os.listdir(ROOT)):
        pdir = os.path.join(ROOT, s, "problems")
        if not os.path.isdir(pdir):
            continue
        for p in sorted(os.listdir(pdir)):
            problems.append(os.path.join(pdir, p))
    overall_ok = True
    for pd in problems:
        ncases, res = verify(pd)
        name = os.path.relpath(pd, ROOT)
        line = f"{name}  ({ncases} cases): "
        parts = []
        for lang in ("python", "javascript", "java"):
            status, fails = res[lang]
            parts.append(f"{lang}={status}")
            if status not in ("OK", "NO_CODE"):
                overall_ok = False
        print(line + "  ".join(parts))
        for lang in ("python", "javascript", "java"):
            status, fails = res[lang]
            for f in fails:
                print(f"    [{lang}] case#{f[0]} in={f[1]} {f[2]}")
    print("\nRESULT:", "ALL PASS" if overall_ok else "FAILURES FOUND")


if __name__ == "__main__":
    main()
