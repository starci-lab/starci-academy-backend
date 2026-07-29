# PROMINENCE — thứ này nên nổi tới mức nào so với thứ quanh nó

> Trục này trả lời đúng một câu: **dùng CƠ CHẾ nào để làm nổi** — chỉ đổi màu chữ (`accent`)?
> đóng khung thành token (`chip`)? hay biến thành hành động bấm được (`button`)?
> Không trả lời TÔ MÀU GÌ trong 6 giá trị semantic (xem `color/context.md` — trục đó
> RỘNG bằng đúng 1 prop `color` của `Typography`/`Alert`/`Chip`). Không trả lời nút
> `variant` nào trong 7 giá trị (xem `button/context.md` — trục đó nhận bàn giao SAU
> KHI trục này đã quyết "đây đúng là một cái nút"). Trục này đứng TRÊN cả hai: nó quyết
> **hình thái** trước, hai trục kia quyết **giá trị bên trong hình thái đã chọn**.
> Neo code thật: [`example.html`](example.html).

---
# PHẦN A · NHẬN BIẾT — nạp phần này khi QUÉT
---

## 1. THANG — bốn cơ chế, không có cơ chế thứ năm

| Bậc | Cơ chế | Dùng khi | Neo |
|---|---|---|---|
| **`muted`** | CHỮ, không khung, màu mờ (`text-muted`) | ngữ cảnh/meta trung tính, scalar tự do đứng riêng (đếm, giờ, trivia) | `CourseCard.tsx:300-308` — `482 học viên` = `Typography color="muted"`, KHÔNG chip |
| **`accent`** (text, không khung) | CHỮ, không khung, màu tín hiệu (`text-accent-soft-foreground`) | tín hiệu THƯƠNG HIỆU/TƯƠNG TÁC chảy trong dòng: link · "của tôi" · pinned · verified · active | `SurfaceCard.tsx:1372` (`metaText`) · `Typography.tsx:381` (`isLink` mặc định) |
| **`chip`** | ĐÓNG KHUNG — token soft bounded (`HeroChip variant="soft"`) | enum/category/status cố định, badge khuyến mãi — có nghĩa dù KHÔNG bấm được | `PriceTag.tsx:141-145` (`Chip tone="success"` cho `−X%`) · `DifficultyChip.tsx` (dot + text) |
| **`button`** | HÌNH NÚT thật — atom `Button`/`HeroButton`, có nền/viền/padding riêng của NÚT | một hành động thật sự xảy ra khi bấm, và hình vẽ ra là hình nút | `CourseCard.tsx:336-344` (`Button variant="primary"`) · `ReactionButton.tsx:153-163` (`HeroButton variant="tertiary"`) |

**`default` (chữ chính, không mờ không tô) KHÔNG phải một bậc của thang này** — nó là mức
nền/baseline nằm NGOÀI escalation, và việc chọn `muted` hay `default` là việc của
`color/context.md` §2 (2 lớp câu hỏi §9a.1). Trục này chỉ bắt đầu tính từ chỗ có
**ý định làm nổi hơn baseline hoặc cố tình dìm xuống dưới nó**.

SSOT thang: không có union TypeScript riêng cho "prominence" (đây là quyết định Ở TRÊN
cấp component, chọn XONG rồi mới đi vào 1 trong ba atom `Typography`/`Chip`/`Button`).
Từng cơ chế có type riêng: `TypographyColor` (`Typography.tsx:33`), `ChipTone`
(`ChipBase.tsx:57`, alias của `AlertStatus`), `ButtonVariant` (`button-tokens.ts:22`).

**Chip ĐƯỢC nhận icon, nhưng CHỈ icon TRẠNG THÁI** (thầy chốt 2026-07-29).

Tài liệu cũ khai "text-only, cấm icon" là sai với code: `ChipBaseProps` cho phép ô glyph dẫn
đầu là `icon` HOẶC `dotColor`/`dotClassName` (loại trừ nhau ở kiểu, `ChipBase.tsx:115-130`), và
story atom dựng sẵn 4 ca `icon={...}`. Nhưng cấm hẳn cũng sai theo chiều ngược — luật đúng nằm
ở GIỮA, và ranh giới là **icon đó nói về TRẠNG THÁI hay nói về MIỀN**:

| Loại icon | Được? | Ví dụ |
|---|---|---|
| **Trạng thái cơ bản** — ai nhìn cũng hiểu ngay, không cần biết sản phẩm | ✅ | `Verified` · `Failed` · `Pending review` · `Locked` |
| **Icon của MIỀN** — chỉ có nghĩa khi đã biết nghiệp vụ | ⛔ | icon khoá học, icon bài tập, icon huy hiệu, icon loại tài liệu |

Vì sao cắt ở đó: chip là một **nhãn nhỏ đọc lướt**, và ô glyph của nó rộng đúng một ký tự.
Một dấu tick hay ổ khoá đọc được ngay ở cỡ đó vì hình nó **đã là nghĩa**. Một icon miền thì
phải tra nghĩa trước khi hiểu, mà chip lại nằm ở chỗ người ta không dừng lại để tra — nên nó
chiếm chỗ, thêm nhiễu, và **không thêm thông tin nào mà chữ `text` chưa nói**.

Cùng một phép thử với luật icon "quốc dân" (`icon/context.md` §2a): nhìn phát hiểu, hay phải
liên tưởng. Chip chỉ nhận vế đầu.

Nhãn `text` vẫn LUÔN bắt buộc (trừ skeleton) — icon không bao giờ thay được chữ.

---

## 2. CÂY QUYẾT ĐỊNH — hỏi từ trên xuống, dừng ở câu YES đầu tiên

| # | Hỏi | Ra |
|---|---|---|
| 1 | Bấm vào đây có **THẬT SỰ xảy ra một hành động** (submit, huỷ, chuyển trang) **VÀ** hình vẽ ra là **hình nút** (nền/viền riêng của atom `Button`)? | `button` — sang `button/context.md` chọn `variant` |
| 2 | (Không phải 1) Đây có phải một **TOKEN ĐÓNG KHUNG có nghĩa cố định** — enum/category/status/badge khuyến mãi — cho dù có bấm được hay không? | `chip` — sang `color/context.md` §2 chọn `tone` |
| 3 | (Không phải 2) Chữ này có mang **tín hiệu thương hiệu/tương tác** (link, "của tôi", active, pinned, verified) mà **không cần đóng khung**? | `accent` (text) |
| 4 | Còn lại — chữ phụ/trung tính, scalar đếm đứng riêng | `muted` |

**Bẫy khi trả lời câu 1:** "bấm được" KHÔNG đủ để ra `button` — phải hỏi ĐỦ 2 vế
(có hành động thật **VÀ** hình là hình nút). Một `Chip` bọc trong `Popover.Trigger`
bấm được thật (mở popover) nhưng hình vẫn là chip — dừng ở câu 2, không rơi xuống
câu 1. Xem BẪY #1.

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Tự thêm `onClick`/`onPress` thẳng lên `Chip` để giả làm nút (thay vì bọc `Popover.Trigger`/tách hẳn ra `Button`) | ✅ `tsc` — `ChipBaseProps` không khai `onClick`/`onPress`, chỉ có `onRemove` |
| 2 | Nhiều điểm nổi cùng lúc trong một vùng (accent-flood, §2c) | ⛔ không gate được — kỷ luật, phán đoán theo VÙNG không theo 1 phần tử |
| 3 | Cặp trái–phải có phân cấp thật nhưng render đồng bậc màu (§2b), trừ peer-row | ⛔ không gate được — kỷ luật, cần biết đây có phải phân cấp thật hay peer |
| 4 | Đổi CƠ CHẾ (element) của cùng một info-type giữa các state thay vì đổi TONE (§2d) | ⛔ không gate được — kỷ luật, cần đọc hiểu ngữ nghĩa info-type xuyên state |
| 5 | Chép câu chữ cũ ở bẫy #6/#7 (§4 tài liệu này) vào code/tài liệu mới mà chưa grep lại `ChipBase.tsx`/`chip.css` | ⛔ không gate được — kỷ luật |
| 6 | Viết class màu tay (`text-accent`, `bg-*-soft`) ngoài 3 atom `Typography`/`Chip`/`Button` để giả một trong bốn cơ chế | ⬜ CHƯA — trùng gate còn thiếu của `color/context.md` §6 dòng 1, chưa viết script riêng cho trục này |

**Việc chưa xong, ghi rõ để không rơi:** dòng 6 cần một gate AST đếm theo VÙNG (bao nhiêu
điểm `accent`/`chip`/`button` cùng xuất hiện trong một node cha), phức tạp hơn regex đơn —
tương tự việc `button/context.md` §6 dòng 2/3 đang thiếu vì cùng lý do "phải đọc theo cụm".

---
# PHẦN B · TRA KHI ĐÃ THẤY LỆCH — chỉ mở khi Phần A ra kết quả lệch
---

## 3. VÉT CẠN CA DỄ LẪN — đủ 6 cặp

Thang 4 giá trị ⇒ `C(4,2) = 6` cặp. Thứ tự dùng để chia nhóm: `muted → accent → chip →
button` (chìm nhất → nổi nhất, đúng thứ tự 4 câu hỏi của cây, đọc ngược từ dưới lên).

### 3a. Ba cặp KỀ NHAU — đây là toàn bộ trận đánh

| Cặp | Phép phân định DỨT KHOÁT | Neo |
|---|---|---|
| **`muted` ↔ `accent`** | Chữ này có mang **tín hiệu tương tác/thương hiệu** không, hay chỉ là dữ kiện trung tính? Có tín hiệu ⇒ `accent`. Trung tính, đứng riêng ⇒ `muted`. | `CourseCard` "482 học viên" (`muted`, trung tính) ↔ `SurfaceCard` `metaText` pinned/verified (`accent`, tín hiệu) |
| **`accent` ↔ `chip`** *(cặp NẶNG NHẤT — dễ lẫn nhất)* | Ý nghĩa này có **BỊ RÀNG BUỘC vào một tập giá trị cố định** (enum/status/category) cần TÁCH KHỎI dòng chữ để mắt nhận ngay "đây là một NHÃN", hay nó chỉ là MỘT CHỮ đọc liền trong câu? Ràng buộc + cần tách ⇒ `chip`. Đọc liền trong câu, không phải danh mục ⇒ `accent`. | `SurfaceCard.tsx:1398` `CheckCircleIcon` accent (tín hiệu "đã chọn", KHÔNG đóng khung) ↔ `PriceTag.tsx:141` `Chip tone="success"` (nhãn khuyến mãi, đóng khung, enum "có giảm giá") |
| **`chip` ↔ `button`** | Bấm vào có tạo ra một **HÀNH ĐỘNG THẬT** không (không phải chỉ mở thêm chi tiết của chính token đó), và hình vẽ có phải **hình nút** không? Cả hai đúng ⇒ `button`. Chỉ mở popover XEM THÊM về chính nó, hình vẫn là pill mềm ⇒ `chip`. | `PriceTag` `−X%` chip bọc `Popover.Trigger` (vẫn là `chip`, xem BẪY #1) ↔ `ReactionButton.tsx:153` `HeroButton variant="tertiary"` (đổi state thật, hình là nút) |

Các cặp cách từ 2 bậc trở lên (`muted` ↔ `chip` · `accent` ↔ `button` · `muted` ↔ `button`): phân vân ở đó là dấu hiệu cây vẽ sai, không phải chọn sai giá trị (luật xuyên trục 3 ở INDEX.md). Quay lại §2.

---

## 4. BẪY CẤU TRÚC — chọn đúng bậc nhưng vẫn sai, vì đọc sai cấu trúc

1. **Chip bọc trong control bấm được KHÔNG tự thăng cấp thành `button`.** Neo thật:
   `PriceTag.tsx:64-65,113-114,136-138` — "the `−X%` chip is ALWAYS a button that opens
   the popover", nhưng "the pressable/focusable button role lives on the canonical
   `Popover.Trigger` wrapper... so there is exactly ONE interactive element". Trục này
   hỏi HÌNH VẼ RA LÀ GÌ, không hỏi "có onClick không" — chip vẫn render bằng atom `Chip`
   (pill mềm), không đổi sang atom `Button`.
2. **Nhiều điểm nổi ĐÚNG cục bộ nhưng CẢ VÙNG mất tác dụng nổi (accent-flood, §2c).**
   Neo thật (`CourseCard` 2026-07-22): 3 dấu check xanh + chip `−55%` xanh + CTA hồng =
   4-5 điểm nổi cùng lúc trong một card — không điểm nào SAI giá trị (mỗi cái đứng một
   mình đều đúng bậc), nhưng cả cụm nhiễu tới mức mắt không đáp được "cái gì mới là thứ
   nổi ở đây". Sửa: hạ bớt xuống `muted`, giữ lại 1-2 điểm nổi. Bẫy này không sửa được
   bằng cây §2 (cây chỉ quyết 1 chỗ), phải nhìn CẢ VÙNG.
3. **Cặp trái–phải trong một hàng phân cấp phải LỆCH bậc, không đồng bậc (§2b).** Hàng
   có phân cấp thật (title ↔ meta, label ↔ value): bên MANG TÍN HIỆU nổi hơn, bên còn lại
   phải chìm xuống — không được cả hai cùng `accent` hay cùng `default` "cho cân". Ngoại
   lệ DUY NHẤT: peer-row (đồng cấp thật, vd hàng nav, hàng tag) — ở đó đồng bậc là ĐÚNG.
4. **Cùng một LOẠI dữ kiện phải escalate bằng TONE của MỘT cơ chế, không đổi CƠ CHẾ giữa
   các state (§2d, ✅ CHỐT).** Neo thật (`ContinueCard` 2026-07-22): `timeLeft` là `Chip`
   ở MỌI scenario; khi urgent, chỉ tone leo `neutral → warning`, chip vẫn là chip. ❌ Sai:
   "40 minutes left" render `muted` text ở state thường nhưng "2 minutes left" render
   `chip` ở state urgent — cùng info-type mà 2 CƠ CHẾ khác nhau, người dùng học lại cách
   đọc mỗi lần state đổi.
5. **`showAnatomy`/icon trạng thái không tự "mượn" độ nổi của phần tử đứng cạnh.** Neo
   thật (`SurfaceCard.tsx:1359-1363`): `leadingIcon` mặc định BÁM màu của label (không tự
   rơi xuống `muted`) — TRỪ khi `leadingIconColor` khai riêng vì icon đó mang nghĩa
   trạng thái (done/pass-fail). Đọc nhầm cấu trúc: tưởng icon luôn `muted` "vì nó chỉ là
   icon phụ" — sai, nó theo NGỮ CẢNH đang đứng cạnh cái gì.
6. **✅ ĐÃ CHỐT 2026-07-29: chip nhận icon TRẠNG THÁI, cấm icon MIỀN.** Xem §1 để biết luật
   đầy đủ và phép phân định.

   Hai bên đều sai một nửa, và đó mới là chỗ đáng học. Canon cũ (`principles.md` §2a) viết
   "STRICT — Chip = TEXT-ONLY, KHÔNG icon/logo" — sai, vì `ChipBase.tsx:109-130` có `icon`
   ngang hàng `dotColor` và `Chip.stories.tsx:150-169` dựng 4 ca chính thống. Nhưng đọc code
   rồi kết luận ngược lại thành "chip nhận icon" cũng sai, vì code chỉ nói **nhận được**, nó
   không nói **nên nhận cái gì**.

   Bài học chung: **code trả lời câu CÓ LÀM ĐƯỢC KHÔNG, không trả lời câu CÓ NÊN KHÔNG.**
   Một prop tồn tại không phải là một luật cho phép. Ranh giới ở đây (trạng thái vs miền) không
   nằm trong type, không grep ra được, và không suy được từ story — nó phải do người chốt.
7. **Canon cũ khai sai cả GIÁ TRỊ lẫn NƠI của luật typography chip.** `principles.md` §2a
   khai "`text-xs font-normal`, override trong `globals.css` (`.chip {...!important}`)".
   Đọc code thật: `chip.css:3` (HeroUI gốc) là `text-xs leading-5 font-medium` — cỡ chữ
   ĐÚNG (`text-xs` = .75rem) nhưng ĐỘ ĐẬM là `font-medium` (500), không phải "normal"
   (400); và **không có file nào** trong `.storybook/**` hay `src/app/globals.css` chứa
   một rule `.chip {...}` ghi đè — đã grep cả hai, không thấy. Luật này CHƯA từng được
   bake vào code, hoặc đã bị revert mà tài liệu không cập nhật theo.

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **`src` thật của chính component đang xét** (`ChipBase.tsx`/`PriceTag.tsx`/
   `SurfaceCard.tsx`/`ReactionButton.tsx`) — đọc code, không tin mô tả.
2. **Luật ngữ nghĩa đã CHỐT của thầy** (§2c restraint "mỗi vùng 1 thứ nổi", §2d "đồng bộ
   element, escalate bằng tone") — đây là quyết định BUSINESS về cách người dùng đọc một
   vùng, thắng trước cả cây khi cây và luật ngữ nghĩa đá nhau (vd cây nói "token cố định
   ⇒ chip" nhưng cả vùng đã có 4 điểm nổi rồi thì luật §2c thắng, hạ bớt xuống `muted`).
3. Cây quyết định §2 — đường lui khi (1) không tồn tại và (2) không áp được.
4. Câu chữ cũ được trích lại ở BẪY #6/#7 (§4 của tài liệu này) — **CHỈ dùng sau khi verify
   lại bằng (1)**, vì đã bắt được 2 lệch thật ở đúng hai bẫy đó. Không chép nguyên văn câu
   chữ cũ mà không grep lại code.

Neo cụ thể từng nhánh: [`example.html`](example.html).
