import "reflect-metadata"
import { readFileSync } from "fs"
import { join } from "path"
import { ExtractJsonFromMdService } from "../src/modules/init/seeders/shared/extracts/extract-json-from-md.service"

const svc = new ExtractJsonFromMdService()
const p = join(
    process.cwd(),
    ".contexts", "coding-problems", "sets", "slidingWindow", "problems",
    "minimum-window-substring", "en.md",
)
const o: any = svc.extract(readFileSync(p, "utf8"))
console.log("title       :", JSON.stringify(o.title))
console.log("difficulty  :", o.difficulty)
console.log("starterCodes:", (o.starterCodes || []).length)
console.log("solutions   :", (o.solutions || []).length)
console.log("example     :", (o.example || []).length)
console.log("testcases   :", (o.testcases || []).length)
console.log("SEEDABLE (title present):", Boolean(o.title))
