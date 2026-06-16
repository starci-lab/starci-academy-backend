// Local-only blog seeder: parse .mount/data/blog/<index>-<slug>/{en,vi}.md and
// upsert into blog_posts. Standalone (Node + pg) so local rendering does not
// depend on the full init pipeline. UTF-8 safe (pg uses UTF-8 over the wire).
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import pg from "pg"

const BLOG_DIR = join(process.cwd(), ".mount", "data", "blog")

/** Parse a mount language file into { field: leafValue } (top-level `# field` only). */
const parseLangFile = (text) => {
    const lines = text.replace(/^﻿/, "").split(/\r?\n/)
    const fields = {}
    let current = null
    let buffer = []
    const flush = () => {
        if (current) {
            const value = buffer
                .filter((line) => !/@starci\/seperator/.test(line))
                .join("\n")
                .trim()
            fields[current] = value
        }
    }
    for (const line of lines) {
        const heading = /^#\s+(\w+)\s*$/.exec(line.trim())
        if (heading) {
            flush()
            current = heading[1]
            buffer = []
        } else {
            buffer.push(line)
        }
    }
    flush()
    return fields
}

/** Pair two locale strings into bilingual jsonb (fallback across locales). */
const pair = (en, vi) => {
    const e = (en || "").trim() || undefined
    const v = (vi || "").trim() || undefined
    if (!e && !v) return null
    return { en: e ?? v, vi: v ?? e }
}

const rows = []
for (const folder of readdirSync(BLOG_DIR)) {
    const dir = join(BLOG_DIR, folder)
    const match = /^(\d+)-(.+)$/.exec(folder)
    if (!match) continue
    const slug = match[2]
    const enPath = join(dir, "en.md")
    const viPath = join(dir, "vi.md")
    const en = existsSync(enPath) ? parseLangFile(readFileSync(enPath, "utf8")) : {}
    const vi = existsSync(viPath) ? parseLangFile(readFileSync(viPath, "utf8")) : {}
    const meta = Object.keys(en).length ? en : vi
    const title = pair(en.title, vi.title)
    const body = pair(en.body, vi.body)
    if (!title || !body) continue
    rows.push({
        slug,
        title,
        excerpt: pair(en.excerpt, vi.excerpt),
        body,
        category: (meta.category || "deep-dive").trim(),
        coverImageUrl: meta.coverImageUrl || null,
        readingMinutes: meta.readingMinutes ? Number(meta.readingMinutes) : null,
        ctaUrl: meta.ctaUrl || null,
        ctaLabel: pair(en.ctaLabel, vi.ctaLabel),
        sourceUrl: meta.sourceUrl || null,
        isPremium: (meta.isPremium || "false").trim() === "true",
        publishedAt: (meta.publishedAt || "").trim() || null,
        isPublished: (meta.isPublished || "true").trim() !== "false",
    })
}

const client = new pg.Client({
    host: "localhost",
    port: 5433,
    user: "postgres",
    password: "Cuong123_A",
    database: "starci-academy",
})

const run = async () => {
    await client.connect()
    for (const row of rows) {
        await client.query(
            `INSERT INTO blog_posts
               (slug, title, excerpt, body, category, cover_image_url, reading_minutes,
                cta_url, cta_label, source_url, is_premium, published_at, is_published)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
             ON CONFLICT (slug) DO UPDATE SET
               title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, body = EXCLUDED.body,
               category = EXCLUDED.category, cover_image_url = EXCLUDED.cover_image_url,
               reading_minutes = EXCLUDED.reading_minutes, cta_url = EXCLUDED.cta_url,
               cta_label = EXCLUDED.cta_label, source_url = EXCLUDED.source_url,
               is_premium = EXCLUDED.is_premium, published_at = EXCLUDED.published_at,
               is_published = EXCLUDED.is_published`,
            [
                row.slug,
                JSON.stringify(row.title),
                row.excerpt ? JSON.stringify(row.excerpt) : null,
                JSON.stringify(row.body),
                row.category,
                row.coverImageUrl,
                row.readingMinutes,
                row.ctaUrl,
                row.ctaLabel ? JSON.stringify(row.ctaLabel) : null,
                row.sourceUrl,
                row.isPremium,
                row.publishedAt,
                row.isPublished,
            ],
        )
        console.log("upserted:", row.slug, "→", row.category)
    }
    const { rows: check } = await client.query(
        "SELECT slug, category, title->>'vi' AS vi FROM blog_posts ORDER BY published_at DESC",
    )
    console.table(check)
    await client.end()
}

run().catch((error) => {
    console.error(error)
    process.exit(1)
})
