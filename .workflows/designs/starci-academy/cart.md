# cart

Migrated from the previous shape mid-run. Plan, Preview and Apply ran against the record-and-seal
skills; their evidence lives in `starci-academy-fe/.artifacts/design-plan/cart/`
(`plan-record.md`, `installment-analysis.md`, `design-record.md/json`, `screens/`, `candidate/`).
This file is that evidence in the shape `starci-workflow-drift` reads.

## plan

| | |
|---|---|
| Doing | The cart: a `/cart` page, a cart drawer, and where the instalment offer lives |
| Repo / branch | `starci-academy-fe` @ `main` (`8410a74` at Plan time) |
| Touching | artifacts only |
| Not touching | all production source |
| Produces | four directions at `localhost:8096` |

**Chose** `direction-legacy-full-default` — the reference's own position, kept. The payment step
opens on paying at once; instalments are a choice the buyer turns on. Chosen one turn after asking
for A and B to be inverted to an instalment default and being shown what that default costs.

| Took | Because |
|---|---|
| Instalments already ship on the backend end to end. One term only: 3 months | The frontend renders none of it |
| Markup drops 10% → **5%**, by the teacher | Shares must sum to `100 + markup`, so the first instruction 50/30/30 (= 110) no longer closes; keeping the instructed 50% first cycle leaves 55 to split, giving **50 / 27,5 / 27,5**. On the worked cart: 2.475.000 + 1.361.250 ×2 = 5.197.500. Working in `installment-analysis.md` |
| Nothing client-side recomputes a discount or a cycle | The legacy drawer re-declared the bundle tiers as constants; that is the copy nobody edits when the server's changes |
| A fourth direction was kept in the lab holding the reference default | The other three departed from it, and a departure nobody can see beside what it left is asserted rather than reviewed |

## review

| | |
|---|---|
| Doing | Build the cart from the real components, contracts, shells and tokens |
| Repo / branch | `starci-academy-fe` @ `main` (`f06071e`) |
| Touching | `.artifacts/design-plan/cart/candidate/` |
| Not touching | all production source |
| Produces | twelve rendered states at `localhost:8087` |

| Owner | State | Rendered |
|---|---|---|
| CartPage | populated | yes — `screens/cart-populated.png` |
| CartPage | one item | yes |
| CartPage | empty | yes |
| CartPage | pricing pending | yes — rows real, figures resting |
| CartPage | pricing failed | yes — rows stand, totals become an em dash, hint withheld |
| CartPage | removing one line | yes — the other rows stay pressable |
| CartPage | narrow | **measured, not photographed.** At 375px the browser reports `scrollWidth === clientWidth === 375`, zero overflowing nodes, cover `display:none`, identity 102px / price 129px / removal 40px. Headless Chrome lays out wider than its window and crops, in both the old and the new headless, so that PNG is not evidence |
| CartPage | light theme | yes, at desktop width — the token inversion was not read node by node |
| CartPage | clear-all ARMED | **no, and the state was removed rather than faked.** Arming is client state behind a real pointer press; react-aria `onPress` ignores a synthetic click and the browser pane was hidden, so a static export drew the resting control while the state claimed the armed one |
| CartDrawer | open populated | yes |
| CartDrawer | open empty | yes |
| CartDrawer | dismissal and focus return | no — delegated entirely to the vendor `Drawer`, and no state exercised the keyboard |
| CheckoutOverlay | paying at once | yes — the default: no surcharge, no ladder, all five gateways |
| CheckoutOverlay | paying over time | yes — surcharge line, three cycles with one marked, terms, gateways narrowed to the domestic pair |
| CheckoutOverlay | submitting | no — the press hands off to a provider this candidate does not have |

| Backend | Covered by |
|---|---|
| `installment-weighted-schedule` — markup to 5 and a BASIS-POINT share vector `5000,2750,2750` snapshotted per plan in a `cycle_bps` column beside the existing `markup_percent`, with `computeMinPaymentVnd(Fixed)` reading `cycles[installmentsPaid]`. Basis points because 27,5 is not an integer and the surrounding columns are `int`. Live plans with no vector keep the even split they were sold under | `$starci-be-feature-plan` |
| `installment-preview-schedule` — `cycles[]` on `InstallmentOptionItem`, month offsets rather than dates, because the server holds one rolling `nextDueAt` and no calendar | `$starci-be-feature-plan` |

**Approved** revision 1.0, confirmed after the revision was named back.

| Rejected | Instead | Why |
|---|---|---|
| `DrawerShell` on `Modal` with `placement="right"` | HeroUI's own `Drawer` | Refused once HeroUI 3.2.4 turned out to ship a real `Drawer` with its own placement, header, handle and edge transitions. The inventory had said "no drawer in `src/`", which is true and was misread as "no drawer" |
| A new `installment-cycle-row` | `pricing-phase-row`, freed of its domain name | A duplicate of `pricing-phase-row`'s classes, slots and mark mechanic; merged by freeing that pair of its domain name instead |
| A `cart-clear-armed` state | the resting control, recorded as uncaptured | A static export renders the resting control while the state claims the armed one |

| Took | Because |
|---|---|
| Line removal is a glyph, not words | The only destructive thing on the row, and its name repeated down a list gives the loudest reading to the action nobody came for |
| Clear-all asks first, and that was READ rather than chosen | The legacy cart arms an inline two-step confirm for a few seconds instead of opening a modal, commented "canon: destructive action needs confirmation". Ported as the leaf `ConfirmButton`. The drawer does not get the control at all |
| The instalment hint names the FIRST payment, not a per-month figure | Under a front-loaded schedule the opening cycle is the most expensive, so a from-price would be a false floor |
| The hint is withheld while pricing is pending or failed | It quotes a number the summary beside it cannot show |
| `order-total-row` is its own entry rather than `label-with-muted-fact-row` | Rank is the whole difference: that entry pins its fact to `xs`/`muted`, the opposite rank to a total |
| `OrderSummary` does not reuse `stacked-stat-rows` | It holds `stat-row`, which requires an `icon`, and a subtotal has no honest glyph |

## apply

| | |
|---|---|
| Doing | Write revision 1.0 into production |
| Repo / branch | `starci-academy-fe` @ `main` (`f06071e`) |
| Touching | the nine files below |
| Not touching | every other path under `src`; `starci-academy` |
| Produces | the components; **no route** — see OWED |

| Wrote | Note |
|---|---|
| `components/shells/DrawerShell/index.tsx` | new; wraps HeroUI `Drawer` |
| `components/leaves/ConfirmButton/index.tsx` | new |
| `components/blocks/commerce/CartLine/component.tsx` | new |
| `components/blocks/commerce/OrderSummary/component.tsx` | new |
| `components/overlays/commerce/CartDrawer/component.tsx` | new |
| `components/overlays/commerce/CheckoutOverlay/component.tsx` | new |
| `components/pages/CartPage/component.tsx` | new |
| `components/contracts/index.ts` | seven entries, six union members, two renames, and `confirm-button` admitted to `stacked-peer-controls` |
| `blocks/courses/CoursePricingRail/component.tsx` | migrated to `ordered-step-*`; sole caller of the rename |

The registry was MERGED rather than replaced: another session added 163 lines to it while this run
was building, and the candidate's copy was taken before that.

        The registry was MERGED rather than replaced: another session added 163 lines to it while
        this run was building, and the candidate's copy was taken before that.

| Green | Result |
|---|---|
| `npx tsc --noEmit` | clean, whole repository |
| `npx eslint src` | exit 0 |
| `npx next build --webpack` | exit 0 |
| `audit-fe-lint-adoption.mjs` | ok; no rule missing, none below error, inline config refused |

| Owed | Cleared by |
|---|---|
| **Nothing mounts any of this.** No `/[lang]/cart` route and no connected half: every owner written is the pure twin | `myCart` ships on the backend and had no frontend query, hook or caller. Cleared by the second pass below |
| The navbar cart button is still dead | `ShellNav/component.tsx:103` renders `IconButton icon="cart"` with no `on` handler. Cleared by the second pass below |
| Both backend enablers | Without them the schedule is a picture: the server still charges three equal cycles at 10%. `$starci-be-feature-plan` |
| `ConfirmButton`'s armed state has never been observed by anyone | A real pointer press in a visible browser |
| The drawer's focus return and keyboard path | |

## apply — second pass, the wiring

| | |
|---|---|
| Doing | Make the basket reachable: the query, the mutations, the connected halves, the route, the navbar control |
| App | `starci-academy` |
| Repo / branch | `starci-academy-fe` @ `main` (`afd894d`) |
| Touching | the fifteen files below |
| Not touching | every approved contract and pure half already shipped; `starci-academy`; the backend |
| Produces | `/vi/cart`, and the navbar control that opens the drawer over any route |

| Wrote | Note |
|---|---|
| `modules/api/graphql/queries/query-my-cart.ts` + `types/my-cart.ts` | |
| `modules/api/graphql/queries/query-courses-checkout-preview.ts` + its types | |
| `modules/api/graphql/mutations/mutation-remove-from-cart.ts` | |
| `modules/api/graphql/mutations/mutation-clear-cart.ts` | |
| `modules/api/graphql/mutations/mutation-courses-checkout.ts` | |
| `modules/api/graphql/mutations/types/{remove-from-cart,clear-cart,courses-checkout}.ts` | |
| `hooks/swr/useQueryMyCartSwr.ts` | |
| `hooks/swr/useQueryCoursesCheckoutPreviewSwr.ts` | |
| `hooks/swr/useMutate{RemoveFromCart,ClearCart,CoursesCheckout}Swr.ts` | |
| `hooks/index.ts` | five exports |
| `blocks/commerce/CartLine/index.tsx` | connected; owns its own removal |
| `pages/CartPage/index.tsx` | connected |
| `overlays/commerce/CartDrawer/index.tsx` | connected |
| `layouts/ShellNav/{component,index}.tsx` | the cart control gains a handler; the drawer mounts here, once |
| `app/[lang]/cart/{page,layout}.tsx` | |
| `messages/{vi,en}.json` | the `cart` block |

| Took | Because |
|---|---|
| Removal lives on the LINE, not the page | The mutation is keyed by course so one row's removal does not spin every other row's control, and one hook per course cannot be called from a loop |
| The drawer mounts once in `ShellNav`, beside the control that opens it | Per page it would be a focus trap per page for a panel only one of which can ever be on screen |
| Checkout goes straight to PayOS rather than through the approved overlay | That overlay names the gateways as prose rather than offering them as a choice, so putting it between the press and the payment would add a step that appears to ask a question it cannot take an answer to |
| `installmentMonths` is deliberately NOT sent | The server splits a term into equal cycles and the enablers teaching it 50 / 27,5 / 27,5 are unbuilt; sending it would take money on a schedule different from the one the buyer was shown |

| Green | Result |
|---|---|
| `npx tsc --noEmit` | clean, whole repository |
| `npx eslint <every path above>` | exit 0 |
| `npx next build --webpack` | exit 0; `/[lang]/cart` in the route table |
| the real page | `/vi/cart` renders under the navbar; the navbar control opens the drawer (`role="dialog"`) |

| Found | What it means |
|---|---|
| **A signed-out reader was told their basket was empty** | The cart query is viewer-scoped, so with no token its SWR key is null and it never fires — leaving no data AND no error, which the first version read as an empty basket. Only opening the real page showed it: the network panel answered 401/403 while the page said the basket was empty. Both surfaces now check the session and offer a way in |

| Owed | Cleared by |
|---|---|
| The checkout overlay is written and NOT mounted | It needs a gateway picker before it can sit between the press and the payment — a Preview question, not a wiring one |
| Both instalment enablers | Until they exist the schedule is a picture and the cart pays in full only. `$starci-be-feature-plan` |
| The populated cart has not been seen | Sign-in is blocked on one Keycloak setting: `academy-web` whitelists `http://localhost:3000/authentication*` while this frontend is locale-routed and calls back at `/vi/authentication`. Adding `http://localhost:3000/*/authentication*` unblocks every remaining state on this page |
