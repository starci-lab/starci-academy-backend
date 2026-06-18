---
name: starci-async
description: >
  Async / data-state conventions for the MAIN StarCi Academy web app
  (`C:\Repositories\starci-academy`). Use whenever a UI region renders fetched
  data (SWR / query) and needs loading / error / empty / content branches —
  lists, feeds, popovers, dashboards, profile sections, any `useQueryXxxSwr`
  consumer. Encodes the `AsyncContent` / `EmptyContent` / `ErrorContent` block
  family and the skeleton-matches-layout rule. Pairs with the `/fe` (UI) skill.
  Trigger on: loading state, skeleton, empty state, error state, retry, "fetch +
  render", spinner, or building any data-backed component.
---

# starci-async — Async / data-state conventions (SSOT)

Sibling of the **`/fe`** UI skill — `/fe` covers the whole UI system; this skill
is the focused contract for **rendering fetched data** (the loading/error/empty/
content switch). Read `/fe` first for architecture, then this for data states.

Full rules (read before non-trivial work):
- `C:\Repositories\starci-academy\.cursor\rules\starci-async.md` — the async/states doc
- `C:\Repositories\starci-academy\.cursor\rules\starci-ui.rules.mdc` — §6 States, overall UI SSOT
- `C:\Repositories\starci-academy\.cursor\rules\starci-popover.md` — popover lists

## The one rule
Every data-backed region renders **4 branches** via ONE block — never an ad-hoc
`isLoading ? … : …` ternary or a bare `<Spinner>`:

```tsx
import { AsyncContent } from "@/components/blocks"   // blocks/async

<AsyncContent
  isLoading={isLoading && items.length === 0}
  skeleton={<SkeletonStack/>}                 // MUST match the real layout
  isEmpty={items.length === 0}
  emptyContent={{ title: t("…empty"), onRetry: () => mutate(), retryLabel: t("…retry") }}
  error={error}
  errorContent={{ title: t("…error"), onRetry: () => mutate(), retryLabel: t("…retry") }}
>
  {items.map((it) => <ListRow key={it.id} … />)}
</AsyncContent>
```

Priority: **error → loading → empty → content**.

## Blocks (`src/components/blocks/async/`)
- **`AsyncContent`** — the switch. `emptyContent` / `errorContent` take **PROPS objects**
  (not nodes); it renders the components itself.
- **`EmptyContent`** — `TrayIcon` + title + (description) + (retry button). Pure/props-only.
- **`ErrorContent`** — danger `WarningOctagonIcon` + title + (description) + (retry button).

## MUST
- Use `AsyncContent`; pass `emptyContent={{…}}` / `errorContent={{…}}` as props.
- `skeleton` mirrors the loaded layout (same rows/blocks, `rounded-xl`) — no empty spinner.
- Text via `t(...)`; retry handler usually `() => mutate()`; omit `emptyContent` to self-hide.
- Icons = `@phosphor-icons/react` `*Icon` exports; styling lives in the block, never the feature.

## AVOID
- `isLoading ? <Spinner/> : …` ternaries, raw `<div>`/`<span>` empty/error blocks, `bg-primary`
  (v2 token), hardcoded text. These are exactly what this block family replaces.
