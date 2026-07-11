export const meta = {
  name: 'fix-drift',
  description: 'Sua body drift CO HOC (ruling #4): doc-path/cd/port/ten-component trong body LECH repo -> sua body khop .repo LOCAL (ground-truth), mirror vi/en, cap nhat synced.yaml->ok, re-gate lesson. KHONG doi logic, KHONG e2e (doc-only). 1 agent/lesson, song song.',
  phases: [
    { title: 'FixDrift', detail: 'sua body khop repo local -> synced.yaml ok -> re-gate', model: 'sonnet' },
  ],
}

// invoke: Workflow({ scriptPath: ".claude/docs/workflows/fix-drift.js", args: { fixes: [ {module, lesson, repo, lessonPath, instruction} , ... ] } })
function asObj(a) { if (!a) return {}; if (typeof a === 'object') return a; if (typeof a === 'string') { const s = a.trim(); if (s.startsWith('{')) { try { return JSON.parse(s) } catch (e) {} } } return {} }
const ARGS = asObj(args)
const FIXES = Array.isArray(ARGS.fixes) ? ARGS.fixes : []
if (!FIXES.length) throw new Error('args.fixes required: [{module, lesson, repo, lessonPath, instruction}]')
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules'

const RESULT = {
  type: 'object',
  properties: {
    lesson: { type: 'string' },
    fixed: { type: 'boolean' },
    gatePass: { type: 'boolean' },
    notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['lesson', 'fixed', 'gatePass', 'notes'],
}

phase('FixDrift')
const results = await parallel(FIXES.map(function (F) {
  return function () {
    const dir = MODDIR + '/' + F.module + '/contents/' + F.lesson
    const repoLesson = '.repo/' + F.repo + '/' + (F.lessonPath || F.lesson)
    return agent(
      'FIX DRIFT (co hoc, doc-only) lesson "' + F.lesson + '" (module ' + F.module + '). cwd = repo root. VIET TIENG VIET CO DAU.\n' +
      'NHIEM VU: ' + F.instruction + '\n' +
      'NGUYEN TAC: doi chieu voi `.repo` LOCAL (ground-truth) = ' + repoLesson + ' — dung ls/Test-Path/Read kiem path/port/ten THAT trong repo TRUOC khi sua. CHI sua BODY ' + dir + '/bodies/<lang>/{vi,en}.md cho KHOP repo. KHONG doi logic code, KHONG doi repo, KHONG chay e2e.\n' +
      '1) Xac minh trong repo local: path/file/port/ten-component THAT la gi (vd doc vite.config.ts lay port that; ls thu muc lay path that).\n' +
      '2) Sua MOI body lang bi dinh (§2.1.2 path, cd-command, port trong §1/§2.1.5, ten component/file) cho khop repo. Mirror vi<->en (cung sua ca 2, cung cau truc).\n' +
      '3) Cap nhat ' + dir + '/synced.yaml: status: ok (neu da khop het), checks gitClone/cdPaths/contentMatch: ok, log ghi RO da sua gi (tieng Viet), issues: [].\n' +
      '4) RE-GATE: powershell -NoProfile -File ".claude/docs/check-lesson.ps1" -Path "' + dir + '" -> doc PASS/FAIL.\n' +
      'TRA VE StructuredOutput {lesson:"' + F.lesson + '", fixed, gatePass, notes:[da sua gi]}.',
      { label: 'fix:' + F.module + '/' + F.lesson, phase: 'FixDrift', model: 'sonnet', schema: RESULT }
    )
  }
}))

const ok = results.filter(function (r) { return r && r.fixed }).length
log('fix-drift xong: ' + ok + '/' + FIXES.length + ' lesson da sua')
return { results: results.filter(Boolean) }
