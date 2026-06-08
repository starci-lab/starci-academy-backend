// Apply the verified mermaid fixes to lesson bodies (vi.md + en.md).
// Each replacement asserts it changed something; aborts loudly otherwise.
import { readFileSync, writeFileSync } from "node:fs"

const C = ".mount/data/courses/0-fullstack-mastery"
const langs = ["en.md", "vi.md"]

/** Apply [from,to] string swaps to a file; throw if any `from` is absent. */
function patch(relDirWithFile, edits) {
    let text = readFileSync(relDirWithFile, "utf8")
    for (const [from, to] of edits) {
        if (!text.includes(from)) throw new Error(`MISS in ${relDirWithFile}: ${JSON.stringify(from.slice(0, 50))}`)
        text = text.split(from).join(to)
    }
    writeFileSync(relDirWithFile, text)
    console.log("patched " + relDirWithFile)
}

// 1) M17 vault — actor "LOOP" collides with the `loop` keyword → rename to TIMER.
for (const l of langs) {
    patch(`${C}/modules/17-security-end-to-end/contents/3-secrets-management-vault/bodies/0-typescript/${l}`, [
        ["participant LOOP as setInterval", "participant TIMER as setInterval"],
        ["LOOP->>APP: trigger refresh", "TIMER->>APP: trigger refresh"],
    ])
}

// 2) M19 deploy — a stray shell `cd ...` line leaked inside the mermaid fence.
for (const l of langs) {
    patch(`${C}/modules/19-deploy-and-devops-workflow/contents/2-deploy-to-digitalocean-vps-with-certbot/bodies/1-java/${l}`, [
        ["cd fullstack-mastery-module-20-deploy-and-devops-workflow/2-deploy-to-digitalocean-vps-with-certbot/1-java\r\n", ""],
    ])
    patch(`${C}/modules/19-deploy-and-devops-workflow/contents/2-deploy-to-digitalocean-vps-with-certbot/bodies/3-go/${l}`, [
        ["cd fullstack-mastery-module-20-deploy-and-devops-workflow/2-deploy-to-digitalocean-vps-with-certbot/3-go\r\n", ""],
    ])
}

// 3) M6 zustand — dotted-link label syntax + empty parens `set()` both break the lexer.
const zEdits = [
    ["Store -.action ref stable → Object.is equal → NO notify.-> Panel",
        "Store -.->|action ref stable → Object.is equal → NO notify| Panel"],
    ["Panel -->|call action → set()| Store", "Panel -->|call action → set| Store"],
]
for (const l of langs) {
    patch(`${C}/modules/6-client-state-zustand-jotai/contents/0-zustand-store-and-selectors/bodies/0-agnostic/${l}`, zEdits)
    patch(`${C}/modules/6-client-state-zustand-jotai/contents/0-zustand-store-and-selectors/${l}`, zEdits)
}

console.log("\nAll patches applied.")
