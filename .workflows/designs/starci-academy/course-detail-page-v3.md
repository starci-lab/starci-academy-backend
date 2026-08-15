# course-detail-page-v3

## plan

| | |
|---|---|
| Doing | Choose how prerequisites, the pricing ladder, trial/cart and a review block land on the course detail page |
| Repo / branch | `D:\Repositories\starci-academy-fe` |
| Touching | `.artifacts/design-plan/course-detail-page-v3/**` |
| Not touching | `src/**`, the legacy repo, the backend |
| Produces | Three real screens at a URL, and one chosen |

**Chose** direction A, *"the rail decides and it does not move"* — answered "A" after the three
directions were hosted. An earlier bare "ok" was NOT recorded as a selection; the choice was put
once more as a named question first.

Everything new lands where the named legacy render already put it: prerequisites under the promises,
the discount ladder in the rail, trial and cart under the primary enrol button, reviews at the foot.
The rail holds still, because a buy box that animates while a reader compares a price is a buy box
they stop trusting.

It absorbs the older `cart` case, whose direction was chosen and never previewed, rather than
leaving two cases competing for one rail.

| Took | Because |
|---|---|
| Two of the seven requested items were ALREADY built | `course-promise-list` and `course-module-list` are joined SurfaceListCard lists today, the second an `ol` because modules are ordered. Excluded from the case rather than dressed up as work |
| "Sticky card with an effect" was never defined | Rather than assume a meaning it became a differentiator: each direction answered it differently, and choosing A chose "the rail does not move" |

| Cost | What it buys |
|---|---|
| The reviews sit furthest from the moment of decision — the one thing the backend built this session exists to serve | That is the trade the parity posture makes |

| Open | Settled by |
|---|---|
| Does an empty review block at the foot read as "no reviews yet" or as a broken region? | |
| Should the trial button disappear or disable once a trial is spent? | The backend has `startTrial` but the page has no state evidence for a spent trial |

## review

| | |
|---|---|
| Doing | Build the chosen screen (direction A) from the real components, contracts and tokens |
| Repo / branch | `D:\Repositories\starci-academy-fe` — `main` @ `f06071e` |
| Touching | `.artifacts/design-plan/course-detail-page-v3/**` |
| Not touching | `src/**`, the legacy repo, the backend |
| Produces | A candidate that builds, four rendered states, this section |

| Owner | State | Rendered |
|---|---|---|
| `course-review-block` | populated — 3 reviews, one score-only | yes |
| `course-review-block` | empty — nobody has rated | yes |
| `course-prerequisite-list` | present — 3 ordered requirements | yes |
| `course-prerequisite-list` | absent — course has none | yes |
| `course-pricing-rail` | trial spent / in cart | **no** — the blocks were not built |

Screens: `.artifacts/design-plan/course-detail-page-v3/screens/*.png`.
Green: `tsc` 0, `eslint` 0 under 58 `starci-fe` rules, `next build --webpack` exits 0.

| Backend | Covered by |
|---|---|
| nothing missing | `submitCourseReview` / `updateCourseReview` / `deleteCourseReview` / `courseReviews` and the CDC-fed aggregate all shipped earlier this session; `startTrial` and `addToCart` already existed. No sub-run was needed |

| Found | What it means |
|---|---|
| The summary printed the mean twice — "4.2" as the heading and "4.2/5" beside it | Only the render showed it |
| An unrated course read as "0.0 ☆☆☆☆☆ 0 đánh giá" | The projection answers zero, and drawing that zero invents a complaint nobody made. It now says it has no reviews |
| The plan recorded REUSE of `pricing-phase-ladder`, and that key no longer exists | The target moved to `main` and the discount breakdown is now `course-price-detail-stack` holding `stacked-stat-rows`. Read from source and corrected, not left to fail at Apply |
| `course-prerequisite-list` as a `ul` would have spelled exactly what `course-promise-list` spells | `no-duplicate-entry-shape` refuses that by name. It is an `ol`, which the backend's own "Ordered prerequisites" wording says it should have been anyway |

| Took | Because |
|---|---|
| Five OUTLINE stars stand for the scale; the number carries the value | A filled star needs `24/solid`, which is not one of StarCi's two glyph families, and ICON-5 refuses telling filled from empty by colour. `react-stars` and a HeroUI star were both refused by ICON-7 |
| Each review row states `5/5` rather than drawing its own star run | Repeating the scale on every line is what makes the scale stop meaning anything |
| Prerequisite ordinals are text, not the browser's `ol` marker | The list carries `p-0` and its rows own the inset, so a native marker would hang outside it |

| Proposed | Target |
|---|---|
| contracts: `course-prerequisite-list`, `course-prerequisite-row`, `course-review-block`, `course-review-summary`, `course-review-list`, `course-review-row`, `course-review-author-line`, `rating-star-run` | `src/components/contracts/index.ts` |
| icon: one name `star` → `@heroicons/react/24/outline` `StarIcon` | `src/components/leaves/Icon/index.tsx` |
| slot: `course-section` body accepts `course-prerequisite-list` and `course-review-block` | `src/components/contracts/index.ts` |

**Approved** — shown the three screens and the calls above, asked *"duyệt cái này và đi tiếp sang
Apply chứ?"*, answered "ok". The thing was named before the word, which is what makes the word
carry it.

## apply

| | |
|---|---|
| Doing | Write the reviewed screen into production and open the real page |
| Repo / branch | `D:\Repositories\starci-academy-fe` — `main` @ `f06071e` |
| Touching | contracts, the Icon leaf, two new blocks, the course detail page, and — after one extra confirmation — the query layer |
| Not touching | the rest of `src/**`, the backend, the legacy repo |
| Produces | `/vi/courses/[displayId]` rendering prerequisites from real data |

| Wrote | Note |
|---|---|
| `components/contracts/index.ts` | 8 entries + `course-section` body slot |
| `components/leaves/Icon/index.tsx` | one meaning `star` → `StarIcon`, both cuts |
| `blocks/courses/CoursePrerequisiteList/component.tsx` | new |
| `blocks/courses/CourseReviewBlock/component.tsx` | new |
| `pages/CourseDetailPage/component.tsx` | two sections, labels, data, resting count |
| `pages/CourseDetailPage/index.tsx` | prerequisites mapped, four labels |
| `modules/api/graphql/queries/query-course.ts` | `prerequisites { text orderIndex }` |
| `modules/api/graphql/queries/types/course.ts` | `CoursePrerequisiteRow` + field |
| `modules/api/graphql/queries/query-course-reviews.ts` | new |
| `modules/api/graphql/queries/types/course-reviews.ts` | new |
| `messages/en.json`, `messages/vi.json` | four labels each |

The last six were OUTSIDE the boundary confirmed at the start. The page receives neither
prerequisites nor reviews and the course query never asked for them, so composing the reviewed
screen was impossible without them. Asked again before writing; answered *"a) mở rộng boundary"*.
Recorded here because a file the review never named is exactly what this list exists to make visible.

| Green | Result |
|---|---|
| `tsc` | clean across every file this run wrote |
| `eslint` | clean across every file this run wrote |
| `next build --webpack` | compiled successfully |
| the real page | `http://localhost:3000/vi/courses/fullstack-mastery` renders "Cần có trước khi bắt đầu" with two real requirements from `PrerequisiteEntity`, numbered and joined, and "Đánh giá từ học viên" showing the unrated state rather than a fabricated zero. Screenshot: `.artifacts/design-plan/course-detail-page-v3/screens/real-page.png` |

| Found | What it means |
|---|---|
| A `ul` prerequisite list would have duplicated `course-promise-list` exactly and been refused by `no-duplicate-entry-shape` | It is an `ol` because the backend documents the relation as ordered — the legal shape and the honest one turned out to be the same shape |
| Block data must be a `type`, never an `interface`, and the fence reaches nested row shapes too | Two rounds of the compiler to learn what the Icon leaf already documents |

| Owed | Cleared by |
|---|---|
| The reviews region renders `unrated` on every course | The connected half does not call `courseReviews` yet: the query document and its types are written and typecheck, but no SWR hook fetches them, so `reviewTotal` is always undefined. One hook plus one mapping |
| The rail states this review never rendered — trial spent, already in cart | They are still not drawn anywhere |
| Four `tsc` errors in `hooks/swr/useQueryCoding*.ts` and one in `mutate-submit-coding-solution.ts` | Another session's in-flight work, not this run's. Reported rather than touched |

### apply, continued — the reviews fetch

WROTE   src/hooks/swr/useQueryCourseReviewsSwr.ts                            new
        src/hooks/index.ts                                                   barrel export
        src/components/pages/CourseDetailPage/index.tsx                      fetch + map + count argument

GREEN   tsc and eslint clean across every file this run wrote.
        Backend booted on 3001 and answered 200 - which also proves the review entity's @ObjectType,
        since a missing one stops the schema being built at all.
        Page: http://localhost:3000/vi/courses/fullstack-mastery renders "Danh gia tu hoc vien" with
        4.5, five marks, "2 danh gia" and both seeded reviews with their scores and bodies.
        Screenshot: .artifacts/design-plan/course-detail-page-v3/screens/reviews-live.png

FOUND   The FE must run on port 3000. On 3020 every GraphQL POST failed with ERR_FAILED after a 204
        preflight - the API's CORS allows the conventional port and nothing else. The page looked
        broken and the code was fine.
FOUND   The rating rendered without Debezium running. The projection service falls back to a TTL
        lazy-refresh on read, so a missing row recomputes itself. The CDC path is the fast path,
        not the only one - worth knowing before anybody debugs a "broken" rating.
FOUND   `t("reviewCount")` printed the raw key. next-intl needs the count to interpolate, and a
        missing argument prints the key rather than failing - visible only by looking.

OWED    THE AUTHOR IS A RAW UUID. `CourseReview` exposes userId and no display name, so the list
        shows an id where a name belongs. My own entity doc argued only scalars belong on that type
        because "a client that just wrote a review already knows both" - true for the mutation
        response, wrong for the list query, where the reader knows neither. Fixing it is a backend
        change: expose the author as a resolved field, then map it here.
        This is the one defect a fixture could not have caught: the preview used names.

| Rejected | Instead | Why |
|---|---|---|
| not recorded | — | This task ran before the refusal table existed. `$starci-fe-upgrade-plan` counts these rows as witnesses, so filling it from memory of somebody else's run would manufacture a rule |
