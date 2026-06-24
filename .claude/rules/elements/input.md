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

## Liên quan
- [[surface-in-surface-inner-has-border]] (input có border + fill) · [[accordion-card-surface-on-standalone-pages]] (da theo nền) · [[elements/list]] (search+count+pager) · [[gap]] (concentric radius) · [[input-affordance-needs-surface-fill]] · [[input-variant-by-surface-and-search-result-count]] (drafts gốc).
