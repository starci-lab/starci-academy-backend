import { readFileSync, writeFileSync } from "node:fs"
const C = ".mount/data/courses/0-fullstack-mastery/modules/9-background-jobs-and-workers/contents/2-priorities-retries-dlq/bodies/1-java"
const from = "PQ -->|@Scheduled ZPopMin: smallest score first| W"
const to   = "PQ -->|Scheduled ZPopMin: smallest score first| W"
for (const f of [C + "/en.md", C + "/vi.md"]) {
  let t = readFileSync(f, "utf8")
  if (!t.includes(from)) throw new Error("MISS " + f)
  t = t.split(from).join(to)
  writeFileSync(f, t)
  console.log("patched " + f)
}
