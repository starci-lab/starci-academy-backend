# FE THINKING — mục lục · 2 thư mục · 15 câu chờ chốt

> Hai thư mục, hai vai. **`rules/` = LUẬT** (đúng/sai, dùng để CHẤM) ·
> **`steps/` = TRÌNH TỰ** (làm gì trước, đo gì rồi mới qua bước sau, dùng để CHẠY).
> Workflow dài cần cả hai: mỗi step nạp đúng file rules nó cần.
> Luật đầy đủ vẫn ở `principles.md`; bộ này là **cách NGHĨ** + chỗ dễ sai + số đo thật.

---

## `rules/` — LUẬT

| File | Trả lời câu gì | Step dùng nó |
|---|---|---|
| [`rules/1-decompose.md`](rules/1-decompose.md) | tách một màn thành cây component (screen → atom), ai được import gì | S3 · S5 |
| [`rules/2-leaf-states.md`](rules/2-leaf-states.md) | bao nhiêu leaf, mỗi leaf vét đủ state nào | S4 · S6 |
| [`rules/3-design-tier.md`](rules/3-design-tier.md) | gap · padding · chọn khung · chọn component · điều cấm | S7 |
| [`rules/4-organization.md`](rules/4-organization.md) | đặt ở đâu · gọi tên gì · khuôn file 7 phần · comment · dao gác | S1 · S5 · S8 · S9 · S10 |

## `steps/` — TRÌNH TỰ

Mỗi bước có 5 ô cố định: **VÀO · LÀM · CỔNG ĐO · RA · DỪNG KHI**. Không qua cổng thì không qua bước; "DỪNG KHI" là chỗ agent phải hỏi thầy, không tự quyết.

| File | Bước | Hình dạng workflow | Barrier? |
|---|---|---|---|
| [`steps/0-sync-baseline-closure.md`](steps/0-sync-baseline-closure.md) | S0-S2 · đồng bộ · đo baseline · dựng closure | 1 agent | — |
| [`steps/1-tree-and-states.md`](steps/1-tree-and-states.md) | S3-S4 · vẽ cây + bảng state | 1 agent → **thầy duyệt** | **có** |
| [`steps/2-fix-by-tier.md`](steps/2-fix-by-tier.md) | S5 · sửa `screen→atom`, fan-out trong tầng | pipeline 5 chặng | **giữa các tầng** |
| [`steps/3-leaf-and-visual.md`](steps/3-leaf-and-visual.md) | S6-S7 · leaf + hình + đo DOM | pipeline theo component | không |
| [`steps/4-naming-and-gates.md`](steps/4-naming-and-gates.md) | S8-S9 · tên · reindex · cổng cuối | 1 agent tuần tự | **có** |
| [`steps/5-handoff.md`](steps/5-handoff.md) | S10 · bàn giao | 1 agent synth | — |

---

## Bốn câu trục

1. **Mỗi tầng sở hữu MỘT thứ** — tranh chấp quyền là sai tầng, không phải "tuỳ ca".
2. **Đi xuống là DỮ LIỆU** — `ReactNode` chỉ mở ở tầng layout (slot).
3. **Leaf tách khi HÌNH component tự vẽ đổi.** Phép thử: **caller bật ⇒ leaf · dữ liệu về ⇒ state trong cùng leaf.**
4. **Đọc seam theo QUAN HỆ, không theo TẦNG** — hai design mà một là caption của cái kia thì cùng một cụm.

---

## 15 câu chờ thầy chốt

Nhóm **A** đổi **số story mỗi screen** (sai là nhân lên mọi screen) · **B** đổi **cách viết code** · **C** là nợ dọn + nghiệp vụ.

### A · Chặn việc generate hàng loạt

| # | Câu | Ở file |
|---|---|---|
| **C2** | Trục THIẾT BỊ có phải trục story? Đo được `Container size="md"` chặn 768px ⇒ **Tablet ≡ Desktop về cấu trúc** | rules/1 |
| **C6** | Leaf `isSkeleton` ở screen có nhân theo device? (hiện 3 device × skeleton = 3 story) | rules/2 |
| **C7** | Tên leaf skeleton: `Skeleton` hay `Prop \`isSkeleton\``? | rules/2 |
| **C1** | Screen có được gọi thẳng `AsyncContent.Empty`/`.Error` (layout) hay phải qua block? | rules/1 |
| **C8** | §10b có thêm nấc **`caption`** để câu "design ↔ design = 6" không bị áp máy móc? | rules/3 |

### B · Đổi cách viết code

| # | Câu | Ở file |
|---|---|---|
| **C11** | 22 file namespace `export const X = { Base }` → `Object.assign` (§12a) hay đổi §12a? | rules/4 |
| **C12** | Luật `XLike` áp cả **story fixture** hay chỉ `components/`? (+~17 mảng) | rules/4 |
| **C13** | Helper cục bộ không export có phải theo `XProps`? (agent bắt thêm 22 chỗ) | rules/4 |
| **C14** | File >800 dòng tách sổ quyết định ra `<Component>.decisions.md`? (`SurfaceCard.tsx` 2063 dòng) | rules/4 |
| **C3** | Biên i18n đặt ở đâu? (28 chuỗi Việt trong 5 block + `toLocaleString("vi-VN")` hard-code) | rules/1 |

### C · Nợ dọn + nghiệp vụ

| # | Câu | Ở file |
|---|---|---|
| **C4** | Ngưỡng "gấp" của suất: `1-3` hay tỉ lệ `< 15%`? | rules/2 |
| **C5** | Câu khi **hết suất** (hiện in `"Còn 0 suất"` — sai nghiệp vụ), có bỏ vế "giá tăng lên sau đó"? | rules/2 |
| **C9** | CTA cần 631px mà card chỉ 488px ⇒ **luôn** wrap. Full-width có chủ ý, hay thu nút? | rules/3 |
| **C10** | 6 chỗ `gap-1.5`/`gap-4` ở `Input`·`FieldFrame`·`TabsBase`: sửa về thang hay khai ngoại lệ? | rules/3 |
| **C15** | 11 error eslint thật: sửa hết, hay chỉ trong closure rồi ghi nợ? | rules/4 |

---

## Hai điều kiện trước khi bấm chạy hàng loạt

1. **Nhóm A phải chốt xong** — nó quyết định số story mỗi screen; chốt sai là nhân lên toàn bộ.
2. **Mỗi gate phải qua negative control** — nhét lỗi giả, thấy đỏ, mới tin. Trong phiên dựng bộ này, gate `storyId` từng báo "✅ sạch" khi đang **mù 10 khai báo**.

## Ba luật cứng khi cắm workflow

1. **Chặn `src/**` ngay trong prompt agent** — Sonnet chạy nền không tự suy ra ranh giới §0 (`.storybook` là bản vẽ, `src` là công trình).
2. **Agent trả về SỐ ĐO, không trả về "đã xong"** — schema bắt buộc có trường `evidence` (lệnh + kết quả).
3. **≤2 workflow nặng song song**, và sau khi báo `completed` vẫn phải kiểm `kept + dropped == tổng` — session limit có thể giết agent mà vẫn báo hoàn tất.
