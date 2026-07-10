export const meta = {
  name: 'fe-redesign-research',
  description: 'Research FE M13-M16 de RE-CODE cho dep: per-module doc canonical gold pattern (skill-code-example-fe + m6 hand-polished) + FE hien tai tung lesson -> bao cao gap code-pattern + ui/ux + redesign plan. CHI RESEARCH (khong sua).',
  phases: [{ title: 'Research', detail: 'per-module: canonical vs current -> gap + plan', model: 'opus' }],
}

const SKILL = '.claude/skills/skill-code-example-fe/SKILL.md'
const GOLD = '.repo/fullstack-mastery-module-7-client-state-zustand-jotai/0-zustand-store-and-selectors/frontend/src'  // m6 hand-polished gold
const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules'
// thay goi M13-M16 = repo module-N (slot N-1)
const TARGETS = [
  { name: 'M13 server-components', repo: 'fullstack-mastery-module-13-server-components-suspense-streaming', mount: '12-server-components-suspense-streaming', stack: 'Next.js (isSandbox=false, Sandpack=Vite KHONG chay Next) — pattern App shell KHAC Vite' },
  { name: 'M14 frontend-performance', repo: 'fullstack-mastery-module-14-frontend-performance', mount: '13-frontend-performance', stack: 'Vite + React (canonical App Local/Sandbox)' },
  { name: 'M15 responsive', repo: 'fullstack-mastery-module-15-responsive-and-adaptive-rendering', mount: '14-responsive-and-adaptive-rendering', stack: 'Vite + React' },
  { name: 'M16 interaction', repo: 'fullstack-mastery-module-16-interaction-and-accessibility', mount: '15-interaction-and-accessibility', stack: 'Vite + React' },
]

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
          codePatternGaps: { type: 'array', items: { type: 'string' } },  // App shell, providers, Typography, testid, structure khac canonical
          uiuxGaps: { type: 'array', items: { type: 'string' } },         // spacing, HeroUI component, layout, polish thieu
          redesignPlan: { type: 'string' },                              // re-code gi cho lesson nay
        },
        required: ['name', 'codePatternGaps', 'uiuxGaps', 'redesignPlan'],
      },
    },
    moduleSummary: { type: 'string' },
  },
  required: ['module', 'lessons', 'moduleSummary'],
}

phase('Research')
const results = await parallel(TARGETS.map(function (T) {
  return function () {
    return agent(
      'RESEARCH FE de RE-CODE cho dep module "' + T.name + '" (CHI RESEARCH, KHONG sua). cwd = repo root. VIET TIENG VIET CO DAU. Stack: ' + T.stack + '\n' +
      '1) HOC CANONICAL "dep" pattern TRUOC: doc ' + SKILL + ' (skill FE pattern) + gold hand-polished ' + GOLD + '/{App.tsx,components/providers,components/Local,app/globals.css} (m6 client-state — thay da chinh tay). Day la chuan: App=Label(Typography.Heading)+Description(Typography.Paragraph)+spacing h-3/h-6+{isSandbox?Sandbox:Local}, HeroUI v3 (Avatar/Skeleton-3row/ErrorMessage/Button isPending/ScrollShadow/NumberField), testid, max-w-2xl, English comment.\n' +
      '2) Doc FE HIEN TAI tung lesson: .repo/' + T.repo + '/<lesson>/frontend/src/** (App.tsx, components, globals.css). So voi canonical.\n' +
      '3) Per-lesson bao cao: codePatternGaps (App shell/providers/Typography/testid/cau truc khac canonical), uiuxGaps (spacing sai, khong dung HeroUI component, layout tho, thieu polish loading/error/empty-state), redesignPlan (re-code cu the cho dep: dung component HeroUI nao, layout, spacing).\n' +
      (T.name.indexOf('M13') >= 0 ? 'LUU Y M13 = Next.js: App shell pattern KHAC Vite (app/ router, "use client", khong ?sandbox Vite-style). De xuat cach lam dep PHU HOP Next (KHONG ep Vite pattern).\n' : '') +
      'TRA VE StructuredOutput {module, lessons:[{name,codePatternGaps,uiuxGaps,redesignPlan}], moduleSummary}.',
      { label: 'feresearch:' + T.name, phase: 'Research', model: 'opus', schema: RESULT }
    )
  }
}))
return { modules: results.filter(Boolean) }
