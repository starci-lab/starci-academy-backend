import { readFileSync, writeFileSync } from "node:fs"
const C = ".mount/data/courses/0-fullstack-mastery/modules/6-client-state-zustand-jotai/contents/0-zustand-store-and-selectors"
const edits = [
  ["Store -.action ref ổn định → Object.is bằng → KHÔNG notify.-> Panel",
   "Store -.->|action ref ổn định → Object.is bằng → KHÔNG notify| Panel"],
  ["Panel -->|gọi action → set()| Store", "Panel -->|gọi action → set| Store"],
]
for (const f of [C + "/bodies/0-agnostic/vi.md", C + "/vi.md"]) {
  let t = readFileSync(f, "utf8")
  for (const [from, to] of edits) {
    if (!t.includes(from)) throw new Error("MISS " + f + " :: " + from.slice(0, 40))
    t = t.split(from).join(to)
  }
  writeFileSync(f, t)
  console.log("patched " + f)
}
