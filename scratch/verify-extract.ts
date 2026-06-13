import "reflect-metadata"
import { readFileSync } from "fs"
import { ExtractJsonFromMdService } from "../src/modules/init/seeders/shared/extracts/extract-json-from-md.service"

const svc = new ExtractJsonFromMdService()
const path = String.raw`C:\Repositories\ac\starci-academy-backend\.gitrefs\data\coding-problems\sets\slidingWindow\problems\minimum-window-substring\en.md`
const obj: any = svc.extract(readFileSync(path, "utf8"))

const langs = (a: any[]) => (a || []).map((x) => x.lang).join(",")
console.log("title       :", JSON.stringify(obj.title))
console.log("difficulty  :", JSON.stringify(obj.difficulty))
console.log("domain      :", JSON.stringify(obj.domain))
console.log("orderIndex  :", JSON.stringify(obj.orderIndex))
console.log("timeLimitMs :", JSON.stringify(obj.timeLimitMs))
console.log("tags        :", JSON.stringify((obj.tags || []).map((t: any) => t.value)))
console.log("starterCodes:", (obj.starterCodes || []).length, "langs=", langs(obj.starterCodes))
console.log("solutions   :", (obj.solutions || []).length, "langs=", langs(obj.solutions))
console.log("example     :", (obj.example || []).length, "io0=", JSON.stringify(obj.example?.[0]))
console.log("testcases   :", (obj.testcases || []).length, "io0=", JSON.stringify(obj.testcases?.[0]))
console.log("stmt firstln:", JSON.stringify((obj.statement || "").split("\n")[0]))
console.log("stmt LEAK?  :", /# starterCodes|# solutions|@starci/.test(obj.statement || ""))
console.log("sol0 has algo:", /Counter|need\[/.test(obj.solutions?.[0]?.content || ""))
console.log("starter0 stub:", /TODO/.test(obj.starterCodes?.[0]?.content || ""))
