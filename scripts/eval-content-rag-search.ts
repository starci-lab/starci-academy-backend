/**
 * Content-RAG search accuracy eval ("Tìm nội dung khóa" — the RAG engine behind
 * the AI content-linking surfaces).
 *
 * WHAT IT PROVES
 * --------------
 * The `searchCourseContent` GraphQL query (→ {@link
 * import("../src/modules/rag/content-rag-retrieval.service").ContentRagRetrievalService.searchCourse})
 * runs a cosine-similarity search over the persistent `content_rag` Qdrant
 * collection, filtered to one course, collapsed to one hit per distinct source
 * (lesson / challenge / flashcard-deck / milestone-task). "Runs correctly" =
 * when a learner searches a topic, the RIGHT source comes back near the top.
 *
 * This harness builds a labelled eval set of ~500 cases across the 3 courses
 * (Fullstack / System Design / DevOps), every kind, both locales. Each case's
 * GROUND TRUTH is objective: the query is a real source's own title, so the
 * search MUST surface that exact source. We measure recall@{1,3,6,10} + MRR.
 *
 * FAITHFULNESS
 * ------------
 * The `runSearch()` below is a line-for-line copy of the production
 * `searchCourse()` retrieval core (over-fetch k*4 chunks → keep the best-scoring
 * chunk per `metadata.contentId` → sort by score → slice top-k). The only thing
 * swapped is the embedder wiring: instead of booting the whole AI balancer we
 * construct the SAME model the balancer's local-first Auto lane resolves to
 * (`nomic-embed-text` on the local Ollama GPU, 768-dim — identical to what the
 * index was built with, so query + stored vectors share the embedding space).
 *
 * RUN
 * ---
 *   node -r ts-node/register -r tsconfig-paths/register scripts/eval-content-rag-search.ts
 * Flags (all optional):
 *   --limit=500      total cases target (stratified across course/kind/locale)
 *   --topk=6         production top-k (the headline recall@k)
 *   --concurrency=6  parallel searches
 *   --course=fullstack,systemdesign,devops   subset of courses
 */
import {
    Client,
} from "pg"
import {
    QdrantClient,
} from "@qdrant/qdrant-js"
import {
    OllamaEmbeddings,
} from "@langchain/community/embeddings/ollama"
import {
    writeFileSync,
} from "node:fs"

// ─────────────────────────────────────────── config (local dev infra) ──

const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333"
const QDRANT_API_KEY = process.env.QDRANT_API_KEY ?? "Cuong123_A"
const COLLECTION = process.env.CONTENT_RAG_COLLECTION ?? "content_rag"
const OLLAMA_URL = (process.env.AI_LOCAL_BASE_URL ?? "http://localhost:11434").replace(/\/v1$/, "")
const EMBED_MODEL = process.env.CONTENT_RAG_EMBED_MODEL ?? "nomic-embed-text"

const PG = {
    host: process.env.POSTGRESQL_PRIMARY_HOST ?? "localhost",
    port: Number(process.env.POSTGRESQL_PRIMARY_PORT ?? 5433),
    user: process.env.POSTGRESQL_PRIMARY_USERNAME ?? "postgres",
    password: process.env.POSTGRESQL_PRIMARY_PASSWORD ?? "Cuong123_A",
    database: process.env.POSTGRESQL_PRIMARY_DATABASE ?? "starci-academy",
}

/** The three courses under test (slug → course id). */
const ALL_COURSES: Array<{ slug: string, id: string }> = [
    { slug: "fullstack", id: "b359da45-9d91-5189-8374-bda0248167b3" },
    { slug: "systemdesign", id: "1ab239c8-ebb5-53ee-b255-dc7839a6b959" },
    { slug: "devops", id: "f22c2da0-fc2d-5145-bf01-1b60426423b4" },
]

/** Rank cutoffs we report recall at (deepest drives how many hits to fetch). */
const CUTOFFS = [1, 3, 6, 10] as const
const FETCH_DISTINCT = 20 // distinct sources to pull per search (≥ max cutoff)

// ───────────────────────────────────────────────────────── cli args ──

function arg(name: string, fallback: string): string {
    const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
    return hit ? hit.split("=").slice(1).join("=") : fallback
}
const TARGET_TOTAL = Number(arg("limit", "500"))
const TOPK = Number(arg("topk", "6"))
const CONCURRENCY = Number(arg("concurrency", "6"))
const COURSE_FILTER = arg("course", "").trim()
const COURSES = COURSE_FILTER
    ? ALL_COURSES.filter((c) => COURSE_FILTER.split(",").includes(c.slug))
    : ALL_COURSES

// ─────────────────────────────────────────────────────────── types ──

type Kind = "content" | "challenge" | "flashcard" | "milestone"
type Lang = "vi" | "en"

interface Source {
    id: string
    kind: Kind
    titleVi: string | null
    titleEn: string | null
}

interface EvalCase {
    courseSlug: string
    courseId: string
    kind: Kind
    lang: Lang
    expectedId: string
    query: string
}

interface CaseResult extends EvalCase {
    /** 1-based rank of the expected source among distinct hits, or 0 if absent. */
    rank: number
    /** Top-1 hit's contentId (what won instead on a miss), for diagnosis. */
    top1Id: string | null
    /** Set on a top-N miss: is the expected source even present in the index? */
    indexedChunks?: number
}

// ─────────────────────────────────────────────── source enumeration ──

/** Load every indexed-kind source of a course with its vi/en titles (translation EAV + base fallback). */
async function loadSources(pg: Client, courseId: string): Promise<Array<Source>> {
    const titleJoin = (table: string, fk: string, alias: string) => `
        coalesce(${alias}_vi.value, case when ${alias}.default_locale='vi' then ${alias}.title end) as title_vi,
        coalesce(${alias}_en.value, case when ${alias}.default_locale='en' then ${alias}.title end) as title_en`

    const queries: Array<{ kind: Kind, sql: string }> = [
        {
            kind: "content",
            sql: `select c.id, ${titleJoin("content_translations", "content_id", "c")}
                  from contents c
                  join modules m on m.id = c.module_id
                  left join content_translations c_vi on c_vi.content_id=c.id and c_vi.locale='vi' and c_vi.field='title'
                  left join content_translations c_en on c_en.content_id=c.id and c_en.locale='en' and c_en.field='title'
                  where m.course_id = $1`,
        },
        {
            kind: "challenge",
            sql: `select c.id, ${titleJoin("challenge_translations", "challenge_id", "c")}
                  from challenges c
                  join contents ct on ct.id = c.content_id
                  join modules m on m.id = ct.module_id
                  left join challenge_translations c_vi on c_vi.challenge_id=c.id and c_vi.locale='vi' and c_vi.field='title'
                  left join challenge_translations c_en on c_en.challenge_id=c.id and c_en.locale='en' and c_en.field='title'
                  where m.course_id = $1`,
        },
        {
            kind: "flashcard",
            sql: `select c.id, ${titleJoin("flashcard_deck_translations", "flashcard_deck_id", "c")}
                  from flashcard_decks c
                  left join flashcard_deck_translations c_vi on c_vi.flashcard_deck_id=c.id and c_vi.locale='vi' and c_vi.field='title'
                  left join flashcard_deck_translations c_en on c_en.flashcard_deck_id=c.id and c_en.locale='en' and c_en.field='title'
                  where c.course_id = $1`,
        },
        {
            kind: "milestone",
            sql: `select c.id, ${titleJoin("milestone_task_translations", "milestone_task_id", "c")}
                  from milestone_tasks c
                  join milestones mi on mi.id = c.milestone_id
                  left join milestone_task_translations c_vi on c_vi.milestone_task_id=c.id and c_vi.locale='vi' and c_vi.field='title'
                  left join milestone_task_translations c_en on c_en.milestone_task_id=c.id and c_en.locale='en' and c_en.field='title'
                  where mi.course_id = $1`,
        },
    ]

    const out: Array<Source> = []
    for (const { kind, sql } of queries) {
        const { rows } = await pg.query(sql, [courseId])
        for (const r of rows) {
            out.push({
                id: r.id,
                kind,
                titleVi: (r.title_vi ?? null) && String(r.title_vi).trim() || null,
                titleEn: (r.title_en ?? null) && String(r.title_en).trim() || null,
            })
        }
    }
    return out
}

// ─────────────────────────────────────────── stratified case builder ──

/** Deterministic even-spaced pick of `n` items from a stably-sorted list. */
function evenSample<T>(items: Array<T>, n: number): Array<T> {
    if (n >= items.length) {
        return [...items]
    }
    const step = items.length / n
    const picked: Array<T> = []
    for (let i = 0; i < n; i++) {
        picked.push(items[Math.floor(i * step)])
    }
    return picked
}

/**
 * Build ~TARGET_TOTAL cases stratified across course → kind → locale. Each kind
 * gets a per-course budget with a floor so the small corpora (15 decks) stay
 * represented; locale alternates per source to maximise distinct-source coverage.
 */
function buildCases(sourcesByCourse: Map<string, Array<Source>>): Array<EvalCase> {
    const perCourse = Math.floor(TARGET_TOTAL / COURSES.length)
    // relative weight of each kind's slice of a course's budget
    const kindWeight: Record<Kind, number> = { content: 0.36, challenge: 0.36, flashcard: 0.14, milestone: 0.14 }
    const cases: Array<EvalCase> = []

    for (const course of COURSES) {
        const sources = sourcesByCourse.get(course.id) ?? []
        for (const kind of Object.keys(kindWeight) as Array<Kind>) {
            const budget = Math.round(perCourse * kindWeight[kind])
            // stable sort by id so the sample is reproducible run-to-run
            const pool = sources
                .filter((s) => s.kind === kind && (s.titleVi || s.titleEn))
                .sort((a, b) => a.id.localeCompare(b.id))
            const picked = evenSample(pool, budget)
            picked.forEach((src, i) => {
                // alternate locale; fall back to whichever title exists
                const wantVi = i % 2 === 0
                const lang: Lang = wantVi
                    ? (src.titleVi ? "vi" : "en")
                    : (src.titleEn ? "en" : "vi")
                const query = (lang === "vi" ? src.titleVi : src.titleEn) as string
                cases.push({
                    courseSlug: course.slug,
                    courseId: course.id,
                    kind,
                    lang,
                    expectedId: src.id,
                    query,
                })
            })
        }
    }
    return cases
}

// ──────────────────────────────────── production retrieval (copied) ──

/**
 * Faithful copy of `ContentRagRetrievalService.searchCourse` retrieval core:
 * over-fetch k*4 chunks scoped to the course, collapse to the best-scoring chunk
 * per distinct `metadata.contentId`, sort by score desc, slice top-k. Returns the
 * ordered distinct contentIds (what the eval scores against).
 *
 * Transport note: prod goes through `QdrantVectorStore.similaritySearch`, whose
 * installed client (1.17) speaks the newer `/points/query` API that the local
 * Qdrant v1.9.2 lacks. We instead embed the query ourselves (SAME model) and call
 * the legacy `client.search` (`/points/search`) — identical nearest-neighbour set
 * + cosine score, so the ranking under test is unchanged.
 */
async function runSearch(
    qdrant: QdrantClient,
    embeddings: OllamaEmbeddings,
    courseId: string,
    query: string,
    k: number,
): Promise<Array<string>> {
    const vector = await embeddings.embedQuery(query)
    const results = await qdrant.search(COLLECTION, {
        vector,
        limit: k * 4,
        with_payload: true,
        filter: {
            must: [{ key: "metadata.courseId", match: { value: courseId } }],
        },
    })
    const bestByContentId = new Map<string, number>()
    for (const point of results) {
        const contentId = (point.payload as any)?.metadata?.contentId
        const score = point.score
        if (typeof contentId !== "string" || !contentId) {
            continue
        }
        const existing = bestByContentId.get(contentId)
        if (existing !== undefined && existing >= score) {
            continue
        }
        bestByContentId.set(contentId, score)
    }
    return [...bestByContentId.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, k)
        .map(([id]) => id)
}

// ───────────────────────────────────────────── concurrency helper ──

async function pool<T, R>(items: Array<T>, size: number, worker: (item: T, index: number) => Promise<R>): Promise<Array<R>> {
    const out: Array<R> = new Array(items.length)
    let cursor = 0
    let done = 0
    async function lane(): Promise<void> {
        while (cursor < items.length) {
            const i = cursor++
            out[i] = await worker(items[i], i)
            done++
            if (done % 25 === 0 || done === items.length) {
                process.stdout.write(`\r  ran ${done}/${items.length} searches`)
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => lane()))
    process.stdout.write("\n")
    return out
}

// ───────────────────────────────────────────────────────── report ──

function pct(n: number, d: number): string {
    return d === 0 ? "  n/a" : `${((100 * n) / d).toFixed(1)}%`.padStart(6)
}

function tallyBlock(label: string, rows: Array<CaseResult>): string {
    const total = rows.length
    const recall = CUTOFFS.map((k) => rows.filter((r) => r.rank > 0 && r.rank <= k).length)
    const mrr = rows.reduce((s, r) => s + (r.rank > 0 && r.rank <= 10 ? 1 / r.rank : 0), 0) / (total || 1)
    const cells = CUTOFFS.map((k, i) => pct(recall[i], total)).join(" ")
    return `${label.padEnd(26)} n=${String(total).padStart(4)}   ${cells}   MRR=${mrr.toFixed(3)}`
}

// ───────────────────────────────────────────────────────────  main ──

async function main(): Promise<void> {
    console.log("=".repeat(78))
    console.log("Content-RAG search accuracy eval")
    console.log(`  courses=${COURSES.map((c) => c.slug).join(",")}  target=${TARGET_TOTAL}  topK=${TOPK}  fetch=${FETCH_DISTINCT}`)
    console.log("=".repeat(78))

    const pg = new Client(PG)
    await pg.connect()
    const qdrant = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY, timeout: 900_000, checkCompatibility: false })
    const embeddings = new OllamaEmbeddings({
        model: EMBED_MODEL,
        baseUrl: OLLAMA_URL,
        maxConcurrency: 8,
        headers: { Authorization: "Bearer local-eval" },
    })

    // 1) enumerate sources
    const sourcesByCourse = new Map<string, Array<Source>>()
    for (const course of COURSES) {
        const s = await loadSources(pg, course.id)
        sourcesByCourse.set(course.id, s)
        console.log(`sources ${course.slug.padEnd(12)} ${String(s.length).padStart(4)}  ` +
            (["content", "challenge", "flashcard", "milestone"] as Array<Kind>)
                .map((k) => `${k}=${s.filter((x) => x.kind === k).length}`).join("  "))
    }

    // 2) build the labelled eval set
    const cases = buildCases(sourcesByCourse)
    console.log(`\nbuilt ${cases.length} eval cases`)
    for (const course of COURSES) {
        const cc = cases.filter((c) => c.courseId === course.id)
        const byKind = (["content", "challenge", "flashcard", "milestone"] as Array<Kind>)
            .map((k) => `${k}=${cc.filter((c) => c.kind === k).length}`).join(" ")
        const vi = cc.filter((c) => c.lang === "vi").length
        console.log(`  ${course.slug.padEnd(12)} n=${String(cc.length).padStart(3)}  ${byKind}  (vi=${vi} en=${cc.length - vi})`)
    }

    // 3) run every case through the production retrieval core
    console.log("\nrunning searches...")
    const results = await pool<EvalCase, CaseResult>(cases, CONCURRENCY, async (c) => {
        const hits = await runSearch(qdrant, embeddings, c.courseId, c.query, FETCH_DISTINCT)
        const idx = hits.indexOf(c.expectedId)
        return { ...c, rank: idx < 0 ? 0 : idx + 1, top1Id: hits[0] ?? null }
    })

    // 4) classify top-N misses: indexed-but-missed vs never-indexed
    const misses = results.filter((r) => r.rank === 0)
    for (const m of misses) {
        const counted = await qdrant.count(COLLECTION, {
            exact: true,
            filter: { must: [{ key: "metadata.contentId", match: { value: m.expectedId } }] },
        })
        m.indexedChunks = counted.count
    }

    // 5) report
    const header = `${"scope".padEnd(26)} ${"cases".padEnd(6)}  ${CUTOFFS.map((k) => `@${k}`.padStart(6)).join(" ")}   MRR`
    console.log("\n" + "=".repeat(78))
    console.log("RECALL@k  (query = a source's own title → that source must come back)")
    console.log("=".repeat(78))
    console.log(header)
    console.log("-".repeat(78))
    console.log(tallyBlock("OVERALL", results))
    console.log("-".repeat(78))
    for (const course of COURSES) {
        console.log(tallyBlock(`course:${course.slug}`, results.filter((r) => r.courseId === course.id)))
    }
    console.log("-".repeat(78))
    for (const kind of ["content", "challenge", "flashcard", "milestone"] as Array<Kind>) {
        console.log(tallyBlock(`kind:${kind}`, results.filter((r) => r.kind === kind)))
    }
    console.log("-".repeat(78))
    for (const lang of ["vi", "en"] as Array<Lang>) {
        console.log(tallyBlock(`lang:${lang}`, results.filter((r) => r.lang === lang)))
    }

    // 6) miss breakdown
    const neverIndexed = misses.filter((m) => (m.indexedChunks ?? 0) === 0)
    const rankedOut = misses.filter((m) => (m.indexedChunks ?? 0) > 0)
    console.log("\n" + "=".repeat(78))
    console.log(`MISSES (not in top-${FETCH_DISTINCT}):  ${misses.length}/${results.length}`)
    console.log(`  never-indexed (excluded from accuracy): ${neverIndexed.length}`)
    console.log(`  indexed but ranked out (real misses):   ${rankedOut.length}`)
    console.log("=".repeat(78))
    for (const m of rankedOut.slice(0, 40)) {
        console.log(`  [${m.courseSlug}/${m.kind}/${m.lang}] "${m.query.slice(0, 60)}"`)
    }
    if (rankedOut.length > 40) {
        console.log(`  … and ${rankedOut.length - 40} more (see json)`)
    }

    // headline: accuracy over the FAIR denominator (indexed sources only)
    const fair = results.filter((r) => !(r.rank === 0 && (r.indexedChunks ?? 1) === 0))
    const hitAtTopK = fair.filter((r) => r.rank > 0 && r.rank <= TOPK).length
    console.log("\n" + "=".repeat(78))
    console.log(`HEADLINE  recall@${TOPK} (fair denominator, indexed sources only): ` +
        `${hitAtTopK}/${fair.length} = ${((100 * hitAtTopK) / (fair.length || 1)).toFixed(1)}%`)
    console.log("=".repeat(78))

    // 7) persist the full 500-case detail for inspection
    const stamp = arg("stamp", "eval")
    const outPath = `${process.cwd()}/scripts/.out-content-rag-eval-${stamp}.json`
    writeFileSync(outPath, JSON.stringify({
        config: { collection: COLLECTION, embedModel: EMBED_MODEL, topK: TOPK, fetchDistinct: FETCH_DISTINCT, target: TARGET_TOTAL },
        summary: {
            total: results.length,
            recall: Object.fromEntries(CUTOFFS.map((k) => [`@${k}`, results.filter((r) => r.rank > 0 && r.rank <= k).length])),
            misses: misses.length,
            neverIndexed: neverIndexed.length,
            rankedOut: rankedOut.length,
        },
        cases: results,
    }, null, 2))
    console.log(`\nfull case-level detail → ${outPath}`)

    await pg.end()
}

main().catch((error: unknown) => {
    console.error("\nEVAL FAILED:", error)
    process.exit(1)
})
