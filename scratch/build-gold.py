from collections import Counter

def solve(s, t):
    if not t or len(t) > len(s):
        return ""
    need = Counter(t); missing = len(t); left = 0; best = (float('inf'), 0, 0)
    for r, ch in enumerate(s):
        if need[ch] > 0: missing -= 1
        need[ch] -= 1
        while missing == 0:
            if r - left + 1 < best[0]: best = (r - left + 1, left, r + 1)
            need[s[left]] += 1
            if need[s[left]] > 0: missing += 1
            left += 1
    return "" if best[0] == float('inf') else s[best[1]:best[2]]

SEP = "<!-- @starci/seperator -->"
LANGS = ["python", "javascript", "typescript", "java", "cpp"]

starters = {
"python": r'''import sys

def solve(s: str, t: str) -> str:
    # TODO: smallest substring of s covering all of t (with multiplicity), or "".
    return ""

def main():
    lines = sys.stdin.read().split("\n")
    s = lines[0].rstrip() if len(lines) > 0 else ""
    t = lines[1].rstrip() if len(lines) > 1 else ""
    print(solve(s, t))

if __name__ == "__main__":
    main()''',
"javascript": r'''function solve(s, t) {
  // TODO: smallest substring of s covering all of t (with multiplicity), or "".
  return "";
}

const lines = require("fs").readFileSync(0, "utf8").split("\n");
const s = (lines[0] || "").replace(/\s+$/, "");
const t = (lines[1] || "").replace(/\s+$/, "");
console.log(solve(s, t));''',
"typescript": r'''function solve(s: string, t: string): string {
  // TODO: smallest substring of s covering all of t (with multiplicity), or "".
  return "";
}

const lines: string[] = require("fs").readFileSync(0, "utf8").split("\n");
const s: string = (lines[0] || "").replace(/\s+$/, "");
const t: string = (lines[1] || "").replace(/\s+$/, "");
console.log(solve(s, t));''',
"java": r'''import java.util.*;
import java.io.*;

public class Main {
    static String solve(String s, String t) {
        // TODO: smallest substring of s covering all of t (with multiplicity), or "".
        return "";
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine(); if (s == null) s = "";
        String t = br.readLine(); if (t == null) t = "";
        System.out.println(solve(s.replaceAll("\\s+$", ""), t.replaceAll("\\s+$", "")));
    }
}''',
"cpp": r'''#include <bits/stdc++.h>
using namespace std;

string solve(const string& s, const string& t) {
    // TODO: smallest substring of s covering all of t (with multiplicity), or "".
    return "";
}

int main() {
    string s, t;
    getline(cin, s); getline(cin, t);
    auto rstrip = [](string& x){ while(!x.empty() && isspace((unsigned char)x.back())) x.pop_back(); };
    rstrip(s); rstrip(t);
    cout << solve(s, t) << "\n";
    return 0;
}''',
}

solutions = {
"python": r'''from collections import Counter
import sys

def solve(s: str, t: str) -> str:
    if not t or len(t) > len(s):
        return ""
    need = Counter(t)
    missing = len(t)
    left = 0
    best = (float("inf"), 0, 0)
    for right, ch in enumerate(s):
        if need[ch] > 0:
            missing -= 1
        need[ch] -= 1
        while missing == 0:
            if right - left + 1 < best[0]:
                best = (right - left + 1, left, right + 1)
            need[s[left]] += 1
            if need[s[left]] > 0:
                missing += 1
            left += 1
    return "" if best[0] == float("inf") else s[best[1]:best[2]]

lines = sys.stdin.read().split("\n")
print(solve(lines[0].rstrip() if lines else "", lines[1].rstrip() if len(lines) > 1 else ""))''',
"javascript": r'''function solve(s, t) {
  if (!t || t.length > s.length) return "";
  const need = {}; for (const c of t) need[c] = (need[c] || 0) + 1;
  let missing = t.length, left = 0, bl = Infinity, bs = 0, be = 0;
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    if ((need[c] || 0) > 0) missing--;
    need[c] = (need[c] || 0) - 1;
    while (missing === 0) {
      if (r - left + 1 < bl) { bl = r - left + 1; bs = left; be = r + 1; }
      const lc = s[left]; need[lc] = (need[lc] || 0) + 1;
      if (need[lc] > 0) missing++;
      left++;
    }
  }
  return bl === Infinity ? "" : s.slice(bs, be);
}
const L = require("fs").readFileSync(0, "utf8").split("\n");
console.log(solve((L[0] || "").replace(/\s+$/, ""), (L[1] || "").replace(/\s+$/, "")));''',
"typescript": r'''function solve(s: string, t: string): string {
  if (!t || t.length > s.length) return "";
  const need: Record<string, number> = {};
  for (const c of t) need[c] = (need[c] || 0) + 1;
  let missing = t.length, left = 0, bl = Infinity, bs = 0, be = 0;
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    if ((need[c] || 0) > 0) missing--;
    need[c] = (need[c] || 0) - 1;
    while (missing === 0) {
      if (r - left + 1 < bl) { bl = r - left + 1; bs = left; be = r + 1; }
      const lc = s[left]; need[lc] = (need[lc] || 0) + 1;
      if (need[lc] > 0) missing++;
      left++;
    }
  }
  return bl === Infinity ? "" : s.slice(bs, be);
}
const L: string[] = require("fs").readFileSync(0, "utf8").split("\n");
console.log(solve((L[0] || "").replace(/\s+$/, ""), (L[1] || "").replace(/\s+$/, "")));''',
"java": r'''import java.util.*;
import java.io.*;

public class Main {
    static String solve(String s, String t) {
        if (t.isEmpty() || t.length() > s.length()) return "";
        int[] need = new int[128];
        for (char c : t.toCharArray()) need[c]++;
        int missing = t.length(), left = 0, bl = Integer.MAX_VALUE, bs = 0;
        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);
            if (need[c] > 0) missing--;
            need[c]--;
            while (missing == 0) {
                if (r - left + 1 < bl) { bl = r - left + 1; bs = left; }
                char lc = s.charAt(left); need[lc]++;
                if (need[lc] > 0) missing++;
                left++;
            }
        }
        return bl == Integer.MAX_VALUE ? "" : s.substring(bs, bs + bl);
    }
    public static void main(String[] a) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String s = br.readLine(); if (s == null) s = "";
        String t = br.readLine(); if (t == null) t = "";
        System.out.println(solve(s.replaceAll("\\s+$", ""), t.replaceAll("\\s+$", "")));
    }
}''',
"cpp": r'''#include <bits/stdc++.h>
using namespace std;

string solve(const string& s, const string& t) {
    if (t.empty() || t.size() > s.size()) return "";
    vector<int> need(128, 0);
    for (char c : t) need[(unsigned char)c]++;
    int missing = t.size(), left = 0, bl = INT_MAX, bs = 0;
    for (int r = 0; r < (int)s.size(); r++) {
        unsigned char c = s[r];
        if (need[c] > 0) missing--;
        need[c]--;
        while (missing == 0) {
            if (r - left + 1 < bl) { bl = r - left + 1; bs = left; }
            unsigned char lc = s[left]; need[lc]++;
            if (need[lc] > 0) missing++;
            left++;
        }
    }
    return bl == INT_MAX ? "" : s.substr(bs, bl);
}
int main() {
    string s, t; getline(cin, s); getline(cin, t);
    auto rs = [](string& x){ while(!x.empty() && isspace((unsigned char)x.back())) x.pop_back(); };
    rs(s); rs(t);
    cout << solve(s, t) << "\n";
    return 0;
}''',
}

statement = '''# Minimum Window Substring

Given two strings `s` and `t`, return the **shortest contiguous substring** of `s`
that contains every character of `t`, counting multiplicity (if `t` has two `A`s,
the window must contain at least two `A`s). If no such window exists, return the
empty string. The answer is guaranteed to be **unique** when it exists.

## Input

Two lines: line 1 = `s`, line 2 = `t`. Both are upper/lower-case English letters.
`1 <= |s|, |t| <= 10^5`.

## Output

A single line: the minimum window substring of `s`, or an empty line if none.

## Example

```
Input:
ADOBECODEBANC
ABC

Output:
BANC
```'''

example = [("ADOBECODEBANC", "ABC")]
hidden = [("a", "a"), ("a", "aa"), ("ab", "b"), ("cabwefgewcwaefgcf", "cae"),
          ("aa", "aa"), ("bba", "ab"), ("abcdef", "fa"), ("ADOBECODEBANC", "AABC"),
          ("xyz", "xyz")]

def lang_block(name, codemap):
    out = ["# " + name]
    for i, l in enumerate(LANGS):
        out += ["## " + str(i), "### lang", l, "### content", SEP, codemap[l], SEP]
    return "\n".join(out)

def io_block(name, cases):
    out = ["# " + name]
    for i, (s, t) in enumerate(cases):
        out += ["## " + str(i), "### input", SEP, s + "\n" + t, SEP, "### output", SEP, solve(s, t), SEP]
    return "\n".join(out)

doc = "\n".join([
    "# title", "Minimum Window Substring",
    "# difficulty", "hard",
    "# domain", "slidingWindow",
    "# orderIndex", "0",
    "# tags", "## 0", "slidingWindow", "## 1", "string", "## 2", "hashing", "## 3", "twoPointers",
    "# timeLimitMs", "3000",
    "# memoryLimitKb", "262144",
    "# statement", SEP, statement, SEP,
    lang_block("starterCodes", starters),
    lang_block("solutions", solutions),
    io_block("example", example),
    io_block("testcases", hidden),
]) + "\n"

path = r"C:\Repositories\ac\starci-academy-backend\.gitrefs\data\coding-problems\sets\slidingWindow\problems\minimum-window-substring\en.md"
open(path, "w", encoding="utf-8", newline="\n").write(doc)
print("wrote en.md:", len(doc), "chars")
print("example out:", repr(solve(*example[0])))
print("hidden outs:", [solve(s, t) for s, t in hidden])
