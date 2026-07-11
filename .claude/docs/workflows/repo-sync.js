export const meta = {
  name: 'repo-sync',
  description: 'Per-repo (song song): dong bo .repo audited-state len GitHub. Dam bao .gitignore day du (node_modules/dist/build/target/bin/obj/.next/out/.gradle/vendor/*.exe/*.tsbuildinfo/test-results/playwright-report), git add -A, SANITY (KHONG node_modules lot, count hop ly), commit "chore: sync audited changes", push origin main. Skip repo sach. Non-git -> report skip.',
  phases: [
    { title: 'RepoSync', detail: 'per-repo: gitignore -> add -A -> sanity -> commit -> push', model: 'sonnet' },
  ],
}

// invoke: Workflow({ scriptPath: ".claude/docs/workflows/repo-sync.js", args: { repos: ["fullstack-mastery-module-1-..."] } })
function asObj(a) { if (!a) return {}; if (typeof a === 'object') return a; if (typeof a === 'string') { const s = a.trim(); if (s.startsWith('{')) { try { return JSON.parse(s) } catch (e) {} } if (s.startsWith('[')) { try { return { repos: JSON.parse(s) } } catch (e) {} } return { repos: [s] } } return {} }
const ARGS = asObj(args)
const REPOS = Array.isArray(ARGS.repos) ? ARGS.repos : (ARGS.repos ? [ARGS.repos] : [])
if (!REPOS.length) throw new Error('args.repos required')

const GI = ['node_modules/', 'dist/', 'build/', 'out/', '.next/', '.gradle/', 'target/', 'bin/', 'obj/', 'vendor/', '*.exe', '*.tsbuildinfo', '*.log', 'go-out.txt', 'go-err.txt', '.DS_Store', '.env.local', 'test-results/', 'playwright-report/', 'coverage/']

const RESULT = {
  type: 'object',
  properties: {
    repo: { type: 'string' },
    pushed: { type: 'boolean' },
    pushRef: { type: 'string' },
    filesCommitted: { type: 'number' },
    gitignoreFixed: { type: 'boolean' },
    note: { type: 'string' },
  },
  required: ['repo', 'pushed', 'note'],
}

phase('RepoSync')
const results = await parallel(REPOS.map(function (repo) {
  return function () {
    return agent(
      'REPO-SYNC dong bo audited-state len GitHub cho repo "' + repo + '". cwd = C:/Repositories/ac/starci-academy-backend. Repo = .repo/' + repo + '. VIET TIENG VIET CO DAU.\n' +
      '1) Neu .repo/' + repo + ' KHONG co .git -> pushed=false, note="non-git, skip", DUNG.\n' +
      '2) GITIGNORE: dam bao .repo/' + repo + '/.gitignore co DU cac rule sau (them dong thieu, KHONG xoa dong cu): ' + JSON.stringify(GI) + '. Neu vua them rule ma co file da-track khop rule do -> untrack: `git -C .repo/' + repo + ' rm -r --cached --quiet <path>` cho dung file do (vd node_modules/dist/*.tsbuildinfo da lo track). gitignoreFixed=true neu co sua.\n' +
      '3) `git -C .repo/' + repo + ' add -A`.\n' +
      '4) SANITY (BAT BUOC truoc commit): `git -C .repo/' + repo + ' diff --cached --name-only | grep -c node_modules` PHAI = 0; tong file staged hop ly (KHONG hang nghin = artifact lot). Neu node_modules lot -> unstage (`git reset HEAD <path>`) + bo sung gitignore. TUYET DOI KHONG commit node_modules/binary lon.\n' +
      '5) Neu KHONG co gi staged (repo sach, chi ahead) -> KHONG commit; nhung VAN push neu ahead>0. Neu co staged -> commit: `git -C .repo/' + repo + ' commit -q -m "chore: sync audited changes (e2e specs, component/config fixes)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"`.\n' +
      '6) PUSH: `$env:GIT_TERMINAL_PROMPT=0; git -C .repo/' + repo + ' push origin main` (hoac master neu branch do). Lay pushRef (old..new). pushed=true neu day duoc.\n' +
      'TRA VE StructuredOutput {repo, pushed, pushRef, filesCommitted, gitignoreFixed, note (tieng Viet: da lam gi)}.',
      { label: 'sync:' + repo.replace('fullstack-mastery-module-', 'm'), phase: 'RepoSync', model: 'sonnet', schema: RESULT }
    )
  }
}))

const all = results.filter(Boolean)
const pushed = all.filter(function (r) { return r.pushed })
log('repo-sync xong: ' + pushed.length + '/' + all.length + ' repo pushed')
return { results: all }
