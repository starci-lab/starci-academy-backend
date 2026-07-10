export const meta = {
  name: 'migrate-github',
  description: 'Tách 1-repo/module → 1-repo/content. INVARIANT: mỗi content = đúng 1 repo (đủ số như trong bài viết); source chung thì Opus tách, thiếu thì bổ sung. Sonnet code, check file-only (KHÔNG e2e), PUSH repo thật (private/public theo premium). KHÔNG xoá repo module cũ.',
  phases: [
    { title: 'Decide', detail: 'Opus: phân bổ file cho từng content (tách collision, leak-guard public), đảm bảo đủ 1 repo/content', model: 'opus' },
    { title: 'Stage', detail: 'Sonnet chép/tách source → staging git-ready per-content (bổ sung nếu thiếu)' },
    { title: 'Pivot', detail: 'Sonnet rewrite link repo trong bodies vi/en (.gitrefs)' },
    { title: 'Check', detail: 'diff/grep file-only + viết migrate.md' },
    { title: 'Push', detail: 'gh repo create + push thật lên org (private/public)' },
  ],
}

// ─── args (minimal per-module; workflow TỰ discover contents) ─────────────────
// Workflow runtime có thể truyền args dạng STRING → parse phòng hờ.
const A = typeof args === 'string' ? JSON.parse(args) : args
const RULES = '.audits/rules/migrate-github.md'
const REPO_ROOT = A.repoRoot
const COURSE = A.course
const MODULE_FOLDER = A.moduleFolder            // vd "1-database-integration-and-caching"
const MODULE_NUM = A.moduleNum                  // = folderIdx + 1 (kế thừa repo cũ)
const OLD_SLUG = MODULE_FOLDER.replace(/^\d+-/, '')
const MODULE_SLUG_NEW = A.moduleSlugNew || OLD_SLUG   // chỉ m0 fullstack đổi (nestjs→framework)
const ORG = A.org
const PREFIX = A.prefix || 'fs'                       // 'fs' fullstack | 'sd' system-design
// oldRepo = tên repo THAM CHIẾU TRONG BODY (cho discover/pivot/check). fullstack suy theo index.
const OLD_REPO = A.oldRepo || `fullstack-mastery-module-${MODULE_NUM}-${OLD_SLUG}`
const GITREFS = `.gitrefs/data/courses/${COURSE}/modules/${MODULE_FOLDER}`
// repoDir = folder .repo chứa SOURCE CODE thật (SD: tên có thể KHÁC oldRepo vì số .repo lệch số trong body).
const REPO_DIR = `.repo/${A.repoDir || OLD_REPO}`
const STAGE = `.audits/.migrate-tmp/${MODULE_FOLDER}`
const repoName = (c) => `${PREFIX}-${MODULE_NUM}-${MODULE_SLUG_NEW}-${c.idx}-${c.slugNoIdx}`

// ─── Phase 0: DISCOVER (deterministic grep qua agent; script không có FS) ─────
phase('Discover')
const DISCOVER_SCHEMA = {
  type: 'object',
  required: ['contents', 'orphanSubdirs'],
  properties: {
    contents: {
      type: 'array',
      items: {
        type: 'object',
        required: ['idx', 'slug', 'slugNoIdx', 'premium', 'sourceSubdir', 'cdConsistent', 'collision', 'repoable'],
        properties: {
          idx: { type: 'number' },
          slug: { type: 'string' },
          slugNoIdx: { type: 'string', description: 'slug bỏ tiền tố "<idx>-"' },
          premium: { type: 'boolean' },
          sourceSubdir: { type: ['string', 'null'], description: 'path sau "cd <oldRepo>/" (có thể sâu, vd "x/frontend"); null nếu NO-CLONE' },
          cdConsistent: { type: 'boolean', description: 'mọi file body của content trỏ cùng 1 subdir' },
          collision: { type: 'boolean', description: 'subdir này bị >1 content dùng chung' },
          repoable: { type: 'boolean', description: 'false nếu sourceSubdir=null (bài khái niệm, không có repo)' },
        },
      },
    },
    orphanSubdirs: { type: 'array', items: { type: 'string' } },
  },
}
const disc = await agent(
  `DISCOVER module "${MODULE_FOLDER}" (course ${COURSE}). Repo root: ${REPO_ROOT}. Dùng grep/ls (deterministic), KHÔNG suy đoán.
Contents dir: ${REPO_ROOT}/${GITREFS}/contents/. Old module repo (source): ${REPO_ROOT}/${REPO_DIR}/. Old repo name: "${OLD_REPO}".
Với MỖI content folder "<idx>-<slug>":
- idx = số đầu folder; slug = tên folder; slugNoIdx = bỏ "<idx>-".
- premium: đọc "${REPO_ROOT}/${GITREFS}/contents/<folder>/vi.md", lấy giá trị dòng ngay sau "# isPremium" (true/false; bỏ qua dòng separator).
- sourceSubdir: grep trong "<folder>/bodies/*/*.md" lấy path X ngay sau "${OLD_REPO}/" ở BẤT KỲ dòng nào — "cd ${OLD_REPO}/<X>", HOẶC "npm install --prefix ${OLD_REPO}/<X>", HOẶC bất kỳ ref "${OLD_REPO}/<X>" nào (X có thể nhiều segment vd "a/frontend"; với --prefix lấy segment đầu = thư mục content, vd "0-nextjs-vs-vite"). repoable=true nếu content có BẤT KỲ ref nào tới "${OLD_REPO}" (kể cả chỉ "git clone .../${OLD_REPO}.git"). CHỈ khi content KHÔNG có ref "${OLD_REPO}" nào (bài thuần khái niệm, không clone) → sourceSubdir=null, repoable=false.
- cdConsistent: mọi file body của content cho cùng 1 X.
- collision: true nếu X bị >=2 content khác nhau dùng.
orphanSubdirs: liệt kê thư mục con trong ${REPO_ROOT}/${REPO_DIR}/ KHÔNG content nào trỏ tới (bỏ .git, file).
Trả structured (sort contents theo idx).`,
  { model: 'sonnet', label: `discover:${MODULE_FOLDER}`, phase: 'Discover', schema: DISCOVER_SCHEMA },
)
// chuẩn hoá M.contents cho các phase sau (chỉ content repoable mới migrate)
const M = {
  course: COURSE, moduleOld: MODULE_FOLDER, moduleNew: MODULE_FOLDER, moduleSlugNew: MODULE_SLUG_NEW,
  moduleNum: MODULE_NUM, org: ORG, oldRepo: OLD_REPO, gitrefs: GITREFS, repoDir: REPO_DIR, repoRoot: REPO_ROOT,
  orphanSubdirs: disc?.orphanSubdirs ?? [],
  contents: (disc?.contents ?? []).filter(c => c.repoable && c.sourceSubdir),
}
const skippedContents = (disc?.contents ?? []).filter(c => !c.repoable || !c.sourceSubdir)
log(`Discover: ${M.contents.length} content repoable, ${skippedContents.length} skip (no-clone), orphans=${M.orphanSubdirs.length}`)
if (!M.contents.length) {
  log('⚠️ Không content repoable — dừng module này.')
  return { module: MODULE_FOLDER, skipped: true, reason: 'no repoable content', skippedContents }
}

// ─── schemas ─────────────────────────────────────────────────────────────────
const DECISION_SCHEMA = {
  type: 'object',
  required: ['perContent', 'orphan', 'summary'],
  properties: {
    perContent: {
      type: 'array',
      description: 'PHẢI có đúng 1 phần tử cho MỖI content (đủ số). Không bỏ content nào.',
      items: {
        type: 'object',
        required: ['idx', 'repo', 'visibility', 'sourceStrategy', 'includePaths', 'supplement', 'leakSafe', 'rationale'],
        properties: {
          idx: { type: 'number' },
          repo: { type: 'string' },
          visibility: { type: 'string', enum: ['public', 'private'] },
          // full = chép nguyên subdir (content sở hữu riêng subdir);
          // partition = subdir dùng chung → chỉ chép includePaths thuộc content này.
          sourceStrategy: { type: 'string', enum: ['full', 'partition'] },
          includePaths: { type: 'array', items: { type: 'string' }, description: 'rel paths trong source subdir (rỗng nếu full)' },
          supplement: { type: 'boolean', description: 'true nếu phần source của content này quá mỏng/thiếu và cần bổ sung (README mô tả + scaffolding tối thiểu) để repo vẫn đứng độc lập' },
          supplementNote: { type: 'string' },
          leakSafe: { type: 'boolean', description: 'repo public TUYỆT ĐỐI không chứa file đặc thù của bài premium chung subdir' },
          rationale: { type: 'string' },
        },
      },
    },
    orphan: {
      type: 'array',
      items: {
        type: 'object',
        required: ['subdir', 'action', 'rationale'],
        properties: {
          subdir: { type: 'string' },
          action: { type: 'string', enum: ['ignore', 'attach', 'delete-local'] },
          rationale: { type: 'string' },
        },
      },
    },
    summary: { type: 'string' },
  },
}

const STAGE_SCHEMA = {
  type: 'object',
  required: ['repo', 'staged', 'fileCount', 'gitReady', 'notes'],
  properties: {
    repo: { type: 'string' },
    staged: { type: 'boolean' },
    fileCount: { type: 'number' },
    gitReady: { type: 'boolean', description: 'staging đã git init + commit + branch main' },
    notes: { type: 'string' },
  },
}

const PIVOT_SCHEMA = {
  type: 'object',
  required: ['idx', 'filesEdited', 'cdNew', 'cloneNew', 'notes'],
  properties: {
    idx: { type: 'number' },
    filesEdited: { type: 'number' },
    cdNew: { type: 'string', description: 'dòng cd mới (phải giống nhau mọi file của content này)' },
    cloneNew: { type: 'string' },
    notes: { type: 'string' },
  },
}

const CHECK_SCHEMA = {
  type: 'object',
  required: ['pass', 'staleHits', 'cdConsistent', 'repoCountOk', 'notes'],
  properties: {
    pass: { type: 'boolean' },
    staleHits: { type: 'number', description: 'số link/subdir repo cũ còn sót trong bodies đã sửa (kỳ vọng 0)' },
    cdConsistent: { type: 'boolean', description: 'mỗi content: dòng cd mới trùng hết mọi file' },
    repoCountOk: { type: 'boolean', description: 'số staging repo == số content' },
    notes: { type: 'string' },
  },
}

const PUSH_SCHEMA = {
  type: 'object',
  required: ['pushed', 'rows', 'notes'],
  properties: {
    pushed: { type: 'number' },
    rows: { type: 'array', items: { type: 'object' } },
    notes: { type: 'string' },
  },
}

// ─── Phase 1: DECIDE (Opus) ──────────────────────────────────────────────────
phase('Decide')
// Gom nhóm collision: subdir bị nhiều content dùng chung (có rủi ro leak nếu mix public+private)
const bySub = new Map()
for (const c of M.contents) {
  if (!bySub.has(c.sourceSubdir)) bySub.set(c.sourceSubdir, [])
  bySub.get(c.sourceSubdir).push(c)
}
const collisionGroups = [...bySub.entries()].filter(([, cs]) => cs.length > 1)
const collisionText = collisionGroups.length
  ? collisionGroups.map(([sub, cs]) => `  • subdir "${sub}" dùng chung bởi: ${cs.map(c => `content ${c.idx} "${c.slug}" (${c.premium ? 'PRIVATE' : 'PUBLIC'})`).join(', ')}`).join('\n')
  : '  (KHÔNG có collision — mỗi content 1 subdir riêng → tất cả sourceStrategy="full")'
const decision = await agent(
  `Bạn RA QUYẾT ĐỊNH migrate GitHub cho module "${M.moduleOld}" (course ${M.course}). Repo root: ${REPO_ROOT}.
ĐỌC rules: ${REPO_ROOT}/${RULES} (§1 naming, §3 chép source, §5 check).

INVARIANT: **mỗi content = ĐÚNG 1 repo** (${M.contents.length} content → ${M.contents.length} repo). KHÔNG gộp, KHÔNG bỏ. Source mỏng thì BỔ SUNG (supplement=true), không loại.

CONTENT (đã verify cd trùng mọi file mỗi content):
${M.contents.map(c => `- content ${c.idx} "${c.slug}" | isPremium=${c.premium} → repo ${c.premium ? 'PRIVATE' : 'PUBLIC'} | source subdir: "${c.sourceSubdir}"${c.collision ? ' | ⚠️CHUNG' : ''}`).join('\n')}
- Subdir mồ côi: ${JSON.stringify(M.orphanSubdirs)} → thường action="ignore".
- Source code thật: ${REPO_ROOT}/${M.repoDir}/<subdir>/.

COLLISION (nhiều content chung 1 subdir):
${collisionText}

NHIỆM VỤ — với MỖI content quyết:
1. sourceStrategy:
   - "full": content sở hữu RIÊNG subdir (không nằm trong nhóm collision) → repo chép NGUYÊN subdir. includePaths=[].
   - "partition": content NẰM TRONG nhóm collision → liệt kê includePaths (rel trong subdir) thuộc RIÊNG content này, để mỗi content 1 repo độc lập.
2. ⚠️ LEAK GUARD (cứng, CHỈ áp dụng khi có collision PUBLIC+PRIVATE chung subdir): repo PUBLIC TUYỆT ĐỐI không chứa file đặc thù của bài PRIVATE/premium chung subdir. Với mỗi nhóm collision có cả public lẫn private: ĐỌC THẬT cây thư mục subdir + bodies vi/en của các content liên quan (${REPO_ROOT}/${M.gitrefs}/contents/<slug>/bodies/) để phân loại file theo content. Repo public chỉ gồm file của bài public; file đặc thù bài premium (kể cả shared-wiring import nó) KHÔNG vào repo public → nếu vì thế repo public quá mỏng/không tự chạy thì supplement=true + supplementNote (README + scaffold tối thiểu). leakSafe phản ánh kết quả.
3. visibility = premium?private:public. Nếu KHÔNG collision: mọi content "full", leakSafe=true, supplement=false.

CHỈ phân tích + quyết (đọc file OK), KHÔNG sửa file/không tạo repo. Trả structured đúng ${M.contents.length} phần tử perContent.`,
  { model: 'opus', label: `decide:${M.moduleOld}`, phase: 'Decide', schema: DECISION_SCHEMA },
)
log(`Decision: ${decision?.summary ?? '(none)'} | perContent=${decision?.perContent?.length}`)
const decByIdx = new Map((decision?.perContent ?? []).map(d => [d.idx, d]))

// ─── Phase 2+3: STAGE → PIVOT (pipeline per content, đủ mọi content) ──────────
const results = await pipeline(
  M.contents,
  // Stage: chép/tách source → staging git-ready (bổ sung nếu thiếu)
  async (c) => {
    const d = decByIdx.get(c.idx) ?? { sourceStrategy: 'full', includePaths: [], visibility: c.premium ? 'private' : 'public', supplement: false }
    const repo = repoName(c)
    const r = await agent(
      `CHÉP SOURCE GỐC (không build, không sửa code) cho repo "${repo}" — INVARIANT: repo này PHẢI được tạo.
Repo root: ${REPO_ROOT}. Source subdir: ${REPO_ROOT}/${M.repoDir}/${c.sourceSubdir}/. Staging đích (tạo mới, sạch): ${REPO_ROOT}/${STAGE}/${repo}/.
Chiến lược: ${d.sourceStrategy}${d.sourceStrategy === 'partition' ? ` — CHỈ chép includePaths: ${JSON.stringify(d.includePaths)}` : ' — chép NGUYÊN subdir (bỏ .git)'}.
${d.supplement ? `BỔ SUNG (source mỏng): ${d.supplementNote || 'tạo README.md mô tả bài + giữ scaffolding tối thiểu để repo đứng độc lập.'}` : ''}
Bước: tạo staging dir; copy file (bỏ .git/node_modules/dist); rồi git-ready: \`git init\`, \`git add -A\`, \`git commit -m "init from ${M.oldRepo}/${c.sourceSubdir}"\`, \`git branch -M main\` (chạy TRONG staging dir). Đếm fileCount, set gitReady. Trả structured.`,
      { model: 'sonnet', label: `stage:${c.slug}`, phase: 'Stage', schema: STAGE_SCHEMA },
    )
    return { ...r, _c: c, _d: d }
  },
  // Pivot: luôn sửa link repo trong bodies (mọi content đều có repo)
  async (staged, c) => {
    const repo = repoName(c)
    const url = `https://github.com/${M.org}/${repo}`
    const r = await agent(
      `PIVOT link repo trong bodies của content "${c.slug}" (idx ${c.idx}). Repo root: ${REPO_ROOT}.
Bodies: ${REPO_ROOT}/${M.gitrefs}/contents/${c.slug}/bodies/<lang>/{vi,en}.md (4 lang × 2 locale). ĐỌC rules §2b: ${REPO_ROOT}/${RULES}. (CHỈ sửa bodies/ — file content-root contents/<slug>/{vi,en}.md KHÔNG dùng, seeder bỏ qua → KHÔNG đụng.)
Trong MỖI file, sửa đúng 3 chỗ (giữ văn phong, chỉ đổi URL/đường dẫn):
1) "Source: [...](...)" → repo MỚI "${M.org}/${repo}" (${url}); BỎ HẲN mệnh đề "— thư mục bài học/lesson directory [\`...\`](.../tree/main/${c.sourceSubdir})" (repo mới chính là content ở root).
2) "git clone .../${M.oldRepo}.git" → "git clone ${url}.git".
3) "cd ${M.oldRepo}/${c.sourceSubdir}" → "cd ${repo}".
4) QUÉT TOÀN FILE: nếu CÒN BẤT KỲ ref nào tới repo cũ "${M.oldRepo}" (vd note/blockquote "Lưu ý", link cross-language [\`...\`](.../tree/main/${c.sourceSubdir}), link prose) → CŨNG đổi URL sang repo MỚI "${repo}" (giữ nguyên text; link "/tree/main/${c.sourceSubdir}" → trỏ root repo mới ${url}). Mục tiêu: sau pivot, grep "${M.oldRepo}" trong file = 0 hit.
CẤM đụng: code thật trong fence không liên quan repo, dep github.com/... KHÁC (vd github.com/gin-gonic), separators, dòng cd nội-bộ kiểu "cd backend/3-go".
Xác nhận dòng cd mới = "cd ${repo}" GIỐNG HỆT mọi file VÀ grep "${M.oldRepo}" = 0. Đếm filesEdited. Trả structured.`,
      { model: 'sonnet', label: `pivot:${c.slug}`, phase: 'Pivot', schema: PIVOT_SCHEMA },
    )
    return { content: c.slug, idx: c.idx, repo, visibility: staged?._d?.visibility ?? (c.premium ? 'private' : 'public'), supplement: !!staged?._d?.supplement, leakSafe: staged?._d?.leakSafe !== false, stage: { staged: staged?.staged, fileCount: staged?.fileCount, gitReady: staged?.gitReady }, pivot: r }
  },
)

// ─── Phase 4: CHECK (file-only) ──────────────────────────────────────────────
phase('Check')
const check = await agent(
  `KIỂM TRA file-only (KHÔNG e2e) module "${M.moduleNew}". Repo root: ${REPO_ROOT}. ĐỌC rules §5: ${REPO_ROOT}/${RULES}.
Content: ${JSON.stringify(M.contents.map(c => ({ idx: c.idx, slug: c.slug, premium: c.premium, repo: repoName(c), sourceSubdir: c.sourceSubdir })))}
Staging: ${REPO_ROOT}/${STAGE}/. Bodies: ${REPO_ROOT}/${M.gitrefs}/contents/<slug>/bodies/ (CHỈ grep stale trong bodies/; file content-root contents/<slug>/{vi,en}.md KHÔNG dùng → BỎ QUA, không tính stale).
1) STALE: chỉ tính reference tới REPO CŨ — pattern "${M.oldRepo}" (ở bất kỳ đâu, kể cả trong link /tree/main/) hoặc "cd ${M.oldRepo}" → staleHits (kỳ vọng 0). LƯU Ý: link "[\`frontend\`](https://github.com/${M.org}/fs-...-/tree/main/frontend)" trỏ tới REPO MỚI (fs-...) là HỢP LỆ (cấu trúc nội bộ repo mới), KHÔNG tính stale.
2) CD CONSISTENT: với MỖI content, dòng cd-sau-clone của vi.md & en.md CÙNG MỘT lang phải GIỐNG nhau. Bài 4-lang có thể có cd KHÁC nhau GIỮA các lang (vd TS="cd <repo>", Java="cd <repo>/1-java") vì cấu trúc repo khác theo lang — ĐÚNG, KHÔNG tính lỗi. cdConsistent=false CHỈ khi vi≠en cùng 1 lang, hoặc cd còn trỏ repo cũ.
3) REPO COUNT: số thư mục staging == ${M.contents.length} (đủ 1 repo/content).
4) LEAK: repo public — staging KHÔNG chứa file đặc thù bài premium chung subdir.
Viết "${REPO_ROOT}/${M.gitrefs}/migrate.md" (bảng: idx | content | repo | visibility | strategy | stage-files | supplement | cd-mới | stale | leak-safe).
Trả structured (pass = staleHits==0 && cdConsistent && repoCountOk && mọi public leak-safe).`,
  { model: 'sonnet', label: 'check:files', phase: 'Check', schema: CHECK_SCHEMA },
)
log(`Check pass=${check?.pass} stale=${check?.staleHits} cdOk=${check?.cdConsistent} countOk=${check?.repoCountOk}`)

// ─── Phase 5: PUSH (thật lên org; skip nếu public mà leak) ────────────────────
phase('Push')
const pushable = results.filter(r => r && r.stage?.gitReady && (r.visibility === 'private' || r.leakSafe))
const push = await agent(
  `PUSH repo thật lên org "${M.org}". Repo root: ${REPO_ROOT}. Mỗi staging là git repo đã commit (branch main).
Danh sách (đã qua leak-guard): ${JSON.stringify(pushable.map(r => ({ repo: r.repo, visibility: r.visibility, dir: `${STAGE}/${r.repo}` })))}
Với MỖI repo, dùng gh (đã auth sẵn):
  gh repo create ${M.org}/<repo> --<public|private> --source ${REPO_ROOT}/${STAGE}/<repo> --remote origin --push
  - Idempotent: nếu repo đã tồn tại (gh repo view ${M.org}/<repo> ok) → KHÔNG create lại; thêm remote origin (nếu chưa) rồi \`git push -u origin main\` từ staging dir; chỉnh visibility cho khớp bằng \`gh repo edit ${M.org}/<repo> --visibility <public|private> --accept-visibility-change-consequences\`.
  - Sau push: \`gh repo view ${M.org}/<repo> --json name,visibility,url\` để xác nhận TỒN TẠI + visibility ĐÚNG.
TUYỆT ĐỐI KHÔNG xoá/đụng repo module cũ "${M.oldRepo}". Báo rows [{repo, visibility, url, ok}] + pushed=count ok. Trả structured.`,
  { model: 'sonnet', label: 'push:org', phase: 'Push', schema: PUSH_SCHEMA },
)
log(`Push: ${push?.pushed} repo lên org. ${push?.notes ?? ''}`)

return {
  module: M.moduleNew,
  decision,
  results,
  check,
  push,
  skippedNoClone: skippedContents.map(c => ({ slug: c.slug, reason: 'no-clone/concept lesson' })),
  skippedPush: results.filter(r => r && !(r.stage?.gitReady && (r.visibility === 'private' || r.leakSafe))).map(r => ({ repo: r.repo, why: !r.stage?.gitReady ? 'not-git-ready' : 'public-leak' })),
}
