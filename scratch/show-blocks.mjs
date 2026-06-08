import { readFileSync } from "node:fs"
const files = [
  ".mount/data/courses/0-fullstack-mastery/modules/17-security-end-to-end/contents/3-secrets-management-vault/bodies/0-typescript/en.md",
  ".mount/data/courses/0-fullstack-mastery/modules/19-deploy-and-devops-workflow/contents/2-deploy-to-digitalocean-vps-with-certbot/bodies/1-java/en.md",
  ".mount/data/courses/0-fullstack-mastery/modules/19-deploy-and-devops-workflow/contents/2-deploy-to-digitalocean-vps-with-certbot/bodies/3-go/en.md",
  ".mount/data/courses/0-fullstack-mastery/modules/6-client-state-zustand-jotai/contents/0-zustand-store-and-selectors/bodies/0-agnostic/en.md",
]
for (const f of files) {
  const t = readFileSync(f, "utf8")
  const m = t.match(/```mermaid\r?\n[\s\S]*?\r?\n```/)
  console.log("\n##### " + f)
  console.log(JSON.stringify(m ? m[0].slice(0, 40) : "NONE"))
  // show whether \r present
  console.log("CRLF:", t.includes("\r\n"))
}
