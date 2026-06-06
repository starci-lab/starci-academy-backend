# M4 Lesson Sandbox Polish — Session Brief

**Goal:** Apply the polished sandbox pattern already shipped on **M4 L0** to the
remaining 3 lessons of M4 (Server State with TanStack Query). L0 is the
canonical reference — copy its structure, conventions, and quality bar.

**Course/module:** `0-fullstack-mastery` → module mount slug
`4-server-state-with-tanstack-query` (repo named `module-5-...`, off-by-one is
intentional/known).

**Source repo (lessons):**
`C:\Repositories\ac\starci-academy-backend\.repo\fullstack-mastery-module-5-server-state-with-tanstack-query`
(each lesson folder has `frontend/`, `backend/`, `.playwright/`). Push to GitHub
(`origin main`) so the platform Sandpack fetches it.

**Mount content:**
`.mount/data/courses/0-fullstack-mastery/modules/4-server-state-with-tanstack-query/contents/<lesson>/`

---

## Model routing (REQUIRED)
- **Viết bài tiếng Việt (author VN lesson content/body)** → **Opus**
- **Dịch (vi → en)** → **Sonnet**
- **Coding (frontend/backend/mock)** → **Sonnet**
- **E2E / Playwright (if touched)** → **Sonnet**

---

## How the sandbox works (infra already built — DO NOT rebuild)

1. **Mock app** `apps/mock` (standalone NestJS, port 3002, no DB). Feature code in
   `src/features/mock/`. Serves `/mocks/:moduleId/:lessonId/sessions/:sessionId/*`
   — session-isolated in-memory data, 1s artificial delay (`MOCK_DELAY_MS`), CORS
   reflect-any-origin (for Sandpack iframe). Per-lesson seed in
   `src/features/mock/registry/<moduleDisplayId>/index.ts`.
2. **Tunnel:** `cloudflared` named tunnel `starci-mock` → `https://mock.starci.org`
   → localhost:3002 (config `~/.cloudflared/starci-mock.yml`). Public HTTPS so the
   Sandpack iframe avoids Private-Network-Access blocking. Restart if 530:
   `cloudflared tunnel --config ~/.cloudflared/starci-mock.yml run starci-mock`.
3. **Platform FE** (`C:\Repositories\starci-academy`, branch `claude/frontend-mastery`):
   - `src/components/layouts/Content/SandboxBody/index.tsx` — fetches lesson source
     from GitHub (Trees API, 1 call), overrides `import.meta.env.VITE_API_BASE` →
     `https://mock.starci.org/mocks/<module>/<lesson>/sessions/<uuid>` (random
     client-side session), injects `<style type="text/tailwindcss">` with `@theme`
     (registers `bg-background`/`text-foreground`/`text-muted`/`default-*`/`accent`)
     + `@custom-variant dark` + Inter font, toggles `.dark` per platform theme.
   - `src/components/reuseable/SandpackPanel/index.tsx` — file-tree + editor + preview,
     full width, no border, surfaces match platform bg (`oklch(12%...)` dark /
     `oklch(97%...)` light), thin themed scrollbars, Tailwind v4 + HeroUI v3 via CDN
     `externalResources`.
   - `src/hooks/useGithubSandpackFiles.ts` — GitHub Trees API fetch.
   - **These are DONE and generic — no per-lesson changes needed.** New lessons just
     need correct mount fields + good source.

**Each lesson mount file (vi.md AND en.md) MUST have these fields** (L0 has them):
```
# isSandbox  -> true
# githubBaseUrl -> https://github.com/StarCi-Academy/fullstack-mastery-module-5-server-state-with-tanstack-query
# githubDir -> <lesson-folder>/frontend
# backendUrl -> /mocks/4-server-state-with-tanstack-query/<lesson-folder>
```

---

## L0 reference — the template to copy

**Frontend stack (package.json deps):** `react@19`, `react-dom@19`,
`@heroui/react@^3.0.2`, `@heroui/styles@^3.0.2`, `@gravity-ui/icons@^2.12.0`,
`framer-motion@^11`, `@tanstack/react-query@^5.51`, `@tanstack/react-query-devtools`.
Dev: vite@^6.3.5, @vitejs/plugin-react, @tailwindcss/vite, tailwindcss@4, @playwright/test, typescript.

**App.tsx (page shell):**
```tsx
<HeroUIProvider><QueryProvider>
  <main className="min-h-screen bg-background p-3">
    <div className="mx-auto max-w-2xl"><UsersPanel /></div>
  </main>
</QueryProvider></HeroUIProvider>
```
Single page, NO router/back link (L0 dropped routing — flow-2 navigation was cut;
keep lessons single-page unless a flow strictly needs navigation).

**lib/api.ts:** `const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000"`
then `fetch(\`${BASE}/users\`)`. Clone runs against localhost; sandbox overrides BASE.
Add `.env.example` documenting `VITE_API_BASE=http://localhost:3000`.

**Component structure — barrel + nested PascalCase (REQUIRED, mirror the platform FE):**
Components live in **PascalCase folders with `index.tsx`**, nested sub-pieces each in
their own folder, re-exported through a barrel `components/index.ts`. NOT flat
kebab files (`users-panel.tsx`). This matches `starci-academy/src/components/...`
(e.g. `Leaderboard/LeaderboardTable/index.tsx`).

```
src/components/
  index.ts                       // barrel: export * from "./UsersPanel"  (etc.)
  providers/
    index.ts
    HeroUIProvider/index.tsx
  UsersPanel/                     // one folder per lesson root component
    index.tsx                     // composes header + action + list (data/useQuery here)
    UserList/index.tsx            // ListBox of users
    UserListItem/index.tsx        // one Avatar + name + email row
    <Action>/index.tsx            // e.g. RefetchButton / AddUserForm / NameEditor
```
- Each folder's `index.tsx` is the component; import siblings via `../UserList` etc.
- Root barrel `components/index.ts` re-exports the lesson root (and anything App.tsx needs).
- Split by responsibility: list, list-item, form/editor, status, action button.
- Types/helpers shared across pieces → `components/UsersPanel/types.ts` or `utils.ts`
  next to `index.tsx` (kept local to the folder).
- **NOTE:** L0 currently ships flat `users-panel.tsx` — when touching L0 again,
  refactor it to `UsersPanel/index.tsx` + nested too, for consistency.

**Main component pattern (the lesson root `index.tsx`) — HeroUI v3 API + conventions:**
- Title: `<div className="text-base font-semibold text-foreground">`
- `<div className="h-3" />` then description `<div className="text-sm text-muted">`
- `<div className="h-6" />` (gap between header block and content)
- Action button: `<Button variant="primary" isPending={query.isFetching}>` with
  render-prop `{({isPending}) => (<>{isPending ? <Spinner color="current" size="sm" /> : null}<Label/></>)}`.
  Label = the operation verb ("Refetch" for L0).
- List: HeroUI `<ListBox aria-label selectionMode="none" data-testid="users-list" className="gap-0.5">`
  + `<ListBox.Item key id={String(id)} textValue data-testid="user-<id>" className="rounded-xl px-2 py-2 data-[hovered=true]:bg-default-100">`
  → Avatar (`<Avatar size="sm"><AvatarImage src={pravatar}/><AvatarFallback>{initials}</AvatarFallback></Avatar>`)
  + name `text-sm font-medium text-foreground` + email `text-xs text-muted`.
- Avatar photo: `https://i.pravatar.cc/120?u=${encodeURIComponent(email)}`.
- Skeleton while `isPending` (3 rows, `data-testid="users-skeleton"`), error branch `data-testid="users-error"`.

**HeroUI v3 API gotchas (NOT NextUI v2):**
- Avatar = compound `<Avatar><AvatarImage src/><AvatarFallback/></Avatar>` (NOT `<Avatar src/>`).
- Button variants: `primary|secondary|tertiary|ghost|soft|surface|outline|danger`. NO `flat`. Use `isPending` (render-prop), NOT `isLoading`/`startContent`.
- Chip: `variant="soft"` (or `dot`), `color="accent|default|success|warning|danger"`.
- Spinner: `<Spinner color="current" size="sm" />` (must set color/size or it's invisible).
- Icons: `@gravity-ui/icons` (e.g. `import { ArrowRotateLeft } from "@gravity-ui/icons"`), icon left of text. NOT phosphor.
- Colors `text-muted` is the v3 muted token (NOT `text-default-500`).

**Reference files:** `0-usequery-and-cache-lifecycle/frontend/src/{App.tsx, components/users-panel.tsx, lib/api.ts}`.

---

## The 3 lessons to do

### L1 — `1-mutations-and-invalidation-graph`
- Current flat file: `users-manager.tsx` → refactor to nested. API: fetchUsers, createUser, deleteUser. Backend: `@Get() @Post() @Delete(":id")`.
- Concept: useMutation + invalidateQueries (write → invalidate → auto refetch).
- Test-ids the UI MUST expose: `users-list`, `input-name`, `input-email`, `btn-add` + delete per row.
- Suggested structure:
  ```
  UsersManager/index.tsx        // useQuery + useMutation(create/delete) + invalidate
    AddUserForm/index.tsx       // input-name + input-email + btn-add
    UserList/index.tsx          // ListBox (users-list)
    UserListItem/index.tsx      // avatar+name+email + delete button (data-testid user-<id>)
  ```

### L2 — `2-optimistic-updates-with-rollback`
- Current flat file: `optimistic-editor.tsx` → refactor to nested. API: fetchUsers, patchUser(id, name, fail?). Backend: `@Get() @Patch(":id")` (`?fail=true` → 500).
- Concept: onMutate optimistic write + snapshot, onError rollback, onSettled invalidate.
- Test-ids the UI MUST expose: `user-1-name`, `input-name`, `btn-save`, `cb-fail`, `status`.
- Suggested structure:
  ```
  OptimisticEditor/index.tsx    // useQuery + useMutation(onMutate/onError/onSettled)
    NameEditor/index.tsx        // input-name + btn-save + cb-fail checkbox
    StatusChip/index.tsx        // status (idle/saving/error)
    UserName/index.tsx          // user-1-name display
  ```

### L3 — `3-infinite-query-and-pagination`
- Current flat file: `users-feed.tsx` → refactor to nested. API: fetchUsersPage(cursor, limit). Backend: `@Get()` cursor+limit → `{ data, nextCursor }`.
- Concept: useInfiniteQuery, getNextPageParam, "load more".
- Test-ids the UI MUST expose: `users-list`, `user-10`, `user-20`, `btn-load-more`, `has-next`, `total-count`.
- Mock registry already seeds 25 users for L3. Suggested structure:
  ```
  UsersFeed/index.tsx           // useInfiniteQuery + flatMap pages
    UserList/index.tsx          // ListBox (users-list)
    UserListItem/index.tsx      // row (data-testid user-<id>)
    LoadMoreBar/index.tsx       // btn-load-more + has-next + total-count
  ```

---

## Per-lesson checklist (apply to L1, L2, L3)

1. **Frontend source** (Sonnet):
   - App.tsx → L0 shell (`min-h-screen bg-background p-3`, max-w-2xl, single page).
   - Components → **barrel + nested PascalCase folders** (`<Root>/index.tsx` + sub-pieces in their own folders + `components/index.ts` barrel). Delete the old flat kebab file. Rewrite to L0 visual standard with HeroUI v3 API + gravity icons + ListBox + Spinner + skeleton. Keep ALL test-ids the specs require (see above).
   - lib/api.ts → `import.meta.env.VITE_API_BASE ?? "http://localhost:3000"`.
   - package.json → add `@gravity-ui/icons`, ensure `framer-motion`; remove phosphor/next-themes/next if present.
   - Add `.env.example`.
2. **Mock registry** (Sonnet): verify `src/features/mock/registry/4-server-state-with-tanstack-query/index.ts` seed fits the lesson (L1 small, L2 needs user #1, L3 = 25). Names must match any spec assertions. Rebuild + restart mock app after changes: `npx nest build mock` → `node dist/apps/mock/main.js`.
3. **Mock endpoints** (Sonnet): controller already supports users CRUD + pagination + `?fail=true` + reset. Confirm L1/L2/L3 needs are covered (they are).
4. **Mount fields** (Sonnet): ensure `# isSandbox/# githubBaseUrl/# githubDir/# backendUrl` in vi.md + en.md.
5. **Content body** (Opus VN author → Sonnet translate): if the body needs polish — VN by Opus, then en by Sonnet. Remove any remaining "Next.js" mentions; flows as bullet list; no Opus-E2E note. (L0/M4 content already cleaned — only touch if a lesson body is wrong.)
6. **Verify** (Sonnet): `tsc` clean on FE platform; mock returns expected via `https://mock.starci.org/mocks/4-server-state-with-tanstack-query/<lesson>/sessions/test/users`; push lesson repo.

---

## Rules already chốt (do not re-decide)
- **Page shell padding default `p-3`** (NOT p-6) + `min-h-screen bg-background`. Recorded in FE `.claude/design/01-tokens.md` (Spacing rhythm). Spacers: title↔desc `h-3`, header↔content `h-6`.
- **Theme:** editor + preview follow platform light/dark; preview bg = platform `--background` oklch.
- **Sandbox tab full width, no border;** thin themed scrollbars (not hidden).
- **No "Reset data" button.**
- **Lesson source is canonical Vite** (clone runs `npm run dev`); platform only transforms an in-memory copy. No `if (sandbox)` branches in source.

---

## Verify / push
- FE platform changes (rare; infra is done): commit selectively on `claude/frontend-mastery`.
- Lesson repo: `git add -A && git commit && git push origin main` per lesson (raw CDN may lag 1-2 min; SandboxBody uses `cache: no-store`).
- After mock seed/registry change: rebuild + restart mock app, confirm tunnel 200.

---

## Future / related (not in scope yet)
`seed.yaml → synchronizers.repoSync` (currently `false`): planned to walk `.repo/`
for every `isSandbox=true` content and upload per-lesson Sandpack file trees to CDN
(key `repo/{repoName}/{githubDir}.json`), so the frontend reads file trees from CDN
instead of the GitHub Trees API (removes rate-limit risk entirely). When this lands,
`useGithubSandpackFiles` will switch from GitHub → CDN. Keep lesson source pushed to
GitHub regardless (the seeder reads `.repo/`).
