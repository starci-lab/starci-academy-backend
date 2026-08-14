# course-detail-page-v3

## plan

SCOPE
| | |
|---|---|
| Doing | Choose how prerequisites, the pricing ladder, trial/cart and a review block land on the course detail page |
| Repo / branch | D:\Repositories\starci-academy-fe |
| Touching | .artifacts/design-plan/course-detail-page-v3/** |
| Not touching | src/**, the legacy repo, the backend |
| Produces | Three real screens at a URL, and one chosen |

CHOSE   direction A, "the rail decides and it does not move" - answered "A" after the three
        directions were hosted. An earlier bare "ok" was NOT recorded as a selection; the choice was
        put once more as a named question first.

        Everything new lands where the named legacy render already put it: prerequisites under the
        promises, the discount ladder in the rail, trial and cart under the primary enrol button,
        reviews at the foot. The rail holds still, because a buy box that animates while a reader
        compares a price is a buy box they stop trusting.

        It absorbs the older `cart` case, whose direction was chosen and never previewed, rather
        than leaving two cases competing for one rail.

TOOK    Two of the seven requested items were ALREADY built - `course-promise-list` and
        `course-module-list` are joined SurfaceListCard lists today, the second an `ol` because
        modules are ordered. Excluded from the case rather than dressed up as work.

TOOK    "Sticky card with an effect" was never defined, so rather than assume a meaning it became a
        differentiator: each direction answered it differently and choosing A chose "the rail does
        not move".

COST    The reviews sit furthest from the moment of decision - the one thing the backend built this
        session exists to serve. That is the trade the parity posture makes.

OPEN    Does an empty review block at the foot read as "no reviews yet" or as a broken region?
OPEN    Should the trial button disappear or disable once a trial is spent? The backend has
        startTrial but the page has no state evidence for a spent trial.
## review

SCOPE
| | |
|---|---|
| Doing | Build the chosen screen (direction A) from the real components, contracts and tokens |
| Repo / branch | D:\Repositories\starci-academy-fe — main @ f06071e |
| Touching | .artifacts/design-plan/course-detail-page-v3/** |
| Not touching | src/**, the legacy repo, the backend |
| Produces | A candidate that builds, four rendered states, this section |

STATES  course-review-block     → populated (3 reviews, one score-only)  → rendered
        course-review-block     → empty (nobody has rated)               → rendered
        course-prerequisite-list → present (3 ordered requirements)      → rendered
        course-prerequisite-list → absent (course has none)              → rendered
        course-pricing-rail     → trial spent / in cart                  → NOT rendered, blocks not built
        Screens: .artifacts/design-plan/course-detail-page-v3/screens/*.png
        Green: tsc 0, eslint 0 under 58 starci-fe rules, next build --webpack exits 0.

BACKEND nothing missing. submitCourseReview / updateCourseReview / deleteCourseReview / courseReviews
        and the CDC-fed aggregate all shipped earlier this session; startTrial and addToCart already
        existed. No sub-run was needed.

FOUND   The summary printed the mean twice - "4.2" as the heading and "4.2/5" beside it. Only the
        render showed it.
FOUND   An unrated course read as "0.0 ☆☆☆☆☆ 0 danh gia". The projection answers zero, and drawing
        that zero invents a complaint nobody made. It now says it has no reviews.
FOUND   The plan recorded REUSE of `pricing-phase-ladder`. That key no longer exists - the target
        moved to main and the discount breakdown is now `course-price-detail-stack` holding
        `stacked-stat-rows`. Read from source and corrected, not left to fail at Apply.
FOUND   `course-prerequisite-list` as a `ul` would have spelled exactly what `course-promise-list`
        spells, and `no-duplicate-entry-shape` refuses that by name. It is an `ol`, which the
        backend's own "Ordered prerequisites" wording says it should have been anyway.

TOOK    Five OUTLINE stars stand for the scale and the number carries the value. A filled star needs
        `24/solid`, which is not one of StarCi's two glyph families, and ICON-5 refuses telling
        filled from empty by colour. `react-stars` and a HeroUI star were both refused by ICON-7.
TOOK    Each review row states `5/5` rather than drawing its own star run - repeating the scale on
        every line is what makes the scale stop meaning anything.
TOOK    Prerequisite ordinals are text, not the browser's `ol` marker: the list carries `p-0` and
        its rows own the inset, so a native marker would hang outside it.

PROPOSED  contracts: course-prerequisite-list, course-prerequisite-row, course-review-block,
          course-review-summary, course-review-list, course-review-row, course-review-author-line,
          rating-star-run  → src/components/contracts/index.ts
          icon: one name "star" → @heroicons/react/24/outline StarIcon, in
          src/components/leaves/Icon/index.tsx
          slot: course-section body accepts course-prerequisite-list and course-review-block

APPROVED  Shown the three screens and the calls above, asked "duyet cai nay va di tiep sang Apply
          chu?", answered "ok". The thing was named before the word, which is what makes the word
          carry it.
