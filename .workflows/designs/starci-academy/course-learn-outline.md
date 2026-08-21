# Course learn outline

## CONTEXT

| Field | Value |
|---|---|
| Project | `starci-academy` |
| FE role | `C:/Repositories/starci-academy-fe` |
| Legacy evidence | `C:/Repositories/starci-academy` |
| Grammar | `starci` |
| Contract | `src/components/contracts/index.ts` |
| Route | `/en/courses/devops-mastery/learn` |

## Decision

- Keep the course map as the route-local left rail; do not merge it into the course-mode spine.
- Resolve hierarchical modules to HeroUI Accordion and selectable lesson rows to HeroUI ListBox.
- Auto-open the active lesson's module; search opens every matching module.
- Expanded modules render progress; collapsed modules render a compact completed/total fact.
- Add one keyboard- and pointer-resizable divider between the map and overview and persist its width.
- Preserve the existing data hooks, routes, page overview and contract architecture.

## Evidence

- Legacy `OutlineRail` owns Accordion grouping, active-row recovery and group progress semantics.
- Legacy `ResizableRail` owns the visible separator, keyboard resizing and persisted width.
- Current grammar receipt: `project=starci-academy`, `grammar=starci`.

## Baseline

- FE branch: `main`.
- FE baseline HEAD: `d73d5ccb`.
- Existing user change: `next.config.ts`; it is outside this change and must remain untouched.

## OUTPUTS

- The learn home, content reader and challenge reader share the same Accordion/ListBox outline grammar.
- The map rail has a visible `separator` control with pointer and keyboard resizing, persisted width,
  and an initial width of `320px`.
- Active modules open automatically; search opens matching groups; collapsed groups omit lesson rows
  and expose their completion count instead.

## CHANGES

- Updated the course-content contracts, map block and three learn page projections.
- Added the `RailDivider` leaf and the `outline` variant of `SelectionList` backed by HeroUI ListBox.
- Added localized progress and resize labels.

## WARNINGS

- Focused ESLint passed and 35 focused unit tests passed.
- Browser verification found the separator at `320px` with the expected accessible name.
- Full typecheck reaches only the pre-existing `next.config.ts` `experimental.rootParams` error.

## REJECTED

- A flat, permanently expanded lesson list: rejected because it loses hierarchy and overloads a dense map.
- A decorative non-interactive divider: rejected because the legacy rail promises actual resizing.

## OWED

- None for this bounded page change.

## Correction — reader route

- The first implementation mounted the divider only on the `/learn` overview. The nested content
  reader kept a different frame, so its course-map rail could not resize.
- `content-reader-frame` now owns the same persisted divider, its reading measure is left-aligned,
  and Accordion summaries explicitly align their title/progress copy to the left.
- Verified locally: map width `320px`, divider width `12px`, reader begins at the divider's right
  edge; focused lint and 20 reader/accordion/divider tests pass.

## Correction — course navigation ListBox

- The persistent course-mode groups (`Path`, `Practice`, `Track`) no longer compose independent
  `NavLink` rows. Each group now renders one HeroUI `ListBox` through the shared `SelectionList`
  owner; the compact rail uses the same primitive with visible labels suppressed.
- Current route state is a controlled selected key. Locked destinations remain visible as disabled
  options, and their `Locked` fact shares the same trailing slot as due counts and ranks.
- Removed the superseded `learn-nav-row` and `learn-nav-row-collapsed` contract nodes; the group
  contracts now own a single named `selection-list` slot.
- Browser proof: three labelled ListBoxes are present; every expanded visual row ends at `x=213`
  inside a ListBox ending at `x=225`; selecting `Modules` navigates to `/learn/content`, retains
  `aria-selected=true`, and emits no runtime console error.
- Verification: focused ESLint passed; 21 focused tests passed. Typecheck now reaches only the
  existing `next.config.ts` `experimental.rootParams` error.
- Verification addendum: the final focused set includes the map and reader regressions and passes
  `32/32` tests across four files.

## Correction — module group separators

- Replaced spacing between peer course modules with contract-owned `divide-y divide-separator`.
  The module-list node owns this relationship so the line spans the full rail width and individual
  Accordion items do not grow their own competing borders.
- Browser proof: four module items occupy the same `288px` list width; the first three resolve a
  separator border and the last resolves none. Focused lint and all `6/6` map/Accordion tests pass.

## Correction — rail scroll and ListBox interaction

- The expanded and collapsed course-navigation rails now use the same themed `scrollbar` and
  `overscroll-contain` behavior as the module tree instead of exposing a native browser scrollbar.
- ListBox once again owns hover, pressed and focus-visible mechanics. StarCi keeps only its selected
  route treatment; nested copy no longer turns accent on hover, so an unselected hovered row remains
  foreground black.
- Browser proof: both rail scroll owners carry the same scroll utilities; hovering `Review` resolves
  the native default background while its row and label retain the foreground color. Focused lint
  and all `23/23` related tests pass.

## Correction — product icon extension and rail boundary

- Published `@starci/heroicons@0.1.0` as the only product glyph entry package. It re-exports the
  approved upstream Heroicons families and adds reviewed 24px outline plus 16px solid cuts for the
  course rail, mind map, mock interview, foundations and playground meanings.
- The course rail toggle now uses the reference-backed two-pane glyph inside the existing circular
  HeroUI button. Both expanded and compact course rails own a right `border-separator` divider.
- Course destinations no longer borrow nearest generic meanings (`blog`, `talents`, `explore`,
  `code`); each asks the icon leaf for its stable product meaning.
- Published `@starci/eslint-canon-fe@1.4.1`. Product source may import glyphs only through
  `@starci/heroicons/24/outline` and `@starci/heroicons/16/solid`; direct upstream imports now fail.
- Grammar version 3 adds `product-glyph-extension`: extend only when the meaning is stable and no
  faithful upstream glyph exists, with both optical cuts, `currentColor`, Heroicons geometry and
  icon-leaf-only ownership.
- Browser proof: expanded and compact rails both resolve a solid right divider; the toggle is
  `36px` circular with two SVG paths and the four product destinations resolve their own 24px cuts.
- Verification: `@starci/heroicons` typecheck/build/pack pass; all 96 lint-package tests pass; all
  36 focused FE tests pass. Full FE typecheck still reaches only the pre-existing `rootParams`
  config error; full repository lint reports the existing 125 migration findings and no new icon
  vendor violation.

## Correction — flush resize seam and role-owned inset

- The map rail now owns `px-3 py-6`; the adjacent overview and lesson reader each own `p-6` and
  remain in normal left-aligned flow without `mx-auto`.
- The resize separator no longer occupies a `12px` flex column. Its layout width is zero, its
  visible `1px` rule sits on the shared edge, and an `8px` invisible pointer strip overlaps that
  edge without displacing either neighbour.
- Grammar version 5 separates rail spacing from primary-plane spacing and makes the shared-edge,
  zero-layout-width separator geometry mandatory. Principle receipts bind both primary planes to
  `PADDING-6` and bind the overview to `MARGIN-0`.
- Browser proof: panel ends, separator starts and overview starts at the same `x=384`; panel padding
  is `24px 12px`, overview padding is `24px`, and separator layout width is `0px`.
- Verification: all `21/21` focused FE tests and all `11/11` grammar/receipt tests pass. Targeted
  production lint passes; the existing page-folder test placement remains a separate migration
  finding.

## Correction — sidebar/content-rail separation

- Course navigation remains collapsible, but both expanded and collapsed contracts retain
  `px-3 py-6`; compact state changes width and visible content, never the rail inset.
- Course content and personal-project milestone navigation are route-content rails, not sidebar
  states. Both are resizable, viewport-bounded scroll planes; authored labels never collapse to
  icon-only navigation.
- Personal project now renders `personal-project-milestone-rail -> RailDivider -> routed body`,
  persists a 256–560px width under `starci.learn.milestoneMap.width`, and removes the invented
  collapsed milestone contract.
- Browser proof: expanded and collapsed sidebar padding resolves to `24px 12px`; the personal rail
  resolves to sticky `320px × 656px`, `overflow-y:auto`, the same `24px 12px` inset, and a zero-width
  divider at its exact right edge. Scrolling the body leaves the personal rail at `top:64px` with
  `scrollTop:0`; the content-map panel remains sticky while its module list resolves
  `overflow-y:auto`. Backend port 3001 responds at GraphQL (HTTP 400 for an empty GET, proving the
  service is listening).
- Verification: `30/30` focused FE tests, grammar golden cases and targeted production lint pass.

## Correction — sticky rail viewport accounting

- Replaced below-navbar `min-h-screen` on expanded, collapsed and personal-project learn frames
  with the shared `min-h-app-rail` token. That token subtracts the navbar's 4rem content box and
  its 1px separator, eliminating the residual document scroll range.
- Content and personal-project rails now start at `top-16`, fill `h-app-rail`, and keep `px-3 py-6`
  solely as internal inset. The former `top-rail + py-6` pairing counted the 24px top rhythm twice
  once the rail became sticky.
- Both long module and milestone collections now pass through `ScrollViewport`; progress/search stay
  pinned, collection overflow remains `auto`, and native scrollbar thumbs are hidden so they cannot
  read as partial resize dividers.
- Browser proof at a 720px viewport: document height is exactly `720px` (`maxDocumentScroll: 0`);
  rail and divider both span `top:64.67px` to `bottom:719.67px`; computed rail padding remains
  `24px 12px`. The personal-project rail reports the same geometry and its milestone list owns the
  only internal scroll plane.
- Verification: `25/25` focused tests, targeted production lint and grammar/receipt tests pass.

## Correction — legacy main-plane hierarchy

- Kept both left rails unchanged and rebuilt only the routed main planes from active data plus the
  selected legacy hierarchy.
- Course content now renders course description, catalogue facts as semantic badges, the next
  target and CTA on one responsive decision row, and the current module as one joined lesson
  surface rather than loose links on the page ground.
- Personal project now renders the next task through the shared surface owner, keeps all completion
  facts on one supporting line, and renders every current-milestone task through the same surface
  owner. Contract entries retain arrangement only; raw border/radius paint was removed.
- Browser proof: content resolves three badges and a `SurfaceCardSurface > course-content-lesson-list`;
  capstone resolves one next-task surface plus one task surface per resting/ready task and emits no
  runtime console error.
- Verification: `15/15` focused page tests, targeted production lint and diff checks pass. Full
  TypeScript still exits on unrelated migration debt, with zero diagnostics in the two page
  families or their touched contract entries.

## Correction — deep path and background refresh stability

- A path with at least three steps now renders one short `Back` link to the deepest pressable
  ancestor; one- and two-step paths retain full HeroUI Breadcrumbs, and a path without a legal
  ancestor never emits an inert link.
- Viewer-scoped SWR identity now fingerprints the JWT subject rather than rotating access-token
  bytes. Renewing a token for the same viewer therefore keeps populated keys and ready UI mounted;
  a real viewer change still receives a distinct cache identity.
- Recorded the remaining cross-project audit under
  `.claude/debt/viewer-token-cache-identity.md`: background `isValidating` cannot select skeleton,
  and resting UI requires absent data plus initial loading.
- Browser proof: the valid three-step lesson route contains `Back` and no breadcrumb list. Focused
  FE tests pass `14/14`; targeted lint passes.

## Correction — durable responsive and Markdown grammar

- Added source-origin-free behavior capsules and hashed TSX templates for adaptive path navigation,
  responsive independent tab axes and authored Markdown documents.
- Markdown grammar now owns semantic blocks, host-relative headings, local overflow for code/tables,
  safe link disposition, source-derived outline and opt-in passage selection. Responsive tabs own
  narrow stacking, wide peer rows, per-axis overflow and omission of inert axes.
- Grammar validation passes with deterministic golden/counterexample resolution, template hash and
  TSX compilation, source-origin rejection and selective context packs that omit unrelated
  principles.
- Added standalone `$starci-grammar-refresh-references`: optional immutable refs may be refreshed in
  one run, while templates/capsules/rulings/cases/rules/profiles remain unchanged.
