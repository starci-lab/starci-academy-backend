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
| 5 | Icon — size theo text · interaction theo ngữ nghĩa · lib phosphor mặc định | ✅ CHỐT |
| 6 | Granularity — foundational primitives · PROP thay vì component mới · **§6c BỐN TẦNG** (primitive·design·block·layout/overlay) | ✅ CHỐT |
| 7 | Press feedback — pressable lún khi nhấn (`active:scale-[0.97]`) | ✅ CHỐT |
| 8 | Loading = card THẬT + skeleton nội dung bên trong | ✅ CHỐT |
| 9 | Typography — foreground/muted + weight · đi qua Typography atom | ✅ CHỐT |
| 10 | Spacing — 1 seam = 1 chủ (padding=container · gap=parent · margin CẤM) · nhịp theo tier | ✅ CHỐT |
| 11 | Layouts & Overlays — decompose top-down theo CHỨC NĂNG, block-first | ✅ CHỐT |

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

**⛔ STRICT — Chip = TEXT-ONLY, KHÔNG icon/logo (thầy chốt 2026-07-23):** chip KHÔNG có leading glyph/logo icon (kể cả brand logo như Vimeo/YouTube). Chip nhỏ, chữ đã đủ nghĩa; icon làm rối + phá cân pill. NGOẠI LỆ DUY NHẤT: **dot color-indicator** (`DotChip` family: LanguageChip/AiCategoryChip/DifficultyChip) — đó là tín hiệu MÀU `size-3`, KHÔNG phải icon. Cần phân biệt platform/enum → dùng CHỮ (tên) hoặc dot màu, không dùng logo.

**Typography chip = `text-xs font-normal` (thầy chốt 2026-07-23):** chip là token phụ, chữ KHÔNG đậm. Override 1 CHỖ trong **`globals.css`** (`.chip { font-size: .75rem !important; font-weight: 400 !important }`) — KHÔNG gắn `text-xs font-normal` từng call-site. NGOẠI LỆ: phần cần nhấn TRONG chip (vd `value` của HighlightChip "24 Modules" = `.font-medium` trên node CON) tự thắng; chip close × là scale riêng (size-4/glyph size-3), KHÔNG dùng button-scale ElementCloseButton.

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
- **NGOẠI LỆ — caret/chevron điều hướng (`>` trailing) = `size-3` (12px) CỐ ĐỊNH** (thầy chốt 2026-07-22), KHÔNG theo text-size. Caret là affordance phụ "còn nữa / đi tiếp", nên nhỏ + chìm (muted); to bằng icon nội dung là lấn át. Neo: `SurfaceListCardItem`, pager `GroupPressableCard`.

### 5b. Interaction đặc thù THEO NGỮ NGHĨA icon (special-case)
Icon mang ý nghĩa hành động → có **micro-interaction riêng khi tương tác** (hover/press). ⚠️ **ARROW ≠ CARET** — hai thứ KHÁC nhau, đừng gộp (thầy chốt 2026-07-22):

- **CHỈ ARROW (`→`, `ArrowRight`, CTA "Xem thêm →")** → **trượt phải** khi hover: `transition-transform group-hover:translate-x-1`. Đây là icon HÀNH ĐỘNG/CTA, trượt để mời nhấn. Neo THẬT: `SeeMoreLink`.
- **CARET/CHEVRON điều hướng (`>`, `CaretRightIcon`) → KHÔNG trượt khi hover.** Caret chỉ là affordance "đi tiếp" tĩnh (list-row, pager, disclosure), giữ NGUYÊN vị trí; thêm `translate-x` cho caret là SAI. (Bài học 2026-07-22: đã lỡ cho caret `SummaryCard` trượt → sửa.)
- **Rotate / refresh / retry / sync icon** → **QUAY** khi bấm (đang xử lý → `animate-spin`; hoặc rotate on click).
- **Chevron mở/đóng (accordion, dropdown)** → **xoay 180°** khi mở: `transition-transform data-[open]:rotate-180` (đây là ROTATE, không phải trượt).
- **Owner:** micro-interaction thuộc **primitive/affordance**, consumer chỉ chọn icon; không hand-roll animation ở call-site.

### 5c. Icon lib — MẶC ĐỊNH `@phosphor-icons/react` (phosphor)
Thầy chốt 2026-07-23 (đảo lại gravity): **phosphor là lib icon chính** — gravity **quá ĐẬM** so với hệ, đã bỏ. `import { CaretRightIcon, ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react"`. **Caret điều hướng = phosphor `CaretRightIcon` `size-3` muted, không trượt.** (Đã revert mọi icon gravity 2026-07-23: ChevronRight→CaretRightIcon, ArrowRight→ArrowRightIcon, CircleCheck→CheckCircleIcon.)

### ✅ Checklist đo (§5)
- [ ] Icon cạnh text: size khớp **font-size** (xs→4 · sm→5 · base→6), không theo line-height?
- [ ] Caret/chevron điều hướng = **`size-3`** (không theo text-size), muted, dùng phosphor `CaretRightIcon`?
- [ ] **ARROW** trailing có `group-hover:translate-x-1`; **CARET** thì KHÔNG trượt (chỉ đứng yên)?
- [ ] Rotate-icon quay khi bấm? Chevron mở/đóng có `rotate-180`?
- [ ] Micro-interaction sống ở PRIMITIVE, không vá ở call-site?

---

## 6. Granularity — foundational primitives + PROP thay vì component mới — ✅ CHỐT (thầy chốt 2026-07-22)

### 6a. Foundational primitives = viên gạch NỀN
Vài primitive là NỀN của 1 họ (vd `Button`, `ButtonGroup` cho họ button; `StatusChip`, `MetaRow`…). Component cao hơn **MAY compose** chúng — hoặc không, TUỲ FIT. KHÔNG import cho-có; chỉ compose khi thật sự tái dùng logic/hình (skeleton, icon-size, layout…).

### 6a.1. Compose theo TẦNG — năng lực ở ATOM · cluster GENERIC · đừng kéo ngữ nghĩa lên nhầm lớp — ✅ CHỐT (thầy chốt 2026-07-23)
Giữ mỗi primitive **ĐÚNG tầng trừu tượng + ĐÚNG tên** của nó. Khi 1 primitive "không phục vụ được" 1 call-site, hỏi **3 câu** theo thứ tự (đừng nhảy cóc):
1. **Năng lực còn thiếu có phải của ATOM bên dưới không?** → thêm PROP cho atom (§6b), đừng nhồi lên lớp cluster. VD: `danger`/`isPending`/`isDisabled` thuộc **Button atom** (nơi SỞ HỮU mọi vai của 1 nút, §4) — KHÔNG nhồi vào `ButtonGroup`.
2. **Primitive này có đang bị opinionated quá so với tên/tier của nó không?** → làm nó **generic đúng bản chất**, đừng thêm ngữ nghĩa. VD: `ButtonGroup` = "nhóm nút" → phải là container **structure-only, agnostic** (`actions[]` + `align`, caller quyết variant/thứ tự); KHÔNG biến thành `ActionBar` semantic biết "confirm/cancel" — làm vậy **tên nói dối** + phá tier (§6c). Cần nó phục vụ dialog footer thì làm nó GENERIC hơn, không phải semantic hơn.
3. **Chỉ khi vai KHÁC HẲN** mới đẻ primitive/tên mới (§6b).
- **Compose theo tầng, KHÔNG tự vẽ lại:** `ConfirmDialog` (semantic) → compose `ButtonGroup` (structure) → compose `Button` (atom). "confirm render ButtonGroup?" = **CÓ**, nhưng vì ButtonGroup trung tính, KHÔNG vì nó biết "confirm"; còn danger/pending đi xuyên xuống Button.
- ❌ neo THẬT (bài học 2026-07-23): lỡ đề xuất **rename `ButtonGroup`→`ActionBar`** (trị triệu chứng, kéo ngữ nghĩa lên lớp cluster) → SAI. Đúng: giữ tên, làm generic, đẩy năng lực xuống atom.
- ⚠️ Trùng tên: HeroUI đã có `ButtonGroup` (segmented, `.Separator`) — port `ButtonGroup` (dãy nút spaced) import qua **relative path**, không đụng HeroUI.

### 6b. Component mới? → HỎI: "có thể thành 1 PROP của thằng sẵn có không?"
TRƯỚC khi đẻ 1 component MỚI, cân nhắc: nó có thể là **1 PROP** trên component đã có không? Chỉ tách component RIÊNG khi **composition/vai KHÁC HẲN**, không phải chỉ 1 biến thể/tính năng.
- ✅ neo THẬT (2026-07-22): skeleton → prop **`isSkeleton`** trên `Button` (KHÔNG đẻ `SkeletonButton` riêng). Time-remaining → prop `timeLeft`+`urgent` trên `ContinueCard` (không component riêng).
- ❓ cân nhắc: `FloatingActionButton` → `<Button variant="fab" iconOnly>`? `ElementCloseButton` → `<Button iconOnly>` + close-affordance? — gộp thành prop TRƯỚC khi quyết giữ riêng.
- ❌ anti: đẻ 1 component cho MỖI biến thể nhỏ → nổ số component, drift, khó bảo trì.

### 6c. BỐN TẦNG — primitive · design · block · layout/overlay — ✅ CHỐT (thầy chốt 2026-07-24, siết từ bản 2026-07-23)
Phân tier theo BẢN CHẤT, không theo "có phải card không". ⚠️ Bản 2026-07-23 chỉ có primitive-vs-block nên gọi "component mang vai nội dung" là *block*; bản này **tách rõ `design`** — thứ đó giờ là **DESIGN**, còn **BLOCK** dành cho VÙNG CHỨC NĂNG.

| Tầng | Bản chất | Test nhận biết | Neo |
|---|---|---|---|
| **PRIMITIVE** | **Hình dạng thuần, slot-AGNOSTIC** — chỉ định nghĩa khung/shape, nhét GÌ vào cũng được; tự sở hữu sizing/spacing/tone nội bộ (§4). | props là **slot trơ** (children/rows/title/frame) | `Typography` · `Button` · `TitledText` · `InlineIconLabel` · `PricePoint` · `NestedCard` · `SurfaceCard` · `PressableCard` · `CrossListCard` · `Skeleton` |
| **DESIGN** | **MỘT component mang VAI NỘI DUNG** — prop có nghĩa nội dung map tới data thật; có state của chính nó. | props là **vai nội dung có tên** (value/label · cover/title/meta · item) | `SummaryCard` (metric) · `MediaCard` (media object) · `SectionCard` (section-header + action) · `EntityResultRow` · `CourseCard` |
| **BLOCK** | **MỘT VÙNG CHỨC NĂNG** — ghép từ (block · design · primitive) và **render theo STATE** của chức năng đó. 1 chức năng = 1 block = 1 story. | phục vụ **1 chức năng người dùng** + có **bộ state riêng** (empty/loading/error/content…) | `ChatThread` · `ChatHistory` · `ChatComposer` · `ChatToolResult` · `FlashcardDeckList` |
| **LAYOUT / OVERLAY** | **Nơi GHÉP block** thành màn (page) hoặc vùng nổi (drawer/modal). KHÔNG tự vẽ chi tiết — chỉ bố trí. | chỉ compose block + bố cục; tự vẽ primitive chi tiết = **sai tầng** | trang `Flashcards` · `ContentAiChatDrawer` · `PaymentModal` |

- ⛔ **ĐỪNG ép lên block khi chỉ là primitive rời** — vùng chỉ gồm vài nguyên tử cạnh nhau, không có chức năng composite (vd header drawer = `Typography` tiêu đề + switcher chế độ) → render **primitive THẲNG**, không đẻ block giả (xem §11c).
- **Ranh SectionCard (design) vs NestedCard (primitive):** SectionCard áp header có **action** + accent (pattern nội dung) → design; NestedCard chỉ là container lồng (header-label trơ + sections agnostic) → primitive (thầy chốt 2026-07-23).
- **Lens 2 — GENERIC vs DOMAIN (thầy chốt 2026-07-23):** UI generic tái dùng MỌI feature (render slot/thông điệp bất kỳ) = **primitive**; render **nội dung DOMAIN cụ thể** hoặc compose 1 **pattern feature** = **design/block**.
  - **Feedback = PRIMITIVE** (generic: `Callout`/`EmptyState`/`SimpleEmptyState`/`ErrorState`/`ErrorPageState`/`InfoTooltip`/`ConfirmDialog` — alert/empty/error/tooltip/confirm dùng ở mọi feature). NGOẠI LỆ: `ReadinessChecklist` compose ListRow/IconTile thành pattern feature → **Block/Feedback**.
  - **Code = domain** (`CodeConsole` console-thực-thi, `IOExampleCard` input→output, `TestCaseResultGrid` kết-quả-test) → KHÔNG Primitives (thầy chốt 2026-07-23).
- **Đo được (thang 3 câu, theo thứ tự):**
  1. Props là *slot trơ* (children/rows) → **PRIMITIVE**. Là *vai nội dung có tên* (value/title/cover/item) → xuống câu 2.
  2. Nó là MỘT component hiển thị 1 mẩu dữ liệu → **DESIGN**. Nó là một VÙNG phục vụ 1 CHỨC NĂNG, có bộ state (empty/loading/error/content) → **BLOCK**.
  3. Nó chỉ GHÉP các block thành màn/vùng nổi → **LAYOUT/OVERLAY**.

### ✅ Audit lens (§6)
- [ ] Gặp component tách riêng: hỏi "gộp thành PROP của foundational (`Button`/…) được không?"
- [ ] Component mới đề xuất: đã cân nhắc prop-trên-thằng-cũ TRƯỚC chưa?
- [ ] Foundational được compose ĐÚNG chỗ (không import thừa, không hand-roll lại cái đã có)?
- [ ] **Tier đúng (§6c):** card áp đặt vai nội dung (value/title/cover/header) → `Block/Cards`, KHÔNG để ở `Primitives`?

---

## 7. Press feedback — pressable LÚN khi nhấn — ✅ CHỐT (thầy chốt 2026-07-22)

**CARD/TILE bấm được** (card/tile/option/nav-tile) phản hồi nhấn bằng **`active:scale-[0.97]`** (lún nhẹ còn 97%) + **ripple** — KHÔNG lift, KHÔNG đổi shadow. ⚠️ **KHÔNG hiệu ứng HOVER** (không `hover:bg-*` đổi màu) — giống HeroUI pressable card: hover TRƠ, phản hồi DUY NHẤT là press (thầy chốt 2026-07-23). *(CSS `:hover` vẫn chạy trên `<button disabled>` → có hover-tint thì disabled trông vẫn bấm được; bỏ hover luôn thì disabled trơ tự nhiên.)*

- **Dùng `:active` NATIVE** (element là `<button>`/`<a>` thật) — không react-aria `data-[pressed]`. ⚠️ **Tailwind v4: `scale-*` set property `scale:` (KHÔNG phải `transform:`)** → transition PHẢI liệt kê `scale`: `transition-[scale] duration-200 ease-out` (để `transition-[transform,…]` thì scale đổi tức thì → GIẬT). Kèm `motion-reduce:transition-none` · `[-webkit-tap-highlight-color:transparent]`.
- **Ripple (port HeroUI v2 `@heroui/ripple` MIT):** vòng tròn mọc từ điểm nhấn (`scale 0→2` + opacity fade) qua `framer-motion`; toạ độ từ `pointerdown` native; màu `bg-foreground`; primitive `overflow-hidden` để bo; safety-timeout clear. Chỉ biến thể press ĐƠN (không overlay). Neo: `PressableCard`.

### 7a. STRICT — pressable CARD phải qua PressableCard-contract (thầy siết 2026-07-23)
- ⛔ **CẤM hand-roll press cho card/tile:** không `<div cursor-pointer>` (còn hỏng a11y — không focus/keyboard), không card bọc `<a>`/`<button>` TRẦN (thiếu scale/ripple/no-hover), không `hover:bg-*` trên card bấm được.
- **PHẢI:** compose **`PressableCard`** — HOẶC nếu cấu trúc khác (vd `MediaCard` cover full-bleed không nhét vừa `p-3` của PressableCard) thì **adopt Y NGUYÊN contract** trên wrapper `<button>/<a>` thật: `active:scale-[0.97]` + `transition-[scale] duration-200 ease-out` + no-hover + `[-webkit-tap-highlight-color:transparent]` + disabled-inert.
- **Owner = PRIMITIVE** (§4): scale/ripple sống ở `PressableCard`; consumer compose là CÓ SẴN, không vá call-site. Neo: `SummaryCard`, tile `GroupPressableCard`, `RatingBar` (compose ✓).

### 7b. ROW ≠ CARD — row KHÔNG scale (phân biệt rõ)
Row danh sách / nav-section (`SurfaceListCardItem`, `NestedCardSection`, `ListRow`) **KHÔNG** phải card → **KHÔNG** press-scale/ripple. Affordance của row:
- **Native `<button>`/`<a>` BẮT BUỘC khi bấm được** (a11y — không `<div cursor-pointer>`); disabled → `disabled`/`aria-disabled`.
- **`hover:bg-default` (row highlight) hoặc hover-underline (nav-link) = HỢP LỆ** cho row (khác card — card cấm hover). Không tự chế scale cho row.

### ✅ Checklist đo (§7)
- [ ] Card bấm được: compose PressableCard HAY adopt contract (`active:scale-[0.97]` + `transition-[scale]` + no-hover + native button/a + disabled-inert)?
- [ ] KHÔNG `<div cursor-pointer>` / card `<a>/<button>` trần / `hover:bg-*` trên card?
- [ ] Row bấm được: native button/a (a11y) + hover-affordance OK, KHÔNG scale?
- [ ] Transition **liệt kê `scale`** (v4 scale là property riêng)?

---

## 8. Loading = CARD THẬT + skeleton nội dung bên trong — ✅ CHỐT (thầy chốt 2026-07-23)

State loading của một card KHÔNG phải là "vẽ 1 skeleton rời hình khác" — mà là **render ĐÚNG KHUNG CARD thật, chỉ thay NỘI DUNG bằng `Skeleton.*`** (giữ frame: surface/radius/shadow/padding + layout). Người dùng nhìn loading thấy y card thật đang tải, không giật khi resolve.

- **Frame = card thật** (không hand-roll khung skeleton lệch với card thật → tránh drift). Chỉ swap các node nội dung sang `Skeleton.Avatar/Typography/...` **mirror đúng shape** (nối với [[§C-fixture]]: content = ProfileCard → skeleton = mirror ProfileCard).
- **`isSkeleton` là PROP trên chính card** (§6b): consumer bật cờ, card tự vẽ frame + skeleton bên trong. KHÔNG để consumer dựng `<Skeleton>` rời ngoài card.
- Group/list loading = render đúng số tile/row bằng KHUNG THẬT (cùng `columns`/`gap`/tile-chrome), mỗi ô là card-loading. Neo: `GroupPressableCard.isSkeleton`, `MediaCard.isSkeleton`, `CourseCard.isSkeleton`, `AsyncContent` skeleton.

### ✅ Checklist đo (§8)
- [ ] Loading render KHUNG card thật (surface/radius/shadow/padding), chỉ nội dung là `Skeleton.*`?
- [ ] Skeleton MIRROR đúng shape nội dung (không generic lệch)?
- [ ] `isSkeleton` là prop trên card, không phải Skeleton rời do consumer dựng?

---

## 9. Typography — foreground/muted + weight · chữ đi qua Typography ATOM — ✅ CHỐT (thầy chốt 2026-07-23)

Chữ là một cây nhỏ: **`Typography` atom sở hữu màu + đậm**; mọi nơi diễn đạt chữ qua PROP của nó, không rải `text-*`/`font-*` className tuỳ tiện (className = "nhánh cắt" của font — đổi Typography không chảy tới). Triad: **muted · foreground · medium**.

### 9a. Màu chữ — 2 mức, chỉ khai báo khi XUỐNG cấp
`Typography` chỉ có `color: default | muted` (**không có** "foreground" — `color="foreground"` không tồn tại; `default` = token `--foreground`).
- **foreground = chữ CHÍNH** (tiêu đề, giá trị, câu đọc) = **MẶC ĐỊNH → KHÔNG khai báo.** `<Typography>` trần. ❌ Bỏ `text-foreground` + `color="default"` trên Typography (đều thừa).
- **muted = chữ PHỤ** (hint/mô tả/caption/meta/nhãn-của-giá-trị/timestamp) = **chiều DUY NHẤT cần khai báo** → `color="muted"`.
- Màu semantic (danger/success/warning/accent) = trục TRẠNG THÁI (§2), KHÔNG thuộc rule nền này.

### 9b. Đậm (weight)
- **normal = body dài / mô tả** = mặc định, KHÔNG khai báo.
- **medium = mức nhấn LÀM VIỆC**: nhãn, phần "giá trị", tiêu đề cỡ-body, từ trọng tâm → `weight="medium"`.
- **semibold / bold = heading / display / số lớn** (ngoài triad, dùng theo type heading).

### 9c. Cơ chế — SSOT qua Typography atom (đúng cây)
- Chữ đi qua **`Typography`** + prop `color`/`weight` = MỘT nguồn. ❌ CẤM rải `text-muted`/`font-medium` className trên `span`/`div` khi Typography diễn đạt được.
- className `text-*`/`font-*` **chỉ chấp nhận** khi element KHÔNG phải Typography (ép icon `[&_svg]:text-muted`, element thô không đáng bọc Typography).
- ❌ Token sai phải dọn: `text-muted-foreground` → `muted`; `text-default` → bỏ; `color="default"`/`text-foreground` trên Typography → bỏ.

### ✅ Checklist đo (§9)
- [ ] Chữ chính để MẶC ĐỊNH (không `text-foreground`/`color="default"`)?
- [ ] Chữ phụ = `color="muted"` (prop), không phải `text-muted` className rải?
- [ ] Nhấn = `weight="medium"` qua prop, không `font-medium` className?
- [ ] Không còn token sai (`text-muted-foreground`/`text-default`)?

---

## 10. Spacing — 1 seam = 1 chủ · nhịp giãn theo tier — ✅ CHỐT (thầy chốt 2026-07-24)

Spacing là một cây: khoảng ở MỖI ranh giới (seam) của `primitive → design → block → page` do ĐÚNG MỘT chủ sở hữu. Không hand-roll `gap-*` rải call-site; đổi nhịp = đổi ở 1 chủ, cả cây theo (giống PricePoint/TitledText — spacing cũng là đơn-vị-thiết-kế).

### 10a. Nguyên tắc gốc — 1 seam = 1 chủ (padding · gap · margin)
| Property | Là gì | CHỦ SỞ HỮU |
|---|---|---|
| **padding** | khoảng TRONG một surface/container tới nội dung | **CONTAINER** (card·section·field tự inset). Con NHẬN, không tự thêm. |
| **gap** | khoảng GIỮA các con anh-em (flex/grid) — 1 nguồn cho cả hàng/cột | **PARENT** (người compose). Con không biết khoảng của mình. |
| **margin** | con TỰ đẩy khoảng của mình | ⛔ **CẤM** — con tự quyết = 2 chủ cùng 1 khoảng → drift + margin-collapse. |

- **Hệ quả (trụ của cả §10):** MỌI khoảng đến từ **padding của container** HOẶC **gap của parent** — KHÔNG bao giờ margin của con. Đây chính là "spacing sở hữu bởi primitive/block".
- **Ngoại lệ margin DUY NHẤT (whitelist):** `mt-auto` (đẩy footer xuống đáy flex-col), `ml-auto`/`ms-auto` (đẩy trailing về phải), `-mx-*/-mt-*` **bleed** (kéo mép ra sát cạnh container, vd cover full-bleed). Ngoài 3 ca này, margin = SAI → chuyển sang gap của parent hoặc padding của container.
- ❌ neo: `<Chip className="mt-1">` (con tự đẩy) → SAI; đúng là parent bọc `flex flex-col gap-2`. `<Icon className="mr-2">` → SAI; đúng là row `flex items-center gap-2`.

### 10b. Ma trận seam — token theo tier (nhịp giãn dần khi lên tier)
Càng xuống primitive càng KHÍT, càng lên block/page càng RỘNG. Mỗi seam 1 token + 1 chủ:

| Seam | Token | Property | Chủ |
|---|---|---|---|
| **Trong primitive** | `flush 0` / `tight 1` + `p-3` | padding + gap nội bộ | **primitive** |
| **primitive ↔ primitive** (cụm ngang) | `related` = `gap-2` | gap | **design** (parent) |
| **primitive ↔ primitive** (hàng dọc) | `grouped` = `gap-3` | gap | **design** (parent) |
| **design ↔ design** (trong block) | `section` = `gap-6` | gap | **block** (parent) |
| **block ↔ block** (page) | `section 6` / `page 8` | gap + padding trang | **page** / PageContainer |

- **Trong primitive:** card padding = `p-3` (xem [[fe-card-padding-p3-rule]]); text-stack (TitledText) = `flush gap-0`; icon+label (InlineIconLabel) = `tight gap-1`. Primitive tự lo, KHÔNG nhận padding/margin từ ngoài.
- **related vs grouped:** `related`(gap-2) = phần tử CÙNG cụm (chip row · meta · nút cạnh nút); `grouped`(gap-3) = hàng/khối xếp trong 1 card (list rows · card content stack). Hai bậc phân biệt theo QUAN HỆ, không lẫn — cấm chọn 2 hay 3 theo cảm tính.
- **section:** vùng KHÁC nhau trong 1 block (header ↔ body ↔ footer, design ↔ design) = `gap-6`. Giữa các block ở page = `gap-6`, hoặc `gap-8` cho trang lớn.

### 10c. Thang token — CHỈ `0 · 1 · 2 · 3 · 6 · 8`
`flush(0) · tight(1) · related(2) · grouped(3) · section(6) · page(8)`. Off-scale bị XOÁ: `gap-4`→grouped(3)/section(6) tuỳ quan hệ, `gap-10/12`→page(8), fractional (0.5/1.5) đã bị lint chặn. (Thang là *từ vựng* — định nghĩa số ở `patterns/fe`; §10 định nghĩa LUẬT dùng.)

### ✅ Checklist đo (§10)
- [ ] Mọi khoảng đến từ **padding container** hoặc **gap parent** — KHÔNG margin con (trừ whitelist `mt-auto`/`ml-auto`/bleed)?
- [ ] gap đúng token theo seam: cụm ngang `gap-2` · hàng dọc `gap-3` · vùng/section `gap-6` · page `gap-8`?
- [ ] KHÔNG gap off-scale (`gap-4/5/7/9/10/11/12`)?
- [ ] Padding do container sở hữu (card `p-3`), con không tự set padding/margin?
- [ ] Primitive tự lo spacing nội bộ (flush/tight), không nhận từ ngoài?

---

## 11. Layouts & Overlays — decompose top-down theo CHỨC NĂNG, block-first — ✅ CHỐT (thầy chốt 2026-07-24)

Cây tier nối lên trên: `primitive → design → block → **layout(page)** / **overlay(modal·drawer)**`. Một layout/overlay được đọc bằng cách **bẻ theo CHỨC NĂNG**, ưu tiên tier CAO nhất — giống mở một app: nhìn ra các VÙNG chức năng trước, không xé ngay xuống nguyên tử.

### 11a. Decompose block-first: BLOCK → design → primitive
- Ở tầng layout/overlay, mỗi vùng chức năng gom về tier **CAO nhất phù hợp**: là composite chức năng → **BLOCK**; chưa tới → design; nguyên tử → primitive. **KHÔNG drill xuống primitive ở tầng đỉnh.**
- Anatomy của layout/overlay = các **BLOCK node** (vùng chức năng); mỗi block ĐÀO SÂU ở **story riêng** của nó (nội dung design/primitive nằm ở đó, không phơi ở tầng overlay).
- ✅ neo (ContentAiChatDrawer 2026-07-24): overlay = `ChatHistory` · `ChatThread` · `ChatComposer` (3 block chức năng) + header 2 primitive — KHÔNG hiện từng ChatBubble/Typography ở tầng overlay.

### 11b. CHỨC NĂNG khác nhau → BLOCK khác nhau (đừng over-group)
- Mỗi **chức năng độc lập = 1 block riêng (1 story riêng)**. CẤM gộp hai chức năng không liên quan vào một block cho "gọn".
- ✅ neo: "lịch sử hội thoại" (đổi/chọn cuộc trò chuyện) ≠ "luồng tin nhắn" (thread) → **2 block** `ChatHistory` và `ChatThread`, không nhét history vào trong ChatThread. ❌ bài học 2026-07-24: đã lỡ gộp → sai.

### 11c. ĐỪNG ép thành block khi chỉ là primitive
- Vùng chỉ gồm nguyên tử rời (vd header = tiêu đề + nút) → render **primitive THẲNG** (`Typography` + `Button`), KHÔNG bọc một "block" giả (`ChatDrawerHeader`) chỉ để có tên. Block chỉ khi có **composite/chức năng thật đáng tái dùng**.
- ❌ bài học 2026-07-24: đã lỡ bọc title+mode thành `ChatDrawerHeader` block → sai; đúng là 2 primitive tại chỗ.

### 11d. Overlay = render NỘI DUNG dạng leaf, KHÔNG render portal
- Design-system review một overlay = render **NỘI DUNG** (Header + Body content) dạng **leaf tĩnh y như block**, KHÔNG dựng portal sống (`Modal`/`Drawer` + backdrop). Portal/placement/backdrop = việc tích hợp của app, ngoài scope.
- **Drawer = surface VUÔNG** (`<div className="surface">` — sheet `bg-surface`), KHÔNG phải rounded floating card. Bỏ `Drawer.Body`/`Modal.Body` content vào một surface bounded. (Modal → dialog-surface tương ứng.)
- ✅ neo: ContentAiChatDrawer render `bg-surface shadow-surface` bo mép trong (side-drawer), không `rounded-3xl` card nổi.

### 11e. Extract vùng chức năng thành BLOCK thật + ĐỦ STATES
- Mỗi vùng chức năng ở 11a phải là **block component riêng (file riêng) + story riêng phủ ĐỦ STATES** của chức năng đó (không chỉ đánh dấu data-anat-part rồi thôi).
- ✅ neo: `ChatThread` story = rỗng+gợi ý · có tin nhắn · đang soạn · quota-error · có ChatToolResult; `ChatHistory` = switcher · loading · rỗng · danh sách · inline-rename; `ChatComposer` = idle · đang gửi · skill-menu · selection-banner.

### 11f. ⭐ LEAF chia theo CẤU TRÚC — STATE sống TRONG block (thầy chốt 2026-07-24)
Luật cốt lõi tách "leaf" khỏi "state" ở tầng layout/overlay:
- **LEAF = một CẤU TRÚC (composition) riêng biệt.** Đổi/mất một vùng, đổi nút điều hướng, mất composer… → **cấu trúc khác → LEAF khác**.
- **STATE = cùng cấu trúc, khác NỘI DUNG/tình huống** → KHÔNG đẻ leaf mới; render bằng **state bên trong block**.
- ⛔ **empty · loading/skeleton · error KHÔNG BAO GIỜ là leaf** của layout/overlay — chúng luôn là **state của block** bên trong.

✅ neo THẬT (chat AI drawer 2026-07-24) — overlay có ĐÚNG **2 leaf**:
| Leaf | Cấu trúc |
|---|---|
| **Phiên chat** | header + nút *xem lịch sử* + `ChatThread` + `ChatComposer` |
| **Lịch sử phiên chat** | header + nút *về phiên chat* + `ChatHistory` — **KHÔNG có composer** |

"Phiên rỗng" vs "có tin nhắn" **cùng cấu trúc** → **CÙNG 1 leaf**, khác nhau là **state của `ChatThread`** (rỗng · có tin · đang chat · ra nested card · skeleton · lỗi).

❌ neo SAI (bài học 2026-07-24): để `Default`/`Empty`/`Thinking` thành **3 leaf** của overlay dù cả ba cùng cấu trúc → sai; **dấu hiệu bỏ lỡ: anatomy của 3 leaf GIỐNG HỆT nhau** (cùng bộ block) — đó là smell "đây chỉ là 1 leaf". Đồng thời **thiếu hẳn leaf 'Lịch sử'** — thứ thực sự khác cấu trúc.

> **Smell test:** hai leaf có `parts` (anatomy) trùng nhau → gần như chắc chắn chúng là **1 leaf + 2 state**, gộp lại.

### ✅ Checklist đo (§11)
- [ ] Anatomy layout/overlay là **BLOCK node** (vùng chức năng), KHÔNG phơi primitive ở tầng đỉnh?
- [ ] Chức năng khác nhau tách **block khác nhau** (không over-group)?
- [ ] KHÔNG bọc block giả cho vùng chỉ-là-primitive (header = primitive thẳng)?
- [ ] Overlay render nội dung **leaf tĩnh** (không portal); drawer là **surface vuông** không rounded card?
- [ ] Mỗi block chức năng có **file + story riêng phủ đủ states**?
- [ ] **Leaf chia theo CẤU TRÚC** — empty/loading/error KHÔNG thành leaf, mà là state của block?
- [ ] Không có 2 leaf nào **trùng `parts`** (nếu trùng → gộp thành 1 leaf + state)?
