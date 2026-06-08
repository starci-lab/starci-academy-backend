import { readFileSync } from "node:fs"
const r = JSON.parse(readFileSync("scratch/mermaid-report.json", "utf8"))
for (const f of r.fails) {
  console.log(f.file.replaceAll("\\", "/") + "  @" + f.line + "  [" + f.error.split("\n")[0].slice(0, 42) + "]")
}
