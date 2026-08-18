/**
 * One-off cleanup: remove the duplicate points that piled up in the `content_rag`
 * Qdrant collection while the indexer's diff/delete filtered the WRONG payload key
 * (`contentId` instead of the LangChain-nested `metadata.contentId`) — every
 * reindex re-embedded + APPENDED instead of replacing, leaving ~28× duplicates.
 *
 * The code bug is fixed in `content-rag-index.service.ts` (future reindexes stay
 * clean); this purges the already-accumulated dupes IN PLACE — no re-embedding,
 * no reseed, no downtime. It keeps ONE point per distinct
 * (contentId · lang · filePath · chunk-text) and deletes the rest.
 *
 * Run:  node -r ts-node/register scripts/dedup-content-rag.ts [--apply]
 * Without --apply it DRY-RUNS (reports what it would delete); pass --apply to delete.
 *
 * Env (defaults = local): QDRANT_URL, QDRANT_API_KEY, CONTENT_RAG_COLLECTION.
 */
import { createHash } from "node:crypto"

const QDRANT = process.env.QDRANT_URL ?? "http://localhost:6333"
const API_KEY = process.env.QDRANT_API_KEY ?? ""
const COLLECTION = process.env.CONTENT_RAG_COLLECTION ?? "content_rag"
const APPLY = process.argv.includes("--apply")
const SCROLL_PAGE = 1000
const DELETE_BATCH = 2000

async function qdrant(path: string, body: unknown): Promise<any> {
    const res = await fetch(`${QDRANT}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": API_KEY },
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        throw new Error(`Qdrant ${path} → ${res.status} ${await res.text()}`)
    }
    return res.json()
}

/** Stable key for a chunk — identical across duplicate re-inserts of the same source. */
function chunkKey(payload: any): string {
    const meta = payload?.metadata ?? {}
    const contentHash = createHash("sha1").update(String(payload?.content ?? "")).digest("hex")
    return `${meta.contentId ?? ""}|${meta.lang ?? ""}|${meta.filePath ?? ""}|${contentHash}`
}

async function deleteIds(ids: Array<string | number>): Promise<void> {
    if (ids.length === 0) {
        return
    }
    await qdrant(`/collections/${COLLECTION}/points/delete`, { points: ids })
}

async function main(): Promise<void> {
    console.log("=".repeat(70))
    console.log(`Dedup ${COLLECTION} @ ${QDRANT}  ·  mode=${APPLY ? "APPLY (will delete)" : "DRY-RUN"}`)
    console.log("=".repeat(70))

    const before = (await qdrant(`/collections/${COLLECTION}/points/count`, { exact: true })).result.count
    console.log(`points before: ${before}`)

    const seen = new Set<string>()
    let scanned = 0
    let dupTotal = 0
    let deleted = 0
    let batch: Array<string | number> = []
    let offset: string | number | null | undefined

    for (;;) {
        const page = await qdrant(`/collections/${COLLECTION}/points/scroll`, {
            limit: SCROLL_PAGE,
            offset,
            with_payload: ["metadata", "content"],
            with_vector: false,
        })
        const points: Array<{ id: string | number, payload: any }> = page.result.points
        for (const point of points) {
            scanned++
            const key = chunkKey(point.payload)
            if (seen.has(key)) {
                dupTotal++
                batch.push(point.id)
                if (APPLY && batch.length >= DELETE_BATCH) {
                    await deleteIds(batch)
                    deleted += batch.length
                    batch = []
                }
            } else {
                seen.add(key)
            }
        }
        process.stdout.write(`\r  scanned ${scanned}  ·  unique ${seen.size}  ·  dup ${dupTotal}`)
        offset = page.result.next_page_offset
        if (offset === null || offset === undefined) {
            break
        }
    }
    if (APPLY && batch.length > 0) {
        await deleteIds(batch)
        deleted += batch.length
    }
    process.stdout.write("\n")

    console.log("-".repeat(70))
    console.log(`scanned:       ${scanned}`)
    console.log(`unique chunks: ${seen.size}`)
    console.log(`duplicates:    ${dupTotal}  (${(dupTotal / (scanned || 1) * 100).toFixed(1)}% of points)`)
    console.log(`dup factor:    ${(scanned / (seen.size || 1)).toFixed(1)}x`)
    if (APPLY) {
        const after = (await qdrant(`/collections/${COLLECTION}/points/count`, { exact: true })).result.count
        console.log(`DELETED:       ${deleted}`)
        console.log(`points after:  ${after}  (expected ~${seen.size})`)
    } else {
        console.log(`\nDRY-RUN — would delete ${dupTotal} points. Re-run with --apply to purge.`)
    }
}

main().catch((error: unknown) => {
    console.error("\nDEDUP FAILED:", error)
    process.exit(1)
})
