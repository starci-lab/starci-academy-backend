# Element — Button / CTA

> Canon nút. Bổ trợ [[elements/icon]] (cỡ icon trong nút) + [[elements/color]] (màu).

## 1. Variant theo VAI (HeroUI `Button variant=`)
- **`primary`** = hành động CHÍNH — **SOLID** (`bg-accent`, chữ/icon = `--accent-foreground` = **trắng**). **Tối đa 1 primary / surface.**
- **`secondary` / `tertiary` / `ghost` / `outline`** = hành động phụ/thứ cấp. Chọn secondary vs tertiary theo việc nút phụ CÓ đứng cạnh 1 primary không:
  - **`secondary`** = nút phụ **CẶP với 1 primary** trong cùng cụm (`[Huỷ secondary] [Lưu primary]`) — mượn sức nặng của primary cạnh nó.
  - **`tertiary`** = nút phụ **ĐỨNG MỘT MÌNH**, KHÔNG có primary cạnh (nút `+` cạnh ô search, filter/sort lẻ, "Sửa" lẻ) — tone quiet (foreground), không đòi chú ý. Đặt secondary một mình = nặng/ồn vô cớ.
  - `ghost` = trong suốt hoàn toàn (icon-only trong composer/toolbar đã có nền bao).
- **Destructive** (xoá…) = tách rõ (`danger`), KHÔNG để cạnh primary như ngang hàng.
- **CẤM tô màu nút bằng className** (`bg-*`/`text-*`) — màu do variant lo. Style nút chỉ ở variant/globals.

## 2. CTA chính = primary SOLID + `size="lg"` + ARROW
- **CTA chính PHẢI: `variant="primary"` + `size="lg"` + icon `ArrowRightIcon`.**
- **Icon CTA = ARROW (`ArrowRightIcon`) — đồng nhất, thay mọi icon CTA khác** (Play/Plus/Rocket…). Arrow = "đi tới / proceed", hợp mọi CTA. Thầy chốt 2026-06-26: *"nút CTA thì xài arrow hết"*. **Kể cả CTA mua/enroll/đăng-ký → arrow, KHÔNG cart** (thầy chốt lại 2026-06-29: giữ arrow cho đồng nhất, không ngoại lệ commerce).
- **Arrow đặt TRAILING** (`Label →`) — convention "đi tới". Cỡ icon theo text nút ([[elements/icon]] §3: leading=trailing, button text-sm → `size-5`).
- **Màu: SOLID, KHÔNG tint `/10`.** Tint `bg-accent/10` chỉ cho active/selected nhỏ ([[elements/color]] §2 + [[accent-system]]), KHÔNG cho CTA chính.
- **Nút KHÔNG icon = sub-CTA** → `size` md (mặc định), không lg → đọc như cấp dưới CTA chính.
  - **Áp cả khi 2 CTA đứng CẠNH NHAU (primary + secondary cùng cụm, không phải primary đứng riêng)** — CHỐT 2026-07-14: `CourseCard` enrolled có "Tiếp tục học" (primary) + "Xem khóa học" (secondary) cạnh nhau, bản đầu CẢ 2 đều `ArrowRightIcon` trailing → thầy hỏi lại *"2 dấu cta có nên không?"*. Đúng — arrow là tín hiệu của **1 CTA CHÍNH/bề mặt**, KHÔNG phải mọi nút bấm được. 2 arrow giống hệt cạnh nhau (dù variant/màu khác) làm nhạt hierarchy, đọc như ngang vai. Fix: bỏ arrow khỏi nút secondary, CHỈ primary giữ arrow — nút phụ không-icon tự đọc ra "cấp dưới" mà không cần thêm dấu hiệu khác.
- **1 surface tối đa 1 nút icon+lg** (CTA chính). 2 nút icon+lg cạnh nhau → 1 cái sai vai.

## 3. Ngoại lệ
- **FAB nổi** (rounded-full trên canvas, vd MindMap) · **thanh mobile compact** (CourseMobileEnrollBar) · **thanh toolbar/navbar-strip compact** (editor toolbar ở navbar bottom-layer) — context chật, giữ `md` (default), KHÔNG ép `lg` (nút lg làm strip cao/khó đoán height).
- **Icon-only** (không label) → BẮT BUỘC `aria-label`. Cỡ icon `size-5` mặc định.
- **Text bấm-được KHÔNG phải nút khối = `Link`** (href→navigate / `onPress`→overlay), KHÔNG `<button>`+style tay.

## 4. Control-button trong item/block LẶP-ĐƯỢC: reorder = `tertiary` · delete = `danger-soft` (STRICT)
- Header của 1 item/block lặp-được (RepeatableItemCard, block card) có cụm **↑↓ (đảo thứ tự) + xoá**. Phân vai màu theo NGHĨA, KHÔNG để chung `ghost` (không phân biệt destructive):
  - **↑↓ (move up/down) = `variant="tertiary"`** (thao tác phụ, trung tính, quiet).
  - **Xoá/remove = `variant="danger-soft"`** — đỏ **MỀM** (tint), KHÔNG `danger` ĐẶC. Trash lặp lại nhiều item/block → danger đặc quá loud/đỏ chói; `danger-soft` vẫn đọc ra destructive mà không hét. Thầy chốt 2026-07-06.
  - Áp cả cấp **item** (RepeatableItemCard) LẪN **block lớn** (block card header — block cũng có ↑↓ đảo thứ tự cả block, không chỉ item).
- Phân biệt với §1 "destructive = `danger`": nút xoá **ĐƠN LẺ, nổi bật** (vd xoá tài khoản, huỷ đơn) = `danger` đặc; nút xoá **lặp trong list control** (item/block) = `danger-soft` (mềm, đỡ chói khi nhiều).

## 4b. Nút TOGGLE 2 trạng thái (thêm↔đã-thêm) — trạng thái "đã có, bấm để GỠ" = `danger-soft` (LUÔN, bất kể variant lúc "thêm"), icon X LEADING, KHÔNG bookend 2 icon (CHỐT 2026-07-14, 2 lượt đính chính cùng ngày)
- **1 nút toggle "thêm X / đã có X, bấm để gỡ" (add-to-cart, follow/unfollow, save/unsave…) — khi ở trạng thái ĐÃ CÓ (nghịch), đổi sang `variant="danger-soft"`** (đỏ MỀM/tint — cùng họ §4 "delete lặp trong list = `danger-soft`", KHÔNG phải `danger` đặc, và KHÔNG giữ nguyên variant "thêm" như `secondary`/`tertiary`). Icon = **X LEADING** (trailing side không icon phụ) + nhãn hành động thật ("Bỏ khỏi giỏ"/"Bỏ theo dõi"), KHÔNG bookend 2 icon (vd `CheckIcon` đầu báo trạng thái + `TrashIcon` cuối báo hành động) — 2 icon 2 đầu đọc rối, không rõ cái nào là NÚT BẤM. 1 icon + 1 nhãn = 1 hành động rõ ràng.
- **Đính chính lượt 1 (2026-07-14):** thử `variant="danger"` (đặc) trước, thầy bác: *"sao trò không nghĩ tới việc cái nút bỏ khỏi giỏ để variant secondary thôi"* → đổi sang giữ nguyên `variant` caller truyền (khỏi tô màu gì cả).
- **Đính chính lượt 2 (2026-07-14, cùng ngày):** lượt 1 đi hơi xa — thầy chỉnh lại: *"ý là danger-soft ấy trò"*. Tức là: gỡ khỏi giỏ VẪN là 1 hành động destructive (bỏ 1 item khỏi giỏ = mất lựa chọn đó), chỉ là loại destructive LẶP LẠI/thường xuyên (mỗi item trong giỏ đều có thể gỡ) — đúng nhóm §4 "xoá lặp trong list control = `danger-soft`", không phải nhóm "giữ variant trung tính" (lượt 1 hiểu sai) cũng không phải nhóm "xoá đơn lẻ nổi bật = `danger` đặc". `danger-soft` là điểm cân bằng: vẫn ĐỌC RA destructive (tint đỏ), nhưng không chói khi lặp lại nhiều nút cùng lúc (catalog nhiều card).
- Áp: `AddToCartButton` (`features/cart`) — trạng thái `inCart`: `variant={inCart ? "danger-soft" : variant}` (ghi đè variant caller truyền, KHÔNG giữ nguyên) + `<XIcon/> "Bỏ khỏi giỏ"` (key i18n `cart.remove` có sẵn). Áp cả bản đầy đủ (label+icon) lẫn bản `iconOnly` (catalog card).
- Áp (2026-07-14): `CartLine` (`features/cart/CartView/CartLine`) — nút xoá item icon-only trong giỏ đổi `variant="tertiary"`→`variant="danger-soft"` (giữ `TrashIcon`, đây là nút XOÁ chuyên dụng không phải toggle nên KHÔNG đổi sang X). Thầy chỉ trên ảnh `MiniCartDrawer`, nhưng `CartLine` DÙNG CHUNG cho cả drawer LẪN trang `/cart` (`CartView`) → cả 2 bề mặt cùng đổi (nhất quán, không tách được vì 1 component). Cùng nhóm "delete lặp trong list" với §4 — mỗi dòng giỏ đều có 1 nút xoá.
- Phân biệt §4: đây là 1 NÚT tự đổi vai theo STATE của chính nó (add↔remove cùng 1 chỗ), không phải 2 nút cố định cạnh nhau trong header lặp-được — nhưng CÙNG mức màu `danger-soft` với §4 delete vì cùng lý do (destructive nhưng lặp lại nhiều chỗ, không nổi bật đơn lẻ).

## 5. Nút màu WARNING (không có variant) = inline `--button-bg` (KHÔNG className `bg-*`)
- HeroUI Button **KHÔNG có `variant="warning"`**. Muốn nút warning (vàng) → `variant="ghost"` + **inline `style`** override `--button-bg` / `--button-bg-hover` / `--button-color` (`var(--warning)` + `--warning-foreground`). KHÔNG `bg-warning` className (base `.button` đổ nền qua **`--button-bg` var**, className `bg-*` thua — [[elements/card]] §3f gotcha). Dùng cho **CTA trong alert warning** (nút tô màu theo status alert — [[elements/alert]] §4).

## 6. Hàng nút hành động trong container HẸP (rail/panel/card phải) = 1 HÀNG, KHÔNG `flex-wrap` (STRICT)
- Hàng nút trong vùng hẹp = `flex w-full items-center gap-2` (KHÔNG `flex-wrap` — wrap đẩy nút rớt hàng = sai). Ép 1 hàng + truncate nhãn dài.
- **Primary (CTA, nhãn ngắn) = `shrink-0`** (đọc trọn, không truncate; icon trong nút cũng `shrink-0`).
- **Secondary (nhãn dài) = `min-w-0 flex-1`** + nhãn bọc `<span className="truncate">` → lấp phần còn lại, dài quá thì ellipsis. `min-w-0` BẮT BUỘC (mặc định `min-width:auto` chặn truncate).
- Phân vai: cái-phải-đọc-trọn (primary) = `shrink-0`; cái-chịu-cắt (secondary/label dài) = `flex-1` + truncate. Ref [[interactive-needs-hover]].

## 6b. Nút `tertiary` full-width ĐỨNG MỘT MÌNH (sidebar/rail dọc) = căn TRÁI + truncate, không dùng center mặc định — CHỐT 2026-07-08
- **Base `.button` mặc định `justify-center`** — hợp cho nút hug-content (CTA, action ngắn), nhưng khi ép `fullWidth`/`w-full` cho 1 nút ĐỨNG RIÊNG (không cặp icon-chỉ-báo bên phải như Select) trong sidebar/rail dọc (vd "Mẫu", "Trợ lý AI", "Dán CV có sẵn" trong CV editor), center làm icon+label trôi giữa khoảng trắng, đọc như "đang canh giữa cho đẹp" thay vì đọc tự nhiên trái→phải như mọi field/label khác cạnh nó.
- **Fix:** `className="w-full justify-start"` (đè `justify-center` base) + label bọc `<span className="min-w-0 flex-1 truncate text-left">` (icon `shrink-0` đứng trước). `flex-1` lấp hết chỗ trống còn lại nên bản thân đã "căn trái" bất kể `justify-*` — 2 lớp phòng hờ (label ngắn vẫn neo trái qua `justify-start`, label dài tự cắt qua `truncate`).
- Phân biệt §6 (hàng NHIỀU nút ngang, primary/secondary cùng hàng): đây là **1 nút full-width đứng riêng, xếp DỌC** trong sidebar — không có nút thứ 2 cùng hàng để so đo shrink-0/flex-1.
- Áp đầu: CV editor sidebar — "Mẫu" (`Button tertiary fullWidth`), "Trợ lý AI" (`GradeModelDropdown isButton isButtonFullWidth` — [[credit-unified-pool-ui]] §GradeModelDropdown trigger styles), "Dán CV có sẵn"/"Chỉnh theo tin tuyển dụng" (`Button tertiary className="w-full justify-start"`).

## 6c. Nút gọi API/async = `isPending` (HeroUI idiom) + spinner thay icon, KHÔNG tự chế `isDisabled`+ternary — CHỐT 2026-07-08
- **Nút bấm → chạy async (tạo session, submit, mua...) PHẢI dùng prop `isPending` của HeroUI Button** (react-aria bên dưới → set `data-pending` → CSS `status-pending` tự dim + CHẶN press khi đang chạy). KHÔNG tự quản `isDisabled={isMutating}` + ternary icon ngoài — đó là chế lại thứ HeroUI đã có.
- **HeroUI Button KHÔNG tự render spinner** (khác v2 `isLoading`). Phải TỰ đặt `<Spinner>` qua **render-prop children**: `{({ isPending }) => (<>{isPending ? <Spinner size="sm" color="current" /> : <Icon/>}{label}</>)}`. `color="current"` để spinner theo màu chữ nút (primary→trắng). Idiom đã dùng: `ChallengeSubmissionPanel/SubmissionRow`.
- **Nhiều nút CHIA CHUNG 1 mutation** (vd 2 nút start qna/design cùng `startSessionSwr`) → 1 state `startingMode` theo dõi nút NÀO đang chạy: nút được bấm `isPending={startingMode===x}`, nút kia `isDisabled={startingMode!==null && startingMode!==x}`. Bare `isMutating` cho cả 2 = quay CẢ HAI khi bấm 1 (sai).
- **Reset pending:** lỗi/return sớm → set `startingMode=null` (nút quay lại). Thành công mà NAVIGATE đi (unmount) → KHÔNG reset (để spinner biến mất cùng lúc unmount, tránh flash icon 1 frame trước khi route swap).
- Thầy chốt (Mock Interview): *"khi bấm nút gọi api tạo session thì cái cửa sẽ thay bằng hiệu ứng quay quay"* → icon `DoorOpenIcon` swap sang `Spinner` khi `isPending`.

## 7. Hàng nút "THANG" (rating/grade/độ-khó) = 1 treatment NHẤT QUÁN theo ramp (STRICT)
- Hàng nút biểu thị 1 THANG bậc (Again/Hard/Good/Easy · độ khó) = cùng 1 "da", khác nhau CHỈ ở hue theo ramp — KHÔNG mỗi nút 1 variant (solid/outline/ghost lộn xộn = "không đều màu"). Chuẩn: tất cả **soft-tint `bg-token/10 text-token`**, hue chạy ramp (đỏ→cam→xanh-lá→accent: Quên `danger` · Khó `warning` · Được `success` · Dễ `accent`).
- **Equal-width lấp ô:** `grid grid-cols-4` + nút `w-full` (mobile `grid-cols-2`), KHÔNG hug-content + `justify-between`.
- **Dùng plain `<button>` + utility tint, KHÔNG HeroUI `Button`** — Button chỉ có ramp 1 màu, style unlayered ĐÈ utility `bg-token/10` (tint không ăn — gotcha [[item-card-meta-inside-bounded-object]]). Block sở hữu style (vd `RatingBar`).

## 8. Cụm nút NỐI LIỀN (segmented) = HeroUI `ButtonGroup`/`ToggleButtonGroup` NATIVE, separator ĐẶT TRONG button theo sau — CHỐT 2026-07-15
- **Muốn 1 cụm nút dính liền (segmented control / item + hành động kèm `[chọn | 🗑 | ⋮]`) = dùng `ButtonGroup` (hoặc `ToggleButtonGroup` nếu là single-select toggle) NATIVE** — nó tự lo touch + bo góc 2 đầu (`:first-child` rounded-s, `:last-child` rounded-e, giữa `rounded-none`). ĐỪNG tự chế `divide-x` + `overflow-hidden` + `!rounded-none` bằng tay.
- **Separator native (`ButtonGroup.Separator`) PHẢI đặt BÊN TRONG button theo sau, KHÔNG phải sibling giữa 2 button.** Lý do: `.button` base là `position: relative`, còn separator là `position:absolute; left:-1px` → nó bám mép trái của button chứa nó = đúng mối nối. Đặt sibling (group không `relative`) → dồn về mép trái, vỡ. (Đã verify trên docs HeroUI.)
- **Full-height + màu chuẩn:** separator native mặc định chỉ cao 50% (`top:25% height:50%`) và màu `bg-current opacity-15` (lấy 15% màu chữ → trông "lạ"). Override: `className="!top-0 !h-full !bg-border !opacity-100"` → cao full + đúng token `--border` (khớp mọi divider khác). ⚠️ `--border` ở dark (L28) ≈ fill `--default` (L27.4) nên mờ trên nút filled — nếu cần rõ ở dark cân nhắc `--separator`.
- **Selected trong ToggleButton = built-in `bg-accent-soft` + `text-accent-soft-foreground`** (token riêng của toggle-button, không cần override) — khớp §7 [[elements/color]].
- **Nút trong cụm filled đồng nhất = `secondary` (chọn, chữ accent) / `tertiary` (chưa chọn + nút hành động, chữ neutral)** — KHÔNG để `ghost` cho item chưa chọn (nó trong suốt, hụt so với các nút filled cạnh nó). Cả 2 variant nền `--default`, phân biệt bằng màu CHỮ.
- Ca thật: `FlexWrapButtonRadio` — `itemAction` render mỗi item thành 1 `ButtonGroup` `[chọn | 🗑 | ⋮]`, component TỰ inject `<ButtonGroup.Separator/>` vào đầu children mỗi nút hành động (caller chỉ trả nút thường). Đã BỎ prop `color`/`insideCard`/`segmented` (dead API / tự chế) khỏi block này.

## Liên quan
- [[elements/icon]] (arrow trailing, cỡ theo text) · [[elements/color]] (primary solid + accent-fg trắng; active tint; §7 soft-foreground) · [[elements/alert]] (nút CTA trong alert theo status) · [[editor-shell-navbar-toolbar-fullheight-sidebar-and-control-button-semantics]] (draft nguồn).
