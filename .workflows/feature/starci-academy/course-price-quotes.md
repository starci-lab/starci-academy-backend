<!-- starci-workflow: v2 -->

# course-price-quotes

## plan

Candidate revision: `course-price-quotes-r1`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | `D:\Repositories\starci-academy-backend` |
| Source | `D:\Repositories\starci-academy-backend` |
| Project | Explicit StarCi Academy targets |
| Frontend | `D:\Repositories\starci-academy-fe` |
| Backend | `D:\Repositories\starci-academy-backend` |
| Trust | `D:\Repositories\starci-academy-backend\.claude` |
| Skills | `D:\Repositories\starci-academy-backend\.claude\skills` |
| App | `core` (`nest-cli.json`) |
| Repo / branch | `D:\Repositories\starci-academy-backend` @ `mtp` |
| Primary database | PostgreSQL through `InjectPrimaryPostgreSQLEntityManager` |
| Purpose | Make one backend quote engine the source of every course price shown or charged for discovery, one-course purchase, multi-course checkout, vouchers and installments. |
| Workflow root | `D:\Repositories\starci-academy-backend\.workflows` |
| Workflow | `D:\Repositories\starci-academy-backend\.workflows\feature\starci-academy\course-price-quotes.md` |
| Language | `vi` |
| Phase | `plan` |
| Touching | Workflow only; no backend or frontend product source until Review approval. |

### SCHEMA EVIDENCE

| Evidence | Result |
|---|---|
| Unfiltered live GraphQL schema at `http://localhost:3001/graphql` | Existing authenticated reads are `coursePricePreview(courseId, voucherCode)` and `coursesCheckoutPreview(request: { courseIds })`; there is no neutral batch quote operation shared by discovery and checkout. |
| Single preview | Loads one course itself, computes loyalty, phase scarcity, voucher preview and installment options independently. |
| Multi-course preview | Calls `CoursesCheckoutPricingService.priceCart`, then separately computes installment options from the cart total. |
| Real single checkout | Gateway services independently resolve phase/loyalty amounts and apply voucher/installment modifiers. |
| Real multi checkout | Handler calls `priceCart`, then independently turns its total into an installment charge. |
| Current ownership | Primitive `CoursePricingService` lives under the `course-enroll` mutation and is re-provided by unrelated query/mutation modules. |
| Visible defect | Course detail derives list-to-phase reduction (`1.25m / 1.5m ≈ 17%`) in FE while catalog displays backend loyalty percent (`5%`), so identical courses disagree. |

### CAPABILITY BRIEF

| Rule | Decision |
|---|---|
| Canonical engine | Add `CoursePriceQuoteService` under the business layer; it loads pricing inputs once and owns phase, loyalty, bundle, voucher preview, totals, scarcity and installment arithmetic. |
| Array contract | Every quote accepts `courseIds: [ID!]!`; one course is exactly a one-element array, never a separate formula. |
| Intent | `DISCOVERY` prices every requested course as an independent one-course purchase; `CHECKOUT` treats the full de-duplicated array as one order and applies progressive loyalty plus bundle bonus. |
| Percent semantics | `loyaltyDiscountPercent` and `bundleDiscountPercent` are explicit. `displayDiscountPercent` means loyalty + bundle only, matching the existing catalog 5% chip. List-to-phase savings remains a separate amount/step and must not masquerade as that chip. |
| Totals | Engine returns per-course lines and aggregate list/phase/charged totals; all adapters consume these values rather than recomputing. |
| Voucher | Optional voucher is evaluated by the engine for a one-course quote. Reservation/consumption remains in the transactional checkout path, but the charge must use the same quoted modifier result revalidated under lock. Multi-course voucher remains rejected until a separate product rule exists. |
| Installments | Engine returns offered terms and, when `installmentMonths` is supplied, the selected plan total and first-cycle amount from the final VND order total. |
| Scarcity | Discovery lines retain current/next phase, seats remaining and next-phase prices so the detail rail/modal does not need a second pricing read. |
| Compatibility | Existing `coursePricePreview` and `coursesCheckoutPreview` stay temporarily as thin adapters to the engine; new clients use `coursePriceQuotes`. No behavior fork remains behind the legacy names. |
| Runtime truth | Checkout handlers receive a prepared quote and persist/charge its values. Gateway adapters must not call price arithmetic again. |

### GRAPHQL CONTRACT

| Shape | Fields |
|---|---|
| `CoursePriceQuotesRequest` | `courseIds: [ID!]!`, `intent: CoursePriceQuoteIntent!`, optional `voucherCode`, optional `installmentMonths` |
| `CoursePriceQuoteIntent` | `DISCOVERY`, `CHECKOUT` |
| `CoursePriceQuoteLine` | `courseId`, list/phase/charged VND and USD, loyalty/bundle/display percents, reason, phase/scarcity/next-phase fields |
| `CoursePriceQuotesData` | `lines`, aggregate list/phase/charged/savings totals, `bundleDiscountPercent`, `itemCount`, offered installment options, optional selected installment |
| Errors | Existing typed course-not-found, voucher and installment exceptions; invalid cross-course voucher and unsupported installment terms fail loudly rather than being ignored. |

### PROPOSED FILE TREE

| Path | Action | Exact responsibility |
|---|---|---|
| `src/modules/bussiness/course-pricing/course-pricing.module-definition.ts` | ADD | Configurable module boundary. |
| `src/modules/bussiness/course-pricing/course-pricing.module.ts` | ADD | Export calculator and quote engine once to API features. |
| `src/modules/bussiness/course-pricing/course-price-calculator.service.ts` | ADD | Re-home pure list/phase/currency arithmetic from the mutation-owned service. |
| `src/modules/bussiness/course-pricing/course-price-quote.service.ts` | ADD | Canonical array quote orchestration for discovery/checkout, modifiers, totals, scarcity and installments. |
| `src/modules/bussiness/course-pricing/types.ts` | ADD | Internal input, line, total and prepared-checkout types. |
| `src/modules/bussiness/course-pricing/course-price-calculator.service.spec.ts` | ADD | Twin specs for list/phase/currency/clamping/test divisor behavior. |
| `src/modules/bussiness/course-pricing/course-price-quote.service.spec.ts` | ADD | Twin specs for one/many intent, ownership, loyalty, bundle, voucher, scarcity and installment branches. |
| `src/modules/bussiness/bussiness.module.ts` | MODIFY | Register/export the course-pricing business module. |
| `src/features/api/core/graphql/queries/courses/course-price-quotes/course-price-quotes.module-definition.ts` | ADD | Isolated query module definition. |
| `src/features/api/core/graphql/queries/courses/course-price-quotes/course-price-quotes.module.ts` | ADD | Register resolver and thin transport service; consume global business engine. |
| `src/features/api/core/graphql/queries/courses/course-price-quotes/course-price-quotes.resolver.ts` | ADD | Authenticated GraphQL query with the array request. |
| `src/features/api/core/graphql/queries/courses/course-price-quotes/course-price-quotes.service.ts` | ADD | Map auth/request envelope to business quote and GraphQL DTO. |
| `src/features/api/core/graphql/queries/courses/course-price-quotes/graphql-types/request.ts` | ADD | Input and intent enum registration. |
| `src/features/api/core/graphql/queries/courses/course-price-quotes/graphql-types/response.ts` | ADD | Line, totals, scarcity and installment response objects. |
| `src/features/api/core/graphql/queries/courses/course-price-quotes/course-price-quotes.service.spec.ts` | ADD | Transport mapping/error twin specs. |
| `src/features/api/core/graphql/queries/courses/courses.module.ts` | MODIFY | Register the new query operation. |
| `src/features/api/core/graphql/queries/courses/course-price-preview/course-price-preview.service.ts` | MODIFY | Compatibility adapter: one-element `DISCOVERY` quote, no arithmetic. |
| `src/features/api/core/graphql/queries/courses/course-price-preview/course-price-preview.module.ts` | MODIFY | Consume business engine; stop re-providing mutation pricing. |
| `src/features/api/core/graphql/queries/courses/courses-checkout-preview/courses-checkout-preview.service.ts` | MODIFY | Compatibility adapter: `CHECKOUT` quote, no totals/installment recomputation. |
| `src/features/api/core/graphql/queries/courses/courses-checkout-preview/courses-checkout-preview.module.ts` | MODIFY | Consume business engine; stop re-providing mutation pricing. |
| `src/features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout-pricing.service.ts` | MODIFY | Thin compatibility adapter to the canonical engine for current handler call sites. |
| `src/features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout-pricing.service.spec.ts` | MODIFY | Prove exact delegation and preserve current public result. |
| `src/features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout.handler.ts` | MODIFY | Consume selected installment/charge from the prepared quote; no local price math. |
| `src/features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout.module.ts` | MODIFY | Remove local pricing providers. |
| `src/features/api/core/graphql/mutations/courses/course-enroll/course-enroll.handler.ts` | MODIFY | Build one-element checkout quote after capability checks and pass it to the selected gateway. |
| `src/features/api/core/graphql/mutations/courses/course-enroll/course-enroll.command.ts` | MODIFY | Carry internal prepared quote without widening GraphQL input. |
| `src/features/api/core/graphql/mutations/courses/course-enroll/course-enroll-payos.service.ts` | MODIFY | Consume quote VND/selected installment; keep gateway and voucher reservation transaction only. |
| `src/features/api/core/graphql/mutations/courses/course-enroll/course-enroll-sepay.service.ts` | MODIFY | Same prepared-quote consumption for SePay. |
| `src/features/api/core/graphql/mutations/courses/course-enroll/course-enroll-stripe.service.ts` | MODIFY | Consume quoted USD; keep gateway and reservation transaction only. |
| `src/features/api/core/graphql/mutations/courses/course-enroll/course-enroll-paypal.service.ts` | MODIFY | Consume quoted USD; keep gateway and reservation transaction only. |
| `src/features/api/core/graphql/mutations/courses/course-enroll/course-enroll-crypto.service.ts` | MODIFY | Consume quoted USD; keep gateway and reservation transaction only. |
| `src/features/api/core/graphql/mutations/courses/course-enroll/course-enroll.module.ts` | MODIFY | Remove mutation-local calculator provider. |
| `src/features/api/core/graphql/mutations/courses/course-enroll/course-pricing.service.ts` | DELETE | Remove wrong mutation ownership after all imports migrate. |
| `src/features/api/core/graphql/mutations/courses/course-enroll/types/course-pricing.ts` | DELETE | Move calculator types to business ownership. |
| `src/features/api/core/graphql/queries/dashboard/recommended-courses/recommended-courses.service.ts` | MODIFY | Consume canonical discovery quote; stop independent discount arithmetic. |
| `src/features/api/core/graphql/queries/dashboard/recommended-courses/recommended-courses.module.ts` | MODIFY | Remove local calculator provider. |
| `src/features/api/core/graphql/schema-builds.int-spec.ts` | MODIFY | Freeze the new array schema and explicit percent meanings. |
| `src/tests/e2e/course-purchase.e2e-spec.ts` | MODIFY | Prove one-course preview, modal quote and persisted/charged amount match. |
| `src/tests/e2e/courses-checkout.int-spec.ts` | MODIFY | Prove multi-course quote totals, line percents and checkout persisted amounts match. |
| `src/tests/e2e/installment-plan.int-spec.ts` | MODIFY | Prove offered/selected installment values and first charge come from the same quote total. |

### TEST MATRIX

| Case | Expected consequence |
|---|---|
| `DISCOVERY` with one course | Line percent and charged amount equal course detail, catalog and legacy single preview. |
| `DISCOVERY` with several IDs | Every line is priced independently with one fetched loyalty context; no accidental bundle/progressive bonus. |
| `CHECKOUT` with one course | Same base/loyalty result as one-course discovery before voucher/installment modifiers. |
| `CHECKOUT` with two/three courses | Progressive loyalty and 5%/10% bundle tiers appear explicitly and totals equal the sum of lines. |
| Duplicate IDs | De-duplicated once; never double charged. |
| Already-owned course | Discovery may report ownership metadata; checkout excludes it exactly as the current cart contract does. |
| Missing ID | Existing typed `CourseNotFoundException` identifies the missing course. |
| Phase price lower than list | `phasePrice`/phase saving changes; `displayDiscountPercent` remains loyalty+bundle (5% in the reported case), never inferred as 17%. |
| Voucher on one course | Previewed final amount equals revalidated checkout amount; reservation remains atomic. |
| Voucher with several courses | Typed rejection until allocation semantics are separately approved. |
| Installment 3/6/12 | Offered total/monthly and selected first-cycle charge derive from final quoted VND total. |
| Unsupported installment/gateway | Existing typed capability exception occurs before transaction creation. |
| USD missing on one line | Aggregate USD remains null and international checkout rejects through existing typed path. |
| Live call | Same learner + Fullstack course returns identical line values from `coursePriceQuotes(DISCOVERY)`, legacy preview, detail consumer and catalog consumer. |

### EXCLUSIONS

| Excluded | Reason |
|---|---|
| New pricing tables or migration | Current course, phase, enrollment, loyalty, voucher and installment storage is sufficient. |
| FE-calculated fallback percentage | Recreates the defect; missing quote must render loading/error, not guess. |
| Silent voucher allocation across a bundle | No approved rule exists for flat/percent distribution. |
| Payment gateway rewrite | Gateways remain transport adapters; only arithmetic ownership moves. |
| Removing legacy GraphQL operations immediately | FE migration should land first; adapters prevent a breaking deploy. |

### OUTPUTS

| Concept | Result |
|---|---|
| Price SSOT | One business quote engine for shown, persisted and charged course prices. |
| Batch API | One array operation with explicit discovery-vs-checkout intent. |
| Discount semantics | 5% loyalty/bundle chip is separate from phase savings; 17% can no longer appear from FE inference. |
| Installments | Options and selected charge are projections of the same final order quote. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/starci-academy/course-price-quotes.md` | Added evidence-backed backend capability revision `course-price-quotes-r1`; no product source changed. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve intent split and exact production boundary? | Approve `course-price-quotes-r1` after Feature Review; Apply remains blocked until explicit approval. |

### WARNINGS

| Warning | Impact |
|---|---|
| Backend worktree contains unrelated CV and workflow changes | Apply must preserve them and touch only this revision's approved tree. |
| Existing single gateway services currently calculate modifiers internally | Moving prepared values must retain their advisory validation plus atomic voucher revalidation/reservation. |
| Local VND `/100` divisor is existing behavior | Calculator re-home must preserve it exactly; this feature does not redefine dev payment amounts. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Catalog sends all visible courses as one checkout | `DISCOVERY` batch intent | Otherwise merely viewing three cards grants a 10% bundle discount. |
| One endpoint without intent | Explicit `DISCOVERY` / `CHECKOUT` | An array can mean independent offers or one order; those have different business rules. |
| Detail computes `(list-phase)/list` | Backend `displayDiscountPercent` | That produced the reported 17% vs 5% drift. |
| Keep calculator under `course-enroll` | Business course-pricing module | Queries, cart, checkout and gateways all own consumers. |

### OWED

| Owed | Cleared by |
|---|---|
| Review challenge and explicit approval | `starci-be-feature-review` for `course-price-quotes-r1`. |
| Backend source, twin specs, schema test, e2e and live call | `starci-be-feature-apply` after approval. |
| FE query generation and migration of detail/catalog/modal/cart | Approved FE design/fidelity continuation after the backend schema is available. |

## review

Candidate revision: `course-price-quotes-r2`

### CONTEXT

| Field | Value |
|---|---|
| Source / Backend | `D:\Repositories\starci-academy-backend` @ `mtp` |
| Frontend | `D:\Repositories\starci-academy-fe` |
| App / database | `core` / primary PostgreSQL |
| Workflow | `.workflows/feature/starci-academy/course-price-quotes.md` |
| Phase | `review` |
| Touching | This workflow only; production source remains frozen pending explicit approval of r2. |

### OUTPUTS

| Capability | Reviewed decision |
|---|---|
| Canonical engine | Business-layer array quote engine remains the single arithmetic owner. |
| Public operation | `coursePriceQuotes(request)` with explicit `DISCOVERY` and `CHECKOUT` intent is approved as the candidate contract. |
| One vs many | One course is a one-element array; multi-course checkout is the same engine with order intent. |
| Display semantics | The reported chip is loyalty + bundle only. Phase saving is a separate breakdown step; generic `-5%` copy must become “ưu đãi thêm 5%”/equivalent so the number is not presented as list-to-final math. |
| Checkout freshness | FE quote is advisory. The authenticated mutation invokes the engine again server-side immediately before gateway transaction creation; no client quote amount is accepted as input. |
| Voucher atomicity | Engine owns modifier arithmetic, while the gateway transaction revalidates and reserves the voucher under the existing lock before persisting the exact final quote. |
| Installment truth | Offered and selected installment values derive from the final server quote. Mutations consume selected quote fields and perform no duplicate arithmetic. |
| Compatibility | Existing single and cart preview queries delegate to the engine until FE migration is complete. |

### CHANGES

| Revision delta | Exact change from r1 |
|---|---|
| Internal handoff | Remove `course-enroll.command.ts` from the production boundary. The command remains a request envelope; the handler creates a fresh server quote and passes an internal prepared-checkout object directly to the chosen gateway service. |
| Transaction rule | Add a quote freshness/revalidation branch to `course-price-quote.service.ts`; checkout cannot trust a previously rendered GraphQL quote. |
| Percentage copy | Freeze explicit phase/loyalty/bundle/effective fields; FE-facing `displayDiscountPercent` is loyalty + bundle and requires qualified copy. |
| Exact touching correction | All r1 paths remain except `src/features/api/core/graphql/mutations/courses/course-enroll/course-enroll.command.ts`, which is removed from Touching. No migration/entity/schema storage change. |

### NEED APPROVALS

| Approval | Required response |
|---|---|
| Freeze `course-price-quotes-r2` and its exact production boundary for Apply | `duyệt course-price-quotes-r2` |

### WARNINGS

| Warning | Mitigation |
|---|---|
| A 5% loyalty chip beside list and phase prices is not the total list-to-final reduction | Label it as an additional loyalty/bundle benefit and show list → phase → benefit in the modal. |
| Discovery batches and checkout arrays have different economics | Required intent enum prevents catalog browsing from accidentally earning bundle discounts. |
| Phase/seat state may change after the modal opens | Checkout re-quotes server-side; the mutation result/redirect owns the final amount. |
| Existing local `/100` VND payment divisor affects shown and charged local amounts | Preserve current behavior in r2; changing local pricing policy is outside this defect. |

### REJECTED

| Rejected | Replacement |
|---|---|
| Accept quote amount/id from FE for charging | Fresh server-side engine invocation in the mutation. |
| Put prepared quote on the CQRS command before handler validation | Handler-local prepared-checkout object after auth/capability validation. |
| Treat `courseIds.length > 1` as automatically one order | Explicit intent controls independent discovery vs checkout economics. |
| Report phase reduction as loyalty discount | Separate fields and qualified modal breakdown. |

### OWED

| Owed | Owner |
|---|---|
| Explicit approval of r2 | User. |
| Backend implementation and proof | `starci-be-feature-apply` after approval. |
| FE wiring for catalog/detail/modal/cart and absolute top-right phase chip | Existing approved FE design Apply continuation after backend schema is live. |

## apply

Applied revision: `course-price-quotes-r2`

### CONTEXT

| Field | Value |
|---|---|
| Source / Backend | `D:\Repositories\starci-academy-backend` @ `mtp` |
| Frontend | `D:\Repositories\starci-academy-fe` |
| App / runtime | `core` / `http://localhost:3001/graphql` |
| Phase | `apply` |
| Touching | Approved r2 production tree plus the directly impacted `course-payment-abandoned.int-spec.ts` constructor harness. Unrelated workflow, CV, lint-lane and test-renaming changes were preserved. |

### OUTPUTS

| Capability | Applied result |
|---|---|
| Canonical quote engine | `CoursePriceQuoteService` owns one-course and array pricing for discovery and checkout. |
| Shared arithmetic | Phase, loyalty, bundle, voucher and installment amounts are derived once by the business pricing module. |
| Public API | `coursePriceQuotes(request)` is mounted in the live GraphQL schema with explicit `DISCOVERY` / `CHECKOUT` intent. |
| Checkout freshness | Single and multi-course mutations re-quote on the backend; gateway adapters receive prepared quote values and do not recalculate discounts. |
| Compatibility | Existing detail, cart preview and recommendation paths delegate to the same quote engine while FE migration remains incremental. |
| Discount display | `displayDiscountPercent` represents only the qualified loyalty/bundle benefit; phase saving remains a separate breakdown value. |

### CHANGES

| Area | Result |
|---|---|
| Business module | Added calculator, quote service, shared types, Nest module and twin specs. |
| GraphQL | Added batch quote request/response types, resolver/service/module and schema proof. |
| Checkout | Routed single, multi, voucher and installment checkout through a fresh canonical quote. |
| Gateways | PayOS, SePay, Stripe, PayPal and crypto consume prepared VND/USD totals and selected installment fields. |
| Adapters | Legacy preview/recommendation services delegate without recreating arithmetic. |
| Integration harness | Updated the abandoned-payment world to provide the canonical calculator and quote service. |

### PROOF

| Gate | Result |
|---|---|
| TypeScript | `npx tsc --noEmit --pretty false` — pass. |
| Focused ESLint | Pricing module, quote query, enroll, checkout and impacted harness — pass. |
| Unit lane | 216 suites, 1,419 tests — pass. |
| Integration lane | 7 suites, 39 tests against Testcontainers Postgres/Redis — pass. |
| Core build | `npx nest build core` — pass; only pre-existing dependency warnings. |
| Live schema | Introspection at `http://localhost:3001/graphql` confirms `coursePriceQuotes` is mounted. |
| Runtime | Backend listens on `localhost:3001`; FE listens on `localhost:3000`. |

### WARNINGS

| Warning | Classification |
|---|---|
| Node local-storage, pg deprecation, Qdrant/Kafka and GPJWP warnings | Existing environment/dependency warnings; no pricing test or build failure. |
| FE still calls compatibility preview in some surfaces | Safe because the adapter now delegates to the canonical engine; direct batch-query migration remains visible work. |

### OWED

| Owed | Owner |
|---|---|
| Generate the FE GraphQL hook and migrate catalog/detail/modal/cart directly to `coursePriceQuotes` | Existing approved FE design/fidelity continuation. |
