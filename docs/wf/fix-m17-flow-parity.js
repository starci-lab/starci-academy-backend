export const meta = {
  name: 'fix-m17-flow-parity',
  description: 'Fix cross-lang §2.1.5 flow-status parity in SD M17 (L0,L1) + FS M17 (L1,L2,L3): regenerate divergent-language bodies with a pinned flow set matching the canonical (TypeScript) order',
  phases: [{ title: 'Parity fix' }],
}

const SD17 = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\16-distributed-file-storage-content-delivery-network\\contents'
const FS17 = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\0-fullstack-mastery\\modules\\16-observability-logs-tracing-errors\\contents'

// Each target lesson: the CANONICAL lang (0-typescript) defines the flow structure; only the listed divergent langs are regenerated.
const LESSONS = [
  { base: SD17, slug: '0-file-chunking-and-metadata-storage', langs: ['1-java'],
    flows: [
      'Flow 1 (HTTP 201): POST /api/files/upload -> manifest {fileId,chunkCount,chunks[]}',
      'Flow 2 (HTTP 200): GET /api/files/:fileId -> manifest; include a SECONDARY check that an unknown fileId returns 404 (but the FIRST request/response in this flow is the 200 manifest read)',
      'Flow 3 (HTTP 200): GET /api/files/:fileId/chunks -> the chunk list',
    ] },
  { base: SD17, slug: '1-data-deduplication-and-resumable-uploads', langs: ['1-java', '2-csharp', '3-go'],
    flows: [
      'Flow 1 (HTTP 201): POST /api/uploads -> {sessionId,uploadOffset}; write the first chunk (dedup MISS)',
      'Flow 2 (HTTP 200): write a DUPLICATE chunk (dedup HIT, bytesSaved>0) then GET /api/dedup/stats -> {uniqueChunks,totalReferences,savingsPercent}',
      'Flow 3 (HTTP 200): GET /api/uploads/:id to read the current Upload-Offset, then PATCH at the CORRECT offset to resume',
      'Flow 4 (HTTP 400): PATCH /api/uploads/:id with a WRONG offset -> rejected',
    ] },
  { base: FS17, slug: '1-opentelemetry-distributed-tracing', langs: ['2-csharp', '3-go'],
    flows: [
      'Flow 1 (HTTP 200): POST /api/v1/orders/:id/charge -> 200; the span orders.charge is created',
      'Flow 2 (HTTP 500): POST /api/v1/orders/fail-xxx/charge (fail- prefix) -> 500; the span status is ERROR and recordException is recorded',
      'Flow 3 (HTTP 200): a normal charge again, then inspect the trace/span tree in the Jaeger UI (parent HTTP span + child orders.charge span)',
    ] },
  { base: FS17, slug: '2-sentry-fe-and-be-integration', langs: ['1-java', '2-csharp'],
    flows: [
      'Flow 1 (HTTP 200): POST /api/v1/orders (happy path) -> 200; NOT sent to Sentry',
      'Flow 2 (HTTP 500): POST /api/v1/orders {forceError:true} -> 500; captured in Sentry (only 5xx reported)',
      'Flow 3 (HTTP 400): a 4xx client/validation error -> 400; NOT sent to Sentry (proves the 5xx-only filter)',
      'Flow 4 (HTTP 500): a frontend-triggered error that reaches the backend (FE-BE stitched via sentry-trace) -> another captured 5xx',
    ] },
  { base: FS17, slug: '3-health-readiness-liveness-probes', langs: ['1-java', '2-csharp', '3-go'],
    flows: [
      'Flow 1 (HTTP 200): GET /health/live (DB only) -> 200 up',
      'Flow 2 (HTTP 200): GET /health/ready (DB + Redis) -> 200 up',
      'Flow 3 (HTTP 200): GET /health/startup -> 200 warmed',
      'Flow 4 (HTTP 503): stop a dependency (e.g. Redis) then GET /health/ready -> 503 down',
    ] },
]

const LOCALES = ['vi', 'en']

const targets = []
for (const L of LESSONS) for (const lang of L.langs) for (const loc of LOCALES) {
  targets.push({ base: L.base, slug: L.slug, lang, loc, flows: L.flows })
}

phase('Parity fix')
await parallel(targets.map(t => () => {
  const isVI = t.loc === 'vi'
  const file = `${t.base}\\${t.slug}\\bodies\\${t.lang}\\${t.loc}.md`
  const canon = `${t.base}\\${t.slug}\\bodies\\0-typescript\\${t.loc}.md`
  const flowList = t.flows.map((f, i) => `  ${i + 1}. ${f}`).join('\n')
  return agent(
    `Fix the cross-language flow parity of ONE existing lesson body file by rewriting ONLY its "#### 2.1.5. ${isVI ? 'Kiểm thử' : 'Testing'}" section. Everything else in the file stays the same.

TARGET FILE (rewrite in place): ${file}
CANONICAL reference for flow structure (same lesson, TypeScript, same locale): ${canon}

STEP 1 — Read the TARGET file (${file}) fully. Read the CANONICAL file's 2.1.5 section (${canon}) to mirror its flow count, ordering, and the exact (HTTP <status>) labels.

STEP 2 — Rewrite the TARGET file with the Write tool, keeping it byte-for-byte identical EXCEPT the "#### 2.1.5" section, which you replace so its flows EXACTLY match this pinned set (identical first HTTP status per flow across all 4 languages):
${flowList}

RULES for the new 2.1.5 section:
- One "##### 2.1.5.N. ${isVI ? 'Luồng N' : 'Flow N'} — ..." heading per pinned flow above, in THIS ORDER. The FIRST request+response shown under each flow MUST carry the (HTTP <status>) given for that flow. If a flow has secondary checks (e.g. the 404 in SD L0 Flow 2), put them AFTER the primary request so the primary status comes first.
- Keep THIS file's language idioms for the commands: PowerShell (Invoke-RestMethod) FIRST then curl. The JSON request/response VALUES must be identical to the canonical TypeScript body (same numbers, same shapes) — only prose is translated.
- Each flow ends with an italic *${isVI ? 'Kết luận:' : 'Conclusion:'} ...* line. Use :::muted callouts for any step sub-blocks; never "### 1." headings. Every code fence has a language tag. No <!-- @starci/seperator --> inside fences.
- ${isVI ? 'Tiếng Việt đầy đủ dấu; code comments in ENGLISH.' : 'English prose; code comments in ENGLISH.'}
- Do NOT change sections 1, 2.1.1-2.1.4, 2.1.6, 2.1.7, 2.2, 3, or the # lang / # body headers. Preserve the SAME number of <!-- @starci/seperator --> as the original file (the body has exactly the header separators; 2.1.5 content has none inside it).

Return ONLY: {"file":"${t.slug}/${t.lang}/${t.loc}","done":true}.`,
    { label: `fix:${t.slug.slice(0, 6)}:${t.lang}:${t.loc}`, phase: 'Parity fix', model: 'sonnet', agentType: 'general-purpose' }
  ).catch(() => null)
}))

return { fixed: targets.length, lessons: LESSONS.map(l => l.slug) }
