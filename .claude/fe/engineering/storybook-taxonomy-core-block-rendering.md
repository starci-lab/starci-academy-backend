# Storybook taxonomy — 3 tầng: CORE · BLOCK · RENDERING (CHỐT 2026-07-16)

Sidebar Storybook (`D:\Repositories\starci-academy`) gom theo `meta.title` = `"<Tier>/<Category>/<Name>"`. **2 tier gốc** (Core · Block) PHÂN LOẠI THEO QUAN HỆ GHÉP (không theo folder code); trong Core có category đặc biệt `Rendering/*` gom bộ render nội dung.

## 1. `Core/*` — PRIMITIVE
Component tự-đủ: chỉ dựng trên `@heroui/react` + icon (phosphor) + utils/types. **KHÔNG import & render component design-system nào khác.** Vd: Button, Input, Chip, Card, Typography, Skeleton, các Foundations (Radius/Spacing/Surfaces).

## 2. `Block/*` — COMPOSITION (ghép từ core)
Component **import & render ≥1 component design-system khác** — từ `@/components/blocks/*` HOẶC `@/components/reuseable/*` (kể cả barrel/relative import). Đây là "ghép core → block". Vd (2026-07-16, 19 cái): PricingTable (ghép PricingCard), ChatPanel, CommentThread, OutlineRail, NotificationBell/List, QuizCard, StatusChip, Callout, ContinueCard, LabeledCard, GroupPressableCard, AppSplash, ResponsiveBreadcrumb, MetricCard (ghép SectionCard), UserCell/AvatarGroup/AvatarUploadButton/Composer (ghép UserAvatar).
- ⚠️ Import file **colocated của chính nó** (`./Sub`) KHÔNG tính là ghép → vẫn Core (vd MarkdownContent, CVSubmissionForm).
- Mục đích: rèn mindset "compose core" cho LLM — component mới mà import block/reuseable khác thì đặt `Block/*`, chỉ HeroUI+icon thì `Core/*`.

## `Core/Rendering/*` — BỘ RENDER nội dung (category trong Core)
Component chuyên RENDER một loại nội dung/định dạng. Vd: `Core/Rendering/Markdown` (MarkdownContent — mermaid, list, `::muted`, code-shiki, chip/accordion/tabs directive), `Rendering/CodeDiff` (DiffViewer). Dự kiến bổ sung: Code (CodeToHtml/shiki), 3D (three), XYFlow (@xyflow/react — hiện rải trong features, chưa tách block), Video (VideoRenderer).

## Ghi chú
- Category `Reuseable` + `Overlays` (top-level cũ) đã **giải thể**: Overlays → `Core/Overlays/*`; Reuseable → phân phối (SectionCard→Core/Card, UserAvatar→Core/Identity, Pagination→Core/Navigation, SearchInput/CVSubmissionForm→Core/Form, MarkdownContent→Rendering).
- Đổi tier = đổi `meta.title` (string-only, tsc-safe) ⇒ đổi story-ID ⇒ URL cũ 404.
- Liên quan: [[storybook-story-authoring-and-minimal-set]] · [[storybook-story-canvas-full-bleed]].
