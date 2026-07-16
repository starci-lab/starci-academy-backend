# Loading & Skeleton — cách VIẾT trạng thái async — STRICT

> Quy ước VIẾT CODE cho MỌI vùng render từ data (SWR/query): async-state đi qua `AsyncContent`, skeleton phải MIRROR hình hài đã-load. Tất cả mẫu ✅/❌ dưới đây trích thẳng code thật branch `mtp` trong `src/`. Đây là code-style, không phải design-rule (design ở `.claude/fe/`).

## 1. Vùng data → LUÔN bọc `AsyncContent`, không tự if/else 4 nhánh

- Mọi region render từ data phải đi qua `AsyncContent` (từ `src/components/blocks/async/AsyncContent`). Nó là NƠI DUY NHẤT giữ thứ tự ưu tiên **error → loading → empty → content**; đừng tự viết lại chuỗi `if (error) … if (isLoading) …` trong feature.
- Truyền `skeleton` (bắt buộc), và tùy nhu cầu `isEmpty` + `emptyContent`, `error` + `errorContent`. Thiếu `emptyContent` → section tự ẩn (render `null`); thiếu `errorContent` → lỗi rơi xuống nhánh loading (nuốt lỗi). Cặp phải đủ đôi.

```tsx
// ✅ src/components/features/dashboard/WhoToFollow/index.tsx
<AsyncContent
    isLoading={isLoading}
    skeleton={<WhoToFollowSkeleton className={className} />}
    isEmpty={!data || data.length === 0}
>
    <SectionCard …>{/* content */}</SectionCard>
</AsyncContent>
```

```tsx
// ❌ tự dựng chuỗi nhánh trong feature — sai thứ tự, bỏ nhánh, không tái dùng
if (isLoading) return <Spinner />
if (!data) return null
return <SectionCard>…</SectionCard>
```

## 2. `isLoading` = CÔNG THỨC "first-load, chưa có data" — không phải `swr.isLoading` trần

- Chỉ bật skeleton ở LẦN TẢI ĐẦU khi chưa có gì trong tay. Nếu truyền `isLoading` trần, background revalidate (SWR) sẽ nháy skeleton đè lên content người dùng đang đọc.
- Idiom trội: `isLoading && <chưa-có-data>` — `&& !data` hoặc `&& items.length === 0`:

```tsx
// ✅ src/components/features/notifications/NotificationCenter/index.tsx
isLoading={isLoading && !data}
// ✅ src/components/features/profile/AiUsage/AiUsageHistory/index.tsx
isLoading={isLoading && items.length === 0}
// ✅ src/components/features/profile/Settings/MySubmissions/index.tsx  (settled = có data HOẶC có lỗi)
isLoading={!swr.data && !swr.error}
```

```tsx
// ❌ isLoading trần → skeleton nháy đè content mỗi lần revalidate nền
isLoading={isLoading}   // chỉ chấp nhận khi query one-shot, KHÔNG revalidate (vd quota.isLoading)
```

- `isEmpty` tính SAU khi loading xong, dựa mảng đã resolve: `isEmpty={items.length === 0}` / `isEmpty={!data || data.length === 0}`. Đừng nhét điều kiện empty vào `isLoading`.

## 3. Skeleton MIRROR hình hài đã-load — không collapse, không jump

- Skeleton phải là cây layout GIỐNG HỆT content thật: giữ node cấu trúc (wrapper, `SectionCard`, separator, gap, spacing) và chỉ thay node NỘI DUNG bằng `Skeleton.<Component>`. Mục tiêu: hộp không co lại / không nhảy khi data về.

```tsx
// ✅ src/components/features/dashboard/WhoToFollow/WhoToFollowSkeleton/index.tsx
// cùng SectionCard (icon + title) bọc N row [avatar · 2 dòng chữ · nút follow], cùng spacing
<SectionCard icon={…} title={t("dashboard.whoToFollow.title")} className={className}>
    <div className="flex flex-col gap-2">
        {Array.from({ length: SKELETON_ROW_COUNT }).map((_row, index) => (
            <div key={index} className="flex items-center gap-3 px-2 py-1">
                <Skeleton className="size-6 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-0">
                    <Skeleton.Typography type="body-sm" width="1/2" />
                    <Skeleton.Typography type="body-xs" width="1/3" />
                </div>
                <Skeleton className="h-8 w-20 shrink-0 rounded-medium" />
            </div>
        ))}
    </div>
</SectionCard>
```

```tsx
// ❌ spinner/1 thanh chung không khớp hình hài → hộp nhảy khi resolve
skeleton={<Spinner />}
skeleton={<Skeleton className="h-40 w-full" />}   // che 1 mảng row bằng 1 khối đặc
```

## 4. Chọn ĐÚNG piece: `Skeleton.<Component>` khớp node thật, bare `Skeleton` cho block tự-do

- Node thật là component nào → dùng piece đó: `Skeleton.Typography type=…` (khớp TEXT TIER để cao đúng glyph, không shift), `Skeleton.Input`, `Skeleton.Avatar size=…`, `Skeleton.ListRow`, `Skeleton.Table rows cols`, `Skeleton.Accordion items`, `Skeleton.Menu items`… (compound đầy đủ ở `src/components/blocks/skeleton/Skeleton`).
- Chỉ dùng bare `<Skeleton className="…" />` khi node KHÔNG khớp component nào — tự cỡ qua `className` (h/w/rounded).

```tsx
// ✅ src/components/features/navbar/Navbar/AccountMenuDropdown/index.tsx — piece khớp node
skeleton={<Skeleton.UserCell />}
skeleton={<Skeleton.Menu items={4} />}
// ✅ bare cho khối tự-do (nút, avatar tròn tùy cỡ)
<Skeleton className="h-8 w-20 shrink-0 rounded-medium" />
```

```tsx
// ❌ rải bare Skeleton lung tung thay vì piece có sẵn → cao/rộng lệch, phải canh tay
<Skeleton className="h-5 w-40" />   // khi node thật là <Typography type="body-sm"> → dùng Skeleton.Typography
```

## 5. Skeleton lớn → 1 folder `<X>Skeleton` co-located; nhỏ → inline

- Skeleton nhiều node / mirror cả card → tách component riêng **1 folder `<X>Skeleton/index.tsx`** cạnh component (named export, `WithClassNames`, JSDoc nói rõ "mirror … nên không jump"). Đây là idiom trội: xem `WhoToFollowSkeleton`, `CommunityFeedSkeleton`, `WeeklyChallengeCardSkeleton`, `ChallengeViewSkeleton`…
- Skeleton 1-2 piece → truyền INLINE thẳng vào `skeleton={…}`, không đẻ folder thừa.

```tsx
// ✅ lớn → folder riêng, truyền qua tên
skeleton={<WhoToFollowSkeleton className={className} />}         // WhoToFollow/WhoToFollowSkeleton/
skeleton={<CommunityFeedSkeleton />}                             // CommunityFeed/CommunityFeedSkeleton/
// ✅ nhỏ → inline
skeleton={<Skeleton.UserCell />}
```

```tsx
// ❌ tách folder <X>Skeleton chỉ để bọc 1 dòng <Skeleton.UserCell /> → folder rác
// ❌ nhét 60 dòng JSX skeleton inline trong skeleton={( … )} của feature lớn → phình index.tsx
```

## 6. Trạng thái empty/error cấu hình bằng PROPS, không bằng node

- `emptyContent`/`errorContent` nhận PROPS (`{ title, description?, onRetry?, retryLabel? }`), `AsyncContent` tự dựng `EmptyContent`/`ErrorContent` chuẩn (icon + title + optional nút retry, căn giữa). Text luôn đã dịch từ caller (`t(...)`), không hard-code chuỗi.

```tsx
// ✅ src/components/blocks/async/AsyncContent/AsyncContent.stories.tsx
emptyContent={{ title: "No submissions yet", description: "Complete a challenge to see it here." }}
errorContent={{ title: "Couldn't load the list", onRetry: () => {}, retryLabel: "Try again" }}
```

```tsx
// ❌ nhét JSX empty/error tay → lệch look chuẩn, lặp lại mọi nơi
isEmpty ? <div className="text-center">Trống</div> : …
```
