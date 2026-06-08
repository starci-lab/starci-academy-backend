export const meta = {
  name: 'reconcile-bodies',
  description: 'Reconcile lesson body §2.1.x code blocks + structural prose to current repo code (post-convention refactor)',
  phases: [{ title: 'Reconcile' }],
}

// repo dir -> mount slot slug (module K repo -> mount slot K-1)
const MODULES = [
  { repo: 'fullstack-mastery-module-5-server-state-with-tanstack-query', mount: '4-server-state-with-tanstack-query' },
  { repo: 'fullstack-mastery-module-6-form-mastery-rhf-zod', mount: '5-form-mastery-rhf-zod' },
  { repo: 'fullstack-mastery-module-7-client-state-zustand-jotai', mount: '6-client-state-zustand-jotai' },
  { repo: 'fullstack-mastery-module-8-react-reactivity-and-effects', mount: '7-react-reactivity-and-effects' },
  { repo: 'fullstack-mastery-module-9-websocket-realtime-communication', mount: '8-websocket-realtime-communication' },
  { repo: 'fullstack-mastery-module-12-file-upload-and-storage', mount: '11-file-upload-and-storage' },
  { repo: 'fullstack-mastery-module-13-server-components-suspense-streaming', mount: '12-server-components-suspense-streaming' },
  { repo: 'fullstack-mastery-module-14-frontend-performance', mount: '13-frontend-performance' },
  { repo: 'fullstack-mastery-module-15-responsive-and-adaptive-rendering', mount: '14-responsive-and-adaptive-rendering' },
  { repo: 'fullstack-mastery-module-16-interaction-and-accessibility', mount: '15-interaction-and-accessibility' },
]

function reconcileAgent(mod) {
  const mountBase = `.mount/data/courses/0-fullstack-mastery/modules/${mod.mount}/contents`
  const repoBase = `.repo/${mod.repo}`
  const prompt = `Reconcile the lesson BODY markdown to the current (refactored) repo code for module "${mod.mount}". Work under C:/Repositories/ac/starci-academy-backend.

The frontend repo code was just standardized: components are now ARROW consts (was \`export function\`), props are named \`interface XProps\`, and UI tokens changed (Card has \`border border-default-200 p-3\`; standalone Input bordered / in-card Input variant="secondary"; Button primary/outline/danger; lesson title <Typography.Heading level={4} className="text-sm font-semibold">; spacing via flex gap not spacer divs; label↔input gap-1.5). The lesson bodies still show the OLD code and must be brought in sync.

Mount bodies: ${mountBase}/<lessonSlug>/bodies/0-agnostic/vi.md (and en.md). Also ${mountBase}/<lessonSlug>/code-context.md if present.
Repo code: ${repoBase}/<lessonSlug>/frontend/src/...

For EACH lesson folder under ${mountBase}:
1. Open vi.md. Find every fenced code block in section §2.1 (Thực hành) and any codeExplaining block that shows component/source code from the repo.
2. For each such block, locate the matching repo source file (the body usually names the file path, e.g. \`frontend/src/components/X/index.tsx\`). Read the CURRENT repo file.
3. Update the body code block to MATCH the current repo verbatim for the portion shown:
   - \`export function Name(...)\` -> \`export const Name = (...): JSX.Element => {...}\`
   - inline/\`type\` props -> the \`interface NameProps\` now in the repo
   - any className / structural change that the block displays (Card border+p-3, gap instead of spacer, title className, Label usage, button variants)
   Keep the block's SCOPE the same (if it was an excerpt of N lines, keep showing that same region, just updated). Do NOT expand a teaching excerpt into a whole file.
4. Update §2.1.2 (Kiến trúc/thành phần) PROSE only where a structural FACT changed (e.g. spacer divs removed -> spacing now via gap; a Card now has a border; a raw label is now <Label>). Preserve all teaching narrative, testids, and wording otherwise. Do NOT rewrite for style.
5. Mirror every change you made in vi.md into en.md at the same place (en is the English translation; keep them structurally parallel). Code blocks are identical in both; translate only surrounding prose deltas.
6. Do NOT touch challenges/, test.md, audited.md, or sections outside §2.1 unless a code block there shows changed repo code.

After all lessons: run \`grep -rc "export function" ${mountBase}/*/bodies/0-agnostic/*.md\` and confirm 0 remain (report the number).

Return a structured per-lesson summary: blocks updated, prose facts updated, vi/en both done (bool), export-function-remaining count.`

  return agent(prompt, {
    label: mod.mount,
    phase: 'Reconcile',
    schema: {
      type: 'object', additionalProperties: false,
      properties: {
        module: { type: 'string' },
        lessons: {
          type: 'array',
          items: {
            type: 'object', additionalProperties: false,
            properties: {
              lesson: { type: 'string' },
              blocksUpdated: { type: 'number' },
              proseFactsUpdated: { type: 'number' },
              viEnMirrored: { type: 'boolean' },
              exportFunctionRemaining: { type: 'number' },
              notes: { type: 'string' },
            },
            required: ['lesson', 'blocksUpdated', 'proseFactsUpdated', 'viEnMirrored', 'exportFunctionRemaining', 'notes'],
          },
        },
      },
      required: ['module', 'lessons'],
    },
  })
}

const results = await parallel(MODULES.map((mod) => () => reconcileAgent(mod)))
return results.filter(Boolean)
