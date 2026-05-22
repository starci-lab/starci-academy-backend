import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".repo")
const MODS = [
    "system-design-mastery-module-9-high-throughput-notification-system",
    "system-design-mastery-module-10-advanced-message-broker",
]

const GENERIC = /\/\*\*\n \* Logic — xử lý demo cho[^*]+?\*\/\n\s*/g

const REPLACEMENTS = [
    [
        /@EventPattern\("platform-events"\)\s*GENERIC/,
        `@EventPattern("platform-events")
    /**
     * Logic — consumer group nhận message; delegate ConsumerService.
     * Code — @EventPattern + @Payload → process().
     * (EN Logic: Consumer group receives messages; delegates to ConsumerService.)
     * (EN Code: @EventPattern + @Payload → process().)
     */
    `,
    ],
    [
        /@EventPattern\("ordering-events"\)\s*GENERIC/,
        `@EventPattern("ordering-events")
    /**
     * Logic — cùng group broker-lesson1-group; so sánh lag fast vs slow.
     * Code — @EventPattern → process() (slow có delay trong service).
     * (EN Logic: Same group broker-lesson1-group; compare fast vs slow lag.)
     * (EN Code: @EventPattern → process() (slow service adds delay).)
     */
    `,
    ],
    [
        /@EventPattern\("reliability-events"\)\s*GENERIC/,
        `@EventPattern("reliability-events")
    /**
     * Logic — gọi processEvent; lỗi throw để Kafka retry / DLQ demo.
     * Code — try/catch log + rethrow.
     * (EN Logic: Calls processEvent; errors rethrown for Kafka retry / DLQ demo.)
     * (EN Code: try/catch log + rethrow.)
     */
    `,
    ],
    [
        /async publish\(@Body\(\) body: PublishEventDto\)/,
        `/**
     * Logic — HTTP nhận body → EventsService.publish (Kafka emit).
     * Code — POST /events → service.publish.
     * (EN Logic: HTTP body → EventsService.publish (Kafka emit).)
     * (EN Code: POST /events → service.publish.)
     */
    async publish(@Body() body: PublishEventDto)`,
    ],
]

function walk(dir, out) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const f = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (!["node_modules", "dist"].includes(e.name)) walk(f, out)
        } else if (f.endsWith(".ts")) out.push(f)
    }
}

let n = 0
for (const mod of MODS) {
    const files = []
    walk(path.join(REPO, mod), files)
    for (const file of files) {
        let t = fs.readFileSync(file, "utf8")
        if (!t.includes("Logic — xử lý demo cho")) continue
        const orig = t
        t = t.replace(GENERIC, "")
        if (file.includes("consumer.controller")) {
            if (t.includes('platform-events')) {
                t = t.replace(
                    /@EventPattern\("platform-events"\)\n/,
                    `@EventPattern("platform-events")
    /**
     * Logic — consumer group nhận message; delegate ConsumerService.
     * (EN Logic: Consumer group receives messages; delegates to ConsumerService.)
     */
`,
                )
            }
            if (t.includes('ordering-events')) {
                t = t.replace(
                    /@EventPattern\("ordering-events"\)\n/,
                    `@EventPattern("ordering-events")
    /**
     * Logic — cùng consumer group; so sánh lag fast vs slow trên UI.
     * (EN Logic: Same consumer group; compare fast vs slow lag in UI.)
     */
`,
                )
            }
            if (t.includes('reliability-events')) {
                t = t.replace(
                    /@EventPattern\("reliability-events"\)\n/,
                    `@EventPattern("reliability-events")
    /**
     * Logic — idempotent processing; lỗi → retry/DLQ path.
     * (EN Logic: Idempotent processing; errors → retry/DLQ path.)
     */
`,
                )
            }
        }
        if (file.endsWith("events.controller.ts")) {
            t = t.replace(
                /async publish\(@Body\(\) body: PublishEventDto\)/,
                `/**
     * Logic — HTTP → Kafka producer.
     * (EN Logic: HTTP → Kafka producer.)
     */
    async publish(@Body() body: PublishEventDto)`,
            )
        }
        if (file.endsWith("consumer.service.ts") && !file.includes("consumer-slow")) {
            t = t.replace(
                /async process\(data:/,
                `/**
     * Logic — log message đã nhận (partitionKey, type).
     * (EN Logic: Log received message (partitionKey, type).)
     */
    async process(data:`,
            )
        }
        if (file.includes("2-reliability") && file.endsWith("events.service.ts")) {
            t = t.replace(
                /async publish\(dto: PublishEventDto\)/,
                `/**
     * Logic — produce reliability-events; key = clientMessageId.
     * (EN Logic: Produce reliability-events; key = clientMessageId.)
     */
    async publish(dto: PublishEventDto)`,
            )
        }
        if (t !== orig) {
            fs.writeFileSync(file, t, "utf8")
            n++
        }
    }
}
console.log({ polished: n })
