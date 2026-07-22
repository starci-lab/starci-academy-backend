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
| 2 | Color-prominence — nổi/chìm · chip vs accent | ⏳ DRAFT (chờ 3 câu) |
| 3 | Reading-flow — từ trái, hạn chế giữa | ⏳ DRAFT (chờ 3 câu) |

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
