/**
 * Rewrites lesson markdown from deleted module-N-M-slug repos to module-N-slug repos.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(
    __dirname,
    "..",
    ".mount",
    "data",
    "courses",
    "1-system-design-mastery",
    "modules",
)

/** @type {Record<string, string>} */
const REPO_RENAME = {
    "system-design-mastery-module-9-8-high-throughput-notification-system":
        "system-design-mastery-module-9-high-throughput-notification-system",
    "system-design-mastery-module-10-9-real-time-chat-instant-messaging-system":
        "system-design-mastery-module-10-advanced-message-broker",
    "system-design-mastery-module-10-real-time-chat-instant-messaging-system":
        "system-design-mastery-module-10-advanced-message-broker",
    "system-design-mastery-module-11-10-social-media-feed-news-feed-system":
        "system-design-mastery-module-11-news-feed-fanout-and-caching",
    "system-design-mastery-module-11-social-media-feed-news-feed-system":
        "system-design-mastery-module-11-news-feed-fanout-and-caching",
    "system-design-mastery-module-12-11-large-scale-video-streaming-platform":
        "system-design-mastery-module-12-large-scale-video-streaming-platform",
    "system-design-mastery-module-13-12-ecommerce-flash-sale-system":
        "system-design-mastery-module-13-flash-sale-at-scale",
    "system-design-mastery-module-13-ecommerce-flash-sale-system":
        "system-design-mastery-module-13-flash-sale-at-scale",
    "system-design-mastery-module-14-13-ride-hailing-system":
        "system-design-mastery-module-14-geospatial-indexing-realtime-matching-and-surge-pricing",
    "system-design-mastery-module-14-ride-hailing-system":
        "system-design-mastery-module-14-geospatial-indexing-realtime-matching-and-surge-pricing",
    "system-design-mastery-module-15-14-distributed-search-autocomplete-system":
        "system-design-mastery-module-15-distributed-search-and-autocomplete",
    "system-design-mastery-module-15-distributed-search-autocomplete-system":
        "system-design-mastery-module-15-distributed-search-and-autocomplete",
    "system-design-mastery-module-16-15-highly-available-distributed-key-value-store":
        "system-design-mastery-module-16-highly-available-distributed-key-value-store",
    "system-design-mastery-module-17-16-distributed-file-storage-content-delivery-network":
        "system-design-mastery-module-17-distributed-file-storage-content-delivery-network",
    "system-design-mastery-module-18-17-high-performance-web-crawler-search-engine":
        "system-design-mastery-module-18-high-performance-web-crawler-search-engine",
    "system-design-mastery-module-19-18-distributed-rate-limiter-api-gateway":
        "system-design-mastery-module-19-distributed-rate-limiter-api-gateway",
    "system-design-mastery-module-20-19-financial-transaction-digital-wallet-system":
        "system-design-mastery-module-20-financial-transaction-digital-wallet-system",
}

function walk(dir, out) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (e.name === "challenges") continue
            walk(full, out)
        } else if (
            e.isFile() &&
            (e.name.endsWith(".md")) &&
            full.includes(`${path.sep}contents${path.sep}`)
        ) {
            out.push(full)
        }
    }
}

const files = []
walk(ROOT, files)

let updated = 0
for (const full of files) {
    let text = fs.readFileSync(full, "utf8")
    let changed = false
    for (const [oldName, newName] of Object.entries(REPO_RENAME)) {
        if (!text.includes(oldName)) continue
        text = text.split(oldName).join(newName)
        changed = true
    }
    if (changed) {
        fs.writeFileSync(full, text, "utf8")
        updated++
    }
}

console.log(`Updated ${updated} markdown files`)
