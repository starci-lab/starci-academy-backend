export const meta = {
  name: 'check-doc-code-drift',
  description: 'Per-module (song song): doi chieu SAU body docs (.mount) vs repo SOURCE + playwright specs (.repo). Bat drift: §2.1.2 component/file list vs src that; §2.1.3 code snippet vs source code that; §2.1.5 flow/testid vs playwright spec that; UX moi (typography/ScrollShadow/delay/registry) co duoc body mo ta khong. CHI BAO CAO drift (KHONG sua) -> de orchestrator ra plan.',
  phases: [
    { title: 'DriftCheck', detail: 'doc body vs source+spec -> liet ke drift', model: 'sonnet' },
  ],
}

// invoke: Workflow({ scriptPath: ".audits/workflows/check-doc-code-drift.js", args: { targets: [{module, repo}] } })
function asObj(a) { if (!a) return {}; if (typeof a === 'object') return a; if (typeof a === 'string') { try { return JSON.parse(a) } catch (e) { return {} } } return {} }
const ARGS = asObj(args)
const TARGETS = Array.isArray(ARGS.targets) ? ARGS.targets : []
if (!TARGETS.length) throw new Error('args.targets required: [{module, repo}]')
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules'

const RESULT = {
  type: 'object',
  properties: {
    module: { type: 'string' },
    lessons: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          inSync: { type: 'boolean' },
          drifts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                area: { type: 'string' },        // §2.1.2 | §2.1.3 | §2.1.5 | UX | testid | port | khac
                severity: { type: 'string' },     // high | medium | low
                body: { type: 'string' },         // body docs ghi gi
                repo: { type: 'string' },         // source/spec that la gi
                fix: { type: 'string' },          // de xuat sua (body theo repo hay nguoc lai)
              },
              required: ['area', 'severity', 'body', 'repo', 'fix'],
            },
          },
        },
        required: ['name', 'inSync', 'drifts'],
      },
    },
  },
  required: ['module', 'lessons'],
}

phase('DriftCheck')
const results = await parallel(TARGETS.map(function (t) {
  return function () {
    const dir = MODDIR + '/' + t.module
    return agent(
      'DOI CHIEU DRIFT body docs vs source+spec cho module "' + t.module + '" (repo .repo/' + t.repo + '). cwd = repo root. VIET TIENG VIET CO DAU. CHI BAO CAO, KHONG SUA FILE.\n' +
      'Voi MOI lesson trong ' + dir + '/contents/<lesson>/ (co bodies/):\n' +
      '1) DOC body: ' + dir + '/contents/<lesson>/bodies/<lang>/vi.md — chu y §2.1.2 (bang thanh phan: ten component/file + path), §2.1.3 (code snippet/walkthrough), §2.1.5 (cac luong + testid + hanh vi mong doi).\n' +
      '2) DOC repo SOURCE: .repo/' + t.repo + '/<lesson>/frontend/src/** (components/hooks that), va .repo/' + t.repo + '/<lesson>/.playwright/scripts/*.spec.ts (testid + flow that).\n' +
      '3) SO SANH tim DRIFT:\n' +
      '   - §2.1.2: ten component/file trong body co khop src that khong (vd body ghi HeavyChart nhung src la SalesChart)?\n' +
      '   - §2.1.3: doan code body trich co khop source that khong (signature/logic/import)?\n' +
      '   - §2.1.5: luong + testid body mo ta co khop spec playwright that khong (getByTestId nao spec dung vs body ghi)? hanh vi (vd delay 1s, ScrollShadow, optimistic) co dung khong?\n' +
      '   - UX MOI thay vua them (typography HeroUI, ScrollShadow, registry UX, API delay, layout spacing) — body co PHAN ANH khong hay con mo ta UI cu?\n' +
      '   - port/cmd con lech khong.\n' +
      '4) Voi moi drift: area + severity + body(ghi gi) + repo(that la gi) + fix de xuat (thuong = sua BODY theo source/spec vi code la ground-truth sau khi thay sua tay; tru khi source thieu thi bao).\n' +
      'TRA VE StructuredOutput {module, lessons:[{name, inSync, drifts:[...]}]}. inSync=true neu lesson do khong drift.',
      { label: 'drift:' + t.module, phase: 'DriftCheck', model: 'sonnet', schema: RESULT }
    )
  }
}))

const all = results.filter(Boolean)
const totalDrift = all.reduce(function (a, r) { return a + (r.lessons || []).reduce(function (b, l) { return b + (l.drifts || []).length }, 0) }, 0)
log('drift-check xong: ' + totalDrift + ' drift tong cong')
return { results: all }
