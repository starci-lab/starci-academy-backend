/**
 * Content-AI chat eval — two parts, both on the local free model qwen2.5-coder:7b:
 *
 *  A) INTENT ROUTING — does an in-chat message route to a "find content" tool
 *     result vs a normal answer, and to the right KIND? We score TWO classifiers
 *     on 100 labelled queries: the shipped REGEX MVP (`detectContentIntent`) and
 *     a 7b LLM classifier. Objective — gold labels are authored below.
 *
 *  B) ANSWER QUALITY — for the real content questions, retrieve the lesson
 *     excerpt from the `content_rag` Qdrant index (same as the chat's RAG
 *     grounding), have 7b answer, then have 7b JUDGE its own answer against the
 *     excerpt (grounded / correct / refused). Self-judge on a coder model is a
 *     WEAK signal — treated as indicative, and raw answers are dumped for review.
 *
 * Run: node -r ts-node/register scripts/eval-content-chat.ts
 * (No app graph — plain fetch to Ollama :11434 + Qdrant :6333.)
 */

const OLLAMA = "http://localhost:11434"
const CHAT_MODEL = "qwen2.5-coder:7b"
const EMBED_MODEL = "nomic-embed-text"
const QDRANT = "http://localhost:6333"
const QDRANT_KEY = process.env.QDRANT_API_KEY ?? ""
const COLLECTION = "content_rag"
// SQL vs NoSQL lesson (Fullstack) — the grounding source for the answer probes.
const LESSON_ID = "ed307eea-b7b0-58c1-8cbf-8ec404f0cb25"
const COURSE_ID = "b359da45-9d91-5189-8374-bda0248167b3"
const CONCURRENCY = 3

type Kind = "flashcard" | "content" | "challenge" | "milestone" | null

interface Case {
    q: string
    /** Gold: is this a "find course content" intent? */
    isFind: boolean
    /** Gold kind when isFind (null = generic find or not-a-find). */
    kind: Kind
    /** Answer-quality probe (a real content question routed to chat). */
    probe?: boolean
    /** Adversarial note (why it's tricky), for the report. */
    note?: string
}

// ── 100 labelled cases ───────────────────────────────────────────────────
const CASES: Array<Case> = [
    // find · flashcard
    { q: "tìm flashcard cho phần này", isFind: true, kind: "flashcard" },
    { q: "cho tôi mấy bộ thẻ ôn phần này", isFind: true, kind: "flashcard" },
    { q: "có flashcard nào về SQL không", isFind: true, kind: "flashcard" },
    { q: "luyện thẻ ghi nhớ phần này đi", isFind: true, kind: "flashcard" },
    { q: "gợi ý bộ thẻ ôn tập", isFind: true, kind: "flashcard" },
    { q: "find flashcards for this lesson", isFind: true, kind: "flashcard" },
    { q: "thẻ nào liên quan chủ đề này", isFind: true, kind: "flashcard" },
    { q: "kiếm flashcard về transaction", isFind: true, kind: "flashcard" },
    { q: "list flashcards about NoSQL", isFind: true, kind: "flashcard" },
    { q: "tìm thẻ ôn cho bài này", isFind: true, kind: "flashcard" },
    { q: "show me flashcards to review", isFind: true, kind: "flashcard" },
    { q: "có bộ thẻ nào cho phần database không", isFind: true, kind: "flashcard" },
    // find · content
    { q: "tìm bài liên quan phần này", isFind: true, kind: "content" },
    { q: "có bài học nào về indexing không", isFind: true, kind: "content" },
    { q: "gợi ý bài đọc thêm", isFind: true, kind: "content" },
    { q: "bài nào nói về caching", isFind: true, kind: "content" },
    { q: "find related lessons", isFind: true, kind: "content" },
    { q: "liệt kê bài về NoSQL", isFind: true, kind: "content" },
    { q: "tìm bài học về ODM", isFind: true, kind: "content" },
    { q: "gợi ý bài nên đọc trước", isFind: true, kind: "content" },
    { q: "show lessons about document model", isFind: true, kind: "content" },
    { q: "tìm bài giảng liên quan", isFind: true, kind: "content" },
    { q: "kiếm bài về ACID", isFind: true, kind: "content" },
    { q: "có nội dung nào về eventual consistency không mà đọc", isFind: true, kind: "content" },
    // find · challenge
    { q: "tìm thử thách phần này", isFind: true, kind: "challenge" },
    { q: "có bài tập nào không", isFind: true, kind: "challenge" },
    { q: "luyện challenge về transaction", isFind: true, kind: "challenge" },
    { q: "find challenges for this topic", isFind: true, kind: "challenge" },
    { q: "gợi ý bài tập thực hành", isFind: true, kind: "challenge" },
    { q: "tìm thử thách coding về database", isFind: true, kind: "challenge" },
    { q: "list practice challenges", isFind: true, kind: "challenge" },
    { q: "có challenge nào về polyglot không", isFind: true, kind: "challenge" },
    { q: "kiếm bài tập luyện thêm", isFind: true, kind: "challenge" },
    { q: "tìm bài luyện tập phần này", isFind: true, kind: "challenge" },
    // find · milestone
    { q: "tìm dự án liên quan", isFind: true, kind: "milestone" },
    { q: "có nhiệm vụ nào phần này", isFind: true, kind: "milestone" },
    { q: "milestone nào về backend", isFind: true, kind: "milestone" },
    { q: "find project tasks", isFind: true, kind: "milestone" },
    { q: "gợi ý task dự án cá nhân", isFind: true, kind: "milestone" },
    { q: "tìm capstone liên quan chủ đề này", isFind: true, kind: "milestone" },
    { q: "liệt kê dự án cần làm", isFind: true, kind: "milestone" },
    { q: "có task nào về API không", isFind: true, kind: "milestone" },
    // find · generic (kind ambiguous)
    { q: "gợi ý gì đó để học thêm phần này", isFind: true, kind: null, note: "generic find, no kind" },
    { q: "tìm tài liệu ôn phần này", isFind: true, kind: null, note: "generic find" },
    { q: "cho tôi thêm tài nguyên về chủ đề này", isFind: true, kind: null, note: "generic find" },

    // NOT find · real content questions (probes)
    { q: "SQL khác NoSQL chỗ nào?", isFind: false, kind: null, probe: true },
    { q: "khi nào nên dùng document database?", isFind: false, kind: null, probe: true },
    { q: "ACID là gì?", isFind: false, kind: null, probe: true },
    { q: "eventual consistency nghĩa là sao?", isFind: false, kind: null, probe: true },
    { q: "polyglot persistence là gì?", isFind: false, kind: null, probe: true },
    { q: "tại sao ghi vào 2 engine không phải transaction nguyên tử?", isFind: false, kind: null, probe: true },
    { q: "tóm tắt phần này giúp tôi", isFind: false, kind: null, probe: true },
    { q: "giải thích outbox pattern", isFind: false, kind: null, probe: true },
    { q: "rủi ro lớn nhất khi tích hợp SQL và NoSQL là gì?", isFind: false, kind: null, probe: true },
    { q: "MongoDB schema có bắt buộc không?", isFind: false, kind: null, probe: true },
    { q: "khi nào nên chọn PostgreSQL thay vì MongoDB?", isFind: false, kind: null, probe: true },
    { q: "NoSQL có thực sự không cần schema không?", isFind: false, kind: null, probe: true },
    { q: "ORM và ODM khác nhau thế nào?", isFind: false, kind: null, probe: true },
    { q: "tại sao chọn sai mô hình lưu trữ lại đắt để sửa?", isFind: false, kind: null, probe: true },
    { q: "saga pattern giải quyết vấn đề gì?", isFind: false, kind: null, probe: true },
    { q: "what is the difference between SQL and NoSQL?", isFind: false, kind: null, probe: true },
    { q: "explain eventual consistency", isFind: false, kind: null, probe: true },
    { q: "when should I use a relational database?", isFind: false, kind: null, probe: true },
    { q: "cho ví dụ về polyglot persistence", isFind: false, kind: null, probe: true },
    { q: "làm sao đảm bảo nhất quán giữa 2 store?", isFind: false, kind: null, probe: true },
    { q: "document model phù hợp với loại dữ liệu nào?", isFind: false, kind: null, probe: true },
    { q: "join trong NoSQL xử lý thế nào?", isFind: false, kind: null, probe: true },
    { q: "transaction phân tán là gì?", isFind: false, kind: null, probe: true },
    { q: "tại sao NoSQL scale ngang dễ hơn?", isFind: false, kind: null, probe: true },
    { q: "denormalization trong NoSQL để làm gì?", isFind: false, kind: null, probe: true },
    { q: "index ảnh hưởng query ra sao?", isFind: false, kind: null, probe: true },
    { q: "mô hình quan hệ mạnh ở điểm nào?", isFind: false, kind: null, probe: true },
    { q: "giải thích câu 'schema chuyển từ database sang application'", isFind: false, kind: null, probe: true },
    { q: "so sánh MongoDB và PostgreSQL", isFind: false, kind: null, probe: true },
    { q: "outbox và saga cái nào tốt hơn?", isFind: false, kind: null, probe: true },
    { q: "nếu team nhỏ nên chọn database gì?", isFind: false, kind: null, probe: true },
    { q: "tại sao interviewer hỏi về polyglot persistence?", isFind: false, kind: null, probe: true },
    { q: "cho tôi một ví dụ code MongoDB", isFind: false, kind: null, probe: true },
    { q: "giải thích lại phần transaction đi", isFind: false, kind: null, probe: true },

    // NOT find · tricky (kind noun present but NOT a find; some are probes)
    { q: "giải thích bài này giúp tôi", isFind: false, kind: null, note: "kind noun, no find-verb", probe: true },
    { q: "bài này khó quá", isFind: false, kind: null, note: "not a question" },
    { q: "phần thử thách trong bài nói về gì?", isFind: false, kind: null, note: "asks ABOUT challenges", probe: true },
    { q: "flashcard là gì?", isFind: false, kind: null, note: "meta, no find-verb", probe: true },
    { q: "milestone nghĩa là gì trong khóa học?", isFind: false, kind: null, note: "meta", probe: true },
    { q: "tôi nên làm challenge trước hay đọc bài trước?", isFind: false, kind: null, note: "strategy, not find" },
    { q: "thẻ ghi nhớ có giúp nhớ lâu không?", isFind: false, kind: null, note: "meta" },
    { q: "dự án cá nhân yêu cầu những gì?", isFind: false, kind: null, note: "asks about project" },
    { q: "bài học này dài không?", isFind: false, kind: null, note: "meta" },
    { q: "phần này có khó với người mới không?", isFind: false, kind: null, note: "meta" },
    // NOT find · adversarial (find-verb substring but NOT a resource-find)
    { q: "tôi muốn tìm hiểu flashcard hoạt động ra sao", isFind: false, kind: null, note: "'tìm hiểu'+kind → regex false-positive risk", probe: true },
    { q: "tìm lỗi trong đoạn code này", isFind: false, kind: null, note: "'tìm' but debugging" },
    { q: "giúp tôi tìm hiểu về ACID", isFind: false, kind: null, note: "'tìm hiểu' = learn", probe: true },
    { q: "tìm cách tối ưu query", isFind: false, kind: null, note: "'tìm cách' = find a way" },
    { q: "find out why my transaction fails", isFind: false, kind: null, note: "'find out' not resource-find" },
    { q: "tôi muốn tìm hiểu sâu hơn về NoSQL", isFind: false, kind: null, note: "'tìm hiểu'", probe: true },
    // NOT find · misc chat
    { q: "cảm ơn bạn", isFind: false, kind: null, note: "smalltalk" },
    { q: "bạn là ai?", isFind: false, kind: null, note: "smalltalk" },
    { q: "học phần này mất bao lâu?", isFind: false, kind: null, note: "meta" },
    { q: "nếu người mới thì bắt đầu từ đâu?", isFind: false, kind: null, note: "meta" },
]

// ── shipped regex classifier (ported from ContentAiChat detectContentIntent) ──
const VERB_RE = /(tìm|find|gợi ý|liệt kê|list|show|kiếm)/i
const KIND_RES: Array<{ re: RegExp, kind: Exclude<Kind, null> }> = [
    { re: /(flashcard|thẻ)/i, kind: "flashcard" },
    { re: /(thử thách|challenge|bài tập)/i, kind: "challenge" },
    { re: /(dự án|milestone|capstone|nhiệm vụ)/i, kind: "milestone" },
    { re: /(bài học|bài|lesson|nội dung)/i, kind: "content" },
]
function regexClassify(text: string): { isFind: boolean, kind: Kind } {
    if (!VERB_RE.test(text)) {
        return { isFind: false, kind: null }
    }
    const kind = KIND_RES.find((entry) => entry.re.test(text))?.kind ?? null
    return { isFind: kind !== null, kind }
}

// ── local model calls ─────────────────────────────────────────────────────
async function chat(system: string, user: string, maxTokens: number): Promise<string> {
    const res = await fetch(`${OLLAMA}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer local-eval" },
        body: JSON.stringify({
            model: CHAT_MODEL,
            messages: [{ role: "system", content: system }, { role: "user", content: user }],
            max_tokens: maxTokens,
            temperature: 0,
            stream: false,
        }),
    })
    const json = await res.json()
    return json.choices?.[0]?.message?.content ?? ""
}

/** Pull the first {...} JSON object out of a model reply (strips ```json fences). */
function extractJson(text: string): any {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
        return null
    }
    try {
        return JSON.parse(match[0])
    } catch {
        return null
    }
}

const CLASSIFY_SYSTEM = `Bạn phân loại câu chat của học viên đang đọc 1 bài học.
Hỏi: câu này có phải yêu cầu TÌM/LIỆT KÊ tài nguyên khóa học (flashcard, bài học, thử thách, dự án) để MỞ ra không?
- Nếu chỉ hỏi kiến thức, nhờ giải thích, tóm tắt, hỏi ý nghĩa 1 từ, hoặc "tìm hiểu/tìm cách" (học sâu) → KHÔNG phải find.
- Nếu muốn được đưa 1 danh sách tài nguyên để chọn → là find; đoán kind gần nhất.
Trả DUY NHẤT 1 JSON: {"isFind": true|false, "kind": "flashcard"|"content"|"challenge"|"milestone"|null}.`

async function llmClassify(q: string): Promise<{ isFind: boolean, kind: Kind }> {
    const raw = await chat(CLASSIFY_SYSTEM, `Câu: "${q}"`, 60)
    const parsed = extractJson(raw)
    if (!parsed || typeof parsed.isFind !== "boolean") {
        return { isFind: false, kind: null }
    }
    const kind: Kind = ["flashcard", "content", "challenge", "milestone"].includes(parsed.kind) ? parsed.kind : null
    return { isFind: parsed.isFind, kind: parsed.isFind ? kind : null }
}

// ── RAG grounding (mirror the chat's retrieveContentExcerpt) ────────────────
async function embed(text: string): Promise<Array<number>> {
    const res = await fetch(`${OLLAMA}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: EMBED_MODEL, input: text }),
    })
    const json = await res.json()
    return json.embeddings[0]
}

async function retrieveExcerpt(question: string, filterKey: string, filterValue: string): Promise<string> {
    const vector = await embed(question)
    const res = await fetch(`${QDRANT}/collections/${COLLECTION}/points/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": QDRANT_KEY },
        body: JSON.stringify({
            vector,
            limit: 6,
            with_payload: true,
            filter: { must: [{ key: filterKey, match: { value: filterValue } }] },
        }),
    })
    const json = await res.json()
    const seen = new Set<string>()
    const parts: Array<string> = []
    for (const point of json.result ?? []) {
        const text = point.payload?.content
        if (typeof text === "string" && !seen.has(text)) {
            seen.add(text)
            parts.push(text)
        }
    }
    return parts.join("\n\n")
}

const ANSWER_SYSTEM = `Bạn là trợ lý học tập. Trả lời NGẮN GỌN, chính xác câu hỏi của học viên, CHỈ dựa trên đoạn trích bài học được cung cấp. Nếu đoạn trích không đủ để trả lời, nói rõ là chưa có đủ thông tin. Trả lời bằng tiếng của câu hỏi.`

const JUDGE_SYSTEM = `Bạn chấm 1 câu trả lời của trợ lý so với ĐOẠN TRÍCH bài học.
Trả DUY NHẤT 1 JSON: {"grounded": true|false, "correct": true|false, "refused": true|false}.
- grounded: câu trả lời bám vào đoạn trích (không bịa ngoài).
- correct: nội dung đúng theo đoạn trích + kiến thức phổ thông đúng.
- refused: trợ lý từ chối / nói không hiểu / không trả lời được.`

// ── concurrency pool ───────────────────────────────────────────────────────
async function pool<T, R>(items: Array<T>, size: number, worker: (item: T, i: number) => Promise<R>): Promise<Array<R>> {
    const out: Array<R> = new Array(items.length)
    let cursor = 0
    let done = 0
    async function lane(): Promise<void> {
        while (cursor < items.length) {
            const i = cursor++
            out[i] = await worker(items[i], i)
            done++
            process.stdout.write(`\r  ${done}/${items.length}`)
        }
    }
    await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => lane()))
    process.stdout.write("\n")
    return out
}

function pct(n: number, d: number): string {
    return d === 0 ? "n/a" : `${((100 * n) / d).toFixed(1)}%`
}

// ── main ───────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
    console.log("=".repeat(72))
    console.log(`Content-AI chat eval · model=${CHAT_MODEL} · ${CASES.length} cases`)
    console.log("=".repeat(72))

    // decide grounding filter: prefer the lesson, fall back to the course
    const countRes = await fetch(`${QDRANT}/collections/${COLLECTION}/points/count`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": QDRANT_KEY },
        body: JSON.stringify({ exact: true, filter: { must: [{ key: "metadata.contentId", match: { value: LESSON_ID } }] } }),
    })
    const lessonChunks = (await countRes.json()).result?.count ?? 0
    const filterKey = lessonChunks > 0 ? "metadata.contentId" : "metadata.courseId"
    const filterValue = lessonChunks > 0 ? LESSON_ID : COURSE_ID
    console.log(`grounding: ${filterKey}=${(lessonChunks > 0 ? LESSON_ID : COURSE_ID).slice(0, 8)} (lesson chunks=${lessonChunks})\n`)

    // ── Part A: intent routing (regex + 7b) ──
    console.log("Part A · intent routing (7b classifier)...")
    const llmPreds = await pool(CASES, CONCURRENCY, (c) => llmClassify(c.q))

    const regexPreds = CASES.map((c) => regexClassify(c.q))
    const score = (preds: Array<{ isFind: boolean, kind: Kind }>) => {
        let findAcc = 0
        let kindAcc = 0
        let kindTotal = 0
        let fp = 0
        let fn = 0
        CASES.forEach((c, i) => {
            const p = preds[i]
            if (p.isFind === c.isFind) {
                findAcc++
            }
            if (p.isFind && !c.isFind) {
                fp++
            }
            if (!p.isFind && c.isFind) {
                fn++
            }
            if (c.isFind && c.kind) {
                kindTotal++
                if (p.kind === c.kind) {
                    kindAcc++
                }
            }
        })
        return { findAcc, kindAcc, kindTotal, fp, fn }
    }
    const rx = score(regexPreds)
    const ll = score(llmPreds)
    console.log("\n" + "-".repeat(72))
    console.log(`${"classifier".padEnd(12)} ${"find-acc".padStart(10)} ${"kind-acc".padStart(12)} ${"false-pos".padStart(10)} ${"false-neg".padStart(10)}`)
    console.log(`${"regex MVP".padEnd(12)} ${pct(rx.findAcc, CASES.length).padStart(10)} ${`${pct(rx.kindAcc, rx.kindTotal)}`.padStart(12)} ${String(rx.fp).padStart(10)} ${String(rx.fn).padStart(10)}`)
    console.log(`${"qwen 7b".padEnd(12)} ${pct(ll.findAcc, CASES.length).padStart(10)} ${`${pct(ll.kindAcc, ll.kindTotal)}`.padStart(12)} ${String(ll.fp).padStart(10)} ${String(ll.fn).padStart(10)}`)
    console.log("-".repeat(72))
    console.log("disagreements vs gold (isFind):")
    CASES.forEach((c, i) => {
        const r = regexPreds[i]
        const l = llmPreds[i]
        if (r.isFind !== c.isFind || l.isFind !== c.isFind) {
            const flags = [r.isFind !== c.isFind ? "REGEX✗" : "regex✓", l.isFind !== c.isFind ? "7b✗" : "7b✓"].join(" ")
            console.log(`  [gold=${c.isFind ? "find" : "chat "}] ${flags}  "${c.q.slice(0, 52)}"${c.note ? ` (${c.note})` : ""}`)
        }
    })

    // ── Part B: answer quality (7b answer + 7b judge) ──
    const probes = CASES.filter((c) => c.probe)
    console.log(`\nPart B · answer quality on ${probes.length} probes (7b answer → 7b judge)...`)
    const answers = await pool(probes, CONCURRENCY, async (c) => {
        const excerpt = await retrieveExcerpt(c.q, filterKey, filterValue)
        const answer = await chat(ANSWER_SYSTEM, `Đoạn trích bài học:\n"""${excerpt.slice(0, 3500)}"""\n\nCâu hỏi: ${c.q}`, 320)
        const judgeRaw = await chat(JUDGE_SYSTEM, `Đoạn trích:\n"""${excerpt.slice(0, 3000)}"""\n\nCâu hỏi: ${c.q}\n\nTrả lời của trợ lý:\n"""${answer}"""`, 60)
        const verdict = extractJson(judgeRaw) ?? {}
        return {
            q: c.q,
            answer,
            grounded: verdict.grounded === true,
            correct: verdict.correct === true,
            refused: verdict.refused === true,
        }
    })
    const grounded = answers.filter((a) => a.grounded).length
    const correct = answers.filter((a) => a.correct).length
    const refused = answers.filter((a) => a.refused).length
    console.log("\n" + "-".repeat(72))
    console.log(`answers: ${answers.length}  ·  grounded ${pct(grounded, answers.length)}  ·  correct ${pct(correct, answers.length)}  ·  refused ${refused}`)
    console.log("-".repeat(72))
    console.log("failed / refused probes:")
    for (const a of answers.filter((a) => !a.correct || a.refused)) {
        console.log(`  ✗ "${a.q.slice(0, 50)}" → ${a.answer.replace(/\s+/g, " ").slice(0, 90)}`)
    }

    require("node:fs").writeFileSync(
        `${process.cwd()}/scripts/.out-content-chat-eval.json`,
        JSON.stringify({
            model: CHAT_MODEL,
            partA: { regex: rx, llm: ll, cases: CASES.map((c, i) => ({ ...c, regex: regexPreds[i], llm: llmPreds[i] })) },
            partB: { grounded, correct, refused, total: answers.length, answers },
        }, null, 2),
    )
    console.log(`\nfull detail → scripts/.out-content-chat-eval.json`)
}

main().catch((error: unknown) => {
    console.error("\nEVAL FAILED:", error)
    process.exit(1)
})
