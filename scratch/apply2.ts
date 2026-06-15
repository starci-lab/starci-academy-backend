import { ExtractJsonFromMdService } from "../src/modules/init/seeders/shared/extracts/extract-json-from-md.service"
import * as fs from "fs"
import * as path from "path"
const SEP = "<!-- @starci/seperator -->"
const svc = new ExtractJsonFromMdService()
const MAP: Array<[string,string]> = [
  ["scratch/sd-outcomes", ".contexts/courses/1-system-design-mastery/modules"],
  ["scratch/devops-outcomes", ".contexts/courses/2-devops-mastery/modules"],
]
function block(d: string, b: string[]): string {
  let s = `# difficulty\n${SEP}\n${d}\n${SEP}\n# outcomes\n`
  b.forEach((x,i)=>{ s += `## ${i}\n### text\n${SEP}\n${x}\n${SEP}\n` })
  return s
}
let applied=0, skipped=0, missing=0
for (const [stage, modbase] of MAP) {
  for (const mod of fs.readdirSync(stage)) {
    const md = path.join(stage, mod); if(!fs.statSync(md).isDirectory()) continue
    for (const f of fs.readdirSync(md)) {
      if(!f.endsWith(".json")) continue
      const lesson = f.replace(/\.json$/,"")
      const j = JSON.parse(fs.readFileSync(path.join(md,f),"utf8"))
      for (const [loc,bul] of [["vi",j.vi],["en",j.en]] as Array<[string,string[]]>) {
        const file = path.join(modbase, mod, "contents", lesson, `${loc}.md`)
        if(!fs.existsSync(file)){missing++;console.log("MISSING",file);continue}
        let c = fs.readFileSync(file,"utf8")
        if(c.includes("# outcomes")){skipped++;continue}
        if(!c.endsWith("\n")) c+="\n"
        fs.writeFileSync(file, c+block(j.difficulty,bul)); applied++
      }
    }
  }
}
console.log(`APPLY applied=${applied} skipped=${skipped} missing=${missing}`)
// verify
let ok=0, fail=0; const dist:Record<string,number>={}
for (const [stage, modbase] of MAP) {
  for (const mod of fs.readdirSync(stage)) {
    const md = path.join(stage, mod); if(!fs.statSync(md).isDirectory()) continue
    for (const f of fs.readdirSync(md)) {
      if(!f.endsWith(".json")) continue
      const lesson = f.replace(/\.json$/,"")
      for (const loc of ["vi","en"]) {
        const file = path.join(modbase, mod, "contents", lesson, `${loc}.md`)
        const json:any = svc.extract(fs.readFileSync(file,"utf8"))
        const n = Array.isArray(json.outcomes)?json.outcomes.length:-1
        const good = ["beginner","intermediate","advanced"].includes(json.difficulty)&&n===5
        if(good){ok++; if(loc==="en")dist[json.difficulty]=(dist[json.difficulty]||0)+1} else {fail++;console.log("FAIL",stage,mod,lesson,loc,"d="+json.difficulty,"n="+n)}
      }
    }
  }
}
console.log(`VERIFY ok=${ok} fail=${fail}`)
console.log("difficulty dist (by en):", JSON.stringify(dist))
