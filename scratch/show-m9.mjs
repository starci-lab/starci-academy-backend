import { readFileSync } from "node:fs"
const C = ".mount/data/courses/0-fullstack-mastery/modules/9-background-jobs-and-workers/contents/2-priorities-retries-dlq/bodies/1-java"
for (const f of [C + "/en.md", C + "/vi.md"]) {
  const t = readFileSync(f, "utf8")
  const lines = t.split(/\r?\n/).filter(l => l.includes("@Scheduled") || l.includes("Scheduled ZPopMin"))
  console.log(f + "\n  " + JSON.stringify(lines))
}
