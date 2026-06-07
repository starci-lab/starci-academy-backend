---
name: skill-code-example-fe
description: Canonical frontend code patterns for StarCi fullstack lesson FE repos (agnostic single-track Vite + React 19 + HeroUI v3 + Tailwind v4). Use when building or FIXING the UI of any lesson frontend under `.repo/fullstack-mastery-module-*/<lesson>/frontend/` — App shell, providers, components, testids, HeroUI components, server-state (SWR), playwright specs. Distilled from m4 (server-state), m5 (form-mastery), m6 (client-state), m7 patterns the instructor hand-polished.
---

# FE Code Example — StarCi lesson frontends

Mọi lesson FE = **agnostic single-track Vite app** (KHÔNG Next). Sửa/build UI PHẢI theo pattern dưới để khớp Playwright spec + đồng nhất toàn khóa. Comment **English-only**.

## Stack (package.json)
```jsonc
"dependencies": {
  "react": "^19.0.0", "react-dom": "^19.0.0",
  "@heroui/react": "^3.1.0", "@heroui/styles": "^3.1.0",
  "framer-motion": "^11.0.0"
  // + per-lesson: zustand | jotai | @tanstack/react-query | swr | react-hook-form + zod
},
"devDependencies": {
  "@playwright/test": "^1.45.0", "typescript": "^5.5.3",
  "tailwindcss": "^4.0.0", "@tailwindcss/vite": "^4.1.8",
  "vite": "^6.3.5", "@vitejs/plugin-react": "^4.5.2",
  "@types/react": "^18.3.3", "@types/react-dom": "^18.3.0"
}
```

## File structure
```
frontend/
  index.html · vite.config.ts · tsconfig.json · package.json
  src/
    main.tsx · App.tsx · vite-env.d.ts
    app/globals.css
    components/
      providers/{HeroUIProvider.tsx,index.ts}
      Local/index.tsx          # default (npm run dev + Playwright)
      Sandbox/index.tsx        # ?sandbox=1 embedded preview
      <FeatureClient>/index.tsx + sub-components/
```

## vite.config.ts — PIN PORT IN SOURCE (không CLI -p/--port)
```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3001 },   // FE 3001; mock backend (nếu có) 3000. Docs chỉ `npm run dev`.
})
```

## app/globals.css
```css
@import "tailwindcss";
@import "@heroui/styles";
body { margin: 0; min-height: 100vh; background: var(--background); color: var(--foreground); font-family: system-ui, sans-serif; }
main { max-width: 48rem; margin: 0 auto; }
```

## App.tsx — shell chuẩn (Label + Description + Local/Sandbox)
```tsx
import { Typography } from "@heroui/react"
import { HeroUIProvider } from "./components/providers"
import { Local } from "./components/Local"
import { Sandbox } from "./components/Sandbox"

const TITLE = "useQuery & Cache Lifecycle"
const DESCRIPTION = "..."

export default function App(): JSX.Element {
  const isSandbox = new URLSearchParams(window.location.search).has("sandbox")
  return (
    <HeroUIProvider>
      <main className="min-h-screen bg-background p-3">
        <div className="mx-auto max-w-2xl">
          <Typography.Heading level={4} weight="semibold">{TITLE}</Typography.Heading>
          <div className="h-3" />
          <Typography.Paragraph size="sm" color="muted">{DESCRIPTION}</Typography.Paragraph>
          <div className="h-6" />
          {isSandbox ? <Sandbox /> : <Local />}
        </div>
      </main>
    </HeroUIProvider>
  )
}
```
- **Local** = client đơn khớp ĐÚNG testid Playwright (content product thật). **Sandbox** = trực quan; single-client → `Sandbox` re-export `Local`.
- Spacing tokens cố định: `h-3` (label↔desc), `h-6` (desc↔content). Container `max-w-2xl`.

## providers
```tsx
// HeroUIProvider.tsx
import type { PropsWithChildren } from "react"
import { I18nProvider } from "@heroui/react"
export const HeroUIProvider = ({ children }: PropsWithChildren) => <I18nProvider>{children}</I18nProvider>
// index.ts → export { HeroUIProvider }
```
Thêm provider khác khi cần (bọc trong HeroUIProvider): `ToastProvider` (toast), `SwrProvider` (SWR config), `QueryProvider` (TanStack).

## HeroUI v3 component conventions (KHÔNG dùng plain div/`<p>`)
| Nhu cầu | Dùng | testid |
|---|---|---|
| Tiêu đề / mô tả | `Typography.Heading level=4` · `Typography.Paragraph size=sm color=muted` | |
| Item user | `Avatar`/`AvatarImage`/`AvatarFallback` + `Typography.Paragraph` trong `div.flex.items-center.gap-3` | |
| Loading | **3-row skeleton**: `div.flex.flex-col.gap-3 data-testid=*-skeleton` bọc 3 `div.flex.items-center.gap-3` (Skeleton tròn avatar + 2 Skeleton chữ nhật) | `*-skeleton` |
| Lỗi | `<ErrorMessage data-testid=*-error>` (KHÔNG `<p>`) | `*-error` |
| Field error form | `FieldError` luôn render (optional chaining message); `Description` là nhánh conditional riêng | |
| Số (qty/price/age) | `Controller` + `NumberField` (KHÔNG `register`+coerce thô) | |
| Scroll feed | tách `FeedScrollArea` bọc `ScrollShadow className="max-h-96" hideScrollBar orientation="vertical" size={40}` | |
| Toast lỗi | `toast.danger("...", { description })` trong `onError` + bọc `<ToastProvider/>` | |
| Nút | `Button`, `isPending={...}` cho loading; giữ text khi loading | `btn-*` |
- **testid BẮT BUỘC** trên mọi element Playwright kiểm; testid động: `` `user-${user.id}-name` `` (không hardcode).

## Server-state pattern (SWR singleton)
- `useUsersSwr()` accessor đọc cache SWR; `registerUser()` mutation → `mutate()` refetch. `UserRegistry` component render success state sau mutate (testid `success`). KHÔNG `useState` mirror server data. KHÔNG `useEffect` trong hook SWR.

## Playwright (.playwright/)
`playwright.config.ts` đọc port từ env (default 3000/3001), `webServer` tự `npm install && (nest start | npm run dev)` cho backend+frontend, bind 127.0.0.1. Spec ở `scripts/flow-N-*.spec.ts` dùng `getByTestId`. Chạy: `npx playwright test --project=chromium` (kill 3000/3001 trước).

## Rules
- Comment/JSDoc **English-only**; UI copy tiếng Anh (lesson agnostic).
- KHÔNG scaffold from-scratch (`npm create vite`...) — dùng repo clone sẵn.
- Docs body: `npm run dev` (port từ vite.config), KHÔNG `-p`/`--port`.
- State global (SWR/store) → component đọc trực tiếp qua accessor, KHÔNG prop-drill; context CHỈ khi state in-component (Overlay/Formik/Socket).

Liên quan: `.claude/design/` (design tokens), `.audits/rules/fullstack/coding.md` §A2 (cd/port), [[frontend-singleton-context-optimization]], [[feedback-frontend-design-system]].
