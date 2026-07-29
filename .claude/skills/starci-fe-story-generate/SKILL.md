---
name: starci-fe-story-generate
description: >
  SINH một `page` / `layout` / `overlay` (modal, drawer) MỚI trong Storybook design-system
  `.storybook/components/<app>/`, từ HAI nguồn: (A) đọc màn có thật trong `src/` của app rồi rút
  cây, hoặc (B) thầy mô tả biz và trò SÁNG TẠO cây cho app chưa có source (`miamia`, `nivo`).
  Hai nhánh nhập vào CÙNG một dây chuyền `steps/1..5`. Chạy trọn: vẽ cây + vét cạn state →
  **DỪNG chờ thầy duyệt cây** → dựng .tsx + story THẬT từ GỐC lên (atom/frame/composite trước,
  block, rồi page/layout/overlay ghép) → leaf + `states[]` + đo DOM → tên + reindex → 10 cổng +
  tsc + eslint → bàn giao. Thay thế và GỘP hai skill cũ `starci-fe-story-audit` (đọc source) và
  `starci-fe-story-create` (soạn biz mới) — hai skill đó dạy cây 4 tầng
  `layout/overlay→block→design→primitive` đã CHẾT (tầng `design` bị xoá 2026-07-28). Dùng khi
  thầy gõ `/starci-fe-story-generate <tên màn>` kèm hoặc không kèm mô tả, hoặc nói "dựng page
  X", "sinh overlay Y", "vẽ cây rồi dựng luôn màn Z", "app miamia chưa có page nào, làm đi".
  KHÔNG dùng để sửa 1 component theo feedback thầy vừa đưa (đó là `starci-fe-story-feedback`),
  KHÔNG dùng để audit sức khoẻ cây đã có (`starci-fe-atom-audit` / `starci-fe-primitives-audit`).
---

# /starci-fe-story-generate — sinh một page/layout/overlay, từ source hoặc từ đầu

> **Code:** `C:\Repositories\starci-academy\.storybook` (branch `mtp`).
> **Nền:** [`discipline/verify-empirically.md`](../../discipline/verify-empirically.md) ·
> [`discipline/multi-session-git.md`](../../discipline/multi-session-git.md) (FE có NHIỀU phiên
> cùng ghi — `git fetch` trước, không `stash`/`reset` để "so cho dễ").

## ⛔ ĐỌC CANON Ở ĐÂU — chỗ này sai là cả cây sai

| Cần biết | Đọc file | ⛔ ĐỪNG đọc |
|---|---|---|
| **tầng nào có thật** | `AnatomyTier` trong `.storybook/utils/AnatomyOverlay/anatomy-context.tsx` — union đó là SỰ THẬT | `principles.md` §6c |
| tầng sở hữu gì · gap · padding | `rules/3-shape-tier.md` | `principles.md` §6/§10 |
| cây · ai import gì | `rules/1-decompose.md` §0 (ba câu trục) · §2 (bảng import cứng) | `principles.md` §11 |
| leaf · vét state · `states[]` | `rules/2-leaf-states.md` §0 · §5 · §8 · §8a | |
| tên story · khuôn file · văn xuôi | `rules/4-organization.md` §2 · §3 · §3a · §3b · §4a | |
| trình tự + cổng mỗi bước | `steps/1..5-*.md` | |

**Vì sao cấm `principles.md`:** file đó đã **CHẾT** (2026-07-29) và giờ chỉ còn là **bản đồ
chuyển hướng** trỏ sang `principles/<trục>/` và `rules/`. Trước khi bị rã, nó dạy sai đúng
chuyện tầng: đo được `primitive` 65 lần · `design` 47 lần · `layout` 43 lần, trong khi `frame`
10 · `composite` 6, và §6c vẫn dạy *"NĂM TẦNG atom·layout·design·block·screen"* — **`design`
đã bị xoá khỏi code từ 2026-07-28**. Nếu lỡ mở nó, đọc bản đồ rồi đi tiếp, đừng trích nội dung
cũ qua `git show`. Danh sách tầng chính thức nằm ở `principles/INDEX.md`. Các mục khác đã rã sang địa chỉ mới,
vẫn dùng bình thường: bản vẽ/công trình → `rules/0-boundary.md` · surface →
`principles/surface/context.md` · icon → `principles/icon/context.md` · Typography →
`principles/text/context.md`.

Tầng đang có thật:

```ts
AnatomyTier = "heroui" | "atom" | "frame" | "composite" | "block" | "screen"
```

## Sinh vào đâu

```
.storybook/components/<app>/{ pages, layouts, overlays/{modals,drawers}, blocks }
.storybook/stories/<app>/…            ← cây story SOI GƯƠNG cây component (rules/4 §1)
```

`<app>` ∈ `starci` · `miamia` · `nivo`. Đo 2026-07-29: `starci` có 20 page · 5 layout · 2
overlay · 6 block; **`miamia` và `nivo` mới có 2 overlay, chưa có page/layout nào** — đó là chỗ
nhánh B (sáng tạo) sẽ dùng nhiều nhất.

---

## P0 · CHỌN NGUỒN — làm trước mọi thứ

| | Nhánh A — TỪ SOURCE | Nhánh B — SÁNG TẠO |
|---|---|---|
| Khi nào | app có màn thật trong `src/` | app chưa có source (`miamia`/`nivo`), hoặc thầy mô tả màn chưa tồn tại |
| Việc đầu | đọc `src/app/**/page.tsx` + `src/components/features/**` của đúng màn đó | viết **BIZ SPEC**: màn làm gì · SWITCH giữa những cấu trúc nào · mỗi vùng có state nào · dữ liệu gì |
| Ràng | ⛔ **CẤM sửa `src/`** (§0). `src` chỉ để ĐỌC | thiếu thông tin thì **HỎI**, đừng bịa view/state |

Không rõ nhánh nào → **hỏi thầy**, đừng đoán. Cả hai nhánh từ P1 trở đi đi CHUNG một đường.

---

## P1 · CÂY + VÉT CẠN STATE — read-only, kết thúc bằng BARRIER

Chạy `steps/1-tree-and-states.md`. Bảy bước ở `rules/1` §1, bắt đầu bằng:

1. **DANH SÁCH CHỨC NĂNG bằng lời, chưa nghĩ hình.** Màn là một danh sách chức năng, mỗi chức
   năng là một block. Dòng nào không nói được nó phục vụ việc gì cho người dùng ⇒ nó là trang
   trí, không phải chức năng.
2. **Khung dựng bằng tầng `frame`, KHÔNG bằng `div`.**
3. **Vét cạn state theo bảng `rules/2` §5** — 4 cột `State · Điều kiện nghiệp vụ · Hình đổi gì ·
   Leaf hay state`. Với block, bảng này CHÍNH LÀ tài liệu nghiệp vụ.
4. Phân biệt **leaf** với **state**: caller bật ⇒ LEAF · dữ liệu về ⇒ STATE trong cùng leaf.
   `isSkeleton` là CỜ CHẢY XUỐNG, có ở mọi tầng — **cấm dựng `XxxLoading` tay** (T3).

**RA:** một file `.md` — danh sách chức năng · cây tầng · bảng state · chỗ nào REUSE component
đã có, chỗ nào phải dựng MỚI. **KHÔNG render 8080** (thầy đã bỏ lối đó — ra `.md` để thầy sửa
từng dòng).

⛔ **DỪNG. Chờ thầy duyệt cây.** Cây sai thì mọi thứ dưới hỏng hết, nên đây là barrier cứng,
không được tự đi tiếp kể cả khi thấy "rõ quá rồi".

---

## P2 · DỰNG TỪ GỐC LÊN, TỪNG TẦNG MỘT

Chạy `steps/2-fix-by-tier.md`. Thứ tự **bắt buộc**: `atom → frame → composite → block → page`.
**Barrier giữa các tầng**; trong cùng một tầng thì các component độc lập nhau, làm song song
được.

**Bảng import cứng (`rules/1` §2) — vi phạm là sai tầng, không phải "tuỳ trường hợp":**

| Tầng | Được import | CẤM |
|---|---|---|
| `screen`/page | block · frame | atom · composite · `div` bố cục tay |
| `block` | composite · frame · atom · **block khác** | screen |
| `composite` | frame · atom | block · screen · **dữ liệu miền** |
| `frame` | atom · frame khác | composite · block |
| `atom` | HeroUI | mọi tầng trên |

**Block ĐƯỢC bọc block**, nhưng block bọc đúng một con **phải kiếm được tầng của nó**: một điều
kiện nghiệp vụ, một quyết định, một luật, **hoặc chính CÂU CHỮ** (biến dữ liệu có kiểu thành câu
người đọc). Cổng `check-passthrough-block` canh chuyện này.

**Bốn luật hình thức, sai là cổng bắt ngay:**
- **KHÔNG namespace** — `PhaseScarcityNote`, không phải `PhaseScarcityNote.Base` (`rules/4` §3b).
- **Đi xuống là DỮ LIỆU, không phải HÌNH** — prop là `string`/`number`/`enum`/mảng CÓ KIỂU.
  `ReactNode` chỉ mở ở tầng `frame` (slot) (T2).
- **Mọi hình dữ liệu phải CÓ TÊN** — cấm `{ index: number; name: string }` ẩn danh tại chỗ khai
  prop (`rules/4` §3a).
- **`gap` và `padding` viết bằng CHỮ** — `gap="grouped"`, `padding="cozy"`; số là compile error
  (`rules/3` §1.0). Atom viết `flex` tay là ĐÚNG; "bố cục qua khung" chỉ áp từ `frame` trở lên.

---

## P3 · LEAF + `states[]` + HÌNH

Chạy `steps/3-leaf-and-visual.md`. Mỗi story leaf khai `states[]` (`rules/2` §8):

```tsx
<BlockAnatomy
    name="PhaseScarcityNote" tier="block" leaf="Default"
    renderClassName="mx-auto max-w-xl"
    reason="Bất biến của CẢ leaf, viết MỘT lần."
    states={[
        { name: "seatsRemaining = 14", why: "…", code: `…`, render: <…/> },
        { name: "nextPhasePriceVnd = null", why: "…", code: `…`, render: <…/> },
    ]}
/>
```

- `name` = **điều kiện dữ liệu** viết như biểu thức. Leaf có trục là THANG (`gap`, `size`) thì
  `name` là **QUAN HỆ**, không phải giá trị (`rules/2` §8a).
- `why` = **đúng 2 câu văn xuôi English** (câu 1 render đổi gì · câu 2 vì sao sản phẩm muốn thế).
  Không `—` `↔` `->` `=>` (`rules/4` §4a).
- **Hình thì ĐO, không nhìn.** `getComputedStyle` trên browser thật. Neo đã cắn 2026-07-29:
  `Container` có bug `@app-xl:` KHÔNG BAO GIỜ fire mà **tsc + toàn bộ cổng + eslint đều xanh** —
  cổng không chứng minh được container-query render đúng.
- Kiểm nhịp: liệt kê seam theo thứ tự dọc; dãy **gần đều nhau** gần chắc là sai, vì nhịp phải
  kể ra được nhóm.

---

## P4 · TÊN · REINDEX · CỔNG

Chạy `steps/4-naming-and-gates.md`. Tên story theo `rules/4` §2. Đổi story id ảnh hưởng chéo mọi
dep ⇒ **tuần tự, không song song**.

**10 cổng phải xanh** (chạy từ repo FE):

```bash
node scripts/check-no-namespace.mjs && node scripts/check-story-ids.mjs && node scripts/check-seams.mjs && node scripts/check-inline-types.mjs && node scripts/check-padding.mjs && node scripts/check-one-instance-per-state.mjs && node scripts/check-member-as-state.mjs && node scripts/check-orphan-parts.mjs && node scripts/check-passthrough-block.mjs && node scripts/check-deps-coverage.mjs
```

⚠️ **`check-story-coverage.mjs` là cổng thứ 11 và đang CHẾT — đừng chạy, đừng "sửa cho xanh".**
Nó so `src/components/blocks` với `.storybook/stories/blocks`, tức đòi **bản vẽ phải soi gương
công trình** — đúng cái §0 đã bãi bỏ (*"spec lệch app là trạng thái BÌNH THƯỜNG"*). Đo
2026-07-29: báo thiếu **162/162**, tức luôn đỏ ⇒ không mang tin gì. Muốn xử thì phải hỏi thầy
(sửa phạm vi hay xoá), không tự quyết trong lượt sinh màn.

Kèm: `npx tsc --noEmit` sạch · `npx eslint .storybook` 0 error · restart Storybook
(`preview_stop` → `preview_start`) vì watcher Windows kẹt khi THÊM file story; xác nhận bằng
`curl -s http://localhost:6006/index.json`. **Đừng tự lái browser soi mắt** — báo thầy tự xem;
chỉ đo DOM là được phép.

---

## P5 · BÀN GIAO

Chạy `steps/5-handoff.md`. Ghi vào `.claude/fe/steps/` một mục mới: cây đã dựng · file đã tạo ·
số đo DOM trước/sau · cổng xanh · **cái gì CHƯA làm và vì sao**. Nếu trong lượt phát sinh một
LUẬT mới (thầy chốt giữa chừng) thì bake vào `rules/*.md` — `git fetch` trước, vì canon là file
chung nhiều phiên.

---

## Luật cứng của lane này

- **DỪNG ở P1 chờ thầy duyệt cây.** Không có duyệt thì không gõ `.tsx`.
- **CẤM đụng `src/`** — chỉ đọc. Kể cả "sync cho khớp" cũng cấm (§0).
- **Không tự chốt thay thầy.** "Chốt" phải là lời thầy thật trong chat; im lặng không phải đồng ý.
- **Không tổng quát hoá luật canon từ ĐÚNG một ví dụ** — muốn nâng thành luật chung cần ≥2 nguồn
  độc lập, không thì ghi rõ "neo vào đúng case này".
- **Tin số đo, không tin báo cáo agent.** Mọi phát biểu "đã xong/đã sạch" phải kèm output cổng
  hoặc số đo DOM. Chạy workflow fan-out thì vẫn tự chạy lại tsc/cổng trước khi tin.
- **Đừng đẻ trùng.** Trước khi dựng component mới, grep `.storybook/components/**` xem đã có
  chưa — sinh trùng một `SurfaceCard` thứ hai là hỏng chính cái design-system đang dựng.

## Model

Vẽ cây + chốt state = main-loop (Opus — phán đoán tầng là việc khó, sai là hỏng hết). Dựng code
theo tầng, khi số component trong một tầng ≥ 5, được đẩy Workflow Sonnet fan-out **trong cùng
một tầng** — vẫn giữ barrier giữa các tầng, và spec agent phải chặn cứng `"KHÔNG đụng src/"`.
