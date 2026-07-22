# FE Principles — thước dựng UI (canon v2)

> **MỘT file duy nhất** cho principle FE (thầy chốt 2026-07-22: *"fe/be chỉ còn patterns; riêng fe có principles.md"*). Mỗi principle = 1 §section: luật STRICT + ✅/❌ neo THẬT + **checklist đo được** (để lane `starci-fe-story-fix-*` và `starci-fe-story-audit` chấm qua).
>
> **Foundation (token màu / gap / radius / elevation) KHÔNG ở đây.** Token là *từ vựng của Primitives* → sống trong Primitives (Storybook stories) + code-style `.claude/patterns/fe`. File này chỉ **tham chiếu tên token**, không định nghĩa lại.
>
> Gom + distill từ `.claude/_legacy/fe/{foundations,principles}` (canon cũ — đừng chế) + bài học phiên 2026-07-22 (CrossListCard / CourseCard).

## Mục lục
| § | Principle | Trạng thái |
|---|---|---|
| 1 | Surface-in-surface — phân lớp bề mặt | ✅ CHỐT |
| 2 | Color-prominence — nổi/chìm · chip vs accent (+ §2d đồng bộ element) | ⏳ DRAFT (§2d ✅ CHỐT) |
| 3 | Reading-flow — từ trái, hạn chế giữa | ⏳ DRAFT (chờ 3 câu) |
| 4 | Element-compliance — primitive sở hữu sizing/style nội bộ | ✅ CHỐT |
| 5 | Icon — size theo text · interaction theo ngữ nghĩa · lib phosphor+gravity | ✅ CHỐT |
| 6 | Granularity — foundational primitives · PROP thay vì component mới | ✅ CHỐT |

---

## 1. Surface-in-surface (bề mặt lồng bề mặt) — ✅ CHỐT

Khi một surface (card / list-card / panel `bg-surface`) LỒNG trong một surface khác.

### 1a. Tín hiệu tách lớp: top-level = SHADOW · nested = BORDER (không double-fill)
- **Card ngoài cùng** (nổi khỏi nền trang): `shadow-surface`, `.card{border:none!important}` — shadow là elevation DUY NHẤT.
- **Surface LỒNG bên trong:** `border border-default`, **KHÔNG shadow**.
- **Gốc lý do (không phải khẩu vị):** dark mode `--surface-shadow = 0 0 0 0 transparent` → shadow CHẾT → hai surface lồng nhau không tách được bằng shadow ở dark → buộc **border**.
- **KHÔNG double-fill:** không hai lớp shadow chồng, không `border`+`shadow` trên cùng một hộp.
- **Helper dùng chung:** `surfaceFrame(bordered)` → `bordered ? "border border-default" : "shadow-surface"`. `CrossListCard`/`SurfaceListCard`/`SurfaceAccordionCard` cùng gọi.

✅ `CrossListCard bordered` trong `CourseCard` (list value-props). ❌ list nested vẫn xài `shadow` (vô hình ở dark) · một hộp vừa border vừa shadow.

### 1b. Radius: surface-card nested GIỮ 3xl — chỉ media/field mới bước xuống
- **Card thật `bg-surface` nested VẪN `rounded-3xl`** — đừng hạ 2xl chỉ vì nested.
- **CHỈ media/field** nested bước concentric: cover/media `rounded-2xl` · input/field `rounded-xl` · chip/avatar/pill `rounded-full`.
- Ngoại lệ 2xl KHÁC (không phải surface-in-surface): group card sibling, popover, chat bubble.

✅ `CourseCard rounded-3xl` chứa cover `rounded-2xl` (media) + `CrossListCard rounded-3xl` (surface). ❌ hạ `CrossListCard` xuống 2xl "vì nested".

### 1c. Đừng xếp 2 surface bordered KỀ NHAU (adjacency ≠ nesting)
Hai hộp viền DÍNH liền dọc = "hộp nối hộp", mất phân cấp. Cái phụ → **link phẳng** (text+caret) / **gộp vào card trên** (divider `border-t`) / hoặc ngang hàng thật thì `gap-6` + nhãn riêng.

### 1d. Trong overlay đã là surface → nội dung PHẲNG
Surface trong overlay đã có `overlay-shadow` (modal/drawer/popover) → nội dung **phẳng**, không bọc thêm card.

### ✅ Checklist đo (§1)
- [ ] Card ngoài: `shadow-surface`, KHÔNG border?
- [ ] Surface nested: `border border-default`, KHÔNG shadow?
- [ ] Không hộp nào vừa border vừa shadow?
- [ ] Surface-card nested giữ `rounded-3xl`; chỉ media/field xuống `2xl`?
- [ ] Không 2 bordered kề dọc?
- [ ] Surface trong overlay → phẳng?

> Gom: `_legacy/fe/foundations/elevation.md` · `principles/card.md` §0/§4 · `foundations/radius.md` · `card-in-card-border-not-double-fill`.

---

## 2. Color-prominence — nổi/chìm (⏳ DRAFT — chờ thầy chốt)

Mỗi vùng nhìn chỉ được có **ĐÚNG MỘT thứ nổi**. Lạm dụng nổi = không còn gì nổi. Gom + nâng `_legacy/fe/principles/accent-system.md` (4 vai accent) + `foundations/color.md` §5 (dòng chính foreground / phụ muted).

### 2a. Thang prominence: muted → accent → chip → button
| Nấc | Dùng khi | Neo |
|---|---|---|
| **muted text** | ngữ cảnh/meta trung tính, scalar tự do (đếm, giờ) | 482 học viên (KHÔNG chip) |
| **accent, no box** | tín hiệu INLINE trong dòng chảy: link · "của tôi" · active text | accent-system 4 vai · 1 kênh |
| **chip (soft token)** | token đóng khung có nghĩa: status semantic · enum/category · badge khuyến mãi | DifficultyChip · −55% |
| **button** | hành động | CTA solid accent |

**Tiêu chí chip vs không (⏳ chờ thầy chốt câu chữ):** chip = token **bounded + enum/status/badge-semantic**; scalar trung tính (count) → muted. (`−55%` chip vì *badge deal*; `482` không vì *count trung tính*.)

### 2b. Cặp trái–phải lệch cấp màu
Trong cặp có phân cấp (title↔meta, label↔value): **1 nổi + 1 chìm**, không đồng màu. Bên nổi = bên MANG TÍN HIỆU (không cố định trái/phải). Peer-row (đồng cấp: nav, tags) → ngoại lệ, cùng màu OK.

### 2c. Restraint (từ accent-system)
Accent = tín hiệu, vài điểm (60-30-10); mỗi element 1 kênh; accent ≠ status (status → semantic). Không accent-flood nền khối lớn.

❌ neo THẬT (CourseCard 2026-07-22): 3 check xanh + chip −55% xanh + CTA hồng = 4-5 điểm nổi → nhiễu sắc, mắt không đáp được. Sửa: hạ check về muted → còn 1-2 điểm nổi.

### 2d. Đồng bộ ELEMENT theo loại thông tin; prominence leo bằng TONE, KHÔNG đổi element (✅ CHỐT 2026-07-22)
Cùng một LOẠI dữ kiện (vd *time-remaining*) phải render bằng **cùng MỘT element** ở MỌI scenario/state — cấm chỗ text muted, chỗ chip. Khi cần nhấn/giảm theo ngữ cảnh (còn nhiều giờ vs sắp hết) → đổi **TONE** của chính element đó (neutral ↔ warning ↔ danger), KHÔNG đổi sang element khác.

✅ neo THẬT (ContinueCard 2026-07-22): `timeLeft` = `StatusChip` ở MỌI scenario (No-progress/Progress); `urgent` chỉ leo tone `neutral → warning`, KHÔNG sơn cả dòng meta. ❌ "40 minutes left" là text muted trong khi "2 minutes left" là chip = **cùng info-type mà 2 element khác nhau** (sai).

**Đo được:** với mỗi info-type xuất hiện ở ≥2 ô (scenario/state), nó có dùng CÙNG element không? khác biệt giữa các ô có nằm ở TONE (không phải loại element) không?

> ⏳ 3 câu chờ chốt: (1) tiêu chí chip = "enum/status/badge" vs "neutral scalar"? (2) cặp trái-phải lệch cấp — peer là ngoại lệ? (3) accent vs chip khi cùng "signal" — accent=inline, chip=đóng khung?

---

## 3. Reading-flow — từ trái, hạn chế giữa (⏳ DRAFT — chờ thầy chốt)

Content neo **TRÁI**, origin top-left, chảy LTR; "giữa" chỉ cho vài moment focal. Gom từ story-conventions cũ (canvas full-bleed top-left, cấm `layout:"centered"`, `flex-col gap-6` neo trái).

| Loại "giữa" | Phán |
|---|---|
| `text-align:center` | ❌ TRÁNH (mép trái răng cưa, mắt dò lại điểm bắt đầu) |
| block position giữa trang (`max-w` căn giữa) | ✅ OK (bố cục trang; content bên trong vẫn trái) |
| `justify-center` trong row | ❌ content chính · ✅ empty-state/spinner |
| `right-align` | ✅ số (tabular) + trailing meta/price/caret |

"Hạn chế" = có ngoại lệ: empty-state, 1 hero focal, modal 1 nút, loading.

❌ neo THẬT: dòng "≈ $58.99 khi thanh toán quốc tế" (CourseCard) căn giữa → lệch mọi dòng khác neo trái.

> ⏳ chờ chốt: "hạn chế giữa" áp `text-align` thôi hay cả `justify-center` block? right-align trailing thuộc luật này hay khác?

---

## 4. Element-compliance — primitive SỞ HỮU sizing/style nội bộ — ✅ CHỐT

Block/consumer compose primitive bằng cách truyền **children TRẦN**; **primitive tự lo sizing/màu nội bộ của nó**. Consumer KHÔNG set `size-*`/màu cho phần bên trong primitive.

- **Gốc lý do:** sizing đồng nhất phải sống Ở MỘT NƠI (primitive) → đổi 1 chỗ, mọi call-site theo; nếu để call-site tự set thì mỗi nơi 1 kiểu, drift.
- ✅ neo THẬT (2026-07-22): `StatusChip` tự ép icon `[&_svg]:size-4` **bất kể caller** → `ContinueCard` truyền `icon={<ClockIcon/>}` TRẦN, không kèm `size-*`. ❌ consumer thêm `className="size-5"` cho icon chip (vá call-site).
- Cần khác sizing/style → **sửa PRIMITIVE** (đổi luật chung), KHÔNG vá 1 call-site. Đây là mặt kia của "không hand-roll": đã có primitive thì để nó CHỦ, đừng override từ ngoài.

### ✅ Checklist đo (§4)
- [ ] Consumer truyền icon/children TRẦN cho primitive (không kèm `size-*`/màu nội bộ)?
- [ ] Sizing phần nội bộ (vd icon chip = size-4) do CHÍNH primitive ép, không phải call-site?
- [ ] Muốn khác → sửa primitive, không vá ngoài?

---

## 5. Icon — size theo TEXT, interaction theo NGỮ NGHĨA — ✅ CHỐT (thầy chốt 2026-07-22)

### 5a. Size icon = ĐỐI CHIẾU text-size đứng cạnh (KHÔNG theo line-height)
Icon cạnh chữ phải khớp **cỡ CHỮ THẬT (font-size)**, không phải chiều cao dòng (line-height). Thang cặp:

| text đứng cạnh | font-size | icon |
|---|---|---|
| `text-xs` | 12px | **`size-4`** (16px) |
| `text-sm` | 14px | **`size-5`** (20px) |
| `text-base` | 16px | **`size-6`** (24px) |

- **Button**: icon co theo **text-size CỦA button đó** (button dùng `text-sm` → icon `size-5`…). Đối chiếu text thật của mỗi size, đừng đoán theo `h-*`.
- **Ai ép size?** — chính primitive (§4): consumer truyền icon TRẦN, primitive map text→icon (vd `StatusChip` `size-4` cho chip nhỏ; `ButtonGroup` map size nút → icon).
- ❌ neo THẬT: lấy `size-5/6` theo `h-5/h-6` (line-height) trong khi glyph chỉ 14/16px → icon TO. Đúng: đối chiếu font-size.

### 5b. Interaction đặc thù THEO NGỮ NGHĨA icon (special-case)
Icon mang ý nghĩa hành động → có **micro-interaction riêng khi tương tác** (hover/press):

- **Arrow / caret TRAILING (CTA "→", "Xem thêm →", caret phải)** → **trượt phải** khi hover/nhấn: `transition-transform group-hover:translate-x-1`. Neo THẬT: `SeeMoreLink` (`group-hover:translate-x-1`).
- **Rotate / refresh / retry / sync icon** → **QUAY** khi bấm (đang xử lý → `animate-spin`; hoặc rotate on click).
- **Chevron mở/đóng (accordion, dropdown)** → **xoay 180°** khi mở: `transition-transform data-[open]:rotate-180`.
- *(mở rộng khi gặp — mỗi ngữ nghĩa 1 hành vi; ghi thêm vào đây, đừng chế lẻ ở call-site.)*
- **Owner:** micro-interaction thuộc **primitive/affordance** (SeeMoreLink, Button trailing-icon…), consumer chỉ chọn icon; không hand-roll animation ở call-site.

### 5c. Icon lib — CHO PHÉP CẢ `@phosphor-icons/react` LẪN `@gravity-ui/icons`
Thầy chốt 2026-07-22 (gỡ ban gravity trước đó, eslint `no-restricted-imports` đã bỏ). Chọn theo thẩm mỹ; đừng trộn lộn xộn trong 1 cụm.

### ✅ Checklist đo (§5)
- [ ] Icon cạnh text: size khớp **font-size** (xs→4 · sm→5 · base→6), không theo line-height?
- [ ] Trailing arrow/caret có `group-hover:translate-x-1`? Rotate-icon có quay khi bấm? Chevron có `rotate-180` khi mở?
- [ ] Micro-interaction sống ở PRIMITIVE, không vá ở call-site?

---

## 6. Granularity — foundational primitives + PROP thay vì component mới — ✅ CHỐT (thầy chốt 2026-07-22)

### 6a. Foundational primitives = viên gạch NỀN
Vài primitive là NỀN của 1 họ (vd `Button`, `ButtonGroup` cho họ button; `StatusChip`, `MetaRow`…). Component cao hơn **MAY compose** chúng — hoặc không, TUỲ FIT. KHÔNG import cho-có; chỉ compose khi thật sự tái dùng logic/hình (skeleton, icon-size, layout…).

### 6b. Component mới? → HỎI: "có thể thành 1 PROP của thằng sẵn có không?"
TRƯỚC khi đẻ 1 component MỚI, cân nhắc: nó có thể là **1 PROP** trên component đã có không? Chỉ tách component RIÊNG khi **composition/vai KHÁC HẲN**, không phải chỉ 1 biến thể/tính năng.
- ✅ neo THẬT (2026-07-22): skeleton → prop **`isSkeleton`** trên `Button` (KHÔNG đẻ `SkeletonButton` riêng). Time-remaining → prop `timeLeft`+`urgent` trên `ContinueCard` (không component riêng).
- ❓ cân nhắc: `FloatingActionButton` → `<Button variant="fab" iconOnly>`? `ElementCloseButton` → `<Button iconOnly>` + close-affordance? — gộp thành prop TRƯỚC khi quyết giữ riêng.
- ❌ anti: đẻ 1 component cho MỖI biến thể nhỏ → nổ số component, drift, khó bảo trì.

### ✅ Audit lens (§6)
- [ ] Gặp component tách riêng: hỏi "gộp thành PROP của foundational (`Button`/…) được không?"
- [ ] Component mới đề xuất: đã cân nhắc prop-trên-thằng-cũ TRƯỚC chưa?
- [ ] Foundational được compose ĐÚNG chỗ (không import thừa, không hand-roll lại cái đã có)?
