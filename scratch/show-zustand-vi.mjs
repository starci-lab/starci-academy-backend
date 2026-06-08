import { readFileSync } from "node:fs"
const C = ".mount/data/courses/0-fullstack-mastery/modules/6-client-state-zustand-jotai/contents/0-zustand-store-and-selectors"
for (const f of [C + "/bodies/0-agnostic/vi.md", C + "/vi.md"]) {
  const t = readFileSync(f, "utf8")
  const m = t.match(/```mermaid[\s\S]*?```/)
  console.log("\n##### " + f)
  console.log(m ? m[0] : "NO BLOCK")
}
