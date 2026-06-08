export const meta = {
  name: 'fix-broken-challenges',
  description: 'Repair 15 challenge files with separator imbalance / missing title block',
  phases: [{ title: 'Fix' }],
}

const M = ".mount/data/courses/0-fullstack-mastery/modules"
const CHALLENGES = [
  // slot12-L1 rsc-boundaries (odd separator)
  { dir: `${M}/12-server-components-suspense-streaming/contents/1-rsc-vs-client-component-boundaries/challenges/0-blog-hybrid-rsc-layout`, issue: "odd-separator" },
  { dir: `${M}/12-server-components-suspense-streaming/contents/1-rsc-vs-client-component-boundaries/challenges/1-rsc-props-serialization-children-slot`, issue: "odd-separator" },
  { dir: `${M}/12-server-components-suspense-streaming/contents/1-rsc-vs-client-component-boundaries/challenges/2-rsc-dashboard-state-injection`, issue: "odd-separator" },
  { dir: `${M}/12-server-components-suspense-streaming/contents/1-rsc-vs-client-component-boundaries/challenges/3-dynamic-widget-superjson-hydration`, issue: "odd-separator" },
  // slot16 sentry (odd separator)
  { dir: `${M}/16-observability-logs-tracing-errors/contents/2-sentry-fe-and-be-integration/challenges/0-sentry-error-tracking-easy`, issue: "odd-separator" },
  { dir: `${M}/16-observability-logs-tracing-errors/contents/2-sentry-fe-and-be-integration/challenges/1-sentry-trace-stitching-medium`, issue: "odd-separator" },
  { dir: `${M}/16-observability-logs-tracing-errors/contents/2-sentry-fe-and-be-integration/challenges/2-sentry-user-context-hard`, issue: "odd-separator" },
  { dir: `${M}/16-observability-logs-tracing-errors/contents/2-sentry-fe-and-be-integration/challenges/3-sentry-tunnel-proxy-insane`, issue: "odd-separator" },
  // slot19 db-migrations (odd separator)
  { dir: `${M}/19-deploy-and-devops-workflow/contents/3-database-migrations-in-production/challenges/0-database-migrations-in-production-easy`, issue: "odd-separator" },
  { dir: `${M}/19-deploy-and-devops-workflow/contents/3-database-migrations-in-production/challenges/1-database-migrations-in-production-medium`, issue: "odd-separator" },
  { dir: `${M}/19-deploy-and-devops-workflow/contents/3-database-migrations-in-production/challenges/3-database-migrations-in-production-insane`, issue: "odd-separator" },
  // slot18 msw (missing title block, even separators)
  { dir: `${M}/18-testing-strategy/contents/3-msw-and-visual-regression/challenges/0-msw-and-visual-regression-easy`, issue: "missing-title-block" },
  { dir: `${M}/18-testing-strategy/contents/3-msw-and-visual-regression/challenges/1-msw-and-visual-regression-medium`, issue: "missing-title-block" },
  { dir: `${M}/18-testing-strategy/contents/3-msw-and-visual-regression/challenges/2-msw-and-visual-regression-hard`, issue: "missing-title-block" },
  { dir: `${M}/18-testing-strategy/contents/3-msw-and-visual-regression/challenges/3-msw-and-visual-regression-insane`, issue: "missing-title-block" },
]

const SPEC = `
StarCi challenge file format (vi.md + en.md), top sections each starting with a single "# ":
  # title / # description / # requirements / # steps / # outputs / # prerequisites
EVERY value is wrapped in a PAIR of separator lines:
  <!-- @starci/seperator -->
  <the value, may be multi-line markdown>
  <!-- @starci/seperator -->
Nested headings: under # requirements -> "## N" -> "### langs" -> "#### N" -> "##### lang|title|body|score" (each value sep-wrapped).
Under # steps -> "## N" -> "### title" / "### body" (sep-wrapped). # outputs/# prerequisites -> "## N" -> "### text" or "##### text" (sep-wrapped).
INVARIANT: the total count of separator lines is EVEN (every value has exactly an opening AND a closing separator). The "# title" section must contain a non-empty sep-wrapped value.
`

function fixAgent(c) {
  const prompt = `Repair ONE broken StarCi challenge (both vi.md and en.md) at: ${c.dir}. Work under C:/Repositories/ac/starci-academy-backend.

Detected issue: ${c.issue}.

${SPEC}

TASK:
1. Read ${c.dir}/vi.md. Count "<!-- @starci/seperator -->" lines.
${c.issue === "odd-separator"
  ? `2. The count is ODD => exactly ONE separator line is missing somewhere (a value has an opening but no closing separator, or vice versa). Walk the structure heading-by-heading; find the value whose separator pair is broken — symptom: a structural heading (^#, ^##, ^###, ^####, ^#####) appears where a closing separator should be, OR two values run together without the separator between them. Insert the SINGLE missing "<!-- @starci/seperator -->" line at the correct spot. Do NOT add/remove any other line. Do NOT change any text content.`
  : `2. The "# title" section is missing its sep-wrapped value block. Add it: right after the "# title" line, insert "<!-- @starci/seperator -->", then a concise title (derive a human title from the challenge folder slug / the # description), then "<!-- @starci/seperator -->". Keep it consistent with how other challenges format the title. Ensure the rest of the file's separators stay balanced.`}
3. Verify: re-count separators in vi.md — it MUST now be EVEN, and the "# title" block must parse to a non-empty value. Re-read the file mentally to confirm requirements/steps/outputs now sit between balanced separators.
4. Apply the SAME structural fix to ${c.dir}/en.md (mirror — same position; the en title is the English version).
5. Be surgical: only add the missing separator line(s) (or the title block). Never alter wording, code, or other separators.

Return: {challenge, vi_seps_before, vi_seps_after, en_seps_after, fixLocation, fixedBoth}`

  return agent(prompt, {
    label: c.dir.split("/challenges/")[1],
    phase: 'Fix',
    schema: {
      type: 'object', additionalProperties: false,
      properties: {
        challenge: { type: 'string' },
        vi_seps_before: { type: 'number' },
        vi_seps_after: { type: 'number' },
        en_seps_after: { type: 'number' },
        fixLocation: { type: 'string' },
        fixedBoth: { type: 'boolean' },
      },
      required: ['challenge', 'vi_seps_before', 'vi_seps_after', 'en_seps_after', 'fixLocation', 'fixedBoth'],
    },
  })
}

const results = await parallel(CHALLENGES.map((c) => () => fixAgent(c)))
return results.filter(Boolean)
