import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const REPO = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    ".repo",
    "system-design-mastery-module-10-advanced-message-broker",
)

const GENERIC = /\n\/\*\*\n \* Logic — xử lý demo cho[^*]+?\*\/\n(?=\s+async )/g

const HANDLE_COMMENT = `
    /**
     * Logic — consumer group nhận message từ topic; delegate sang ConsumerService.
     * Code — @EventPattern(topic) + @Payload() → process().
     * (EN Logic: Consumer group receives topic messages; delegates to ConsumerService.)
     * (EN Code: @EventPattern(topic) + @Payload() → process().)
     */`

function walk(dir, out) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const f = path.join(dir, e.name)
        if (e.isDirectory()) walk(f, out)
        else if (f.endsWith("consumer.controller.ts")) out.push(f)
    }
}

const files = []
walk(REPO, files)
for (const file of files) {
    let t = fs.readFileSync(file, "utf8")
    t = t.replace(/import \{ ConsumerService \} from "\."/, 'import {\n    ConsumerService,\n} from "./consumer.service"')
    t = t.replace(GENERIC, HANDLE_COMMENT)
    fs.writeFileSync(file, t, "utf8")
}
console.log({ controllers: files.length })
