export const meta = {
  name: 'fix-vite-port',
  description: 'Per-module (1 agent/repo, song song): chuan hoa Vite port-in-source toan bo lesson FE Vite. Pin server.port trong frontend/vite.config.ts (KHONG CLI -p/--port); docs bodies -> `npm run dev` (bo flag), align prose port. Commit+push CHI vite.config.ts vao .repo (docs .mount giu lai cho content push). Idempotent: da chuan thi skip, KHONG empty commit.',
  phases: [
    { title: 'FixVitePort', detail: 'per-module: pin config + sua docs + commit/push repo', model: 'sonnet' },
  ],
}

// invoke: Workflow({ scriptPath: ".claude/docs/workflows/fix-vite-port.js", args: { modules: ["5-form-mastery-rhf-zod", ...] } })
function asObj(a) { if (!a) return {}; if (typeof a === 'object') return a; if (typeof a === 'string') { const s = a.trim(); if (s.startsWith('{')) { try { return JSON.parse(s) } catch (e) {} } if (s.startsWith('[')) { try { return { modules: JSON.parse(s) } } catch (e) {} } return { modules: [s] } } return {} }
const ARGS = asObj(args)
const MODULES = Array.isArray(ARGS.modules) ? ARGS.modules : (ARGS.modules ? [ARGS.modules] : [])
if (!MODULES.length) throw new Error('args.modules required, vd { modules:["5-form-mastery-rhf-zod"] }')
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules'

const RESULT = {
  type: 'object',
  properties: {
    module: { type: 'string' },
    repo: { type: 'string' },
    lessonsFixed: { type: 'array', items: { type: 'string' } },
    configsPinned: { type: 'array', items: { type: 'string' } },
    docsFixed: { type: 'array', items: { type: 'string' } },
    pushed: { type: 'boolean' },
    pushRef: { type: 'string' },
    skippedNote: { type: 'string' },
    otherDirtyFiles: { type: 'array', items: { type: 'string' } },
  },
  required: ['module', 'pushed', 'lessonsFixed'],
}

phase('FixVitePort')
const results = await parallel(MODULES.map(function (mod) {
  return function () {
    const dir = MODDIR + '/' + mod
    return agent(
      'CHUAN HOA VITE PORT-IN-SOURCE cho module "' + mod + '". cwd = C:/Repositories/ac/starci-academy-backend. VIET TIENG VIET CO DAU.\n' +
      'RULE (coding.md A2): port FE pin trong frontend/vite.config.ts (`server: { port: N }`), docs CHI `npm run dev`. CAM `npm run dev -- -p N` (Next syntax, Vite loi) VA `-- --port N` (mismatch Win/Linux).\n' +
      '1) Lay repo: doc 1 body ' + dir + '/contents/*/bodies/*/vi.md -> URL `github.com/StarCi-Academy/<repo>` (dong Source). Repo local = `.repo/<repo>`.\n' +
      '2) PER LESSON (moi folder ' + dir + '/contents/<lesson>/ co bodies/ va co frontend trong repo):\n' +
      '   a) Xac dinh FE la VITE (frontend/vite.config.ts ton tai + package.json dev script = "vite"). NEU la Next (next dev / next.config) -> SKIP lesson do (ghi vao skippedNote), KHONG dung.\n' +
      '   b) PORT: lay port muc tieu theo thu tu uu tien: port trong vite.config hien co > port docs dang dung (CLI flag hoac prose localhost:PORT) > 3001 mac dinh (FE != backend 3000).\n' +
      '   c) CONFIG `.repo/<repo>/<lesson>/frontend/vite.config.ts`: neu CHUA co `server.port` -> them `server: { port: <P> }` (comment English: pin in source so npm run dev works same on Win/Linux). Neu da co -> giu.\n' +
      '   d) DOCS `.mount` bodies/<lang>/{vi,en}.md (vi+en): doi `npm run dev -- -p <n>` / `-- --port <n>` -> `npm run dev`; align MOI prose port (localhost:<n>, "cong <n>", "port <n>") ve <P> (KHONG dong cham port backend 3000). Mirror vi<->en.\n' +
      '   e) Neu lesson DA chuan (config pin + docs `npm run dev` + prose khop) -> KHONG dung, ghi vao skippedNote.\n' +
      '3) COMMIT+PUSH `.repo/<repo>` (thay da authorize): `git -C .repo/<repo> add "*/frontend/vite.config.ts"` (CHI vite.config, KHONG add -A). Neu co staged thay doi -> commit message:\n' +
      '   "fix(frontend): pin Vite dev port in vite.config.ts instead of CLI flag" + body ngan + "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>". Roi `$env:GIT_TERMINAL_PROMPT=0; git -C .repo/<repo> push origin main`. Lay pushRef (vd abc..def). Neu KHONG co config thay doi (chi docs) -> pushed=false, KHONG commit rong.\n' +
      '   QUAN TRONG: KHONG `git add -A` — neu repo co file dirty LA (App.tsx/package.json...) thi GHI ten vao otherDirtyFiles, KHONG commit chung.\n' +
      '   LUU Y docs `.mount` la repo content rieng (KHONG push o day) -> chi sua file, de content push gom sau.\n' +
      'TRA VE StructuredOutput {module, repo, lessonsFixed:[lesson], configsPinned:[file], docsFixed:[file], pushed, pushRef, skippedNote, otherDirtyFiles}.',
      { label: 'viteport:' + mod, phase: 'FixVitePort', model: 'sonnet', schema: RESULT }
    )
  }
}))

const all = results.filter(Boolean)
const pushed = all.filter(function (r) { return r.pushed })
log('fix-vite-port xong: ' + pushed.length + '/' + all.length + ' repo pushed; ' + all.reduce(function (a, r) { return a + (r.lessonsFixed || []).length }, 0) + ' lesson sua')
return { results: all }
