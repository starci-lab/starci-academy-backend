export const meta = {
  name: 'verify-repos',
  description: 'Verify body <-> repo PUBLISHED: clone tung repo tu GitHub vao TEMP (khong dung .repo live), test cd-path trong body co resolve that khong, Haiku brief noi-dung-trong-clone vs body-ngoai de confirm khop, roi XOA temp. Bat body tro path khong ton tai / repo lech body.',
  phases: [
    { title: 'Verify', detail: 'clone temp -> test cd-path resolve -> brief match -> xoa temp', model: 'sonnet' },
  ],
}

// invoke: Workflow({ scriptPath: ".claude/docs/workflows/verify-repos.js", args: { modules: ["8-websocket-realtime-communication", ...] } })
function asObj(a) { if (!a) return {}; if (typeof a === 'object') return a; if (typeof a === 'string') { const s = a.trim(); if (s.startsWith('{')) { try { return JSON.parse(s) } catch (e) {} } if (s.startsWith('[')) { try { return { modules: JSON.parse(s) } } catch (e) {} } return { modules: [s] } } return {} }
const ARGS = asObj(args)
const MODULES = Array.isArray(ARGS.modules) ? ARGS.modules : (ARGS.modules ? [ARGS.modules] : [])
if (!MODULES.length) throw new Error('args.modules required, vd { modules:["8-websocket-realtime-communication"] }')
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules'

const RESULT = {
  type: 'object',
  properties: {
    module: { type: 'string' },
    remote: { type: 'string' },
    cloneOk: { type: 'boolean' },
    lessons: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          cdResolve: { type: 'boolean' },   // moi cd-path trong body co ton tai trong clone khong
          contentMatch: { type: 'boolean' }, // noi dung repo khop body (Haiku brief)
          issues: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'cdResolve', 'contentMatch', 'issues'],
      },
    },
  },
  required: ['module', 'cloneOk', 'lessons'],
}

phase('Verify')
const results = await parallel(MODULES.map(function (mod) {
  return function () {
    const dir = MODDIR + '/' + mod
    return agent(
      'VERIFY repo PUBLISHED <-> body cho module "' + mod + '". cwd = C:/Repositories/ac/starci-academy-backend. VIET TIENG VIET CO DAU.\n' +
      '1) Lay remote: doc 1 body bat ky ' + dir + '/contents/*/bodies/*/vi.md -> tim URL `https://github.com/StarCi-Academy/fullstack-mastery-module-<N>-<slug>` (dong "Source:"/clone). Do la remote.\n' +
      '2) CLONE BLOBLESS VAO TEMP (DISK-SAFE — repo co node_modules committed, KHONG tai full keo day o C): `git clone --depth 1 --filter=blob:none --no-checkout <remote> "$env:TEMP/verify-<slug>"` (PowerShell; $env:GIT_TERMINAL_PROMPT=0). Co `--filter=blob:none --no-checkout` -> chi tai commit+tree (ten file/thu muc), KHONG tai noi dung blob/node_modules -> temp ti xiu. Neu clone fail (repo chua ton tai/chua push) -> cloneOk=false, ghi issue, BO QUA.\n' +
      '3) TEST CD-PATH (qua ls-tree, KHONG can checkout): `git -C "$temp" ls-tree -r --name-only HEAD` -> danh sach MOI path tracked. Voi MOI lesson, doc body bodies/<lang>/{vi,en}.md, rut MOI lenh `cd <path>` trong block "cach chay" (cd backend/<lang>, cd frontend, cd <repo>/<lesson>). KIEM <lesson>/<path> co la prefix cua path nao trong ls-tree khong (thu muc ton tai). Khong co = cd KHONG work -> cdResolve=false + issue ghi RO path thieu + repo layout that.\n' +
      'LUU Y body: NOI DUNG bai o `bodies/<lang>/{vi,en}.md` (KHONG phai root `vi.md`/`en.md` — root chi metadata title/description/references/minutesRead/isPremium). ĐUNG bao "body trong" khi root metadata trong — phai doc bodies/<lang>/.\n' +
      '4) HAIKU BRIEF noi-dung-clone vs body-ngoai: tu ls-tree, doi chieu cau truc repo (backend/<lang>/src, frontend/, .docker/...) voi body MO TA (§2.1.2 thanh phan, §2.1.1 Source/clone path). Can doc 1-2 file thi `git -C "$temp" show HEAD:<path>` (chi keo blob do). Khop co ban -> contentMatch=true; lech ro (body noi co X repo khong co / layout khac) -> false + issue.\n' +
      '5) XOA TEMP: `[System.IO.Directory]::Delete("$env:TEMP/verify-<slug>", $true)` (Remove-Item bi chan; dung .NET). XAC NHAN da xoa (giai phong disk ngay).\n' +
      'TRA VE StructuredOutput {module, remote, cloneOk, lessons:[{name, cdResolve, contentMatch, issues}]}.',
      { label: 'verify:' + mod, phase: 'Verify', model: 'sonnet', schema: RESULT }
    )
  }
}))

return { verified: results.filter(Boolean) }
