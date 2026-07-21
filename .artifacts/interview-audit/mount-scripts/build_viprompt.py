"""Sanitize mount-translate-vi output -> _viprompt.json (idx -> plain Vietnamese prompt).

Cleans two model artifacts seen in the run:
  1. hallucinated closing tags (</viPrompt>, </invoke>), sometimes HTML-escaped;
  2. the whole answer wrapped as a JSON string ({"viPrompt": "..."} / {"prompt": "..."}),
     including malformed/truncated JSON -> regex fallback.
Also strips ** so the prompt stays PLAIN TEXT (thay chot: khong bold).
"""
import json
import re
import html
import sys

OUT = sys.argv[1]
DEST = sys.argv[2]

res = json.load(open(OUT, encoding="utf-8"))["result"]


def clean(s: str) -> str:
    s = html.unescape(s)
    s = re.sub(r"</?(viPrompt|invoke|parameter)[^>]*>", "", s).strip()
    if s.lstrip().startswith("{"):
        done = False
        try:
            o = json.loads(s)
            if isinstance(o, dict):
                for k in ("viPrompt", "prompt"):
                    if isinstance(o.get(k), str):
                        s = o[k]
                        done = True
                        break
        except Exception:
            pass
        if not done:
            m = re.search(r'"(?:viPrompt|prompt)"\s*:\s*"(.*?)"?\s*\}?\s*$', s, re.S)
            if m:
                s = m.group(1)
                s = s.replace('\\"', '"')
                s = s.replace("\\n", "\n")
                s = s.replace("\\\\", "\\")
    s = s.replace("**", "").strip()
    return s


vip = {str(r["idx"]): clean(r["viPrompt"]) for r in res}

VN = set("ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỹ")
bad = []
for i, v in vip.items():
    if v.lstrip().startswith("{") or re.search(r"</\w+>", v):
        bad.append((i, "wrapper/tag", v[:60]))
    elif len(v) < 40:
        bad.append((i, "short", len(v)))
    elif sum(1 for c in v.lower() if c in VN) < 5:
        bad.append((i, "not-vietnamese", v[:60]))

print("total:", len(vip), "| problems:", len(bad))
for b in bad[:12]:
    print("  ", b)
print("with bold **:", sum(1 for v in vip.values() if "**" in v))

json.dump(vip, open(DEST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("wrote:", DEST)
print("\n--- sample idx 15 ---")
print(vip.get("15", "")[:240])
