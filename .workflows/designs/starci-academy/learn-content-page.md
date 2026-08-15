# learn-content-page

Migrated from the previous shape mid-run. Plan and Preview ran against the record-and-seal skills;
their evidence lives in `starci-academy-fe/.artifacts/design-plan/learn-system-map/`
(`plan-record.md`, `preview-inventory.md`, `design-record.json`, `screens/revision-1-6/`). This file
is that evidence in the shape `starci-workflow-drift` reads.

## plan

| | |
|---|---|
| Doing | The whole learn feature, drawn from legacy, down to one direction |
| Repo / branch | `starci-academy-fe` @ `main` |
| Touching | artifacts only |
| Not touching | all production source |
| Produces | three directions at `localhost:8080` |

**Chose** direction B — one spine. The eleven learn modes hang off one persistent left rail, and
the content's own contents drop to a panel inside the reader. Two conditions came with it, in the
user's words: parity is at the level of CONCEPT rather than pixels, and the content page is built
first.

| Took | Because |
|---|---|
| Reference is `starci-academy@9a19342`, `pages/ContentPage` + `LearnShellLayout` | Read as source rather than as a screenshot |
| The spine is a separate work item; the reader owns its two rails | The plan record puts the contents panel and the on-this-page outline inside `learn-content-page` |


| Rejected | Instead | Why |
|---|---|---|
| Drawing the learn system from a reading of legacy | reading `pages/ContentPage` and `LearnShellLayout` as SOURCE | *"bám sát code legacy nhé, y chang ấy về concept"* — a description of a screen is not the screen |


| Rejected | Instead | Why |
|---|---|---|
| Drawing the learn system from a reading of legacy | reading `pages/ContentPage` and `LearnShellLayout` as SOURCE | *"bám sát code legacy nhé, y chang ấy về concept"* — a description of a screen is not the screen |

## review

| | |
|---|---|
| Doing | Build the reader from the real components, contracts and tokens |
| Repo / branch | `starci-academy-fe` @ `main` |
| Touching | `.artifacts/design-plan/learn-system-map/candidate/` |
| Not touching | all production source |
| Produces | eight rendered states at `localhost:8083` |

| Owner | State | Rendered |
|---|---|---|
| CourseLearnContentPage | ready | yes — `screens/revision-1-6/reader-ready.png` |
| CourseLearnContentPage | pending | yes |
| CourseLearnContentPage | locked | yes |
| CourseLearnContentPage | failed | yes |
| CourseLearnContentPage | single face | yes |
| CourseLearnContentPage | first content | yes |
| CourseLearnContentPage | last content | yes |
| CourseLearnContentPage | no destinations | yes |
| CourseLearnContentPage (connected) | all four situations | covered by the eight above — it resolves data and draws nothing of its own |
| CourseLearnContentPage (connected) | which outline entry is current | **no** — scroll spy needs a live document, so no entry claims to be current |

| Backend | Covered by |
|---|---|
| nothing missing | `content` and `module` already exist and were read as evidence: `content` is authenticated and truncates a premium body server-side, `module` is login-only and returns nested contents. No enabler was needed |

**Approved** revision 1.6, after five revisions:

| Revision | What changed |
|---|---|
| 1.2 | Rebuilt from the legacy page read line by line — paper card, paywall inside it, footer suppressed when locked, reaction on its own ground, tab bar never rested |
| 1.3 | The two rails, and the entity renamed from `lesson` to `content` everywhere |
| 1.4 | Outline tinted rather than plated and indented by depth; map rows given mark, time and current plate; modules given a summary line that opens |
| 1.5 | Declared the mirror specifier repoint as the one integration edit |
| 1.6 | The body is markdown, because the data is — `sections` retired, `Article` and `CodeBlock` added, and the connected half built to the same approval |


| Rejected | Instead | Why |
|---|---|---|
| Revision 1.1, built from a description of the legacy reader | revision 1.2, rebuilt line by line from the file | *"đọc y chang legacy đi sao trò chế lại 1 đẳng làm 1 nẻo thế"* — five divergences at once, none of them visible without opening the source |
| The word `lesson` for the entity | `content`, everywhere: keys, types, fixtures | *"đã bảo không lession phải là content rồi mà"* — the reference product says `ContentPage`, `ContentMap`, `contentId`; two names for one entity is two owners waiting to happen |
| The reader as one column, rails called somebody else's work | three columns: content map, reading, outline | *"cái này nó có 3 layout ntn ma? sao trò đọc code mà cũng tệ thế"* — and the plan record had put both rails in this work item all along |
| `sections: { title, paragraphs[] }` as the body model | the markdown the server actually returns, drawn by an `Article` leaf | Found against `ContentEntity.body`, whose own description reads "Markdown body content". Nothing the server returns can produce the other shape without dropping code blocks |


| Rejected | Instead | Why |
|---|---|---|
| Revision 1.1, built from a description of the legacy reader | revision 1.2, rebuilt line by line from the file | *"đọc y chang legacy đi sao trò chế lại 1 đẳng làm 1 nẻo thế"* — five divergences at once, none of them visible without opening the source |
| The word `lesson` for the entity | `content`, everywhere: keys, types, fixtures | *"đã bảo không lession phải là content rồi mà"* — the reference product says `ContentPage`, `ContentMap`, `contentId`; two names for one entity is two owners waiting to happen |
| The reader as one column, rails called somebody else's work | three columns: content map, reading, outline | *"cái này nó có 3 layout ntn ma? sao trò đọc code mà cũng tệ thế"* — and the plan record had put both rails in this work item all along |
| `sections: { title, paragraphs[] }` as the body model | the markdown the server actually returns, drawn by an `Article` leaf | Found against `ContentEntity.body`, whose own description reads "Markdown body content". Nothing the server returns can produce the other shape without dropping code blocks |

## apply

| | |
|---|---|
| Doing | Write revision 1.6 into production and prove it renders |
| Repo / branch | `starci-academy-fe` @ `main` (`f06071e`) |
| Touching | the sixteen files below, `package.json`, `.claude/launch.json` |
| Not touching | every other path under `src`; `starci-academy` |
| Produces | `/vi/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]` |

| Wrote | Note |
|---|---|
| `pages/CourseLearnContentPage/component.tsx` | |
| `pages/CourseLearnContentPage/index.tsx` | |
| `blocks/learn/ContentTabRow/component.tsx` | |
| `leaves/Article/index.tsx` | |
| `leaves/CodeBlock/index.tsx` | |
| `leaves/ContentMapRow/index.tsx` | |
| `leaves/NavLink/index.tsx` | gains `kind: "section"` and `depth` |
| `components/contracts/index.ts` | eleven entries, three union members |
| `modules/api/graphql/queries/query-content.ts` | |
| `modules/api/graphql/queries/query-module.ts` | |
| `modules/api/graphql/queries/types/content.ts` | |
| `hooks/swr/useQueryContentSwr.ts` | |
| `hooks/swr/useQueryModuleSwr.ts` | |
| `app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/page.tsx` | the route |
| `messages/vi.json`, `messages/en.json` | merged: the `learn` key |
| `package.json` | unified, remark-parse, remark-gfm, remark-directive |
| `.claude/launch.json` | tooling: the dev server had no launch config |

| Green | Result |
|---|---|
| `npx tsc --noEmit` | clean, whole repository |
| `npx eslint <every path above>` | exit 0 |
| `npm run build` | exit 0; the route appears in the route table |
| `audit-fe-lint-adoption.mjs` | ok — no rule missing, none below error, inline config refused |

| Owed | Cleared by |
|---|---|
| The real page has not been looked at in ANY state | One Keycloak setting. The gate works — two GraphQL calls returned 403 and the app redirected to sign-in — but `academy-web` whitelists `http://localhost:3000/authentication*` while this FE is locale-routed and calls back at `/vi/authentication`. The whitelist predates locale routing. Adding `http://localhost:3000/*/authentication*` unblocks every remaining state |
| Scroll spy for the outline rail | Until it exists no entry claims to be current, because a wrong current entry is worse than none |
| Syntax highlighting in code blocks | The reference uses shiki |
| Remark directives (`:::accordion`) draw as ordinary blocks | |


| Rejected | Instead | Why |
|---|---|---|
| Sealing revision 1.4 without declaring the specifier repoint | revision 1.5, with the edit declared | The seal would have made Apply choose between an undeclared difference and a stop — the exact thing a seal exists to refuse |


| Rejected | Instead | Why |
|---|---|---|
| Sealing revision 1.4 without declaring the specifier repoint | revision 1.5, with the edit declared | The seal would have made Apply choose between an undeclared difference and a stop — the exact thing a seal exists to refuse |
