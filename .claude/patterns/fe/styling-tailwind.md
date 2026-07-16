# Styling & Tailwind — STRICT

Cách VIẾT class Tailwind trong `$FE_SOURCE` (branch `mtp`): token semantic, `cn()`, spacing/radius scale, variant-theo-nền, phosphor. Đây là code-style class, KHÔNG phải design system (màu/spacing cụ thể do design rules quyết).

## 1. Token semantic — KHÔNG hex/px ma

- Màu = token CSS-var trong `src/app/globals.css` (`--accent`, `--muted`, `--foreground`, `--background`, `--default`, `--surface`, `--success/warning/danger`, họ `-soft`/`-soft-foreground`), tiêu thụ qua utility Tailwind: `text-muted` (399×), `bg-default` (121×), `text-foreground` (179×), `bg-accent-soft`.
- ❌ CẤM hex/rgb thẳng trong class hoặc style của component thường. Hex CHỈ hợp lệ trong 3D/canvas/SVG-mark thật (`blocks/marketing/ArchitectureScene`, `svg/LogoMark`, `features/profile/CV/.../CvHtmlDocument`) — nơi THREE.js/WebGL/`<svg fill>` không đọc được CSS-var. 14 file dùng hex đều thuộc nhóm này; component UI thường = 0.

```tsx
// ✅ blocks/chips/StatusChip/index.tsx — tone → HeroUI color token
<Chip color={toneToColor[tone]} variant="soft" size="sm" …>
// ❌ raw-hue tay (StatusChip comment: "cũ bg-<status>/10 + text-<status> FAIL contrast")
<span className="bg-[#34d399]/10 text-[#34d399]">
```

- Kích thước = step Tailwind (`size-4`, `w-36`, `h-8`). Arbitrary `[Npx]` CHỈ cho kích thước media/scene cố định thật (`w-[300px]`, `h-[560px]` cho illustration/canvas), TUYỆT ĐỐI không cho spacing.

## 2. `cn()` từ `@heroui/react` — cách DUY NHẤT ghép class

- Import `import { cn } from "@heroui/react"` (KHÔNG `clsx`/`twMerge`/`tailwind-merge` — repo không dùng).
- Base trước, `className` prop sau; slot điều kiện trả `null` khi tắt:

```tsx
// ✅ blocks/identity/IconTile/index.tsx
className={cn(
    "flex shrink-0 items-center justify-center overflow-hidden",
    SIZE[size],
    showImage ? null : TONE[tone],   // slot tắt = null, không chuỗi rỗng
    className,                        // prop LUÔN cuối để override
)}
```

- Chuỗi class dài/tái dùng → hằng SCREAMING_SNAKE module-level có JSDoc (xem [[react-idioms]] §5), hoặc `Record<Variant, string>` (§4).

## 3. Spacing scale — step token, không arbitrary

- Chỉ dùng step Tailwind: `gap-2`/`gap-3` (mật độ chuẩn), `gap-6` cho khối lớn; padding `p-3` (card house-rule), `p-6` cho section.
- **Card = `p-3`** cứng: `globals.css` bake `.card { padding: calc(var(--spacing) * 3) !important }` (override HeroUI `p-4`). Đừng thêm `p-4`/`p-6` tay lên `<Card>`; card body là divider-list → dùng variant flush (`p-0`) rồi mỗi row tự `p-3`.
- ❌ `gap-[10px]`, `p-[14px]` — không có arbitrary spacing trong repo.

## 4. Variant theo NỀN → nền ghép foreground

- Tone/variant drive 1 `Record<Tone, string>` map ra CẶP `bg-X-soft text-X-soft-foreground` (nền + chữ đi đôi), KHÔNG set nền một chỗ chữ một chỗ:

```tsx
// ✅ blocks/identity/IconTile/index.tsx
const TONE: Record<IconTileTone, string> = {
    accent:  "bg-accent-soft text-accent-soft-foreground",
    success: "bg-success-soft text-success-soft-foreground",
    danger:  "bg-danger-soft text-danger-soft-foreground",
    neutral: "bg-default text-muted",
}
```

- Nền đặc → luôn ghép `-foreground` của chính nó: `bg-accent text-accent-foreground` (`blocks/cards/ContinueCard` CTA). ❌ `bg-accent text-white`.
- Ưu tiên pairing NATIVE HeroUI (`variant="soft"` tự set `--chip-bg`=`X-soft`, `--chip-fg`=`X-soft-foreground` — contrast đã tune) thay vì tự trộn `bg-<hue>/10`.

## 5. Rounded đồng tâm (concentric)

- Radius trong LÕM luôn NHỎ hơn radius ngoài 1 bậc — element con lồng trong card lùi 1 step:

```tsx
// ✅ blocks/cards/CourseCard/index.tsx
<Card className="overflow-hidden rounded-3xl …">
  {/* rounded-2xl = "inner" step dưới rounded-3xl của card */}
  <div className="… rounded-2xl bg-surface">
```

- Radius co theo kích thước box: `size-12 → rounded-xl`, `size-16/20 → rounded-2xl` (IconTile `SIZE` map).
- Pill/chip/avatar/nút-tròn = `rounded-full` (277× — bậc phổ biến nhất). Thang dùng thật: `full > xl > 2xl > 3xl > lg`; tránh chế `rounded-[Npx]`.

## 6. Cấm hand-roll primitive (góc styling)

- Đừng tự dựng lại hộp-có-tint/pill/tile bằng `div + class` khi đã có block canon: `IconTile` (khung icon), `StatusChip` (pill trạng thái), HeroUI `Card`/`Chip`. Grep `src/components/blocks` trước. Chi tiết tầng: [[react-idioms]] §2.
- ❌ `<div className="rounded-2xl bg-accent-soft p-3">` để giả IconTile — dùng `<IconTile tone="accent" … />`.

## 7. Phosphor icon

- Icon = `@phosphor-icons/react` (317 file; 8 file lẻ dùng lib khác — đừng nhân bản). Import named `*Icon`: `import { CheckCircleIcon } from "@phosphor-icons/react"`.
- Render TRẦN, size bằng CLASS `size-4`/`size-5` (2 bậc phổ biến), hoặc để cha ép qua `[&_svg]:size-N` (IconTile/StatusChip). ❌ prop số `size={20}` (chỉ 2 chỗ legacy).
- Màu icon = THỪA KẾ từ `text-*` của cha (`text-muted`, `text-accent-soft-foreground`), không set màu trên icon. Nhấn mạnh → `weight="fill"`.

```tsx
// ✅ blocks/cards/CheckListCard/index.tsx
<CheckCircleIcon className="size-5 shrink-0 text-success-soft-foreground" />
// ✅ ép đồng đều size mọi icon caller truyền vào (StatusChip)
<span className="shrink-0 [&_svg]:size-4">{icon}</span>
```
