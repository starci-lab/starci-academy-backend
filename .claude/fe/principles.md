# FE Principles — thước dựng UI (canon v2)

> **MỘT file duy nhất** cho principle FE (thầy chốt 2026-07-22: *"fe/be chỉ còn patterns; riêng fe có principles.md"*). Mỗi principle = 1 §section: luật STRICT + ✅/❌ neo THẬT + **checklist đo được** (để lane `starci-fe-story-fix-*` và `starci-fe-story-audit` chấm qua).
>
> **Foundation (token màu / gap / radius / elevation) KHÔNG ở đây.** Token là *từ vựng của Primitives* → sống trong Primitives (Storybook stories) + code-style `.claude/patterns/fe`. File này chỉ **tham chiếu tên token**, không định nghĩa lại.
>
> Gom + distill từ `.claude/_legacy/fe/{foundations,principles}` (canon cũ — đừng chế) + bài học phiên 2026-07-22 (CrossListCard / CourseCard).

## Mục lục
| § | Principle | Trạng thái |
|---|---|---|
| **0** | **NƠI KẺ BẢN VẼ** — `.storybook` = bản vẽ · `src` = công trình (THẦY restructure) | ✅ CHỐT |
| 1 | Surface-in-surface — phân lớp bề mặt | ✅ CHỐT |
| 2 | Color-prominence — nổi/chìm · chip vs accent (+ §2d đồng bộ element) | ⏳ DRAFT (§2d ✅ CHỐT) |
| 3 | Reading-flow — từ trái, hạn chế giữa | ⏳ DRAFT (chờ 3 câu) |
| 4 | Element-compliance — primitive sở hữu sizing/style nội bộ | ✅ CHỐT |
| 5 | Icon — size theo text · interaction theo ngữ nghĩa · lib phosphor mặc định | ✅ CHỐT |
| 6 | Granularity — PROP thay vì component mới · **§6c NĂM TẦNG** (atom·**layout**·design·block·**screen**) | ✅ CHỐT |
| 7 | Press feedback — pressable lún khi nhấn (`active:scale-[0.97]`) | ✅ CHỐT |
| 8 | Loading = card THẬT + skeleton nội dung bên trong | ✅ CHỐT |
| 9 | Typography — foreground/muted + weight · đi qua Typography atom | ✅ CHỐT |
| 10 | Spacing — 1 seam = 1 chủ (padding=container · gap=parent · margin CẤM) · nhịp theo tier | ✅ CHỐT |
| 11 | Layouts & Overlays — decompose top-down theo CHỨC NĂNG, block-first | ✅ CHỐT |
| 12 | **ATOM LAYER** — phần tử web · root callable = `Base` (member theo hình thái thật) · **cấm children** · isSkeleton co-located · size↔icon | ✅ CHỐT |
| 13 | **LAYOUT TIER** — bộ khung (tên cũ "primitive") · namespace `X.<Member>` · slot `header/body/footer` · danh sách = `items` | ✅ CHỐT |
| 14 | **MÔ HÌNH TƯ DUY** — block=chức năng · ISOLATED · design mang WHY · **STATE 2 loại (đệ quy)** · leaf chỉ đổi theo block | ✅ CHỐT |

> ### ⚠️ ĐỔI TÊN TẦNG (2026-07-25) — đọc TOÀN BỘ canon theo ánh xạ này
> Cây 5 tầng: **`atom`(§12) → `layout`(§13) → `design` → `block` → `screen`** (§6c).
> - Chữ **"primitive"** xuất hiện ở §4/§6/§10/§11 (viết trước 2026-07-25) = tầng **LAYOUT** bây giờ — luật vẫn đúng, chỉ đổi TÊN (bỏ "primitive" vì nguyên tử giờ là `atom`).
> - §11 "Layouts & Overlays" = tầng **SCREEN**, KHÔNG phải tầng `layout` §13.
> - Năng lực nào **đẩy được xuống atom** thì đẩy (§6a.1) — khung chỉ giữ việc bố trí.

---

## 0. NƠI KẺ BẢN VẼ — `.storybook` là BẢN VẼ, `src` là CÔNG TRÌNH — ✅ CHỐT (thầy chốt 2026-07-26)
Thầy: *"ý là kẻ code, trò hiểu không? thầy design xong sẽ restructure source code"*. Đây là luật **đứng trước mọi § khác**: nó quyết định được phép GHI VÀO ĐÂU, nên vi phạm nó thì mọi principle bên dưới làm đúng cũng vô nghĩa.

| Cây | Vai | Ai được sửa |
|---|---|---|
| `starci-academy/.storybook` | **BẢN VẼ** — atom · layout · design · block · screen + story | **AGENT kẻ ở đây** |
| `starci-academy/src` | **CÔNG TRÌNH** — app thật đang chạy | **THẦY** restructure, sau khi duyệt bản vẽ |

- ⛔ **CẤM codemod `src/`** trong lane design/audit. Cấm cả "sync cho khớp", cả "đổi import cho đỡ vỡ". Muốn đụng `src` phải có câu thầy nói thẳng ở lượt đó.
- ⛔ **CẤM đòi sync.** Spec lệch app là **TRẠNG THÁI BÌNH THƯỜNG** — file port ghi sẵn *"synced to `src` later"*. Báo "spec và app là hai cây khác nhau" như một sự cố là đọc sai vai.
- ✅ **Số liệu `src` = CHỨNG CỨ, không phải việc phải làm.** Đếm trong `src` để **chọn mặc định cho bản vẽ** thì đúng (neo: `max-w-3xl` xuất hiện 72 lần ⇒ đó là default hợp lý cho container). Đếm rồi kết luận "phải sửa 111 file" là sai vai.
- ✅ Xoá/gộp component thì chỉ dọn call-site **trong `.storybook`** (kể cả `_legacy/`), để bản vẽ tự đứng vững.
- ⭐ **Gom họ · dời tầng · đặt lại category = DESIGN, thầy chốt.** Agent chỉ **kẻ bản vẽ + chỉ ra chỗ đá nhau**, không tự quyết. Neo 2026-07-26: 5 atom cùng làm "chọn 1 trong N" (`Tabs`/`ExtendedTabs`/`SegmentedToggle`/`FlexWrapButtonRadio`/`SelectableCardGroup`) — trò bày ba phương án, thầy chọn.
- ⚠️ Khi cắm **Workflow**: chặn cứng ngay trong spec của agent (*"KHÔNG đụng `…/src/`"*). Agent Sonnet chạy nền không tự suy ra ranh giới này. Neo: run `wf_8baf829a-5a1`.
- ⭐ **"Không tìm thấy real `src`" là kết luận YẾU nếu chỉ grep 1 cái tên** (thầy 2026-07-29,
  `ChallengeResultPage`: *"có trang này mà"* — báo "chưa có bản gốc" SAI, chỉ vì grep đúng tên
  component `ChallengeResultPage` mà không thử tên KHÁI NIỆM khác. Grep lại theo domain
  (`SubmissionResult`/`attempt`/`finding`) ra ngay `src/components/features/learn/Challenge/
  SubmissionResult/index.tsx`). Trước khi báo "no real src" — thử ≥2-3 cách gọi tên khác nhau
  (tên component, tên khái niệm domain, tên route/file) chứ không dừng ở 1 lần grep trượt.
- ⭐ **1 component Storybook có TÊN gần giống thật KHÔNG đồng nghĩa nó LÀ port của thật.** Neo:
  `SubmissionAttemptsDrawer` (đã có sẵn) nhìn giống `SubmissionResultHistoryDrawer` thật (cùng
  domain, tên gần giống) nhưng SAI hẳn tương tác khi đọc kỹ (2 nút "xem chi tiết"/"xem bài nộp"
  so với thật: bấm 1 dòng = chọn + đóng luôn; phân trang controlled-từ-caller so với thật: tự
  phân trang nội bộ). Phải đối chiếu HÀNH VI (ai bấm gì, xảy ra gì), không chỉ tên biến/prop
  hao hao, trước khi coi 1 component có sẵn là "đã port xong".

### ✅ Checklist đo (§0)
- [ ] Mọi file ghi trong lượt đều nằm dưới `.storybook/` (trừ khi thầy chỉ đích danh `src`)?
- [ ] Số liệu `src` chỉ xuất hiện ở mục **chứng cứ / chọn default**, không nằm trong danh sách "phải sửa"?
- [ ] Quyết định gom họ / dời tầng đã **hỏi thầy**, chưa tự thi hành?
- [ ] Spec agent của Workflow có câu chặn `src` chưa?

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

### 4a. ⛔⛔ KHÔNG tuỳ tiện đổi THANG CỠ của atom để chữa hình ở MỘT chỗ (thầy chốt 2026-07-27)
§4 nói "cần khác sizing → sửa PRIMITIVE". Mục này chặn cách hiểu ngược: **"sửa primitive" KHÔNG
phải giấy phép hạ/nâng nấc cỡ đã ghim của atom mỗi khi nó trông lệch ở một khung.**

- Atom ghim **MỘT** nấc cỡ dùng chung. Đổi nấc ấy là **đổi hình của MỌI call-site trong hệ** —
  bán kính ảnh hưởng toàn cây, để chữa đúng một chỗ người ta đang nhìn.
- Thấy atom "bự/nhỏ" ở một khung ⇒ mặc định là **khung đó đặt nó sai ngữ cảnh**, không phải cả
  hệ sai. Hỏi "chỗ này có nên chứa atom này không?" TRƯỚC khi hỏi "atom có nên nhỏ lại không?".
- Muốn đổi thật thì đó là **quyết định của thầy**, kèm rà toàn bộ consumer — không phải một
  edit tiện tay giữa lượt.
- ❌ neo (2026-07-27): chip `−33%` trong `PriceTag` trông phình (chữ `text-xs` 12px nhưng hộp
  24px, cạnh dòng chữ 14px/hộp 20px). Trò hạ `Chip.Base` từ `md`→`sm` + đắp `px-2` **cho cả hệ**,
  và phải kéo theo `SKELETON_H` `h-6`→`h-5`. Thầy chặn: *"render như Chip.Base gốc. rules không
  tuỳ tiện thay đổi size nhé"* → revert. Dấu hiệu nhận ra sớm: **một sửa đổi kéo theo phải chỉnh
  hằng số thứ hai (skeleton) mới khỏi vỡ** ⇒ đang đụng vào trục nền, không phải vá một chỗ.

### ✅ Checklist đo (§4)
- [ ] Consumer truyền icon/children TRẦN cho primitive (không kèm `size-*`/màu nội bộ)?
- [ ] Sizing phần nội bộ (vd icon chip = size-4) do CHÍNH primitive ép, không phải call-site?
- [ ] Muốn khác → sửa primitive, không vá ngoài?
- [ ] **KHÔNG** đổi nấc cỡ đã ghim của atom chỉ vì nó trông lệch ở một khung (§4a)? Atom render **y như story gốc của chính nó**?

---

## 5. Icon — size theo TEXT, interaction theo NGỮ NGHĨA — ✅ CHỐT (thầy chốt 2026-07-22)

### 5⃣0. ⭐ BỘ ICON = **`@phosphor-icons/react`**, MỘT BỘ DUY NHẤT (thầy chốt 2026-07-26)
Trước đó dùng **CẢ HAI** — atom đi gravity, block/screen đi Phosphor — nên nét và ngữ vựng icon lệch nhau ngay trong một màn. **Đó mới là cái sai**, không phải "bộ nào đẹp hơn". Một bộ, không ngoại lệ.

**Vì sao Phosphor (đã thử gravity rồi quay lại — đừng thử lại):**
1. **Có trục `weight`** → giữ được nét ĐỒNG ĐỀU QUANG HỌC giữa các cỡ (xem §5⃣0a). Gravity một-nét-cố-định nên **không có cách nào** khắc phục lệch nét ~33% giữa `size-5` và cỡ chip.
2. **Phủ nghĩa rộng hơn.** Ép sang gravity phải hạ 3 icon và cả 3 **mất nghĩa**: "ôn thẻ ghi nhớ" → `Copy` (đọc ra "sao chép") · "hạng" → `Medal` · "chồng nội dung" → `Layers`. Icon là NGHĨA, không phải trang trí.

### 5⃣0a. ⭐ WEIGHT THEO SIZE — icon nhỏ thì nét NẶNG hơn (thầy chốt 2026-07-26)
Bề dày nét **co giãn theo size**, nên cùng một weight ở hai cỡ khác nhau ra hai độ dày quang học khác nhau. Muốn nét TRÔNG bằng nhau thì phải bù bằng weight:

| Size icon | Weight | Vì sao |
|---|---|---|
| **`size-5`** (20px) | `regular` (mặc định) | cỡ chuẩn, nét vừa |
| **nhỏ hơn `size-5`** | `bold` | thu nhỏ làm nét mảnh đi → nặng weight lên để bù |

**Số đo thật** (lưới Phosphor 256): `regular` = 16 đơn vị, `bold` = 24. Ở 32px nét regular ra **2.0px**; ở 16px nét bold ra **1.5px** — gần bằng nhau. Cùng weight ở hai cỡ đó thì lệch **~33%**.

- Chỉ HAI nấc. Không mở thêm `thin`/`light`/`duotone` — nhiều nấc là mở lối cho mỗi người chọn một kiểu.
- ⚠️ Icon **cùng một hàng phải cùng KHUÔN**: ❌ neo — `KeepGoingPath` từng để `PlayIcon` (tam giác trần) cạnh `CheckCircleIcon`/`CircleIcon` (tròn) → gãy nhịp hàng. Sửa: `PlayCircleIcon`.
- ✅ Kiểu prop icon ở layout phải là **`ComponentType<SVGProps<SVGSVGElement>>`**, KHÔNG khai `Icon` của một thư viện — khai chặt là khoá cả cây vào một nhà cung cấp (neo: `AsyncContent` từng khai `icon?: PhosphorIcon`).

### 5a. Size icon — CHỌN THEO VỊ TRÍ icon: "icon=TEXT" (khớp glyph) hay "icon=DIV" (khớp Ô/control) — sửa 2026-07-29

⚠️ **Bảng cũ ở đây từng chia theo LIB (Phosphor vs Gravity) — SAI, đã bỏ.** Gravity đã dẹp hoàn
toàn từ §5⃣0 (2026-07-26, xem neo ở đó); trục quyết định thật KHÔNG PHẢI lib (chỉ còn 1 lib) mà
là **icon đang nằm ở đâu**:

| Icon nằm ở đâu | Khớp với | Vì sao |
|---|---|---|
| **TRẦN cạnh chữ chạy** (`Typography.prefixIcon`/`suffixIcon`, không Ô bọc riêng) | **font-size** (1:1, "icon=TEXT") | Icon là 1 phần của DÒNG CHỮ, phải bằng đúng glyph mới không lấn dòng. |
| **BÊN TRONG 1 Ô/control có nhịp riêng** (tab, button, chip — Ô có padding/line-height của chính nó) | **line-height mặc định của text-size đó** (to hơn font-size, "icon=DIV") | Icon phải lấp ĐỦ chiều cao Ô để không "lửng" giữa khoảng trống trên/dưới — Ô cao hơn glyph vì có line-height/padding riêng. |

**Số đo thật** (đo trực tiếp `tailwindcss/theme.css`, không phải quy ước bịa — line-height mặc
định Tailwind LUÔN đi kèm mỗi bậc `text-*`):

| text-size | font-size | line-height mặc định | icon = TEXT (1:1 font-size) | icon = DIV (khớp Ô, = line-height) |
|---|---|---|---|---|
| `text-xs` | 12px | 16px | `size-3` (12px) | `size-4` (16px) |
| `text-sm` | 14px | 20px | `size-3.5` (14px) | `size-5` (20px) |
| `text-base` | 16px | 24px | `size-4` (16px) | `size-6` (24px) |
| `text-lg` | 18px | 28px | `size-[18px]` | `size-[28px]` (chưa có ca thật xác nhận) |

- **Neo icon=TEXT**: `Typography.tsx` `ICON_CLS = { xs:size-3, sm:size-3.5, base:size-4, lg:size-[18px] }` — `prefixIcon`/`suffixIcon` luôn TRẦN cạnh chữ, đúng 1:1 font-size.
- **Neo icon=DIV**: HeroUI `Tabs.Tab` (`tabs.css:47`, `.apply ... text-sm ...`) — Ô tab cao đúng line-height 20px của `text-sm`.
- ❌ **neo BUG THẬT (2026-07-29)**: `ContentModeNav.tsx` để icon trong `Tabs.Tab` (ca icon=DIV) nhưng lấy `size-4` — nhầm sang bảng icon=TEXT của `text-xs`, trong khi tab dùng `text-sm`. Icon nhìn hụt so với hàng chữ. Sửa: `size-5`.
- ⚠️ **CÙNG 1 `text-sm` ra 2 kết quả khác nhau tuỳ ngữ cảnh** — đừng tra bảng trước khi biết icon đang trần hay trong Ô: `prefixIcon` trên Typography (icon=text) → `size-3.5` + `bold` (§5⃣0a, nhỏ hơn size-5); icon trong Tab/Button/Chip (icon=div) → `size-5` + `regular`.
- ❌ neo cũ (2026-07-25, vẫn còn giá trị dù đổi khung): lấy `size-4` cho chữ 14px khi đáng lẽ `size-3.5` (ca icon=TEXT) — đối chiếu `Typography` ICON_CLS trước khi đặt thang mới.
- ⚠️ **Bẫy specificity** khi ép icon trong HeroUI Button: HeroUI có `.button svg:not(…) { size-5 sm:size-4 }` = **(0,2,2)** > class Tailwind thường (0,1,1) → phải `[&_svg]:!size-3.5` (có `!`) và đặt trên **span bọc icon** (không trên button, kẻo đụng `<Spinner>`). Không ép thì icon âm thầm rơi về thang HeroUI mà nhìn vẫn "hợp lý".
- **Ai ép size?** — chính primitive (§4): consumer truyền icon TRẦN, primitive map text→icon (vd `StatusChip` `size-4` cho chip nhỏ; `ButtonGroup` map size nút → icon).
- **NGOẠI LỆ — caret/chevron điều hướng (`>` trailing) = `size-3` (12px) CỐ ĐỊNH** (thầy chốt 2026-07-22), KHÔNG theo text-size. Caret là affordance phụ "còn nữa / đi tiếp", nên nhỏ + chìm (muted); to bằng icon nội dung là lấn át. Neo: `SurfaceListCardItem`, pager `GroupPressableCard`.

#### 5a.1 ⭐ KHOẢNG CÁCH chữ ↔ icon trong một text-link = **`gap-2`** (thầy chốt 2026-07-26)
Text-link có mũi tên (`Link.Back` "← Back", `Link.SeeMore` "See more →", back link của `Breadcrumbs`) dùng **`gap-2` (8px)**, không phải `gap-1`. Cùng một họ mà mỗi member chừa một khoảng là drift — người đọc thấy hai thứ *gần giống nhau* thay vì *cùng một thứ*.

- ❌ neo THẬT (2026-07-26): `SeeMoreLink` để `gap-1` còn `BackLink` để `gap-2` suốt thời gian hai cái nằm ở **hai thư mục rời**. Gom vào một namespace `Link` xong mới lộ — đó chính là lý do gom.
- Đi kèm bộ ba BẮT BUỘC của một arrow-link, cả ba phải khớp nhau, thiếu một là lệch: **`gap-2`** · **cỡ mũi tên = HÀM của `size`** + **`weight="bold"`** (§5.0a — mọi nấc đều nhỏ hơn `size-5`) · **`transition-[translate]`** (§5b — không phải `transition-transform`).
- ⭐ **Atom có trục `size` thì mũi tên phải CO THEO, bằng BẢNG đặt cạnh bảng cỡ chữ** (§12d: icon là hàm của size, caller không chỉnh riêng). `text-sm` → `size-3.5` · `text-xs` → `size-3` (thang §5a, 1:1 với font-size — ca icon=TEXT vì mũi tên luôn TRẦN cạnh chữ link).
  - ❌ neo THẬT (2026-07-26): `LinkSeeMore` khoá cứng `size-3.5` cho CẢ `sm` lẫn `xs` → leaf `Size` render hai chữ khác cỡ mà **mũi tên y hệt nhau** — đúng dấu hiệu "hai ô nhìn giống nhau = LỖI ATOM" (§12g). Sửa ATOM (thêm bảng `ARROW_CLASS`), KHÔNG sửa story cho đỡ lộ. Atom một-cỡ (`Link.Back`, chỉ `text-sm`) thì hằng số `size-3.5` là đúng, không tính khoá cứng.
- **Tín hiệu hover cũng phải một kiểu**: nhãn **gạch chân** (`group-hover:underline` trên span NHÃN, không trên cả cụm, kẻo mũi tên bị gạch theo). ❌ `opacity-60` — mờ đi dễ đọc nhầm thành *đang bị vô hiệu*. Neo: `LinkSeeMore` đổi từ opacity sang underline 2026-07-26.
- ⚠️ **Ranh giới của `gap-2` này: chỉ áp khi icon gắn với ĐÚNG 1 DÒNG chữ** (text-link 1 dòng).
  Khi icon gắn với cả 1 KHỐI nhiều dòng (vd nhãn + tiêu đề 2 dòng của 1 thẻ pager) thì đó là quan
  hệ icon↔cột-nội-dung, không phải icon↔text-link — dùng `grouped` (gap-3), cùng hạng với
  Avatar↔cột-nội-dung, KHÔNG áp `gap-2` này. Neo THẬT (2026-07-29): `ContentPager.tsx` từng lấy
  nhầm `gap-2` cho caret↔khối-2-dòng — sửa lại `gap-3`.

### 5a.2 ⭐ Icon "quốc dân" — CHỈ giữ icon ai nhìn cũng hiểu ngay, bỏ icon cần liên tưởng (thầy chốt 2026-07-29)

Icon trang trí cạnh 1 fact đã tự đủ nghĩa bằng chữ (vd "2 phút đọc", "N phản hồi") **CHỈ được
giữ nếu icon đó là ký hiệu "quốc dân"** — ai nhìn cũng đọc ra ngay không cần liên tưởng (vd
`✓ check` = xong/đúng, `🔒 lock` = khoá). Icon cần một bước LIÊN TƯỞNG mới ra nghĩa (đồng hồ ⇒
thời gian, lửa ⇒ độ khó, bong bóng chat ⇒ trả lời) → **BỎ**, để chữ tự đứng.

- Phép thử: icon có tự đứng làm 1 KÝ HIỆU BÁO HIỆU (không cần đọc chữ mới hiểu) không, hay chỉ là
  minh hoạ cho chữ bên cạnh? Ký hiệu báo hiệu → giữ. Minh hoạ → bỏ.
- ❌ neo THẬT: `ContentHeader.tsx` — `ClockIcon` trước "N phút đọc", `FlameIcon` trước "N thử
  thách" → bỏ cả hai, giữ nguyên `CheckCircleIcon` trên chip "Đã đọc". `QaQuestionThread.tsx` +
  `QaConversationHeader.tsx` — `ChatCircleIcon` trước "N phản hồi" → bỏ (chữ đã tự đủ nghĩa).
- ✅ Giữ lại: `LockSimpleIcon` (`ContentRelatedList.tsx`, dòng cảnh báo "vào học để mở") — ổ khoá
  là ký hiệu trực tiếp cho trạng thái khoá, không phải liên tưởng, cùng hạng với check.
- Luật này KHÔNG áp cho icon trong `Button`/`Link` tương tác (search, refresh, play, back…) —
  đó là icon CHỨC NĂNG (áp §5b), không phải icon trang trí cho 1 fact tĩnh.

### 5a.3 ⭐ Icon MANG NGHĨA TRẠNG THÁI dùng lại `AlertStatus`, KHÔNG tự chế bảng màu riêng (thầy chốt 2026-07-29)

Icon như checkmark của 1 checklist ("bạn sẽ học được gì") hay pass/fail của 1 hàng chấm điểm
**mang Ý NGHĨA TRẠNG THÁI**, khác hẳn icon trang trí ở §5a.2 — màu của nó phải PHẢN ÁNH ĐÚNG
trạng thái (thành công/lỗi/cảnh báo), không được để mặc định theo màu label (rule cũ của
`SurfaceCard.leadingIcon`, vẫn đúng cho icon THUẦN TRANG TRÍ, chỉ sai khi icon có nghĩa trạng thái).

- **Dùng lại `AlertStatus`** (`Alert.tsx`, `"default" | "accent" | "success" | "warning" |
  "danger"`) cho MỌI prop màu-trạng-thái mới, KHÔNG tự chế 1 enum hẹp hơn (vd chỉ
  `"default"|"success"|"danger"`) — kể cả khi ca đang sửa chỉ cần đúng 1-2 giá trị. Lý do: đây
  đã là từ vựng trạng thái DUY NHẤT của hệ thống (chính `Alert.Base` gộp `FeedbackCallout` +
  `Toast` lại để tránh 2 bảng trùng nhau, 2026-07-25) — mở thêm 1 bảng hẹp hơn song song là lặp
  lại đúng lỗi mà `Alert.Base` từng được tạo ra để sửa.
- Verify bằng quét THẬT (đừng suy diễn theo cảm tính): `CheckCircleIcon` màu tường minh trong
  `.storybook/components/**` → LUÔN `text-success-soft-foreground`; `XCircleIcon` màu tường
  minh → LUÔN `text-danger-soft-foreground` (0 ca "X trung tính" tìm được — icon đen từng thấy
  đều là nút đóng/xoá — chức năng khác, áp §5b, không phải trạng thái).
- ❌ neo THẬT: `SurfaceCard.leadingIcon` (outcomes list `ContentHeader`) từng khoá cứng theo màu
  label → checkmark ra màu đen thay vì xanh. Fix: thêm `leadingIconColor?: AlertStatus` (composite
  `SurfaceCard`), mặc định `undefined` = giữ hành vi cũ (theo label), set `"success"` mới ép
  `text-success-soft-foreground`. Bảng màu (`LEADING_ICON_COLOR_CLASS`) đặt NGAY CẠNH khai báo
  prop, không lặp lại `Alert`'s `STATUS_CLOSE_TONE` (bảng đó có `hover:` cho nút ×, không hợp icon
  tĩnh) — table riêng nhưng CÙNG type `AlertStatus`, không CÙNG bảng class.

### 5b. Interaction đặc thù THEO NGỮ NGHĨA icon (special-case)
Icon mang ý nghĩa hành động → có **micro-interaction riêng khi tương tác** (hover/press). ⚠️ **ARROW ≠ CARET** — hai thứ KHÁC nhau, đừng gộp (thầy chốt 2026-07-22):

- **CHỈ ARROW (`→`, `ArrowRight`, CTA "Xem thêm →")** → **trượt phải** khi hover: `transition-[translate] group-hover:translate-x-1`. Đây là icon HÀNH ĐỘNG/CTA, trượt để mời nhấn. Neo THẬT: `Link.SeeMore` (trượt →) · `Link.Back` / `Breadcrumbs` (trượt ←).
  - ⚠️ **`transition-transform` KHÔNG ăn ở Tailwind v4** — v4 tách `translate` thành **property riêng**, không còn gộp trong `transform`. Ghi `transition-transform` thì mũi tên **nhảy giật** thay vì trượt, và không có gì báo lỗi. Phải là `transition-[translate]`. ❌ neo (2026-07-26): cả `LinkBack` lẫn `LinkSeeMore` đều dính, chỉ `Breadcrumbs` viết đúng — tức lỗi này lây bằng copy-paste, không tự lộ.
- **CARET/CHEVRON điều hướng (`>`, `CaretRightIcon`) → KHÔNG trượt khi hover.** Caret chỉ là affordance "đi tiếp" tĩnh (list-row, pager, disclosure), giữ NGUYÊN vị trí; thêm `translate-x` cho caret là SAI. (Bài học 2026-07-22: đã lỡ cho caret `SummaryCard` trượt → sửa.)
- **Rotate / refresh / retry / sync icon** → **QUAY** khi bấm (đang xử lý → `animate-spin`; hoặc rotate on click).
- **Chevron mở/đóng (accordion, dropdown)** → **xoay 180°** khi mở: `transition-transform data-[open]:rotate-180` (đây là ROTATE, không phải trượt).
- **Owner:** micro-interaction thuộc **primitive/affordance**, consumer chỉ chọn icon; không hand-roll animation ở call-site.

### 5c. ⛔ SUPERSEDED bởi §5⃣0 (2026-07-26) — Icon lib PHÂN VÙNG theo tầng — KHÔNG còn hiệu lực

> Giữ lại làm lịch sử, ĐỪNG đọc như luật đang áp dụng. §5⃣0 (ra sau §5c đúng 1 ngày) đảo ngược
> hẳn: *"Trước đó dùng CẢ HAI — atom đi gravity, block/screen đi Phosphor... Đó mới là cái sai...
> Một bộ, không ngoại lệ."* Verify code thật 2026-07-29: `grep -rl "@gravity-ui/icons"
> .storybook/components` ra **0 file** (kể cả `_legacy`) — migration đã xong, chỉ còn
> `@gravity-ui/icons` nằm trong `package.json` (chưa gỡ dependency). Bảng "2 thang theo lib" ở
> §5a cũng bị dẹp theo — trục quyết định giờ là **vị trí icon** (icon=TEXT vs icon=DIV, xem
> §5a), không phải lib.

**(Nội dung cũ, chỉ để tham khảo lịch sử — đã dẹp):** Chọn lib theo tầng — Atom layer từng dùng
`@gravity-ui/icons` (1:1 font-size), app/block dùng `@phosphor-icons/react`. Lý do gravity từng
được chọn: hợp khối HeroUI v3. Lý do bị bỏ: nét/ngữ vựng lệch nhau giữa atom và block trong cùng
1 màn (xem §5⃣0).

- Lịch sử: 2026-07-23 từng đảo gravity→phosphor cho app vì gravity **quá ĐẬM**; 2026-07-26 bỏ
  hẳn gravity khỏi atom layer luôn, về lại MỘT bộ Phosphor cho toàn hệ thống.

### ✅ Checklist đo (§5)
- [ ] Icon TRẦN cạnh chữ chạy (`prefixIcon`/`suffixIcon`): size khớp **font-size 1:1** (xs→3 · sm→3.5 · base→4), đúng ca icon=TEXT?
- [ ] Icon BÊN TRONG 1 Ô/control (tab, button, chip): size khớp **line-height của Ô đó** (xs→4 · sm→5 · base→6), đúng ca icon=DIV — KHÔNG lấy nhầm bảng icon=TEXT?
- [ ] Icon trang trí cạnh 1 fact tĩnh: có phải ký hiệu "quốc dân" (check, lock…) không cần liên tưởng? Không → bỏ icon, để chữ tự đứng (§5a.2)?
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
- ⭐ **`isPressable` = SUY RA từ `onPress`/`href`, không phải prop caller tự truyền** (thầy
  2026-07-29: "sao còn `.Pressable`, thành `isPressable` là prop hết rồi mà?"). `List.Row`
  đã làm đúng từ trước (`const isPressable = Boolean(onPress || href)`, nội bộ, không phải
  API công khai) — `SurfaceCard.Pressable` là 1 component RIÊNG song song `SurfaceCard.Base`
  suốt 1 thời gian dài, đúng loại "biến thể đáng lẽ là prop" §6b cấm. Fix: gộp
  `onPress`/`href`/`actions`/`ariaLabel`/`isSelected`/`isDisabled` thẳng vào
  `SurfaceCardBaseProps`, `Base` tự suy `isPressable` NỘI BỘ rồi chọn render
  `<div>`/`<button>`/`<a>` — xoá hẳn component `Pressable` (và export `SurfaceCardPressable`),
  `PressableGroup` (grid, vẫn giữ vì `items` = REPEATING LIST là hình khác thật, §13b) gọi
  thẳng `Base` cho từng ô thay vì gọi 1 sibling riêng.
  - ⚠️ **Bẫy khi gộp**: `isSkeleton` của `Base` (thuần) và của `Pressable` (cũ) mang 2 NGHĨA
    KHÁC NHAU — thuần chỉ shimmer phần frame SỞ HỮU (label/description), `children` chảy
    thật xuống; pressable cũ thay `children` bằng 1 MIRROR CHUNG cố định (khối icon + 2
    thanh chữ) bất kể `children` là gì. Gộp app 1 tên prop cho 2 nghĩa khác nhau phải giữ
    NHÁNH RIÊNG (`isSkeleton && Boolean(onPress||href)` → mirror cũ) — không xoá nhánh mirror
    chỉ vì "đằng nào cũng có prop isSkeleton của Base rồi", 2 consumer thật
    (`FlashcardDeckList`, `_legacy/SummaryCard`) đang sống nhờ đúng nhánh mirror đó.
  - ⭐ **`href` = LINK, `onPress` = ACTION — 2 NGÔN NGỮ HOVER khác nhau, không dùng chung 1
    hiệu ứng** (thầy 2026-07-29, bắt qua `ContentPager`: *"hover ref bài là card mà có group
    underline mà"* — vì `Base` gộp cả 2 nhánh vào chung ripple+`active:scale`, mất phân biệt).
    Trong nhánh press đơn giản (`!actions`): `const isLink = Boolean(href) && !isDisabled`.
    `isLink` → card chỉ nhận class `"group"`, KHÔNG ripple/KHÔNG `active:scale-[0.97]`, nội
    dung tự chọn `Typography.underlineOnGroupHover` để đọc như 1 link trầm (đúng convention
    `SurfaceCardListItem.hover="underline"` có từ trước). Không `isLink` (chỉ `onPress`, hành
    động tại chỗ) → giữ ripple+`active:scale-[0.97]`, không hover-hiệu-ứng-nghỉ, cú bấm là
    phản hồi duy nhất. Áp cho `ContentPager` (2 card đều `href`, thêm
    `underlineOnGroupHover` cho title).
  - ⭐ **`SurfaceCard.Base` có 2 prop className TÁCH TẦNG, đừng lẫn** (thầy 2026-07-29, bắt qua
    ảnh "quái lạ có cái card gì đằng sau nhỉ?"): `className` luôn rơi vào `<section>` NGOÀI
    CÙNG (bọc khi có `label`/`description`, KHÔNG có nền) — `contentClassName` mới rơi vào
    khung thẻ THẬT (`<a>`/`<button>`/`<div>` mang `rounded-3xl`/`shadow-surface`). Muốn RESTYLE
    mặt thẻ (đổi radius/shadow) PHẢI dùng `contentClassName`; truyền nhầm qua `className` không
    báo lỗi (cả 2 đều hợp lệ kiểu string) nhưng vô hiệu về mặt style — hoặc tệ hơn, nếu class đó
    có `shadow-*` (box-shadow vẽ được dù không có nền) sẽ lộ ra như **1 card ma nấp sau thẻ
    thật** (bo góc khác nhau ở 2 lớp, lộ 4 góc). Bug thật: `PressableGroup`'s tile builder
    (sau vụ gộp §6b ở trên) truyền `TILE_CHROME` qua `className` thay vì `contentClassName` —
    sửa lại đúng prop là hết ngay, không cần đổi giá trị class.

### 6c. NĂM TẦNG — atom · **layout** · design · block · **screen** — ✅ CHỐT (thầy ĐỔI TÊN TẦNG 2026-07-25)
> **⚠️ ĐỔI TÊN (2026-07-25):** bỏ chữ **"primitive"** (sai nghĩa — "nguyên tử" giờ là **atom**). Tầng đó tên mới = **LAYOUT** (bộ khung). Tầng ghép-block-thành-màn đổi từ "layout/overlay" → **SCREEN**. Thầy: *"atom là phần tử web; primitives là layout web, kiểu bộ khung, như PageHeader — để hình dung sự tương tác của phần tử, không mang chức năng"*.
> Bảng cũ (4 tầng) đọc theo ánh xạ: `primitive → layout` · `layout/overlay → screen`.
Phân tier theo BẢN CHẤT, không theo "có phải card không". ⚠️ Bản 2026-07-23 chỉ có primitive-vs-block nên gọi "component mang vai nội dung" là *block*; bản này **tách rõ `design`** — thứ đó giờ là **DESIGN**, còn **BLOCK** dành cho VÙNG CHỨC NĂNG.

| Tầng | Bản chất | Test nhận biết | Neo |
|---|---|---|---|
| **ATOM** (§12) | **PHẦN TỬ web** — 1 component HeroUI bọc lại, API khoá chặt, tự lo `isSkeleton`. Tầng THẤP NHẤT. | 1 phần tử người dùng chạm được (nút/ô nhập/chip/ảnh) | `Button.Base` · `Input.Text` · `Chip.Dot` · `Image.Base` · `Menu.Base` · `Typography.Sm` |
| **LAYOUT** *(tên cũ: primitive)* | **BỘ KHUNG, slot-AGNOSTIC** — sắp đặt phần tử, cho thấy chúng bố trí/tương tác ra sao; **KHÔNG mang chức năng**; tự sở hữu sizing/spacing/tone nội bộ (§4). | props là **slot trơ** (header/body/footer · items · frame) | `SurfaceCard.*` · `PageHeader` · `AsyncContent` · `ModalShell` · `ListRow` · `Callout` · `Skeleton` · `SplitWorkspace` |
| **DESIGN** | **MỘT component mang VAI NỘI DUNG** — prop có nghĩa nội dung map tới data thật; có state của chính nó. | props là **vai nội dung có tên** (value/label · cover/title/meta · item) | `SummaryCard` (metric) · `MediaCard` (media object) · `SectionCard` (section-header + action) · `EntityResultRow` · `CourseCard` |
| **BLOCK** | **MỘT VÙNG CHỨC NĂNG** — ghép từ (block · design · primitive) và **render theo STATE** của chức năng đó. 1 chức năng = 1 block = 1 story. | phục vụ **1 chức năng người dùng** + có **bộ state riêng** (empty/loading/error/content…) | `ChatThread` · `ChatHistory` · `ChatComposer` · `ChatToolResult` · `FlashcardDeckList` |
| **SCREEN** *(tên cũ: layout/overlay)* | **Nơi GHÉP block** thành màn (page) hoặc vùng nổi (drawer/modal). KHÔNG tự vẽ chi tiết — chỉ bố trí. | chỉ compose block + bố cục; tự vẽ chi tiết = **sai tầng** | trang `Flashcards` · `ContentAiChatDrawer` · `PaymentModal` |

- ⛔ **ĐỪNG ép lên block khi chỉ là primitive rời** — vùng chỉ gồm vài nguyên tử cạnh nhau, không có chức năng composite (vd header drawer = `Typography` tiêu đề + switcher chế độ) → render **primitive THẲNG**, không đẻ block giả (xem §11c).
- **Ranh SectionCard (design) vs NestedCard (primitive):** SectionCard áp header có **action** + accent (pattern nội dung) → design; NestedCard chỉ là container lồng (header-label trơ + sections agnostic) → primitive (thầy chốt 2026-07-23).
- ⭐ **1 pattern lặp lại ở ≥2 nguồn `src` ĐỘC LẬP (cùng byte-for-byte CSS) + ≥2 nơi Storybook tự
  thú "chưa có khung riêng" ⇒ đủ điều kiện dựng 1 LAYOUT KHUNG mới, không phải vá từng screen**
  (neo `SplitWorkspace`, thầy 2026-07-29: *"desktop là phải render flex chứ nhỉ?"* — bắt ra
  `ChallengePage`'s `StackH gap="section" wrap` KHÔNG BAO GIỜ thực sự stack ở mobile/tablet, vì
  `StackH` là 1 trong 2 trục CỐ ĐỊNH của `Stack.*` §13, không tự đổi trục theo bề rộng; `wrap`
  vô hiệu vì cột chính `min-w-0 flex-1` co vô hạn, không bao giờ tràn để kích hoạt). Real `src`
  có đúng shape này (`flex-col` mobile/tablet → `@app-xl:flex-row` desktop) Ở 2 NƠI KHÁC NHAU
  byte-for-byte giống hệt (`ChallengeView`, `PersonalProjectWorkspace`), và cả 2 Storybook
  screen tương ứng đều tự ghi sẵn đúng câu "best-available substitute, no dedicated frame yet"
  — 2 nguồn độc lập hội tụ là đủ bằng chứng để dựng khung MỚI (không phải thêm prop đổi-trục
  vào `Stack.*`, việc đó sẽ làm mờ đúng nghĩa "2 member = 2 trục" của nó).
  - **Số đo HARD-OWNED khi mọi nguồn thật đồng ý y hệt** (§6c "tự sở hữu sizing nội bộ") — không
    biến thành prop configurable chỉ vì "có thể sau này cần khác" (YAGNI); thêm prop CHỈ khi có
    ca thứ 3 thật sự lệch số.
  - **Khe nội dung do CALLER truyền (`main`/`aside`) KHÔNG tự badge `data-anat-part`** — đúng
    loại-3 trong luật `check-orphan-parts` ("CALLER SLOT: node bên trong thuộc về người truyền
    nó"), y hệt `Container.body` không tự badge nội dung nó bọc. Prop `showAnatomy` cũng bị bỏ
    hẳn khỏi khung nếu khung không có gì của riêng nó để gate theo cờ đó — giữ lại "cho đủ bộ"
    là 1 prop chết, tự ăn lỗi `no-unused-vars`.
- ⭐⭐ **`@container` KHÔNG BAO GIỜ đứng chung 1 element với `padding` của chính element đó**
  (thầy 2026-07-29, sau khi bắt kill+restart Storybook lộ ra `SplitWorkspace` kẹt cứng
  `flex-col` dù resize browser lên 1920px). Nguyên do đo được bằng browser thật (không phải suy
  luận CSS): `@container` đo theo **content-box** của chính element mở nó — padding trên CÙNG
  element đó bị TRỪ khỏi số đo trước khi so ngưỡng. `Container.tsx`'s bug gốc:
  `className="@container mx-auto w-full max-w-app-xl p-6"` — `size="xl"` cap ĐÚNG BẰNG token
  của `@app-xl` (80rem), nên content-box (đã trừ `p-6`=48px) KHÔNG BAO GIỜ đủ chạm `@app-xl`, ở
  BẤT KỲ viewport nào — không phải vấn đề "chưa đủ rộng", mà chính `Container` tự cắt cụt số đo
  của MÌNH trước khi con kịp hỏi. Fix: tách 2 lớp — lớp NGOÀI giữ `@container`+`max-w-*` (không
  padding, đo đủ trọn cap), lớp TRONG giữ `padding` riêng. **Luật chung**: bất kỳ frame nào tự
  mở `@container` VÀ tự có padding phải tách 2 element, không gộp — không chỉ riêng `Container`.
  - **`tsc sạch + 9/9 gate xanh + eslint 0 lỗi` KHÔNG chứng minh container-query render đúng** —
    không gate nào đo hành vi CSS thực tế lúc chạy. Fix liên quan responsive/breakpoint/
    container-query BẮT BUỘC đo bằng `getComputedStyle(...)` trên browser thật (kill+restart
    Storybook nếu cần, đừng né) trước khi báo "đã verify" — dừng ở gate tĩnh là báo sớm.
  - ⚠️ **Kiểm `document.hidden`/`window.innerWidth` TRƯỚC KHI TIN 1 số đo DOM bất thường**
    (thầy 2026-07-29, ca "vàng phải lệch" đo ra 0 width khắp nơi — tưởng bug thật, hoá ra tab
    Browser pane phía client chưa hiển thị nên không compositing frame, MỌI
    `getBoundingClientRect()` trả 0 giống hệt triệu chứng "layout vỡ"). `resize_window` vẫn ép
    được viewport ra số thật dù screenshot vẫn lỗi "pane not displayed" — dùng nó để đo tiếp
    thay vì kết luận vội có bug từ 1 lần đo đầu tiên bất thường.
  - ⭐ **`Typography` thêm `parseInlineCode`** — tách `` `code` `` (CHỈ cú pháp backtick, không
    phải markdown đầy đủ) thành `<code>` span-only, dùng cho text PHẢI nằm trong 1 element
    không nhận block-level markup (accordion title trong `<button>`/`Accordion.Trigger` — full
    `MarkdownContent` lồng vào đó là HTML không hợp lệ). Cùng công thức inline-code với
    `MarkdownContent` nhưng cỡ TƯƠNG ĐỐI (`text-[0.9em]`, không `text-sm` cố định) vì
    `Typography` chạy mọi size. Neo: `SurfaceCard.Accordion`'s trigger title (cascades mọi
    `SurfaceCardAccordion` consumer) + `ChallengeDeliverableList`'s trigger (đã tự viết
    `<span>` tay thay vì qua `Typography`, phải sửa riêng — 1 fix ở atom không tự lan tới chỗ
    lách qua atom).
- ⭐⭐ **Gộp N bản port trùng của 1 real component thành 1 — CHỌN phần tốt nhất từng bản bằng
  BẰNG CHỨNG ĐO ĐƯỢC, không giữ nguyên bản có sẵn/mới nhất** (neo `TrialEnrollBanner`, thầy
  2026-07-29: real `src`'s `TrialEnrollHook` từng bị port thành 3 block —
  `TrialEnrollNudge`/`FoundationTrialEnrollBanner`/`TrialEnrollBanner` — mỗi bản 1 quyết định
  khác nhau về description/isSkeleton/cách dựng CTA). Ví dụ quyết định thật: chọn "CTA compose
  `Button` làm child thật" thay vì `FeedbackCallout`'s `actionLabel` shorthand — không phải vì
  "nhìn gọn hơn", mà vì đọc thẳng `Feedback.tsx:157` xác nhận nút dựng từ `actionLabel` KHÔNG
  gắn `data-anat-part`, vô hình với cây deps BlockAnatomy. `LeaderboardPage.tsx` đã tự phát
  hiện đúng vấn đề "3 bản trùng" này TRƯỚC audit (ghi trong file header của chính nó khi build)
  — dấu hiệu đáng tin để bắt đầu 1 lượt gộp là chính CODE đã tự cảnh báo, không cần đợi audit.
  - ⚠️ **Build 1 leaf/state MỚI cho story thường lộ ra bug đã nằm im từ trước** — copy y nguyên
    nhánh `isSkeleton` cũ (chưa từng có leaf riêng test bằng render thật) sang bản gộp lộ ra lỗi
    HTML thật: `FeedbackCallout`'s `title`/`description` render trong `<p>`
    (`Alert.Title`/`Alert.Description` của HeroUI), còn `Typography isSkeleton` phát ra `<div>`
    — lồng `<div>` trong `<p>` là HTML không hợp lệ, React báo hydration error thật (không phải
    cảnh báo suông). Fix đúng: `FeedbackCallout` KHÔNG có `isSkeleton` riêng, nhưng atom `Alert`
    bên dưới nó ĐÃ CÓ — gọi `Alert isSkeleton` trực tiếp (tiền lệ đã có sẵn ở `CourseTeamGate.tsx`,
    đúng đoạn comment tự giải thích lý do). Đừng "copy code cũ vì nó chắc chạy được" khi chưa có
    bằng chứng nhánh đó THỰC SỰ đã render qua browser thật.
  - ⚠️ **Kill+restart server KHÔNG đủ để xoá cache HMR phía browser TAB** — 1 tab đã mở từ
    TRƯỚC lúc restart có thể tiếp tục serve nhầm 1 webpack chunk CŨ (lỗi `ReferenceError` đúng
    dấu vết bản TRƯỚC fix) dù server đã chạy bản mới. Mở TAB MỚI HOÀN TOÀN (không navigate lại
    tab cũ) mới chắc chắn đang xem đúng build mới nhất.
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
- **medium = mức nhấn LÀM VIỆC**: nhãn, phần "giá trị", tiêu đề cỡ-body, từ trọng tâm, **tên/danh
  tính** (tên tác giả bình luận, người hỏi…) → `weight="medium"`.
- **bold = heading / display / số lớn** (dùng ở cỡ heading `h1`-`h5`).
- ⚠️ **`semibold` CHỈ có nghĩa RIÊNG ở cỡ heading** (`h1`-`h5`, đi qua `HeroTypography.Heading`
  của HeroUI — thang weight ở đó khác cỡ body). **Ở cỡ body (`xs`/`sm`/`base`/`lg`), `semibold`
  GẬP về `medium`** (thầy chốt 2026-07-25) — KHÔNG phải bậc thứ 3 riêng ở body. Neo bug
  2026-07-29: luật này đã ghi sẵn trong comment `Typography.tsx` nhưng code KHÔNG thực thi —
  cả 2 nhánh render body-scale rơi `weight === "semibold"` vào `null` (mất đậm hoàn toàn) thay
  vì fold về `font-medium`, âm thầm sai ở 7 file/9 chỗ (`ContentPaywall`,
  `MindMapContinueButton`, `ModuleContinueBand`, `PersonalProjectDashboard`,
  `PersonalProjectResultScreen`, `QuizProgressPanel`, `TaskBriefBody`×3) trước khi bắt được qua
  feedback tên tác giả `ContentCommentThread` thiếu đậm. Đã vá `Typography.tsx` (2 nhánh weight
  thêm fold `semibold`→`font-medium`) — luật đúng từ đầu, chỉ thiếu 1 dòng thực thi.
- **Khi nghi ngờ dùng weight gì cho 1 vai trò mới (vd tên người) — tra quy ước NỘI BỘ đã có
  trước khi copy class của `src` thật.** Neo: `src`'s `EntityLink` bake `font-semibold` cho tên
  trong feed/activity, nhưng hệ thống Storybook đã có 98 call-site `weight="medium"` cho đúng
  vai "tên/nhãn cỡ body" (kể cả sibling `askerName` ở `CourseQaQuestionList`) — quy ước nội bộ
  đã có sẵn thắng, không bịa bậc mới để khớp 1 class riêng lẻ của `src`.

### 9a.1. Con số cạnh 1 hành động — 2 lớp câu hỏi, KHÔNG gộp chung 1 rổ "phụ" (thầy sửa lưng 2026-07-29)

Phép thử cũ (SAI, đã dùng để kết luận nhầm) chỉ hỏi 1 câu: "con số có phải LÝ DO người đọc nhìn
vào hàng không, hay chỉ là sự kiện phụ đi kèm 1 hành động khác đã là trọng tâm?" — công thức này
gộp NHẦM mọi con số đứng cạnh 1 icon/nút vào chung 1 rổ "phụ" (vd coi số lượt-react và số
lượt-xem là CÙNG loại). Thầy chỉ ra đây là 2 loại số khác nhau, cần 2 lớp câu hỏi:

1. **Con số có mang GIÁ TRỊ THÔNG TIN thật** người đọc cần cân nhắc, hay chỉ là số liệu
   nền/trivia không ảnh hưởng quyết định gì? (128 lượt reaction = bằng chứng xã hội, ảnh hưởng
   cảm nhận "nội dung có đáng đọc"; lượt xem = trivia, xem nhiều/ít không nói lên chất lượng)
2. **Con số có DÍNH LIỀN về cấu trúc với 1 control đang active không** — nếu nằm NGAY CẠNH/cùng
   1 khối với 1 nút bấm, nó phải "ăn theo" trọng lượng thị giác của nút đó (mờ đi cạnh 1 nút rõ
   ràng = lệch tông, đọc rời rạc); nếu đứng RIÊNG không gắn control nào, được phép mờ độc lập.

✅ **Neo bug đã sửa (2026-07-29)** — `ReactionButton.tsx` (cụm reaction: nút "Thích" + emoji +
số "128"): trước đây build theo `src` thật (`ReactionBar.tsx:60,79` — cả nút lẫn số đều
`xs`/`muted` khi chưa reaction) và bị đánh giá "đã đúng theo src". Thầy chốt **"src không quan
trọng"** ở case này — cụm reaction đổi hẳn theo phép thử 2 lớp trên: nút bỏ `size="sm"` (về
`md`), `variant` cố định `tertiary` (không đổi theo trạng thái reaction — khác `src`), icon
trong nút + icon cụm tóm tắt lên `size-5`, chữ trong nút + số "128" lên `text-sm` và bỏ hẳn
`color="muted"` — vì 128 dính liền cấu trúc với nút VÀ mang giá trị bằng-chứng-xã-hội thật.
`"lượt xem"` (`ContentReaction.tsx`) đứng RIÊNG, không gắn control nào, thuần trivia →
**giữ nguyên** `xs`+`muted`, KHÔNG đổi. Render + phép thử đầy đủ: `color-system.html` (8080).

### 9c. Cơ chế — SSOT qua Typography atom (đúng cây)
- Chữ đi qua **`Typography`** + prop `color`/`weight` = MỘT nguồn. ❌ CẤM rải `text-muted`/`font-medium` className trên `span`/`div` khi Typography diễn đạt được.
- className `text-*`/`font-*` **chỉ chấp nhận** khi element KHÔNG phải Typography (ép icon `[&_svg]:text-muted`, element thô không đáng bọc Typography).
- ❌ Token sai phải dọn: `text-muted-foreground` → `muted`; `text-default` → bỏ; `color="default"`/`text-foreground` trên Typography → bỏ.
- **Mở rộng 2026-07-28 — luật này áp dụng cho MỌI CSS phức tạp, không chỉ màu/đậm.** Neo:
  `ContentRelatedList` (block) từng tự viết
  `className="underline-offset-4 decoration-[var(--separator-tertiary)] group-hover:underline"`
  lên một `Typography` để mô phỏng "cả hàng hover thì title gạch chân" — đúng dạng vi phạm
  trên, chỉ là arbitrary-value/pseudo-class thay vì `text-*`/`font-*`. Sửa đúng: thêm PROP mới
  (`underlineOnGroupHover`) cho chính `Typography`, atom tự giữ chuỗi CSS bên trong nó — block
  chỉ gọi prop. **CSS phức tạp (`[...]` arbitrary value, `group-hover:`/`peer-*` pseudo-class)
  chỉ được viết ở tầng atom/frame ("layouts")/composite, không bao giờ ở block/screen.** Route
  qua 1 prop `className` CÓ SẴN ở khung KHÔNG miễn trừ luật này — khung phải sở hữu nó bằng 1
  PROP RIÊNG có tên (neo: `Stack.nested`, `frames/Stack/Stack.tsx`, 2026-07-28), không nhận hộ
  qua cổng chung — mục đích là tối thiểu code trùng + strict rules đồng bộ cho cả app.
- ⭐ **Copy className của `src` KHÔNG đủ nếu `src` đi qua component HeroUI thật — phải soi cả
  class NỀN (inherited), không chỉ chuỗi override nhìn thấy** (thầy 2026-07-29: *"sao kích
  thước underline không đều nhỉ? lấy css của Link underline của heroui mà?"*). Bug thật: chuỗi
  "quiet link" (`underline-offset-4 decoration-[var(--separator-tertiary)]`) chép từ
  `CommentItem.tsx` — nhưng `CommentItem` render qua `<Link>` THẬT của `@heroui/react`, có base
  class `.link` (`@heroui/styles/.../link.css`) bake sẵn `decoration-[1.5px]` — className ở
  call-site chỉ override offset/color, KHÔNG BAO GIỜ cần khai lại thickness vì đã có sẵn. Chép
  y hệt chuỗi className đó lên `Typography` (không phải `HeroLink`, không có class nền nào) làm
  mất `decoration-[1.5px]`, để lại `text-decoration-thickness: auto` (trình duyệt tự tính, mỏng/
  không đều). Fix: `GROUP_HOVER_UNDERLINE_CLS`/`SELF_HOVER_UNDERLINE_CLS` (`Typography.tsx`)
  thêm `decoration-[1.5px]` tường minh. **Luật chung**: khi 1 câu feedback bảo "lấy CSS của
  component HeroUI X" — phải mở CSS THẬT của X (`node_modules/@heroui/styles/...`), không chỉ
  đọc className string ở 1 call-site đã dùng X, vì call-site đó có thể đang ĂN THEO base class
  không hiện trong className.

### 9d. ⭐ Cỡ chữ (size) — LUÔN đối chiếu `src` thật, đừng đoán theo "nhìn card cần to hơn" (thầy chốt 2026-07-29)

- **`size` mặc định (không khai) = `base` (16px) = `type="body"` mặc định của HeroUI Typography.**
  Khi porting 1 component từ `src` thật, nếu `src` KHÔNG khai `type` cho 1 dòng chữ (hoặc dùng
  `<div>`/`<span>` trần không class size) → phải map về `size="base"`, KHÔNG được tự nâng lên
  `lg` "cho card có vẻ nổi bật hơn".
- **Vai trò quyết định cỡ, không phải cảm giác "cần to hơn"**: `xs`=meta/caption/timestamp/nhãn
  phụ · `sm`=nội dung CHÍNH của 1 hàng/card DÀY ĐẶC (dashboard, list) — cỡ tường minh phổ biến
  nhất hệ thống (281 call-site, quét 2026-07-29) · `base`=tiêu đề/đoạn văn ĐỘC LẬP trong khối
  rộng rãi, MẶC ĐỊNH khi porting · `lg`=nhấn mạnh THẬT SỰ, hiếm (chỉ 5 call-site Typography thật
  trong toàn hệ thống — số 26 đếm nhầm ban đầu gộp cả `size` của `Button`/`Avatar`/`Container`/
  `ModalShell`/`IconTile`, xem bài học đếm-chuỗi-không-đếm-import ở dưới).
- **Chuỗi `text-xl font-semibold` (hoặc tương đương) ở `src` thật = `size="h4"` (heading, 20px),
  KHÔNG PHẢI `size="lg"` body (18px)** — 2 thang khác nhau, dễ lẫn vì cả hai đều "to hơn sm".
  Neo: `EnrollGate` (`src`: `type="h4"`), `ContentPaywall` (`src`: `text-xl font-semibold` viết
  trần, không qua Typography) — cả 2 từng bị hạ nhầm xuống `lg`.
- ❌ **neo bug THẬT (2026-07-29), phát hiện qua 1 câu feedback rồi lan ra round-2 quét cả hệ
  thống**: `MilestoneUpNextCard` (`size="lg" weight="bold"` → đúng `size="base" weight="medium"`,
  `src` không khai `type` + `semibold` gập §9b) · `EnrollGate` (`lg`→`h4`) · `LeaderboardBoard`
  số hạng trên bục (`lg`→`base`, `src` là div trần không Typography, chỉ `font-bold`) ·
  `ContentPaywall` (`lg`→`h4`) · `VoiceHero` transcript (`lg`→`base`, `src` không khai `type`).
  5/5 sai đều là TỰ Ý NÂNG CỠ so với `src`, không có ca nào hạ nhầm — dấu hiệu bản năng chung khi
  build "card cần nổi bật hơn" mà quên verify.
- ⚠️ **Tự kiểm chứng lại chính bảng audit của mình trước khi báo xong** (bài học 2026-07-29):
  lần đầu đọc `Podium/index.tsx` nhầm dòng `type="body-sm"` (của TÊN người chơi) tưởng là của SỐ
  HẠNG — đọc lại kỹ mới thấy số hạng là 1 div trần khác, không Typography, kế thừa `base`. Trích
  đúng DÒNG, không chỉ đúng FILE.
- Bảng đầy đủ + tần suất đo thật (`xs`=151 · `sm`=281 · `base`=176 · `lg`=5 thật) + render so
  sánh: `text-size-system.html` (8080, `.artifacts/decompose/`).

**Nâng cấp 2026-07-29 (deep research ~70 file `src` thật, Explore agent) — bảng vai trò → `type`
HeroUI đầy đủ, thay cho suy diễn:**

| Vai trò | `type` thật | Neo |
|---|---|---|
| Tiêu đề card ĐỘC LẬP trong lưới | `h6` + bold | `CourseCard/index.tsx:285` |
| Tên/tiêu đề trong hàng DÀY ĐẶC (list/table) | `body-sm` + `medium` | `ListRow/index.tsx:78` · `UserCell/index.tsx:62` |
| Tên người trong hero/modal ĐỘC LẬP | `h3`/`h4` | `HeadhunterModal/index.tsx:80` |
| Số liệu/thống kê nổi bật | `h3`/`h4` + bold | `MetricCard/index.tsx:67` · `DeadlineCallout/index.tsx:57` |
| Nhãn/label | `body-xs` | `DifficultyChip/index.tsx:48` |
| Mô tả tầng 1 (dưới title) | `body-sm color="muted"` | `CourseCard/index.tsx:222` |
| Caption tầng 2 (hint dưới mô tả) | `body-xs color="muted"` | |
| Timestamp | `body-xs color="muted"` | `FeedItem/index.tsx:51` — **nhất quán TUYỆT ĐỐI**, mọi file soi đều vậy |
| Giá tiền phụ ("/tháng", giá gạch) | `body-xs` | `PricingCard/index.tsx:121` |
| Giá tiền CHÍNH | `h3`/`h4` + bold | `PricingCard/index.tsx:108` |
| ⭐ **Tiêu đề Modal** | `body` + `weight="semibold"` — **KHÔNG BAO GIỜ `h*`** | `CookieConsentModal/index.tsx:45` · `PaymentModal/index.tsx:460` — luật RIÊNG, dễ lẫn với heading nhất |

**Ví dụ ĐÚNG/SAI để tự chấm khi porting — bẫy hay gặp nhất là tiêu đề Modal:**

| ✅ / ❌ | Chữ đang port | Chọn | Vì sao |
|---|---|---|---|
| ❌ SAI (hay gặp) | Tiêu đề đầu 1 Modal, chữ to đậm | `size="h4"` | Nhìn "to đậm" ⇒ theo bản năng chọn heading — nhưng modal header trong `src` KHÔNG BAO GIỜ dùng `h*`, xem đúng ✅ bên dưới |
| ✅ ĐÚNG | Tiêu đề đầu 1 Modal, chữ to đậm | `size="base" weight="semibold"` | Neo `PaymentModal/index.tsx:460`, `CookieConsentModal/index.tsx:45` — cả 2 đều `type="body"` + `semibold`, không phải heading |
| ❌ SAI | Tên hiển thị trong 1 hàng list dày đặc | `size="base"` | Hàng list đặc thường dùng `body-sm`, không phải `base` — `base` dành cho khối RỘNG RÃI, không phải hàng chật |
| ✅ ĐÚNG | Tên hiển thị trong 1 hàng list dày đặc | `size="sm" weight="medium"` | Neo `UserCell/index.tsx:62` — `body-sm` + `medium`, đúng vai "nổi hơn xung quanh nhưng không phải heading riêng" |
| ❌ SAI | Tiêu đề card game/khoá học ĐỘC LẬP trong lưới (không phải hàng list) | `size="base"` | Card độc lập trong lưới cần nổi hơn 1 hàng list — dùng heading nhỏ nhất, không phải body |
| ✅ ĐÚNG | Tiêu đề card game/khoá học ĐỘC LẬP trong lưới | `size="h5"` (Storybook nấc gần nhất `h6` thật) `weight="bold"` | Neo `CourseCard/index.tsx:285` — `type="h6"` + bold |

**Xương sống thật của toàn app: `body-sm` (541 call-site) + `body-xs` (431)** — áp đảo tuyệt
đối. `h1`/`h2` gần như KHÔNG dùng (1 lần MỖI loại, cả hai đều là ca đặc biệt: mã lỗi trang,
skeleton) — đừng suy diễn "trang cần 1 h1", thực tế app không làm vậy.

**Weight — 4 quy tắc phân biệt rõ theo cỡ đi kèm:**
- Không khai (regular) — văn xuôi dài, hoặc đã có `color="muted"` làm điểm nhấn riêng.
- `medium` — tên/nhãn CHÍNH trong 1 hàng DÀY ĐẶC, nổi hơn xung quanh nhưng KHÔNG phải heading
  riêng. Neo: `UserCell/index.tsx:62`, `DiffViewer/index.tsx:142`.
- `semibold` — tiêu đề CẤP KHỐI (modal header, tổng tiền, verdict), luôn đi với `type="body"`
  hoặc `h3`. Neo: `PaymentModal/index.tsx:554`, `VerdictHeroCard/index.tsx:103`.
- `bold` — CHỈ đi với heading (`h1`/`h3`-`h5`), số liệu/giá/tiêu đề gây chú ý mạnh nhất trang.
  KHÔNG BAO GIỜ đi với `body-sm`/`body-xs`.

**1 chỗ KHÔNG nhất quán thật, ghi rõ không tự gộp**: tên người trong hàng bình luận —
`CommunityPostCard/index.tsx:71` (cấp 1) dùng `body-sm`, `CommunityCommentRow/index.tsx:57`
(reply lồng sâu hơn) dùng `body-xs` — quy ước "càng lồng sâu, chữ càng nhỏ dần", không phải lỗi,
nhưng cần biết ĐANG Ở ĐỘ SÂU NÀO trước khi chọn size cho 1 comment-row mới.

Render đầy đủ + so sánh trực quan: `text-size-system.html` (bản nâng cấp, 8080).
- **Neo mới (2026-07-29) — đường nối cong (thread connector) cũng đi qua atom riêng, không viết
  tay trong block.** Tính năng MỚI "nested avatar khi trả lời kiểu Facebook" (không có trong
  `src` thật) cần 1 đường viền bo góc nối 2 avatar — đóng gói thành atom
  `ThreadConnector` (`atoms/display/ThreadConnector/`, `border-l`+`border-b`+`rounded-bl-2xl`),
  CÙNG HỌ kỹ thuật với `Stack.nested` (bẻ cong thay vì đường thẳng) chứ không hand-roll lại từ
  đầu trong `ContentCommentThread`. Quy ước chung: bất kỳ "đường dẫn hướng thị giác" nào (thẳng
  hay cong) đều là 1 khả năng atom/frame có tên, không phải className rải ở block.

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

### 10b'. ⭐ Neo 2026-07-29 — "related vs tight" phải neo real-src RIÊNG từng component, không suy diễn từ tên-hình

Bảng §10b là **ước lượng bước 1** (đếm mark-vs-peer: tight = mark gắn liền 1 chủ DUY NHẤT, vd
icon+nhãn/số+đơn vị; related = ≥2 phần tử tự đứng độc lập được, chỉ đang xếp cạnh nhau — neo
`ChallengeDeliverableList.tsx:209`, `ChallengeScoreCard.tsx:94-95`) — **KHÔNG phải hằng số cố
định cho MỌI hình cùng tên**. Bài học (thầy chốt "khách quan tư duy", sau khi đưa ảnh Facebook
phản bác 1 đề xuất): đo trực tiếp GitHub Primer (`getComputedStyle`, hàng byline tên+giờ thật)
ra `gap-1`/4px — chứng minh không có 1 số đúng cho MỌI hàng byline trên toàn ngành, nó phụ
thuộc cấu trúc câu cụ thể (có động từ/dấu nối hay không).

**Luật đúng**: (1) đếm mark-vs-peer để có ước lượng → (2) nếu component có real-src riêng (ghi
trong file header "ported from…"), **LUÔN đo lại đúng file đó** và ưu tiên số đo được, dù 2
component "nhìn giống nhau" bên ngoài → (3) ví dụ ngoài ngành (Facebook, GitHub…) chỉ là DỮ
LIỆU THAM KHẢO xem ngành có hội tụ hay không, không thay được real-src của chính app.

Neo cụ thể: `ContentCommentThread` (nguồn `CommentItem.tsx`) và `QaQuestionThread` (nguồn
`QuestionRow/index.tsx`) có CÙNG hình avatar+byline+content, nhưng đo real-src ra 2 số KHÁC
nhau cho đúng 1 vị trí (byline→body): `CommentItem.tsx:99` = `gap-2`/related,
`QuestionRow/index.tsx:172` = `gap-1`/tight — cả hai ĐÚNG cho chính component của nó, không
phải 1 cái sai theo cái kia. Đừng ép 2 sibling "nhìn giống nhau" phải dùng cùng 1 số.

### 10b''. ⭐ Thuật toán hệ thống hoá gap (thầy chốt 2026-07-29 — "chưa hệ thống hoá, còn cảm tính")

Sửa đúng 1 điểm thầy chỉ không phải là hệ thống — quy trình BẮT BUỘC áp cho MỌI block, không
chỉ chỗ đang bị feedback:

1. **Vẽ cây tổ hợp.** Mọi vùng UI phân rã thành 1 cây; mỗi nút có ≥2 con là 1 **seam** cần
   quyết định gap (nút 1 con hoặc leaf → không có seam). Mỗi seam là 1 quyết định ĐỘC LẬP
   (§10a) — không suy ra seam này từ seam khác, không giả định nested phải nhỏ dần đều.
2. **Phân loại quan hệ từng seam**, hỏi TỪ TRÊN XUỐNG, dừng ở câu đầu tiên YES:
   | # | Câu hỏi | Bậc gợi ý |
   |---|---|---|
   | 1 | Xoá 1 phần tử, phần còn lại MẤT NGHĨA? (số+đơn vị, icon+nhãn) | flush/tight |
   | 2 | Phần tử CÙNG LOẠI lặp lại, không cái nào là "chủ"? (chip row) | related |
   | 3 | Phần tử KHÁC VAI nhưng cùng tạo 1 dòng nhận diện? (byline) | related (mặc định) |
   | 4 | Phần tử là NHIỀU VÙNG khác nhau trong 1 đơn vị lớn hơn? | grouped |
   | 5 | Phần tử là CÁC KHỐI chức năng riêng, tự đứng được? | section/page |
3. **Neo real-src, ghi đè heuristic** — nếu component có nguồn thật (§10b'), đo lại ĐÚNG seam
   đó, luôn ưu tiên số đo được.
4. **Áp cho MỌI seam trong cây, không chỉ seam bị feedback** — 1 điểm sai là dấu hiệu cần soát
   lại CẢ CÂY, không suy đoán "chắc chỉ chỗ đó sai".
5. **⭐ 1 chốt trước khi thấy render là TẠM, không phải chung thẩm (neo 2026-07-29,
   `IdentityContentRow`)** — thầy chốt "cả 3 seam tight" (kể cả qua `AskUserQuestion` rõ ràng),
   nhưng sau khi soi ĐÚNG render thật đó, tự sửa lại seam avatar↔cột thành `grouped` vì nhìn quá
   khít. Verify-empirically áp dụng cho CẢ quyết định gap, không chỉ cho việc đo màu/DOM — một
   con số hợp lý trên giấy vẫn phải soát lại khi đã thật sự lên màn hình.

Đã áp thử nghiệm ĐẦY ĐỦ lên `ContentCommentThread` (5/5 seam, 4 khớp sẵn + 1 đã sửa) và cross-
check độc lập lên `QaQuestionThread` (2 component khác nhau, seam "byline" ra CÙNG kết luận vì
real-src cùng `gap-2`, seam "cột nội dung" ra 2 kết luận KHÁC nhau vì real-src khác nhau thật —
bằng chứng thuật toán tổng-quát-hoá được, không áp đặt 1 số cứng theo tên-hình).

Trang review đầy đủ (thuật toán + bảng phân loại + cây áp đầy đủ + cross-check + ví dụ render +
case study before/after): `starci-academy/.artifacts/decompose/gap-system.html`.

### 10c. Thang token — CHỈ `0 · 1 · 2 · 3 · 6 · 8`
`flush(0) · tight(1) · related(2) · grouped(3) · section(6) · page(8)`. Off-scale bị XOÁ: `gap-4`→grouped(3)/section(6) tuỳ quan hệ, `gap-10/12`→page(8), fractional (0.5/1.5) đã bị lint chặn. (Thang là *từ vựng* — định nghĩa số ở `patterns/fe`; §10 định nghĩa LUẬT dùng.)

### ✅ Checklist đo (§10)
- [ ] Mọi khoảng đến từ **padding container** hoặc **gap parent** — KHÔNG margin con (trừ whitelist `mt-auto`/`ml-auto`/bleed)?
- [ ] gap đúng token theo seam: cụm ngang `gap-2` · hàng dọc `gap-3` · vùng/section `gap-6` · page `gap-8`?
- [ ] KHÔNG gap off-scale (`gap-4/5/7/9/10/11/12`)?
- [ ] Padding do container sở hữu (card `p-3`), con không tự set padding/margin?
- [ ] Primitive tự lo spacing nội bộ (flush/tight), không nhận từ ngoài?

---

## 11. SCREENS & Overlays — decompose top-down theo CHỨC NĂNG, block-first — ✅ CHỐT (thầy chốt 2026-07-24; đổi tên "Layouts"→"Screens" 2026-07-25 để không đụng tầng LAYOUT §13)

Cây tier nối lên trên: `primitive → design → block → **layout(page)** / **overlay(modal·drawer)**`. Một layout/overlay được đọc bằng cách **bẻ theo CHỨC NĂNG**, ưu tiên tier CAO nhất — giống mở một app: nhìn ra các VÙNG chức năng trước, không xé ngay xuống nguyên tử.

### 11a. Mỗi tầng CHỈ badge con TRỰC TIẾP ở TIER CAO NHẤT — mỗi node = cửa vào story riêng (⭐ áp MỌI tầng, thầy siết 2026-07-24)
Luật này KHÔNG chỉ cho overlay — áp cho **mọi component compose** (layout · overlay · block):
- Khi phơi anatomy, một component **chỉ badge con TRỰC TIẾP mà nó compose, ở TIER CAO NHẤT** — rồi **DỪNG**. Nội bộ của con đó là việc của **story riêng của con** (bấm node để đào sâu). ⛔ KHÔNG drill xuyên qua một component để badge cháu-nội của nó.
- Mỗi vùng gom về tier **CAO nhất phù hợp**: composite-chức-năng → BLOCK · component-vai-nội-dung → DESIGN · pattern-slot-agnostic → PRIMITIVE. Không hạ xuống primitive khi đã có node cao hơn ôm.
- ✅ neo (CourseContents 2026-07-24): layout badge **`PageHeader` = 1 node** — KHÔNG badge `Breadcrumb`/`HighlightChips` bên trong nó (đó là nội bộ PageHeader, đào ở story PageHeader). ❌ bài học: đã lỡ khai `PageHeader` kèm `children:[Breadcrumb, HighlightChips]` + component tự badge riêng 2 con → **drill sai tầng**, sửa: gỡ children + gỡ `data-anat-part` con.
- ✅ neo (ContentAiChatDrawer): overlay badge `ChatThread`/`ChatComposer` (block) — không phơi ChatBubble/ChatToolResult bên trong.
- **Bậc thang (mỗi tầng chỉ 1 nấc):** layout `CourseContents` → PageHeader·EnrollGate·ContinueCard… (KHÔNG breadcrumb/meta) · block `ChatThread` → ChatBubble·ChatToolResult (KHÔNG Typography/NestedCard) · block `ChatToolResult` → NestedCard·EntityResultRow·SeeMoreLink.

#### 11a.1 ⭐⭐ CƠ CHẾ giữ một-nấc: `anatPart` TRUYỀN XUỐNG, `showAnatomy` **KHÔNG** (thầy chốt 2026-07-27)
§11a nói *cái gì* được badge; mục này nói *bằng cách nào* — vì đây là chỗ luật bị phá trong im lặng.
Hai prop anatomy có **hai chủ khác nhau**, đừng truyền lẫn:

| Prop | Ai đặt | Nghĩa |
|---|---|---|
| `anatPart` | **CHA** đặt cho con | *"Trong cây của tao, mày tên là X"* → con phát MỘT node |
| `showAnatomy` | **CHÍNH component đó**, chỉ ở **story của nó** | *"Mở ruột tao ra"* → mọi part NỘI BỘ cùng phát |

- ⛔ **Cha KHÔNG bao giờ chuyền `showAnatomy={showAnatomy}` xuống con.** Chuyền = tự tay mở ruột con
  ⇒ cháu-nội rò ra thành **anh em ngang hàng** với con (DOM phẳng, panel không biết ai của ai).
- ⛔ **Story của cha KHÔNG khai `children` cho một node ĐÃ CÓ `storyId`.** Node đó là **cửa** —
  bấm vào nhảy sang story của nó, ở đó mới thấy con. Khai lồng ở đây là **chép nội bộ của con
  ra ngoài**: con đổi cấu trúc thì cây của cha nói dối, và không ai nhớ đi sửa.
- ❌ neo (`TrialConversionStrip` 2026-07-27): khai `TitledText` **kèm `children:[Title, Subtitle]`**
  + chuyền `showAnatomy` cho `TitledText`/`PriceTag`/`PhaseScarcityNote`. Hậu quả đo được trên DOM:
  16 part cho một block **7 dep** — `Typography.Amount`·`Text`×2·`Popover.Trigger`·`StatusChip`
  (ruột `PriceTag`) và `WarningCircleIcon`·`SeatCountLine`·`Separator`·`PriceRiseClause`
  (ruột `PhaseScarcityNote`) đều rò ra. Sửa = **gỡ passthrough + gỡ `children`**, KHÔNG phải đi
  khai thêm 9 node.
- 🧭 **Test một câu — "AI DỰNG ra node này?"**
  | Node do… | Khai không? |
  |---|---|
  | **CON tự dựng** trong thân nó (`TitledText` đẻ `Title`/`Subtitle`) | ❌ KHÔNG — đó là ruột con, đào ở story con |
  | **CHA tự dựng** rồi **đặt vào SLOT của con** (`ContinueCard` dựng `StatusChip` → slot `chip` của `List.Meta`) | ✅ CÓ — nó là con của CHA, DOM chỉ tình cờ lồng nó vào |
  Nói cách khác: `storyId` chặn việc chép **ruột** con ra, KHÔNG chặn khai thứ chính cha
  truyền vào. Cây phải soi đúng DOM, mà DOM thì lồng theo nơi node **đứng**, không theo nơi
  nó **sinh ra** — nên node slot vẫn nằm dưới node con trong cây, và điều đó là ĐÚNG.

### 11b. CHỨC NĂNG khác nhau → BLOCK khác nhau (đừng over-group)
- Mỗi **chức năng độc lập = 1 block riêng (1 story riêng)**. CẤM gộp hai chức năng không liên quan vào một block cho "gọn".
- ✅ neo: "lịch sử hội thoại" (đổi/chọn cuộc trò chuyện) ≠ "luồng tin nhắn" (thread) → **2 block** `ChatHistory` và `ChatThread`, không nhét history vào trong ChatThread. ❌ bài học 2026-07-24: đã lỡ gộp → sai.

### 11c. Gom-hay-không: hỏi "cụm này có LẶP thành PATTERN CÓ TÊN không?" (thầy siết 2026-07-24)
Ranh giới giữa "gom thành 1 component" và "để primitive rời" KHÔNG phải "nhiều atom hay ít atom" — mà là **cụm đó có lặp thành một pattern có tên, đáng tái dùng không**:
- **CÓ lặp thành pattern có tên → 1 COMPONENT** (dù làm từ primitive). VD: breadcrumb + tiêu đề + mô tả + meta = **`PageHeader`** (lặp gần MỌI page) → 1 node, không xé rời. Cùng lẽ: `PricePoint`/`TitledText`/`InlineIconLabel` (composite lặp → gom, §6a).
- **KHÔNG lặp, chỉ atom rời tình cờ ở đúng 1 chỗ → PRIMITIVE RỜI.** VD: header drawer chat = tiêu đề + nút chế độ (chrome riêng của 1 drawer, không lặp) → render `Typography` + `ModeSwitch` thẳng, KHÔNG bọc `ChatDrawerHeader` giả.
- **Test:** cụm này xuất hiện ở ≥2 surface như một khối có tên? → component. Chỉ ở đây, ghép cho tiện? → rời. (Nối [[feedback-semantic-unit-primitive-and-vertical-rhythm]]: composite lặp → gom.)
- ❌ bài học 2026-07-24: (a) lỡ bọc title+mode thành `ChatDrawerHeader` (không lặp) → SAI, để rời; (b) lỡ để breadcrumb/title/meta của `CourseContents` thành 3 node rời (LÀ pattern PageHeader) → SAI, gom thành 1 `PageHeader`.

### 11d. Overlay = render NỘI DUNG dạng leaf, KHÔNG render portal
- Design-system review một overlay = render **NỘI DUNG** (Header + Body content) dạng **leaf tĩnh y như block**, KHÔNG dựng portal sống (`Modal`/`Drawer` + backdrop). Portal/placement/backdrop = việc tích hợp của app, ngoài scope.
- **Drawer = surface VUÔNG** (`<div className="surface">` — sheet `bg-surface`), KHÔNG phải rounded floating card. Bỏ `Drawer.Body`/`Modal.Body` content vào một surface bounded. (Modal → dialog-surface tương ứng.)
- ✅ neo: ContentAiChatDrawer render `bg-surface shadow-surface` bo mép trong (side-drawer), không `rounded-3xl` card nổi.

### 11e. Extract vùng chức năng thành BLOCK thật + ĐỦ STATES
- Mỗi vùng chức năng ở 11a phải là **block component riêng (file riêng) + story riêng phủ ĐỦ STATES** của chức năng đó (không chỉ đánh dấu data-anat-part rồi thôi).
- ✅ neo: `ChatThread` story = rỗng+gợi ý · có tin nhắn · đang soạn · quota-error · có ChatToolResult; `ChatHistory` = switcher · loading · rỗng · danh sách · inline-rename; `ChatComposer` = idle · đang gửi · skill-menu · selection-banner.

### 11f. ⭐ LEAF chia theo CẤU TRÚC — STATE sống TRONG block (thầy chốt 2026-07-24)

> ⚠️ **PHẠM VI: từ LAYOUT trở lên.** Ở tầng **ATOM** luật NGƯỢC LẠI — **1 prop = 1 leaf** (§12g).
> Đây là chỗ hay áp nhầm nhất: xem bảng hai tầng ở đầu §12g trước khi tách leaf.

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

### 11g. ⭐ Bộ STATE chuẩn phải render ĐỦ — liệt kê TRƯỚC khi build (thầy chốt 2026-07-25: "sao thầy dặn mà thiếu/quên hoài")
"Đủ states" (§11e) KHÔNG được mơ hồ — mỗi TẦNG có **bộ state chuẩn phải render HẾT** (mỗi state 1 story). Gen happy-path (chỉ `Default` + `Loading`) rồi dừng = **sai kỷ luật**, không phải thiếu info.

| Tầng | Bộ state BẮT BUỘC (mỗi cái 1 story) |
|---|---|
| **Atom form-control** (Input.* · Select.* · Choice.*) — atom TỰ mang label/error (§12e), KHÔNG còn tầng Field riêng | `Default`(trần) · `WithLabel` · `Required`(*) · `Filled`/`Selected`/`Checked` · **`Disabled`** · **`Error`**(nhãn + message + viền) · `Loading`(skeleton) |
| **Async/interactive block** | `empty`(+CTA) · `loading`/skeleton · **`error`** (chung + domain) · `content`(biến thể) · `pending`/streaming |

- Trước khi code: **VIẾT RA bộ state** → build HẾT → **self-critique + grep đếm `export const`** đối chiếu bảng trên, RỒI mới báo xong.
- ⚠️ Giao **WORKFLOW/agent**: spec PHẢI **liệt kê đủ bộ state trong prompt** — đừng ghi "Default + Loading" (agent build thiếu y hệt).
- ❌ neo (2026-07-25): dựng 17 form atom mà story chỉ `Default`+`Loading`; thầy phải chỉ "thiếu Filled/Disabled/Invalid" → **lỗi enumerate kỷ luật** (xem memory `feedback-enumerate-full-state-set-before-gen`).

### ✅ Checklist đo (§11)
- [ ] Anatomy layout/overlay là **BLOCK node** (vùng chức năng), KHÔNG phơi primitive ở tầng đỉnh?
- [ ] KHÔNG chỗ nào chuyền `showAnatomy={showAnatomy}` xuống con, và KHÔNG node nào vừa có `storyId` vừa có `children` (§11a.1)?
- [ ] Chức năng khác nhau tách **block khác nhau** (không over-group)?
- [ ] KHÔNG bọc block giả cho vùng chỉ-là-primitive (header = primitive thẳng)?
- [ ] Overlay render nội dung **leaf tĩnh** (không portal); drawer là **surface vuông** không rounded card?
- [ ] Mỗi block chức năng có **file + story riêng phủ đủ states**?
- [ ] **Leaf chia theo CẤU TRÚC** — empty/loading/error KHÔNG thành leaf, mà là state của block?
- [ ] Không có 2 leaf nào **trùng `parts`** (nếu trùng → gộp thành 1 leaf + state)?
- [ ] Render **ĐỦ bộ state chuẩn** của tầng (§11g: atom form = Default/Filled/Disabled/Invalid/Loading · field = +WithHint/Required/Error · block = empty/loading/error/content/pending)? **grep đếm `export const` khớp bảng**?

---

## 12. ATOM LAYER — PHẦN TỬ web, bọc HeroUI, API khoá chặt — ✅ CHỐT (thầy chốt 2026-07-25)
Tầng thấp nhất của cây (dưới tầng `layout` §13). **Atom = MỘT component HeroUI được bọc lại** với API thu hẹp; primitive/design/block compose atom thay vì gọi HeroUI trực tiếp. Sống ở `.storybook/components/atoms/<cat>/<Atom>/`, story `Atoms/<Cat>/<Family>/<Family>.<Member>`.

### 12a. ⭐ `Base` = mặc định GỌI ĐƯỢC — member đặt theo HÌNH THÁI THẬT (thầy sửa 2026-07-25)
Root export **gọi thẳng được** (`<Menu …/>`), và chính nó *là* `Base` — kỹ thuật `Object.assign(MenuBase, {…})`. **KHÔNG bắt buộc** có member `Base`: atom một hình thái thì thôi, đừng đẻ `{ Base: X }` rỗng cho đủ luật. Member CHỈ mở khi có **hình thái/kiểu khác thật sự**, không theo biến thể thị giác (biến thể = PROP, §6b).
- Neo CÓ member (hình thái thật): `Chip {Base, Dot}` · `Button {Base, Icon, Group}` · `Input {Text, Textarea, Number, Date…}` · `Typography {Xs, Sm, Base, Lg}` · `Progress {Bar, Circle, Meter}`.
- Neo KHÔNG cần member: `Menu` · `UserCell` · `Tooltip` · `Image` — root callable là đủ. `.Base` còn lại chỉ là **alias tuỳ chọn** (được phép giữ cho call-site cũ, không phải nghĩa vụ).
- Vẫn giữ: root phải là **callable-namespace**, không phải object khai báo trần mất khả năng gọi.
- 🕰️ Ghi chú lịch sử: neo 2026-07-25 *"`Menu`/`Popover`/`Tabs`/`Toast` export trần → phải là `Menu.Base`"* đã **THU HỒI** — đó là ép namespace rỗng, chính cái luật này bỏ.

### 12b. ⭐⭐ CẤM `children` — mọi thứ đi bằng PROP DỮ LIỆU
Consumer **không được truyền structure**. children là NHÃN → prop `label`/`triggerLabel`; children là DANH SÁCH con → **`items`/`options` dữ liệu**, atom tự dựng member con.
- Neo: `Button.Group items={[{key,label?,icon?,variant?,…}]}` (item có `label` → dựng `Button.Base`, không có → `Button.Icon`) · `Select options` · `Menu sections` · `Choice.RadioGroup options`.
- ⚠️ **NGOẠI LỆ CÓ TÊN — atom-WRAPPER**: giữ `children` **khi và chỉ khi BUỘC PHẢI bọc phần tử khác** — `Tooltip.Base` (bọc trigger bất kỳ), `Badge.Base` (neo lên anchor bất kỳ). Phải **ghi lý do trong doc header**. Atom khác cấm tuyệt đối.
- ✅ VẪN cho `ReactNode` ở prop **THÂN nội dung** (`content`/`action`/`title`/`label`/`hint`/`errorMessage`) — chỉ cấm `children`.
- ❌ neo: `<Button.Group><Button.Base/>…</Button.Group>` → sai; phải `items={[…]}`.

### 12c. ⭐⭐ `isSkeleton` CO-LOCATED — CHỦ CỦA HÌNH LÀ CHỦ CỦA SKELETON, ở MỌI TẦNG (thầy chốt 2026-07-25)
**Component nào sở hữu HÌNH thì sở hữu SKELETON của hình đó** — atom, design, block, layout, screen, không trừ tầng nào. Tự vẽ bằng `HeroSkeleton` đúng hộp/size của chính mình. Cluster truyền `isSkeleton` xuống → mỗi item tự mirror (giữ footprint, không nhảy layout, §8).

**KHÔNG có component skeleton dùng chung.** Compound `Skeleton.*` (29 member soi gương từng component) đã **XOÁ HẲN 2026-07-25** — nó là bản sao thứ hai của mọi hình, nên luôn trôi khỏi bản gốc.
- ❌ neo trôi có thật: `Skeleton.Accordion` vẽ **dư một ô caret** mà `TruthList` thật đã bỏ Indicator — không ai phát hiện vì hình loading sống ngoài chủ.
- Viên gạch KHÔNG phải của nhà: dùng thẳng `Skeleton as HeroSkeleton` của HeroUI. Không bọc lại.

**KHUNG KHÔNG CÓ SKELETON** (thầy chốt: *"Card đâu có skeleton?"*). Container render **THẬT** — giữ nguyên `rounded-3xl` + `bg-surface` + shadow + separator + gap — chỉ **node NỘI DUNG** mới thành gạch. Bịa "hình thẻ giả" là sai: thẻ vẫn là thẻ, chỉ ruột nó chưa có chữ.

**Nội dung là OPTIONAL khi `isSkeleton`.** Prop nội dung (`text`/`label`/`value`) ép bằng union chứ không hạ xuống optional đại trà — giữ lưới an toàn §12b:
```ts
type XProps = XOwnProps &
    ({ isSkeleton: true; text?: ReactNode } | { isSkeleton?: false; text: ReactNode })
```
Đã áp: `Typography` · `Chip.Base` · `Button.Base` · `Input.*` · `Progress.Meter` ·
`MarkdownContent` (neo 2026-07-29: thầy bắt 1 call-site (`MockInterviewScorecard`) giả skeleton
bằng `Typography isSkeleton` thay vì `MarkdownContent` tự có — "sao không pass isSkeleton vào
MarkdownContent luôn?"; thêm thẳng vào atom, call-site chỉ còn `<MarkdownContent isSkeleton />`).

⭐⭐ **Quét chủ động "giai đoạn 2" (2026-07-29)** — thầy: *"kiếm chỗ nào không có isSkeleton rồi
fix... đừng để thầy feedback kiểu này"*. Quét TOÀN `.storybook/components/**` (246 file) →
77 ứng viên (không có `isSkeleton`, không phải re-export thuần) → phân loại genuine gap vs
exempt → **24 gap thật**, đã thêm union `isSkeleton` (§12b) + shimmer đúng khuôn (§12g.0) +
leaf `Skeleton` trong story (§12g.0a) cho cả 24: `CoverImage` · `HighlightChip` ·
`KeyValue.Row`/`.List` · `Page.Header` · `CourseProgressBar` · `Legend` · `MetricCard` ·
`ProgressMeter` · `ProgressRing` · `SegmentBar` · `StatPair` · `StatRibbon` · `FlowDiagram` ·
`RichText` · `PhaseScarcityNote` · `QaMessageBubble` · `WorkSessionHeader` ·
`AiQuotaSubscriptionPanel` · `QuizRecapList` · `ContentModal` · `PDFView` ·
`PlaygroundConnectSheet` · `PlaygroundStepGuide` · `E2eResultDrawer`. Chi tiết per-file (khuôn
shimmer, quyết định union vs độc lập, chuyền cờ xuống con theo §12g.0 mục 3) ghi ở
`steps/13-feedback-anatomy-registry.md` §2r.

- ⚠️ Nhánh `isSkeleton` phải xét **TRƯỚC** mọi nhánh rẽ hình. ❌ neo: `Typography` để check dưới nhánh heading → `size="h3" isSkeleton` render heading RỖNG, tsc/eslint không bắt.
- ⚠️ **Nếu component có HOOK thật (`useState`/`useMemo`/`useRef`…), nhánh `isSkeleton` phải nằm SAU khi mọi hook đã gọi** — early-return trước 1 hook là vi phạm Rules of Hooks (hook bị gọi có điều kiện), tsc/eslint không luôn bắt được ngay. Khác với component không hook (Typography — "trước mọi nhánh rẽ hình" chỉ cần đứng đầu hàm); có hook thì "đầu tiên sau khi khai hook xong", không phải "đầu hàm". Neo: `MarkdownContent.tsx` (2026-07-29) — tự đặt sai 2 lần liên tiếp (trước cả `useRef`/`useMemo`, rồi vẫn còn 1 `useMemo` kẹt sau nhánh) trước khi sửa đúng.

### 12d. ⭐ `variant` và `size` là HAI TRỤC ĐỘC LẬP — icon là HÀM của `size`
`variant` = **ý nghĩa** (primary/danger…) · `size` = **tỉ lệ** (box + font + icon). **KHÔNG có prop icon-size** — atom tự suy từ `size` (§4 ownership). Naming size map thẳng HeroUI: `sm · md · lg` (md default). Cluster đặt `size` ở **CẤP CỤM** (hàng nút luôn đồng cỡ), item chỉ mang vai trò/hành vi.

### 12e. Form atom TỰ MANG label/hint/errorMessage/required — KHÔNG có tầng Field riêng
Thầy chốt 2026-07-25: **xoá `Field.*` primitive**; `Input.*`/`Select.*`/`Choice.*` tự mang `label` · `hint` · `errorMessage` · `isRequired` qua scaffold nội bộ **`FieldFrame`** (`atoms/forms/_field/`, self-contained chỉ HeroUI — atom là tầng thấp nhất, KHÔNG import `blocks/`). Bỏ hết 4 prop → atom trở lại ô TRẦN.
- `errorMessage` set → control `isInvalid` (viền lỗi) + dòng đỏ. Story `Error` phải hiện **ĐỦ nhãn + dòng lỗi + viền** (❌ neo: chỉ có viền → thầy bắt).
- Anatomy: FieldFrame badge `Label`/`Description`/`Error`; control con tự badge `Field`/`Skeleton` — **không** badge wrapper Control (tránh nest 2 tầng, §11a).
- **a11y**: input đơn nối `id`↔`htmlFor`; control COMPOUND (Number/Date/Otp) không nối được → helper `fieldName(label, fallback)` đổ label-string vào `aria-label` (nếu không sẽ **mất accessible name** — tsc/eslint KHÔNG bắt).

### 12f. ⭐ STATE THUỘC VỀ AI — story không lặp state của thành viên khác
Story chỉ render state **SINH RA TỪ CHÍNH component đó**. State đã có "nhà" ở component khác thì KHÔNG lặp lại.
- ❌ neo (2026-07-25): `Button.Group` có `WithIcons`/`Pending`/`Disabled` — đều là state của `Button.Base` → xoá, chỉ giữ `Default` (mapping items) · `Sizes` (size cấp cụm) · `Loading` (skeleton cả cụm).
- ❌ neo ngược chiều: `Choice.Radio` (radio lẻ **không sống độc lập**, phải nằm trong RadioGroup) ôm `hint`/`errorMessage`/`isRequired` của NHÓM → đẩy lên `Choice.RadioGroup`.
- Test: "state này do prop của CHÍNH nó sinh ra, hay chỉ chuyển tiếp xuống con?" — chuyển tiếp ⇒ không phải state của nó.

### 12g. ⭐⭐ TẦNG ATOM: **1 PROP = 1 LEAF** (ngược với §14d.2 ở tầng trên)
Thầy chốt 2026-07-26. Ở tầng **atom**, story tách leaf theo **PROP**, không theo cấu trúc:
mỗi prop có hình = **một leaf**, và leaf đó render **ĐỦ MỌI GIÁ TRỊ** của prop đó.

| Tầng | Leaf tách theo | Lý do |
|---|---|---|
| **atom** | **PROP** (§12g) | atom là bảng tra: người dùng đến để xem "prop này làm được gì" |
| design · block · screen | **CẤU TRÚC** (§14d.2) | ở trên, state không được đẻ leaf — cùng cây DOM ⇒ cùng leaf |

Hai luật này **không mâu thuẫn** — chúng trả lời hai câu hỏi khác nhau. Ở atom: "prop `variant`
có những giá trị nào?" Ở block: "vùng chức năng này có mấy hình?".

**Bộ leaf của một atom** = `Default` (trần, chưa bật prop nào) + một leaf cho mỗi prop CÓ HÌNH.
Bỏ qua prop không sinh hình: `onPress`/`className`/`showAnatomy`/`anatPart`.
- `variant` → leaf `Variants` — render ĐỦ mọi giá trị union, thiếu một giá trị là giá trị đó
  sẽ mọc thành leaf lạc chỗ (neo: `danger` không có trong mảng `VARIANTS` nên đẻ ra story
  `Danger` riêng — gộp 2026-07-26).
- `size` → `Sizes` · `icon` → `Icon` (đủ các thế: leading · trailing · trượt hover)
- `isDisabled` → `Disabled` · `isPending` → `Pending` · `isSkeleton` → `Skeleton`

**TRONG một leaf: render ĐỦ MỌI STATE CÓ THỂ CÓ của prop đó** (thầy siết 2026-07-26).
Không chỉ đủ giá trị của union — mà đủ **tổ hợp còn quan sát được**: leaf `isSkeleton` phải
render skeleton của ĐỦ 3 `size`, leaf `isDisabled` phải đủ mọi `variant`, leaf `icon` phải
có cả ca dùng kèm `suffixIcon`.

⚠️ **Ba ô nhìn y hệt nhau = LỖI ATOM, không phải cớ để bớt ô.** Neo 2026-07-26: leaf
`isSkeleton` của `Button.Base` render 3 size ra 3 pill gần như giống nhau — truy ra atom
dùng `w-24` CỨNG cho cả ba bậc (chỉ khác chiều cao 4px), tức footprint skeleton SAI so với
nút thật ⇒ layout nhảy khi dữ liệu về. Sửa atom (thêm bảng `SKELETON_W` theo size), KHÔNG
sửa story cho đỡ lộ. Story render đủ chính là cái BẮT được lỗi này.

#### 12g.0 ⭐⭐ KHUÔN CHUẨN CỦA SKELETON — **đi theo TRỤC HÌNH của chính component** (thầy chốt 2026-07-27)
Skeleton là **chỗ giữ chỗ**: nó phải chiếm ĐÚNG khoảng mà nội dung thật sắp chiếm. Sai
footprint ⇒ dữ liệu về là trang GIẬT, và không có test nào bắt được.

**Phép thử hai bước:**
1. Component có trục hình nào (`size`/`variant`/`shape`/`collapseFrom`…)?
2. Trục đó caller **BIẾT TRƯỚC** lúc đang tải, hay **CHÍNH LÀ dữ liệu đang chờ**?

| Loại trục | Ví dụ | Skeleton phải làm gì |
|---|---|---|
| **Biết trước** — cấu hình tĩnh caller viết sẵn | `size`, `variant`, `collapseFrom`, `columns` | **PHẢI rẽ nhánh theo nó** |
| **Do dữ liệu quyết** — chưa có lúc tải | `totalPages` của `Pagination` | vẽ MỘT hình chung là đúng; bịa thêm hình là sai |

- ❌ neo (2026-07-27): `Breadcrumbs` có `if (isSkeleton) return <3 thanh>` đặt **TRƯỚC** logic
  `collapseFrom`/`collapseOnMobile`. Hai prop đó đổi hẳn hình (dãy crumb dài ⟷ một back-link
  ngắn) và caller biết trước — nên mọi cấu hình ra cùng ba thanh, rồi co lại khi dữ liệu tới.
- ❌ neo cùng ngày: `Tabs.Base` skeleton bỏ qua `variant` — `secondary` (underline mảnh) vẫn vẽ
  pill đặc của `primary`.
- ✅ neo NGƯỢC: `Pagination` **cố ý** giữ một hình. Trục windowing do `totalPages` quyết, mà đó
  chính là giá trị chưa biết ⇒ không preview được. **Không bịa hình cho đủ ô.**

**Ba dạng "đúng" dễ bị chấm nhầm là vi phạm** (quét bằng grep sẽ báo nhầm cả ba):
1. Trục đi qua **biến trung gian** — `Avatar` dùng `box`, `Typography` dùng `SKEL_H[bodySize]`.
2. Khung render **THẬT**, chỉ chữ thành gạch — `Alert` giữ tint/icon/khung, nên `tone` đã ăn vào
   khung ở NGOÀI nhánh skeleton.
3. Cờ **chảy xuống con** (§12c) — không có nhánh riêng, `SurfaceCard.Nested` truyền
   `isSkeleton` vào `Typography.Base`; con tự vẽ shimmer của nó.

⚠️ Dạng 3 là ĐƯỜNG ƯU TIÊN: **truyền cờ xuống atom đã có `isSkeleton`, đừng dựng cây shimmer
song song.** Chỉ tự vẽ `HeroSkeleton` khi phần đó do CHÍNH component render trực tiếp (icon tự
tra bảng, thanh tiến độ…) hoặc con chưa có cờ.

#### 12g.0a ⭐⭐ `isSkeleton` LÀ MỘT NGÔN NGỮ DUY NHẤT CHO CẢ 5 TẦNG (thầy chốt 2026-07-27)
`atom` · `layout` · `design` · `block` · `screen` — **mọi tầng** dùng CÙNG một tên prop
`isSkeleton`, và **mọi tầng** đều có **leaf `Skeleton` riêng trong story, có `code`**.

| Điều | Bắt buộc |
|---|---|
| Tên prop | `isSkeleton` ở MỌI tầng. Tầng trên cùng cũng vậy — screen KHÔNG được đẻ ngôn ngữ riêng |
| Story | **LEAF RIÊNG** tên `Skeleton`, không phải "render kèm trong leaf Default" |
| Panel | leaf đó phải có `code` (tab Code) như mọi leaf khác |
| Anatomy | dùng CHÍNH cây part của bản thật — `isSkeleton` đổi STATE, không đổi CẤU TRÚC (§11f) |

- ❌ neo (2026-07-27): `CourseContents` (screen) dùng `state: "content"|"loading"|"empty"` trong
  khi bốn tầng dưới đã nói `isSkeleton` ⇒ đọc qua ranh giới tầng phải DỊCH. Sửa: `isSkeleton` +
  `isEmpty`.
- ❌ neo cùng ngày: `LearnNudges` có `isPending`/`pendingRows` — đúng cơ chế, sai tên. Đổi thành
  `isSkeleton`/`skeletonRows`.
- ❌ neo cùng ngày: `_shared.tsx` của screen khai `LOADING_PARTS` = cây anatomy **một node** cho
  trạng thái nghỉ ⇒ khai một CẤU TRÚC KHÁC cây thật, đúng cái sai mà việc gỡ
  `CourseContentsLoading` vừa chữa. Xoá; trạng thái nghỉ dùng chính cây content.

⚠️ **PHÂN BIỆT với ba prop KHÁC KHÁI NIỆM** (đừng đổi tên chúng cho "đồng bộ"):
| Prop | Nghĩa | Khác gì |
|---|---|---|
| `isSkeleton` | **chưa có dữ liệu**, giữ chỗ đúng footprint | — |
| `isPending` (`Button`) | **BUSY** — spinner thay glyph, khoá press | đã có nội dung, đang xử lý HÀNH ĐỘNG |
| `isLoading` (`SearchAutocomplete`) | spinner thay danh sách gợi ý | đang fetch theo QUERY, không phải lần tải đầu |

#### 12g.1 ⭐ "CÓ HÌNH" = ĐỔI PIXEL. Prop chỉ đổi a11y thì KHÔNG có leaf (thầy chốt 2026-07-26)
Phép thử: *đổi giá trị prop này, màn hình có khác một pixel nào không?* Không ⇒ **không có hình
⇒ không leaf**, bất kể nó là prop thật và có giá trị mặc định.
- ❌ **KHÔNG leaf**: `label` của `Spinner.Base` · `ariaLabel` của `Progress`/`Choice.RadioGroup`/
  `Input.{Date,Time,Search,Tags}` · `removeLabel` · `aria-label` của nút hiện/ẩn mật khẩu.
  Chúng chỉ chạy vào `aria-*` — screen reader nghe khác, MẮT không thấy gì.
- **Vì sao**: mở leaf cho chúng thì leaf đó render ra hai ô **y hệt nhau**, mà y hệt nhau chính là
  dấu hiệu LỖI ATOM ở đoạn trên ⇒ tự tay đẻ ra thứ luật khác đang bắt lỗi.
- ⚠️ Vẫn phải ĐÚNG a11y (§12e: control compound thiếu `aria-label` là mất accessible name) —
  chỉ là kiểm bằng đọc code/eslint, KHÔNG kiểm bằng một leaf trong Storybook.

#### 12g.2 ⭐ Prop nội dung: SINH CẤU TRÚC thì có leaf, chỉ là CHỮ thì không (thầy chốt 2026-07-26)
Cả hai đều "chở nội dung", nhưng khác nhau ở chỗ có đẻ ra HÌNH riêng hay không:

| Prop | Có leaf? | Vì sao |
|---|---|---|
| `items` / `options` (dữ liệu dựng ra N phần tử con) | ✅ **CÓ** — và leaf đó **chính là `Default`** | *"`items` bản thân là một prop rồi"* (lời thầy). Việc map dữ liệu ra cả cụm LÀ hình đáng soi: item có `label` ra nút thường, không có ra nút chỉ-icon. |
| `text` / `amount` / `title` (một chuỗi/số) | ❌ **KHÔNG** | Mọi leaf khác đều buộc phải truyền nó, nên nó không phải một TRỤC — tách leaf riêng sẽ trùng hệt `Default`. |

- Neo ĐÚNG (giữ nguyên, không sửa): `Button.Group` → `Default` ghi *"Prop `items`"* ·
  `Chip.Base` → `Default` ghi *"Bare chip"*. Hai file mẫu nói khác nhau là **hợp lệ**, vì
  prop nội dung của chúng thuộc hai loại khác nhau ở bảng trên.
- Hệ quả cho số đếm leaf: cụm dữ liệu (`*.Group`) có `Default` **là** leaf của `items` ⇒ đừng
  đẻ thêm một leaf `Items` nữa.

**DEPS TREE = story KHÁC mà leaf này dựa vào** (thầy chốt 2026-07-26). Cây phụ thuộc
CHỈ khai component **CÓ story riêng** — bấm vào là nhảy sang được. Span nội bộ (`Label`,
`Icon`, `Spinner`, `SuffixIcon`) KHÔNG phải deps: chúng không có nhà để nhảy tới, khai
vào chỉ làm nhiễu.
- Atom lá bọc thẳng HeroUI ⇒ **deps RỖNG**, bỏ hẳn prop `parts` (neo: `Button.Base`,
  `Button.Icon`).
- Cụm/khối ⇒ khai đúng cái nó **dựng lại** (neo: `Button.Group` → `Button.Base` +
  `Button.Icon`, kèm `storyId`).

#### 12g.3 ⭐⭐ MỌI leaf PHẢI có `code` — tab Code không được rỗng (thầy chốt 2026-07-27)
Panel có hai tab, và chúng mọc theo dữ liệu: **Deps** cần `annotate` có `storyId` thật, **Code**
cần prop `code`. Thiếu `code` ⇒ panel trống trơn, leaf không nói được *"gọi thế nào"*.

| Tab | Điều kiện mọc | Rỗng thì |
|---|---|---|
| **Code** | có `code` | ❌ LỖI — mọi leaf đều gọi được, nên luôn viết được snippet |
| **Deps** | `annotate` có entry `storyId` thật | ✅ HỢP LỆ khi atom lá bọc thẳng HeroUI — bỏ hẳn prop |

- Snippet là **lời gọi tối thiểu thể hiện đúng prop leaf đó minh hoạ**, dữ liệu dài rút thành
  `items={[…]}`. Người đọc cần thấy HÌNH DẠNG lời gọi, không cần bãi dữ liệu.
- ⚠️ ESLint repo bắt **doublequote**: một dòng thì `code={"<X a=\"b\" />"}` (escape); backtick
  CHỈ khi snippet nhiều dòng. Sai chỗ này là lỗi lint, không phải thẩm mỹ.
- ⚠️ `storyId` là **chuỗi tự do, KHÔNG có gì kiểm** — sai thì link Deps gãy CÂM (không lỗi
  build, chỉ bấm không nhảy). Phải **đối chiếu `index.json`**, đừng suy từ title.
  ❌ neo (2026-07-27): `Link.SeeMore` kebab-hoá thành `link-seemore`, KHÔNG phải `link-see-more`
  — trò suy từ title, ghi nhầm, và tự xác nhận "đã nhảy đúng" bằng cách đọc `href` thay vì kiểm
  id có tồn tại.
- ❌ neo cùng ngày (quét 911 leaf): **458 leaf thiếu `code`** — `_legacy` 378 · `layouts` 51 ·
  `designs` 16 · `blocks` 5. Tức luật này chưa bao giờ được áp bằng máy. **Quét, đừng vá lẻ**
  chỗ nào bị chỉ ra.

⚠️ **§12g KHÔNG phá §12f**: leaf chỉ mở cho prop của CHÍNH atom đó. Prop chuyển tiếp xuống con
thì vẫn thuộc về con (`Button.Group` không có leaf `Pending` — đó là prop của `Button.Base`).

### ✅ Checklist đo (§12)
- [ ] Root atom **callable** (= `Base`)? Member chỉ mở cho **hình thái thật**, không có `{ Base: X }` rỗng (§12a)?
- [ ] **Mỗi prop có hình = một leaf**, leaf render ĐỦ giá trị của prop đó (§12g)? Không có leaf nào là một giá trị lẻ?
- [ ] Prop chỉ đổi **a11y** (`label`/`ariaLabel`/`removeLabel`) đã bị loại khỏi bộ leaf (§12g.1)?
- [ ] Cụm dữ liệu: `Default` **chính là** leaf của `items`, không đẻ thêm leaf `Items`; prop chữ (`text`/`amount`) không có leaf riêng (§12g.2)?
- [ ] **KHÔNG `children`** (trừ atom-wrapper Tooltip/Badge có ghi lý do)? Cụm dùng `items`/`options` dữ liệu?
- [ ] `isSkeleton` **co-located** ở CHÍNH chủ của hình (mọi tầng)? Không có component skeleton dùng chung?
- [ ] Khung render **THẬT** (surface/radius/shadow/separator giữ nguyên), chỉ nội dung thành gạch?
- [ ] Prop nội dung optional-khi-skeleton bằng **union**, và nhánh `isSkeleton` xét **TRƯỚC** mọi nhánh hình?
- [ ] `size` là trục riêng; **icon suy từ size** (không có prop icon-size)? Cluster đặt `size` ở cấp cụm?
- [ ] Form atom tự mang `label`/`hint`/`errorMessage`/`isRequired`; story `Error` hiện đủ **nhãn + message + viền**?
- [ ] Control compound có **accessible name** (aria-label từ label) khi không nối được `htmlFor`?
- [ ] Story KHÔNG lặp state đã có nhà ở component khác (§12f)?

---

## 13. LAYOUT TIER — BỘ KHUNG (tên cũ: "primitive") — ✅ CHỐT (thầy chốt 2026-07-25)
Tầng trên `atom` (§12), dưới `design`. **Khung sắp đặt phần tử** — cho thấy các atom bố trí/tương tác ra sao. **KHÔNG mang chức năng, KHÔNG mang nội dung domain** (có nội dung domain ⇒ tụt xuống `design`/`block`, §6c).

> Thầy: *"atom là phần tử web; layout là bộ khung, như PageHeader — để hình dung sự tương tác của phần tử, không mang chức năng"*. Chữ **"primitive" bị bỏ** vì nguyên tử giờ là atom.

### 13a. Namespace theo HỌ KHUNG — `X.<Member>`
Gom các khung **cùng họ** vào một namespace; member = **hình thái khung**, không phải biến thể thị giác (biến thể = prop, §6b). Gom **RỘNG** (thầy chốt): mọi khung mặt-thẻ về `SurfaceCard.*` thay vì tách nhiều namespace nhỏ.
- Neo: `SurfaceCard = { Base, Nested, Pressable, PressableGroup, List, Accordion, CrossList, Placeholder }`.
- Story title: `Layouts/<Cat>/<Family>/<Family>.<Member>`.

### 13b. ⭐ API khung — slot CÓ TÊN là chính · `children` được phép · **danh sách BẮT BUỘC `items`**
Khác atom (§12b cấm children tuyệt đối): khung **tồn tại để bọc nội dung**, nên children hợp lệ — nhưng có thứ tự ưu tiên:

| Loại khung | API |
|---|---|
| Khung **BỌC** (`.Base`/`.Nested`/`.Pressable`, ModalShell, PageContainer) | slot **có tên** `header`/`body`/`footer` là đường CHÍNH; `children` = shorthand của `body` |
| Khung **DANH SÁCH LẶP** (`.List`/`.Accordion`/`.CrossList`/`.PressableGroup`, LabeledList) | **BẮT BUỘC `items` dữ liệu — CẤM children** (giống `Button.Group items` §12b) |

- Test: "nội dung có phải N phần tử CÙNG KIỂU lặp lại không?" — có ⇒ `items`; không ⇒ slot/children.

### 13d. ⭐ Khung BỐ CỤC = nơi THI HÀNH §10 — `gap` là UNION LITERAL, SSOT một chỗ
Thang §10c (`0·1·2·3·6·8`) trước đây chỉ là *lời khuyên* — rà tay mới bắt được `gap-4`/`gap-5`. Từ 2026-07-25 nó được **ép bằng TYPE**: khung bố cục nhận `gap: SpaceScale` (union literal), off-scale là **lỗi tsc tại call-site**, không phải phát hiện lúc review. Đây chính là LÝ DO tầng khung sở hữu `gap` (§10a: seam thuộc PARENT).
- Khung bố cục nền: **`Stack.{V,H}`** (xếp dọc/ngang) · **`Split.Base`** (trái↔phải) · **`Cluster.Base`** (hàng wrap) · **`Grid.Base`** (lưới responsive).
- ⚠️ **SSOT: `blocks/_spacing.ts`** — `SpaceScale` + `GAP_CLASS` + `ALIGN_CLASS` khai **ĐÚNG MỘT CHỖ**. Khung khác import, **CẤM khai lại tại chỗ** dù giá trị giống hệt.
- ❌ neo (2026-07-25): 4 agent song song đẻ 4 tên cho cùng thang (`SpaceScale`/`SectionGap`/`SpacingStep`/`KeyValueGap`) + 4 bản sao `GAP_CLASS` → 4 nguồn sự thật ngay lúc mới sinh. Đã gom về 1. **Khi fan-out nhiều agent: chỉ định SẴN file SSOT dùng chung trong spec**, đừng để mỗi agent tự khai.
- Class Tailwind phải là **literal** (`gap-3`), KHÔNG nội suy `gap-${n}` (JIT không emit ra).

### 13c. Khung KHÔNG lặp lại atom — trùng thì XOÁ, dùng atom thẳng
Sau khi có atom layer, khung nào chỉ là "atom mặc áo" thì **xoá**, consumer dùng atom trực tiếp.
- ❌ Đã xoá: `Field.*` (atom form tự mang label/error §12e) · `navigation/Pagination` · `ResponsiveBreadcrumb` · `TabsCard` (đã có `Pagination.Base`/`Breadcrumbs.Base`/`Tabs.Base`) · `AvatarGroup` → thành member atom `Avatar.Group`.
- Giữ khung CHỈ KHI nó thêm khái niệm khung thật (bố cục/nhóm/trạng thái khung), không phải đổi tên atom.

### ✅ Checklist đo (§13)
- [ ] Khung nằm đúng tier: **không** mang nội dung domain / chức năng (nếu có ⇒ design/block)?
- [ ] Gom **namespace theo họ** (`SurfaceCard.*`), không rải component rời cùng loại?
- [ ] Danh sách lặp dùng **`items`** (không children)? Khung bọc có slot `header`/`body`/`footer`?
- [ ] Không có khung nào **trùng chức năng atom** (trùng ⇒ xoá, dùng atom)?
- [ ] Story title `Layouts/…` (KHÔNG còn `Primitives/…`)?


---

### 13z. ⭐⭐ "Bố cục đi qua KHUNG" áp TỪ TẦNG LAYOUT TRỞ LÊN — atom thì KHÔNG (thầy hỏi 2026-07-27)
Luật "không tự dựng `div` + class bố cục, phải dùng `Stack`/`Cluster`/`Split`/`Grid`" áp cho
**layout · design · block · screen**. Ở **ATOM thì NGƯỢC LẠI**: atom PHẢI viết flex bằng tay.

**Vì sao — chiều phụ thuộc chỉ đi MỘT hướng.** Đo trên cây bản vẽ 2026-07-27:

| Chiều | Số file |
|---|---|
| `atoms/` → `layouts/` | **0** |
| `layouts/` → `atoms/` | **25** (`Stack` tự nó import `Divider.Base`) |

Khung được DỰNG TRÊN atom. Cho một atom dùng khung là tạo `Button → Stack → Divider → …`:
atom phụ thuộc khung, khung phụ thuộc atom ⇒ **vòng lặp tier**, và là vòng lặp import thật
chứ không phải chuyện lý thuyết.

- ✅ `<button className="inline-flex items-center gap-1.5">` bên trong atom `Button` là **ĐÚNG**.
  Tầng đáy không còn gì bên dưới để mượn.
- ⛔ Đừng "dọn" flex trong atom cho đồng bộ với tầng trên — đó là kéo đổ chiều phụ thuộc.
- 🧭 Test: *"dưới component này còn tầng nào không?"* Còn → đi qua khung. Không còn → viết tay.

## 14. MÔ HÌNH TƯ DUY — block=chức năng · design mang WHY · STATE hai loại — ✅ CHỐT (thầy giảng 2026-07-25)

§6c/§12/§13 nói mỗi tầng LÀ GÌ. Mục này nói cả hệ **VẬN HÀNH thế nào** — đọc mục này trước khi dựng bất cứ thứ gì.

### 14a. Screen là DANH SÁCH CHỨC NĂNG — mỗi block = một chức năng
- **Block represent chức năng của screen.** Đọc tên các block là đọc được trang làm gì.
- Screen chỉ quyết định **block nào CÓ MẶT**; không chạm atom, không gọi khung layout, không tự vẽ chi tiết (§11).
- ✅ neo `CourseContents`: `CourseBrief`(khoá này là gì) · `ContinueCard`(quay lại chỗ dở) · `LearnNudges`(hôm nay làm gì) · `KeepGoingPath`(đi tiếp trong chương).

### 14b. Block ISOLATED — không block nào biết block khác tồn tại
- Giao tiếp **MỘT CHIỀU**: `screen → block` qua props. **KHÔNG có `block ↔ block`.**
- Block nhận **DỮ LIỆU**, không nhận node dựng sẵn — nhận node = phụ thuộc thứ caller đã dựng ⇒ phá isolation.
  ✅ neo: `CourseBrief` nhận `breadcrumbItems` (mảng crumb), KHÔNG nhận `breadcrumb?: ReactNode`.
- Cờ phụ thuộc **ngữ cảnh cha** (`bordered`, `tone`, `size`) phải là **PROP** — block không biết cha nó là gì. Hard-code = mùi sai.
  ❌ bài học 2026-07-25: `KeepGoingPath` hard-code `bordered` (bê từ code cũ) → vẽ viền trên nền trang trần, sai luật §1.
- **Phép thử isolation:** story của một block phải render được **MỘT MÌNH**. Phải dựng cả màn mới ra hình ⇒ block đó đang ăn state hàng xóm.
- ⚠️ Mô tả tài liệu phải khớp: viết "block tự ẩn khi paid" là mô tả một block **biết state của screen** — cấm. Sự CÓ MẶT do screen quyết.

### 14c. Block dựng trên `layout + atom + design` — chỉ LẮP, không sáng tạo
- Cần một quyết định thẩm mỹ mới ⇒ **đẻ ở tầng design** rồi block dùng lại. Block tự chọn vỏ/nhịp/màu = **lấn quyền tầng design**.
  ❌ bài học: `KeepGoingPath` tự vẽ `div.rounded-2xl.border` + tự chọn nhịp — không phải "chế thêm cách render", mà là block ra quyết định thẩm mỹ.

### 14d. Design mang kèm MỤC ĐÍCH (WHY) — phân theo WHY, KHÔNG theo hình
Mỗi component tầng design tồn tại vì **một mục đích**. Hai loại đã chốt:
| WHY | Ví dụ |
|---|---|
| **CTA** — đẩy người dùng hành động | `ContinueCard` · `PricingCard` · `PlaygroundCard` |
| **Render nội dung** — trình bày để đọc/nhìn | `CourseCard` · `MediaCard` · `SummaryCard` · `FlipCard` |
- Cùng WHY, khác hình ⇒ **gộp**. Khác WHY, giống hình ⇒ **tách**. Hình là hệ quả, WHY là gốc.
- Component không có WHY riêng (`SectionCard`/`SurfaceCard`/`HighlightCard`) là **khung trung tính** ⇒ thuộc tầng **layout**, không phải design.
- ⏳ **CHỜ THẦY**: tầng sáng tạo vẫn phải **tuân thủ hệ màu/token** — ranh giới "sáng tạo tới đâu" thầy feedback sau (2026-07-25).

#### 14d.1 ⛔⛔ TỪ DESIGN TRỞ LÊN — KHÔNG MỞ LỐI "CUSTOM" (thầy chốt 2026-07-26)
`design` · `block` · `screen` nhận **DỮ LIỆU**, và **SỞ HỮU** hình lẫn chữ của chính mình. **CẤM** prop cho caller đè lên phần trình bày:
- ❌ nhãn tự đặt (`label?` đè nhãn mặc định) · ❌ trục hình (`variant?` kiểu `bare`/`pill`) · ❌ đổi icon · ❌ `className` để restyle.
- ✅ vẫn được: prop **DỮ LIỆU** (`difficulty`, `items`, `title`) · `className` **CHỈ để đặt chỗ** (`mb-4`, `flex-1`) · `isSkeleton` · `anatPart`/`showAnatomy`.

**Lý do**: hở một lối là caller lách được, và bản chuẩn hết còn chuẩn — component thôi mang VAI NGHĨA, tụt xuống thành "một cái chip/thẻ". Muốn tự do hình thì gọi **thẳng atom/layout**, đừng bẻ design.

- ❌ neo (2026-07-26): `VariantChip.Difficulty` từng mở `label?` + `variant?: "pill"|"bare"` → thầy bắt. Sửa: `difficulty` là trục DUY NHẤT, quyết cả nhãn lẫn màu; hình luôn `pill`.
- ❌ neo cùng ngày: `CourseTeamGate` mở `actionLabel?` → xoá, nhãn nút do block sở hữu.
#### 14d.3 ⛔ BLOCK KHÔNG BỊA CASE (thầy chốt 2026-07-26)
Chỉ dựng biến thể mà app **THẬT SỰ dùng**. Không mở prop, không render thêm bản, không đẻ story chỉ để "cho đủ bộ".

- ❌ neo: `KeepGoingPath`/`LearnNudges` từng có `bordered` cho ca "surface-in-surface" — **app không có ca đó**. Prop bịa, và story còn render bản thứ hai chỉ để khoe nó. Đã xoá cả prop lẫn bản render.
- ⚠️ **Ngoại lệ `bordered` từng ghi ở §14d.1 nay VÔ HIỆU** — đừng dựa vào nó để mở prop. Trò từng viết nó vào canon rồi bảo vệ suốt mấy lượt; sai vì lý lẽ "ngữ cảnh cha" chỉ đúng khi ngữ cảnh đó CÓ THẬT.
- Phép thử: *"màn nào trong app đang cần case này?"* — không chỉ ra được một màn ⇒ **không dựng**.

**Ba hệ quả thầy siết thêm 2026-07-26:**

1. ⛔ **KHÔNG nhận `heading`/tiêu đề.** Câu dẫn là phần TRÌNH BÀY ⇒ block sở hữu. Caller chỉ đưa **dữ liệu miền**; block tự ghép câu.
   - ❌ `<LearnNudges heading="Việc nên làm hôm nay"/>` → block tự đặt, cụm này luôn trả lời một câu hỏi nên câu dẫn là HẰNG SỐ.
   - ❌ `<KeepGoingPath heading="Tiếp tục · Chương 2 · Container hoá"/>` → nhận `moduleTitle="Chương 2 · Container hoá"`, block ghép `Tiếp tục · {moduleTitle}`.

2. ⛔ **KHÔNG truyền GENERIC / chuỗi đã format.** Prop phải là **dữ liệu có kiểu**, không phải nội dung đã trình bày sẵn.
   - ❌ neo: `<CourseBrief meta="8 chương · ~14 giờ học · 2,481 học viên"/>` — caller quyết luôn đơn vị, dấu ngăn, phân tách hàng nghìn ⇒ **phá cấu trúc**, block hết sở hữu hình.
   - ✅ `moduleCount={8} hours={14} learnerCount={2481}` — số rời, block tự ghép dải muted. Danh sách thì truyền **mảng dữ liệu**, không truyền chuỗi nối sẵn.
   - Hệ quả: prop nội dung ở tầng này nên là `string`/`number`/mảng có kiểu, **hạn chế `ReactNode`** (ReactNode = caller nhét được hình vào).

3. 📛 **THUẬT NGỮ MIỀN: `contents`, KHÔNG phải `lessons`.** Strict ở MỌI chỗ — tên type, tên prop, biến, chú thích.
   - ⚠️ **ĐỪNG TIN CODE CŨ**: `src/` đang gọi `lessons` (`MyCourseOutlineModule.lessons`), đó là chỗ SAI, không phải chuẩn để bê theo.
   - ❌ neo: `KeepGoingLesson`/`lessons` → `KeepGoingContent`/`contents`.

#### 14d.2 ⭐ STORY: LEAF = CẤU TRÚC · mỗi leaf render ĐỦ VARIANT (thầy siết 2026-07-26)

> ⚠️ **PHẠM VI: DESIGN · BLOCK · SCREEN.** Tầng **ATOM** dùng luật ngược — **1 prop = 1 leaf** (§12g).
> ❌ neo (2026-07-26): `Button.Base` từng viện §14d.2 để nhồi `variant`+`isDisabled`+`isSkeleton`
> vào chung leaf `Default` — áp nhầm luật tầng trên xuống atom. Tách lại thành 7 leaf theo prop.

Nhắc lại §11f ở tầng story vì hay bị làm sai: **leaf tách khi CẤU TRÚC đổi** (mất/thêm node). Cùng cây DOM, khác nội dung ⇒ **STATE**, phải nằm TRONG một leaf, KHÔNG tách story riêng.
- ❌ **skeleton KHÔNG phải leaf** — cùng cấu trúc, chỉ thay chữ bằng gạch. (Prop `isSkeleton` thì VẪN có ở design, §12c — hai chuyện khác nhau.)
- ❌ neo: `VariantChip.Difficulty` từng có 4 story `Levels`/`Bare`/`CustomLabel`/`Skeleton` → gộp còn **MỘT** leaf render đủ 4 bậc + hàng skeleton.
- ✅ leaf THẬT là khi node biến mất: `PhaseScarcityNote` bỏ `Separator`+`PriceRiseClause` · `CourseBrief` bỏ `Breadcrumbs` · block tự ẩn (render rỗng).

### 14e. Dựng block = TÁI SỬ DỤNG — đừng đẻ khái niệm mới
Thứ tự BẮT BUỘC trước khi dựng bất kỳ block/design nào:
1. Cái này phục vụ **WHY** gì?
2. Hệ **đã có** design/block nào phục vụ WHY đó chưa?
3. Có rồi → **dùng lại** (thêm prop nếu thiếu). Chưa có → mới dựng.
- ❌ bài học 2026-07-25: dựng `KeepGoingPath` mà bỏ qua bước 1–2; hệ đã sẵn `UpNextCard` cùng họ WHY "đưa người học tới mục kế tiếp".
- Dấu hiệu hệ đang đẻ khái niệm thừa: **một việc có ≥2 đường làm**. Ví dụ đã đo: 4 cách đặt nhãn cho một khối (`Page.Header` · `eyebrow` riêng của ContinueCard · `SurfaceCardHeader` · `Section.Header` **0 consumer**).
- ⚠️ Khái niệm dựng xong **không ai dùng** nguy hiểm hơn drift đang chạy: drift là hai đường đang đi, còn nó là đường thứ ba **đang chờ** người vô tình đi vào.

### 14f. STATE — hai loại, lặp lại ở MỌI tầng (⭐ xương sống)
Mỗi tầng đều tách đôi theo cùng một hình: state **đổi cấu trúc của chính tầng đó** thì đẻ ra một đơn vị; state **chỉ lan xuống tầng dưới** thì mãi chỉ là một prop.

| Tầng | ① đổi cấu trúc tầng đó ⇒ **đẻ đơn vị** | ② lan xuống / nội bộ ⇒ **chỉ prop** |
|---|---|---|
| **screen** | nội dung KHÁC (`paid`/`unpaid`, từng tab, `empty`) ⇒ **story screen riêng** | state của block ⇒ không đẻ gì |
| **block** | đổi theo block (`variant` item·hero·plain) ⇒ **leaf riêng** | lan xuống phần tử (`isSkeleton`) ⇒ không đẻ leaf |
| **phần tử** | — | mỗi atom tự sở hữu skeleton của mình (§12) |

- **LEAF chỉ thay đổi theo BLOCK.** State lan xuống KHÔNG sinh leaf.
- `<A isSkeleton>` → mọi phần tử bên trong tự skeleton; **cấu trúc A không đổi một mảnh nào** ⇒ prop, không leaf.

### 14g. Phép thử phân loại state
> **Chụp cây block HAI LẦN ở hai state cần so.**
> Danh sách block **KHÁC** ⇒ loại ① ⇒ đẻ đơn vị (story screen / leaf).
> Danh sách **GIỐNG** ⇒ loại ② ⇒ chỉ là prop.

Câu hỏi là **"trang còn cụm đó không"**, KHÔNG phải "ai viết đoạn code ẩn nó" — block tự ẩn hay screen `? null` đều cho ra cùng một cây ⇒ cùng một loại.

**Luật suy ra được (không phải ý thích):**
| Quyết định | Suy ra từ |
|---|---|
| Bỏ story `Skeleton`, giữ `Empty` | `loading` lan xuống ⇒ ②; `empty` thay trọn spine ⇒ ① |
| `Unpaid`/`Paid` là 2 story, không phải 1 prop | rụng hẳn 2 block ⇒ danh sách khác ⇒ ① |
| Trạng thái bài `done/active/todo` không đẻ story screen | vẫn 3 hàng, chỉ đổi icon ⇒ ② |

### ✅ Checklist đo (§14)
- [ ] Đọc tên block trên screen có ra được **trang làm gì** không?
- [ ] Block có render được **một mình** trong story không (isolation)?
- [ ] Block nhận **dữ liệu** hay nhận node dựng sẵn?
- [ ] Cờ phụ thuộc ngữ cảnh cha là **prop** hay bị hard-code?
- [ ] Trước khi dựng mới, đã hỏi **WHY** và tra hệ có sẵn chưa (§14e)?
- [ ] State đã chạy qua **phép thử §14g** chưa — đẻ đơn vị hay chỉ prop?
- [ ] Có việc nào đang có **≥2 đường làm** không? Có khái niệm nào **0 consumer** không?

## 15. Button variant — khi nào secondary / tertiary / ghost / outline (deep research 2026-07-29)

Trước khi có mục này, atom `Button` (Storybook, `button-tokens.ts`) chỉ khai **5** variant:
`primary`/`secondary`/`ghost`/`danger`/`danger-soft`. HeroUI thật (`node_modules/@heroui/styles/
dist/components/button/button.styles.d.ts`) khai **7**: thêm `tertiary` và `outline`. Nghĩa là
atom đang THIẾU 2 variant mà `src` thật dùng khá nhiều (`tertiary`=77 call-site, `outline`=6).

### 15a. Giả thuyết thầy đưa ra, đã KIỂM CHỨNG bằng agent đọc ~35 file `src` thật — BỊ BÁC BỎ

> "button secondary chỉ đi kèm primary. còn lại thì tertiary."

**Bằng chứng ngược lại**: ≥8 cụm nút `secondary` đứng **MỘT MÌNH**, không có `primary` bên cạnh.

| ✅ / ❌ | Ca | Neo | Vì sao |
|---|---|---|---|
| ❌ bác bỏ giả thuyết | `secondary` đứng một mình, KHÔNG có `primary` cạnh | `SystemStatus/index.tsx:67-75` — nút refresh đơn độc | Giả thuyết đòi `secondary` luôn cần `primary` kèm — ca này không có |
| ❌ bác bỏ giả thuyết | 3 nút icon-only reorder dùng `secondary` (+1 `danger`), không `primary` | `ManagePinnedProjectsModal/PinnedProjectCard/index.tsx:90-129` | Cụm hành động phụ trong 1 card, tự đứng, không kèm CTA chính nào |
| ✅ đúng 1 phần giả thuyết | `secondary` đứng CẠNH `primary` (2 nút cùng hàng) | ví dụ điển hình: dialog Huỷ(secondary)/Xác nhận(primary) | Đây là mô hình PHỔ BIẾN nhất của `secondary`, nhưng không phải DUY NHẤT |

**Kết luận thật**: `secondary` là 1 mức nhấn TRUNG BÌNH độc lập (không phải "vệ tinh của primary")
— dùng được cả khi đứng cạnh `primary` LẪN khi đứng một mình cho 1 hành động không nổi bật bằng
CTA chính của trang nhưng vẫn quan trọng hơn hành động lặt vặt. `tertiary` mới là mức "hành động
lặt vặt, không cần nổi bật" — không phải "mọi nút KHÔNG có primary kèm".

### 15b. `ghost` vs `tertiary` — ✅ CHỐT (thầy chốt 2026-07-29): mô hình 4 TẦNG nhấn giảm dần

`src` thật tự nó KHÔNG nhất quán (2 file làm cùng 1 pattern nhưng chọn variant khác nhau — bằng
chứng ở `button-variant-system.html §4`), nên không đi tìm "đúng theo src". Thầy chốt 1 luật
RIÊNG cho Storybook, không cố khớp từng case lẻ của `src`:

> **`primary` → `secondary` → `tertiary` → `ghost`, 4 TẦNG nhấn mạnh giảm dần — `ghost` KHÔNG
> phải "cùng cấp, khác hình" với `tertiary` mà là 1 TẦNG THẤP HƠN NỮA.**
> - Dùng `ghost` khi 1 cụm có **≥3 nút cần phân bậc rõ** — nút yếu nhất của cụm xuống `ghost`.
>   Neo mẫu ĐÚNG (giữ nguyên, không sửa): `MockInterviewScorecard.tsx:357-383` — 1 hàng 3 nút
>   `primary` ("Ôn lại phần yếu") → `secondary` ("Làm dự án cá nhân") → `ghost` ("Phỏng vấn lại"),
>   đọc gradient rất rõ.
> - Dùng `tertiary` khi cụm chỉ có **2 mức** (chính + phụ) nhưng nút phụ vẫn cần RÕ RÀNG là 1
>   nút (không muốn nó gần như tàng hình). Đây là tầng mặc định cho "hành động phụ" khi không có
>   tầng thứ 3 nào thấp hơn nó trong cùng cụm.

⚠️ **Luật áp dụng CHO CÔNG VIỆC VỀ SAU** (build/sửa block mới) — KHÔNG kích hoạt 1 đợt quét lại
toàn bộ `ghost`/`secondary` hiện có trên diện rộng. Đã fix ĐÚNG 1 va chạm cụ thể lộ ra ngay khi
đối chiếu luật này (xem `steps/13-feedback-anatomy-registry.md` §2w):
`SubmissionAttemptsDrawer.tsx` có 2 nút "Xem chi tiết"/"Xem bài nộp" đứng CẠNH NHAU trong cùng 1
footer — dòng "Xem chi tiết" vừa đổi `tertiary` ở đợt audit §15d, còn "Xem bài nộp" vẫn `ghost`
từ trước → cùng vai trò, cùng cụm, lệch variant → đồng bộ cả hai về `tertiary`.

✅ **ĐÃ SỬA (thầy chốt "ok cả 2 là tertiary", 2026-07-29)**: pattern "Huỷ cạnh nút Gửi/primary"
từng có 2 cách làm khác nhau ngay trong Storybook — `ContentCommentComposer.tsx:158` (`ghost`) và
`CourseQaComposer.tsx:220` (`secondary`) — cả hai là cụm 2 nút, đúng luật 4 tầng phải là
`tertiary`. Đã đổi cả hai. Verify: `tsc --noEmit` sạch (0 output), `eslint --fix` sạch.

### 15c. Bảng vai trò 7 variant thật (để tham chiếu khi chọn)

| Variant | Khi nào | Neo |
|---|---|---|
| `primary` | CTA chính DUY NHẤT của 1 khối/trang | phổ biến khắp nơi |
| `secondary` | Hành động quan trọng thứ 2 — đứng cạnh `primary` HOẶC đứng một mình khi là hành động chính của 1 cụm nhỏ | `SystemStatus/index.tsx:67-75`, `PinnedProjectCard/index.tsx:90-129` |
| `tertiary` | Hành động phụ, không cần nổi — phổ biến NHẤT trong 7 loại (77 call-site) | `RepeatableItemCard.tsx:52-71` |
| `outline` | Hiếm (6 call-site) — viền rõ nhưng nền trong suốt, dùng khi cần phân biệt khỏi nền nhưng không muốn nặng như `secondary` | |
| `ghost` | Không viền không nền, chỉ hiện khi hover — nút rất nhẹ, thường icon-only cạnh nội dung khác | |
| `danger` | Hành động phá huỷ, nổi bật (nền đỏ) | |
| `danger-soft` | Hành động phá huỷ, nhẹ hơn (chưa chắc-chắn / cần xác nhận thêm) | |

### 15d. ✅ ĐÃ LÀM (thầy chốt 2026-07-29 — "cắm workflows sửa hết đi")
- ✅ Thêm `"tertiary"` + `"outline"` vào `ButtonVariant` type + `HERO_VARIANT` trong `button-tokens.ts` (mechanical, làm trực tiếp — HeroUI thật khai đủ 7, kể cả `danger-soft` sẵn có, comment cũ nói "HeroUI không có `danger-soft`" đã lỗi thời nhưng KHÔNG đổi cách mượn `secondary` của `danger-soft` — ngoài phạm vi lần này).
- ✅ Audit 20 call-site `variant="secondary"` thật của Button (loại trừ prop `variant` trùng tên của Tabs/Select/Input/TextField/InputGroup — không liên quan), qua workflow 16 agent song song đọc ngữ cảnh + áp §15c. Kết quả: **11 đổi sang `tertiary`**, **9 giữ `secondary`** — mỗi quyết định có lý do bám đúng nhánh (a)/(b) của §15c, xem đầy đủ ở `steps/13-feedback-anatomy-registry.md` §2w.
- ✅ Verify: `tsc --noEmit` sạch, 9/9 gate script không phát sinh lỗi mới, `eslint --fix` sạch trên toàn bộ 17 file đụng tới.
- [ ] Thầy chốt 1 luật RIÊNG cho ghost-vs-tertiary trong Storybook (§15b) — vẫn CHƯA làm, vì `src` thật tự nó lệch, không có "đáp án đúng" để copy — cần thầy quyết, không tự chốt thay.

Render đầy đủ + bảng tần suất + mock nút cả 7 variant: `button-variant-system.html` (8080, `.artifacts/decompose/`).
