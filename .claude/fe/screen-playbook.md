# PLAYBOOK — dựng MỘT screen từ đầu

> Đúc kết từ ca `CourseContents` (2026-07-26 → 27). Đọc `principles.md` cho LUẬT;
> file này là THỨ TỰ LÀM và BỘ KIỂM. Mọi § dẫn dưới đây đều trỏ về `principles.md`.

---

## 0. Nguyên tắc trục — nhớ đúng ba câu

1. **Mỗi tầng sở hữu một thứ.** atom sở hữu glyph/nét · layout sở hữu khoảng cách/khung ·
   composite+block sở hữu HÌNH và CHỮ của chính nó · screen sở hữu DANH SÁCH CHỨC NĂNG.
2. **Đi xuống là DỮ LIỆU, không phải hình.** Prop truyền xuống là `string`/`number`/mảng
   có kiểu. `ReactNode` là cửa để caller nhét hình vào — hạn chế tối đa (§14d.1).
3. **Trạng thái nghỉ là CỜ chảy xuống, không phải cây thứ hai.** `isSkeleton` ở cả 5 tầng
   (§12g.0a).

---

## 1. Thứ tự làm

### B1 — Viết DANH SÁCH CHỨC NĂNG trước, chưa nghĩ hình
Screen là một danh sách chức năng, mỗi chức năng = một block (§14a). Viết ra dạng:
*"khoá này là gì · gate GitHub team · đổi trial→mua · quay lại chỗ dở · hôm nay làm gì"*.
Chưa vẽ, chưa chọn card hay list.

### B2 — Dựng KHUNG bằng tầng layout, KHÔNG bằng `div`
| Cần | Dùng | ⛔ Đừng |
|---|---|---|
| khổ trang căn giữa | `Container size padding` | `mx-auto max-w-3xl p-6` |
| cột dọc / hàng ngang | `Stack.V` / `Stack.H` (`gap: SpaceScale`) | `flex flex-col gap-10` |
| lưới | `Grid columns gap` | `grid grid-cols-*` |

Vì sao bắt buộc: `gap`/`padding` khai kiểu `SpaceScale` (union `0·1·2·3·6·8`), nên
**off-scale là LỖI TYPE tại call-site** — đây là chỗ §10c được thi hành bằng máy, không
bằng review. `max-w-3xl` bằng `--container-app-md` *hôm nay* nhưng là NGUỒN KHÁC; token
đổi thì nó lệch âm thầm.

### B3 — Mỗi chức năng gọi đúng MỘT block
- Block chưa có ⇒ dựng ở tầng block, **đừng** lắp tạm bằng atom/layout trong screen.
- Block nhận **dữ liệu**, tự quyết hình: nhãn CTA, icon, tiêu đề cụm đều là **hằng số của
  block** (§14d.1). Caller không đặt tên hộ.
- Cần hai hình khác nhau? Hỏi **KHÁC WHY hay chỉ khác vẻ ngoài**:
  - khác WHY ⇒ **tách member** (`ContinueCard.Hero` vs `.Item`, `PriceTag.Prominent` vs `.Inline`)
  - cùng WHY ⇒ **gộp một hình**
  - ⛔ TUYỆT ĐỐI không mở `variant`/`size` cho caller chọn ở tầng composite/block.

### B4 — Nối trạng thái
| Trạng thái | Cách làm |
|---|---|
| đang tải | `isSkeleton` chảy xuống TỪNG block; mỗi block tự vẽ hình nghỉ của nó (§12c) |
| rỗng | `isEmpty` → `AsyncContent.Empty` thay TOÀN BỘ spine |
| lỗi | block tự lo trong khung của nó, không để lại card trắng |

⛔ **Không viết `XxxLoading` dựng tay.** Cây thứ hai luôn trôi khỏi cây thật — ca thật:
mirror vẽ 2 khối trong khi cây thật có 5 block, không ai phát hiện.

### B5 — Story
- Leaf = **một prop có hình** (§12g). Tên leaf = tên prop, không phải tên tình huống
  (`Skeleton`, không phải `Loading`).
- **Mọi leaf phải có `code`** (§12g.3). Panel thiếu tab Code = leaf không nói được cách gọi.
- `Skeleton` là **leaf riêng**, dùng lại **chính mảng `parts` của bản loaded** — cờ đổi
  STATE, không đổi CẤU TRÚC (§11f).
- Deps: chỉ khai component **có story riêng**, `storyId` phải **đối chiếu `index.json`**.

---

## 2. BỘ KIỂM trước khi báo xong

Chạy đủ, đừng tin mắt:

```bash
npx tsc --noEmit                          # kiểu + off-scale gap/padding
npx eslint ".storybook/**/*.{ts,tsx}"     # quotes, unused, indent
curl -s http://localhost:6006/index.json  # id story CÓ THẬT không
```

Bốn phép quét đã bắt được lỗi thật, nên chạy lại khi đụng vùng tương ứng:

| Quét | Bắt được gì |
|---|---|
| icon `size-*` + `weight` | glyph nhỏ hơn `size-5` mà thiếu `bold`; `size-5` mà thừa `bold` |
| nhánh `isSkeleton` vs trục hình | skeleton không rẽ theo `variant`/`collapseFrom` ⇒ layout nhảy |
| prop cấm ở composite/block | `variant`/`ctaLabel`/`icon`/`ReactNode` lọt vào tầng trên |
| leaf thiếu `code` | panel trống |

⚠️ **RESTART Storybook** sau mọi lần **thêm/xoá/đổi tên/di chuyển** file story — watcher
Windows luôn kẹt, index giữ bản cũ và story mới báo *"Couldn't find story"*.

---

## 3. Bẫy đã cắn thật — đọc trước khi mất buổi

1. **Vá lẻ chỗ được chỉ.** Mọi lỗi trong buổi đều rải khắp nơi: 458/911 leaf thiếu `code`,
   16 chỗ icon sai weight, 6 prop cấm. **Quét trước, sửa sau.**
2. **`storyId` gãy CÂM.** Không có gì kiểm nó; sai thì bấm không nhảy, build vẫn xanh.
   Đọc `href` trong DOM KHÔNG phải bằng chứng — phải tra `index.json`.
3. **Tailwind v4 tách `translate` khỏi `transform`.** `transition-transform` **không ăn**,
   mũi tên nhảy giật mà chẳng có gì báo. Phải `transition-[translate]`.
4. **`className` của khung khác vị trí nhau.** `SectionCard.className` áp lên CARD,
   `SurfaceCard.className` áp lên `<section>` bọc ngoài — bê thẳng là mất nền + bo góc.
5. **Component 0 consumer.** Trước khi dựng/giữ một biến thể, đếm chỗ dùng thật trong
   `src`: `SegmentedToggle` (0), `ContinueCard variant="plain"` (0), `PriceTag size="lg"` (0)
   — tất cả chỉ sống trong story của chính chúng (§14d.3).
6. **Cái "ngoại lệ" tự phong.** JSDoc có thể tự khai mình là ngoại lệ hợp lệ và sai
   (`ExtendedTabs`), mà cũng có thể ĐÚNG trong khi audit gọi nó là nợ. Phán bằng
   **consumer thật**, đừng phán bằng lời file tự viết về mình.
7. **Gom theo HỌ là công cụ PHÁT HIỆN** (namespace đã bỏ 2026-07-28, nhưng phép so vẫn dùng).** `gap-1` vs `gap-2`, hover mờ vs gạch chân —
   chỉ lộ khi hai component bị đặt cạnh nhau trong một `Link.*`.
