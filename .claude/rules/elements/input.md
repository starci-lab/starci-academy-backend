# Element — Input / Field

> Element doc cho ô nhập (HeroUI `TextField`/`Input`, composer pill, search box, fake-input mở editor). Quy ước **fill · radius · variant theo nền**. Bổ trợ [[surface-in-surface-inner-has-border]] + [[accordion-card-surface-on-standalone-pages]] (chọn da theo nền).

## 1. Mọi ô nhập PHẢI có fill surface — KHÔNG để trong suốt
- **Ô nhập / affordance bấm-để-nhập (composer pill, search box, fake-input) đặt trên surface đọc → PHẢI có fill `bg-surface`.** Trong suốt = ăn nền `bg-background` (tối) phía dưới → đọc như "vùng tối", không ra field. Field là 1 **surface có nghĩa** (chỗ gõ) → nền sáng hơn nền trang.
- **Pattern chuẩn:** `rounded-xl border border-default bg-surface px-4 py-2` + hover `hover:bg-default`. Border + surface fill = field nổi rõ.
- **Phân biệt:** phần TĨNH (text/row/divider) để trong suốt được; INPUT (chỗ tương tác nhập) luôn có fill. Input = surface-in-surface cố ý → có nền + border ([[surface-in-surface-inner-has-border]]).

## 2. Radius = radius của FIELD (`rounded-xl`), KHÔNG `rounded-full`
- **Concentric (ref [[gap]]):** khung `rounded-2xl` → **ô/field `rounded-xl`** → chỉ chip/avatar mới `rounded-full`. Ô nhập (composer/search/fake-input) là field → `rounded-xl` khớp các input khác. KHÔNG bo tròn pill (thầy chốt 2026-06-25: *"rounded theo size input"*).

## 3. Variant chọn để TƯƠNG PHẢN với nền ô nằm trên (không một-cỡ)
| Input nằm trên | variant | vì sao |
|---|---|---|
| **background** (xám nhạt) | **không variant** (`primary`, `bg-field` trắng) | trắng nổi trên nền xám |
| **card / bg-surface** (trắng) | **`secondary`** (`bg-default` xám) | xám nổi trên surface trắng |
- HeroUI `Input` default variant = `primary` (`bg-field` trắng + `shadow-field`) → bỏ prop là đủ khi trên background. `.input--secondary` = `bg-default` xám + `shadow-none` → dùng khi trên card/surface trắng (nếu để default trắng-trên-trắng sẽ blend).
- Nguyên tắc: variant **tương phản với nền nó NẰM TRÊN** (cùng họ chọn da accordion/card theo nền — [[accordion-card-surface-on-standalone-pages]]). Repo còn ~39 chỗ `variant="secondary"` áp bừa → khi đụng 1 input, hỏi "nằm trên nền gì?" rồi chỉnh.

## 4. List có search → search-row + result-count
- Thanh search lọc list = `flex flex-wrap items-center justify-between gap-3`: input TRÁI (`w-full sm:max-w-sm`) + **result-count** PHẢI (`"Tìm thấy {n} …"`, muted `body-sm`, `shrink-0`) → cân bằng + cho biết "lọc ra mấy cái". Count cạnh search CÓ NGHĨA (giữ), khác count vanity dưới list (cắt). Ref [[elements/list]] §anatomy + [[list-surface-anatomy-search-count-list-pagination]].

## 5. Textarea = `TextField` + `TextArea` (HeroUI), KHÔNG `<textarea>` thô — CHỐT 2026-06-25
- **Ô nhiều dòng (mô tả, comment, bio…) PHẢI dùng `<TextField variant=…><Label/><TextArea/></TextField>` (HeroUI)**, KHÔNG `<textarea className="bg-default/40 rounded-xl p-3 …">` tự chế. Textarea thô = **lệch** so với các `Input` cùng form: fill khác (`bg-default/40` 40% ≠ secondary `bg-default` 100% → nhạt hơn), khoảng **nhãn↔ô** khác (gap tay ≠ gap nội bộ TextField), radius/focus khác.
- `TextArea` nhận `rows`, `placeholder`, `className="resize-none"`, + `value/onChange` (controlled) HOẶC `{...register(...)}` (RHF). Variant chọn theo nền y §3 (trên modal/card → `secondary`). Canonical: `CommunityComposer`.
- Áp 2026-06-25: `ManagePinnedProjectsModal` 2 form (External/Course) đổi `<textarea bg-default/40>` → `TextField secondary + TextArea` → 4 ô đồng nhất.

## 6. Input CÓ 2 CÁCH NHẬP (dán văn bản / tải file) = `TabsCard` tabs TRÊN + field TRỰC TIẾP DƯỚI (KHÔNG bọc Card ngoài), KHÔNG field-Label
- 1 field text nhập được bằng 2 cách (dán chữ HOẶC upload file → cùng 1 `value`) → toggle = **`TabsCard`** (2 tab "Dán văn bản"/"Tải file lên"): **tabs float TRÊN, field ngay DƯỚI** (`<div className="flex flex-col gap-3"><TabsCard/>{field}</div>`). KHÔNG SegmentedControl (đây là đổi PANEL nội dung — [[single-select-among-options-use-tabs]]).
- **KHÔNG bọc field trong `<Card>` ngoài** (thầy: *"đừng bọc card ngoài"*): field nằm trong 1 surface sẵn có (modal/card cha) → bọc thêm Card = card-in-card thừa ([[concepts/card]]). `TabsCard` = CHỈ thanh tab (không có body card riêng); field (TextArea/Dropzone) đặt thẳng dưới nó. (Khác FeedTabs bọc `<Card>` vì FeedTabs nằm trên PAGE bg, cần card cho feed; ở đây nền đã là modal surface.)
- **BỎ field-`<Label>` riêng** (vd "Mô tả công việc"): tab đã nhãn cách-nhập + modal description đã nói nhập gì → Label thừa. TextArea giữ `aria-label` cho a11y. Paste = `TextField secondary + TextArea`; upload = `Dropzone` (block `reuseable/Dropzone`). File→text extract SERVER-SIDE (mutation dùng chung), ghi text vào cùng `value` + về tab paste để user review. Canonical: `CvTextOrFileInput`.

## Liên quan
- [[surface-in-surface-inner-has-border]] (input có border + fill) · [[accordion-card-surface-on-standalone-pages]] (da theo nền) · [[elements/list]] (search+count+pager) · [[gap]] (concentric radius) · [[input-affordance-needs-surface-fill]] · [[input-variant-by-surface-and-search-result-count]] (drafts gốc).
