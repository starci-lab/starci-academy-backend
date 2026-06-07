export const meta = {
  name: 'sync-check',
  description: 'Per-module (1 agent/repo, chay song song): CLONE repo published blobless vao TEMP -> check moi lesson body<->repo (git clone URL · moi cd <path> resolve qua ls-tree · snippet khop code) -> GHI synced.yaml vao tung contents/<lesson>/ -> XOA clone temp (disk hygiene). Idempotent: lesson da co synced.yaml status=ok thi SKIP (tru khi force).',
  phases: [
    { title: 'SyncCheck', detail: 'clone temp -> check cd+content per-lesson -> synced.yaml -> xoa clone', model: 'sonnet' },
  ],
}

// invoke: Workflow({ scriptPath: ".audits/workflows/sync-check.js", args: { modules: ["0-nestjs-core-and-request-lifecycle", ...], force?: true } })
function asObj(a) { if (!a) return {}; if (typeof a === 'object') return a; if (typeof a === 'string') { const s = a.trim(); if (s.startsWith('{')) { try { return JSON.parse(s) } catch (e) {} } if (s.startsWith('[')) { try { return { modules: JSON.parse(s) } } catch (e) {} } return { modules: [s] } } return {} }
const ARGS = asObj(args)
const MODULES = Array.isArray(ARGS.modules) ? ARGS.modules : (ARGS.modules ? [ARGS.modules] : [])
if (!MODULES.length) throw new Error('args.modules required, vd { modules:["0-nestjs-core-and-request-lifecycle"] }')
const FORCE = ARGS.force === true || ARGS.force === 'true'
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules'

const RESULT = {
  type: 'object',
  properties: {
    module: { type: 'string' },
    remote: { type: 'string' },
    cloneOk: { type: 'boolean' },
    cleaned: { type: 'boolean' },         // da xoa clone temp chua
    lessons: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          status: { type: 'string' },     // ok | mismatch | skipped
          issues: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'status', 'issues'],
      },
    },
  },
  required: ['module', 'cloneOk', 'cleaned', 'lessons'],
}

phase('SyncCheck')
const results = await parallel(MODULES.map(function (mod) {
  return function () {
    const dir = MODDIR + '/' + mod
    return agent(
      'SYNC-CHECK module "' + mod + '": clone repo published -> check body<->repo per-lesson -> ghi synced.yaml -> XOA clone. cwd = C:/Repositories/ac/starci-academy-backend. VIET TIENG VIET CO DAU.\n' +
      '1) REMOTE: doc 1 body ' + dir + '/contents/*/bodies/*/vi.md -> URL `https://github.com/StarCi-Academy/fullstack-mastery-module-<N>-<slug>` (dong Source/clone). Do la remote.\n' +
      '2) CLONE BLOBLESS (DISK-SAFE — repo co the co node_modules committed, KHONG keo full lap o C): PowerShell `$env:GIT_TERMINAL_PROMPT=0; git clone --depth 1 --filter=blob:none --no-checkout <remote> "$env:TEMP/sync-<slug>"`. Chi tai commit+tree (ten file/thu muc), KHONG tai blob -> temp ti xiu. Clone fail (repo chua push/chua co) -> cloneOk=false, ghi tat ca lesson status=mismatch issue "repo chua push len GitHub", VAN nho XOA temp neu co, DUNG.\n' +
      '3) LS-TREE: `git -C "$temp" ls-tree -r --name-only HEAD` -> moi path tracked (KHONG can checkout).\n' +
      '4) PER-LESSON (moi folder ' + dir + '/contents/<lesson>/ co bodies/):\n' +
      (FORCE ? '' : '   - IDEMPOTENT: neu <lesson>/synced.yaml DA co status: ok -> status=skipped, KHONG check lai.\n') +
      '   - Doc bodies/<lang>/{vi,en}.md: rut URL clone + MOI lenh `cd <path>` (cd <repo>/<lesson>, cd backend/<lang>, cd frontend).\n' +
      '   - gitClone: URL khop remote vua clone? cdPaths: voi moi cd-path, `<lesson>/<path>` co la prefix cua path nao trong ls-tree khong (thu muc ton tai)? contentMatch: doc 1-2 file (`git -C "$temp" show HEAD:<lesson>/<path>/<file>`) so snippet §2.1.2/§2.1.3 trong body -> khop?\n' +
      '   - GHI <lesson>/synced.yaml: status(ok|mismatch)+checkedBy: Sonnet 4.x+checkedAt+repo+lessonPath+checks{gitClone,cdPaths,contentMatch}+log(tieng Viet)+issues[]. status=ok CHI khi ca 3 ok; lech -> mismatch + issues ghi RO path/file thieu + repo layout that.\n' +
      '5) XOA CLONE TEMP (BAT BUOC, giai phong disk ngay): `[System.IO.Directory]::Delete("$env:TEMP/sync-<slug>", $true)` (Remove-Item bi chan). XAC NHAN da xoa -> cleaned=true.\n' +
      'TRA VE StructuredOutput {module, remote, cloneOk, cleaned, lessons:[{name,status,issues}]}.',
      { label: 'sync:' + mod, phase: 'SyncCheck', model: 'sonnet', schema: RESULT }
    )
  }
}))

const all = results.filter(Boolean)
const okN = all.reduce(function (a, r) { return a + (r.lessons || []).filter(function (l) { return l.status === 'ok' }).length }, 0)
const badN = all.reduce(function (a, r) { return a + (r.lessons || []).filter(function (l) { return l.status === 'mismatch' }).length }, 0)
const notClean = all.filter(function (r) { return !r.cleaned })
log('sync-check xong: ' + okN + ' lesson ok, ' + badN + ' mismatch' + (notClean.length ? ' | CHUA XOA clone: ' + notClean.map(function (r) { return r.module }).join(',') : ' | clone temp da xoa het'))
return { results: all }
