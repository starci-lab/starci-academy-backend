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

## 7. FIELD (hiện giá trị, mở picker để ĐỔI) vs COMMAND (thực hiện hành động) — CHỐT 2026-07-06
- **Control trong 1 panel/sidebar phân loại theo Ý NGHĨA, không theo "trông có giống nút không":**
  - **FIELD** — control hiện 1 GIÁ TRỊ HIỆN TẠI, bấm vào để MỞ 1 picker/modal nhằm ĐỔI giá trị đó. → style **default/field** (`bg-field` + border + `shadow-field` + `rounded-field`, đúng §3 "không variant"). Dùng `Select`/`Select.Trigger` khi picker là dropdown-listbox, hoặc block **`InputButtonLike`** (`blocks/buttons/InputButtonLike` — "button trá hình", `Button variant="outline"` + class field 1:1: `rounded-field border-[var(--field-border)] bg-field text-field-foreground shadow-[var(--field-shadow)]`) khi picker mở MODAL/overlay khác (không phải Listbox). Canonical: `Navbar/SearchButton`.
  - **COMMAND** — control THỰC HIỆN 1 HÀNH ĐỘNG, không có "giá trị hiện tại" để hiển thị. → `Button variant="tertiary"` (`bg-default`, pill `rounded-3xl`, không border/shadow — [[elements/button]] §1).
  - **PRIMARY CTA** — 1 hành động chính duy nhất/màn → `Button variant="primary"` (accent solid, [[elements/button]] §2). Không đổi bởi luật này.
- **Câu hỏi quyết định nhanh:** control này có "GIÁ TRỊ HIỆN TẠI" để hiển thị không (đổi được giữa các lần mở app)? → CÓ = field. KHÔNG (chỉ 1 nút bấm để làm gì đó) → command.
- **Đừng dùng `Button variant="tertiary"` cho control field-like** — cả 2 "nền xám nhạt" thoạt nhìn nhưng khác border/shadow/radius; xếp cạnh `Select` thật sẽ lộ lệch, đọc "rối". Root cause hay gặp: 1 sidebar có nhiều `Select` (field) + 1 nút mở modal picker (vd chọn template/mẫu) bị lầm gắn `variant="tertiary"` vì "nó cũng là 1 nút" — SAI, nó là field.
- Áp đầu: CV editor sidebar ("Mẫu" — trước `Button variant="tertiary"`, lệch với Font/Cỡ chữ/Ngôn ngữ/AI-model đều field → đổi `InputButtonLike`; "Dán CV có sẵn"/"Chỉnh theo tin tuyển dụng" giữ `tertiary`, đúng vì là command).

## 8. Composer chat AI = 1 BOX chứa input FLAT + hàng controls BÊN TRONG (ngoại lệ có chủ đích) — 2026-06-28
- **Composer của panel chat AI = 1 BOX bounded duy nhất** (`rounded-2xl border border-default bg-surface px-3 py-2`, `focus-within:border-accent`) chứa 2 tầng: (1) ô nhập **flat** ở trên, (2) hàng controls `[model picker ▾] · flex-1 · [⚙ settings] [gửi]` ở dưới — **TẤT CẢ trong CÙNG 1 box**. KHÔNG tách "input viền riêng" + "hàng controls trần dưới" (2 khối rời). Ref: Claude.ai / Perplexity / Vercel AI Elements.
- **Ô nhập trong composer-box = `<input>`/`<textarea>` THUẦN flat** (`bg-transparent text-sm text-foreground outline-none placeholder:text-muted`), KHÔNG `TextField`/`Input` HeroUI. **Đây là NGOẠI LỆ CÓ CHỦ Ý của §1-3** (input luôn cần fill/border riêng): khi input phải hoà vào 1 box chung với controls, HeroUI Input mang viền/field-bg riêng → lồng 2 viền. Box NGOÀI lo viền + fill + `focus-within`; input BÊN TRONG phẳng. Chỉ áp cho composer-in-box; field đứng riêng vẫn theo §1-5 bình thường.
- **KHÔNG toolbar điều khiển ở ĐẦU panel chat** — model picker + settings/xoá-lịch-sử thuộc cụm composer (đáy, cạnh nút gửi), không phải hàng riêng trên cùng. Hành động phá huỷ (xoá lịch sử) → **`⚙ Cài đặt`** icon-only mở modal/in-panel-view (KHÔNG nút trần cạnh model — dễ bấm nhầm).
- Áp đầu: `ContentAiChat` — composer box (input flat + hàng model·⚙·gửi); overlay phụ (Cài đặt/Cuộc trò chuyện) mở từ TRONG popover FAB → render **IN-PANEL** (view trượt), KHÔNG `Drawer`/`Modal` body-level (tránh z-fight popover-trên-popover — `.modal__backdrop`/`.drawer__backdrop` bake `z-50` cùng layer utility, `z-[N]` tự thêm thua theo source-order). Nguyên tắc: overlay-phụ-mở-từ-popover → render in-panel, đừng cố ăn thua z-index.

## 8b. FIELD (Select / InputButtonLike / isDropdown) đặt BÊN TRONG 1 card = BORDER, BỎ shadow-field (card-in-card / surface-in-surface) — CHỐT 2026-07-06
- **Field-look control (`Select`, `InputButtonLike`, `GradeModelDropdown isDropdown` — bất kỳ trigger mang `bg-field` + `shadow-field`) khi NẰM TRONG 1 card/surface → BỎ `shadow-field`, đọc bằng BORDER thôi.** `shadow-field` là 1 nấc elevation; đặt field-có-shadow bên trong card (vốn đã là 1 surface) = **card-in-card / surface-in-surface stack elevation** → "hộp nổi trong hộp", nặng. Nested surface phân tách bằng **border**, KHÔNG cộng thêm shadow ([[surface-in-surface-inner-has-border]] · [[card-in-card-border-not-double-fill]] · [[card-global-shadow-not-border]]: top-level = shadow, nested = border).
- **Impl:** field đứng RIÊNG trên page (không nested) → giữ `shadow-field` (§3, §7 — nổi trên nền trang). Field NESTED trong card → override `shadow-none` (HeroUI `cn`/tailwind-merge dedupe `shadow-field`↔`shadow-none`, cái sau thắng — verify: Alert `cn("shadow-none", ...)` đè `shadow-surface`). Border của field (`border-[var(--field-border)]`) tự gánh delineation.
- **Câu hỏi quyết định:** field này đứng thẳng trên page bg hay lồng trong 1 card? Trên page → `shadow-field` (nổi). Trong card → `shadow-none` (border-only, card-in-card).
- Áp đầu: `MockInterviewSession` setup — `GradeModelDropdown isDropdown` (model chấm) nằm trong `LabeledCard` "Cấu hình phiên" → `className="… shadow-none …"` (border-only). (CV editor sidebar `isDropdown` đứng cạnh Select trên sidebar-surface, KHÔNG lồng trong 1 card riêng → giữ shadow-field, khớp Select.)

## 9. Text con (hint/error) BÊN TRONG `TextField` (React-Aria) PHẢI có `slot`, KHÔNG `<Typography>` trần — STRICT
- **Mọi text con trong `<TextField>` (HeroUI v3 = React-Aria) PHẢI khai `slot`** — thiếu = crash RUNTIME (*"A slot prop is required"*), KHÔNG lỗi tsc:
  - Hint (luôn hiện): `<Typography slot="description" type="body-xs" color="muted">…`.
  - Error (gated `errors.x`, field `isInvalid`): `<Typography slot="errorMessage" …>` HOẶC block **`<FieldError>{errors.x}</FieldError>`** (gọn hơn).
- **CẤM `<Typography>`/text trần làm con của `TextField`.** `<Label>`/`<Input>` là subcomponent nhận diện sẵn (khỏi slot); chỉ text PHỤ mới cần. Error gated `? … : null` → chỉ nổ khi field invalid → dễ lọt; gắn slot NGAY khi thêm hint/error.
- **Tổng quát: text con trong BẤT KỲ React-Aria component nào** (`Radio`/`RadioGroup`/`Checkbox`/`Select`/`Menu`) = `<span className="text-xs text-muted">` PLAIN (KHÔNG `<Typography>` trừ khi khai đúng `slot`) — node truyền vào slot của block-trên-React-Aria (badge/label/hint) = plain element; để Typography cho vùng NGOÀI React-Aria. Ref [[heroui-textfield-helper-error-needs-slot]].

## 10. Field kiểu URL (block editor tự-quản-state, KHÔNG RHF) = validate bằng zod, hiện lỗi khi BLUR — STRICT
- Field URL trong editor mutate-JSON-trực-tiếp (không react-hook-form) → validate bằng **zod trực tiếp**: helper `isValidOptionalUrl(v) = z.union([z.literal(""), z.string().trim().url()]).safeParse(v.trim()).success`. Lỗi CHỈ hiện khi `touched && !isValidOptionalUrl(v)` (blur-triggered, không chặn gõ); touched tự quản `useState<Set<...>>` (field đơn key theo tên, field lặp key theo `item.id`).
- Hiển thị = `TextField isInvalid` + `<FieldError>{t("…invalidUrl")}</FieldError>` (§9). KHÔNG chặn submit/autosave — chỉ tín hiệu lỗi thị giác.
- **Placeholder field URL PHẢI có scheme `https://`** (vd `https://linkedin.com/in/…`) — url() đòi scheme; placeholder bare-domain → user gõ đúng-placeholder vẫn báo lỗi = mâu thuẫn.
- **Chỉ validate field chứa URL TUYỆT ĐỐI** (linkedinUrl, credentialUrl…); field slug/username (`githubUsername`) KHÔNG validate url(). Xác nhận field thật sự là URL trước khi gắn zod. Ref [[submit-requires-valid-input-fe-disable-be-throw]] · [[disable-vs-lock-and-perrow-autosave]].

## 11. Field NGÀY = HeroUI `DatePicker`; `variant` đặt trên `DateField.Group` (KHÔNG `DatePicker` root)
- Field ngày (sinh/cấp…) = HeroUI **`DatePicker`** (`DateField` segmented + `Calendar` popover), KHÔNG `<Input>` text thô. Value ISO string (`@internationalized/date` `parseDate(str)` ↔ `date.toString()`); `maxValue={today(getLocalTimeZone())}` cho ngày-sinh.
- **`variant="secondary"` đặt trên `<DateField.Group variant="secondary">`, KHÔNG trên `<DatePicker>` root** (khác `TextField` — variant ở root). Quên → Group mặc định `primary` (bg-field trắng) → lệch sibling secondary trên cùng card. Chọn variant theo nền vẫn theo §3. Precedent: `LivestreamCalendarModal`.

## 12. Hand-roll 1 trigger giả field (Select/TextField look) PHẢI wire hover CẢ 2 đường — 2026-07-06
- Khi hand-roll 1 trigger để TRÔNG NHƯ `Select.Trigger`/field chuẩn nhưng KHÔNG dùng chính component đó (vd `DropdownTrigger` giả-Select vì cần mở custom popover) — copy className KHÔNG đủ nếu chỉ copy phần `data-[hovered=true]:` (aria-state). `.select__trigger` thật bake **`&:hover, &[data-hovered="true"]`** CÙNG 1 rule (2 đường: CSS `:hover` thật + aria state).
- **PHẢI wire CẢ 2: `hover:<class>` (CSS `:hover`) VÀ `data-[hovered=true]:<class>` (aria).** Thiếu 1 đường = silent bug — không lỗi build/lint, chỉ lộ khi so sánh trực tiếp cạnh Select thật (hover phản hồi khác/chậm hơn).
- Áp đầu: `GradeModelDropdown isDropdown` trigger — thêm `hover:bg-field-hover hover:border-[color:var(--field-border-hover)]` song song `data-[hovered=true]:...` đã có.

## 13. Popover picker (chọn 1-trong-N có search + lựa-chọn-MẶC-ĐỊNH): GHIM default trên · search NGAY DƯỚI · chỉ LIST cuộn ScrollShadow — 2026-06-30
- **Popover/dropdown "chọn 1-trong-N" có (a) 1 lựa chọn MẶC ĐỊNH/đặc biệt (Auto/Tất cả/None) + (b) ô search + (c) list dài → bố cục 3 tầng cố định:**
  1. **Default GHIM TRÊN CÙNG** — NGOÀI vùng search + scroll, luôn thấy, 1 click tới (không bị search lọc mất, không cuộn trôi). Nó KHÔNG phải "1 item trong list" → tách ra.
  2. **Ô search NGAY DƯỚI default** — search chỉ lọc LIST, KHÔNG lọc default.
  3. **List kết quả CUỘN trong `ScrollShadow`** (`hideScrollBar` + `max-h-*`, fade mép). Default + search đứng yên (ngoài ScrollShadow).
- **Ngăn 3 tầng bằng WHITESPACE `gap-3`, KHÔNG divider** (bọc `flex flex-col gap-3`) — đặc biệt **KHÔNG divider DƯỚI search** → search liền mạch chảy vào list ([[whitespace-over-dividers]]).
- **Search input = `variant="secondary"`** (popover là surface → §3, xám nổi trên mặt popover). HeroUI `SearchField` nhận `variant`.
- **Đóng popover khi chọn default:** default ghim NGOÀI listbox (react-aria) → KHÔNG tự đóng theo menu-select → phải **controlled `isOpen`** (HeroUI `Dropdown isOpen/onOpenChange`) + nút default `onClick` gọi `onSelect(...)` rồi `setIsOpen(false)`. Item trong `DropdownMenu` vẫn auto-đóng.
- **`onKeyDownCapture` chặn typeahead:** bọc search trong `<div onKeyDownCapture={e=>e.stopPropagation()}>` (KHÔNG đặt thẳng lên `SearchField` — HeroUI v3 root không nhận, lỗi type).
- **Active state của default = accent ở CHI TIẾT** (`text-accent` khi đang chọn Auto), KHÔNG tô nền cả nút ([[highlight-accent-as-detail-not-block-fill]]).
- **Phân biệt:** áp cho picker có **default đặc biệt + search + list dài**. List ngắn/không default đặc biệt → không cần tách tầng. Khác search-row của 1 LIST surface (§4, có count/pager) — đây POPOVER nhỏ, trọng tâm ghim-default + cuộn-kết-quả. Canonical: `GradeModelDropdown`. Ref [[picker-popover-pin-default-search-below-scroll-results]].

## Liên quan
- [[surface-in-surface-inner-has-border]] (input có border + fill) · [[accordion-card-surface-on-standalone-pages]] (da theo nền) · [[elements/list]] (search+count+pager) · [[gap]] (concentric radius) · [[elements/button]] (tertiary/primary) · [[when-drawer]] · [[overlay-from-popover-render-in-panel]] (overlay phụ mở từ popover) · [[heroui-textfield-helper-error-needs-slot]] (text con cần slot) · [[submit-requires-valid-input-fe-disable-be-throw]] (validate URL) · [[text-or-file-input-shared-component-presign-extract]] (2 cách nhập) · [[picker-popover-pin-default-search-below-scroll-results]] (popover picker) · [[sticky-rail-overflow-wrap-scrollshadow]] (ScrollShadow).
