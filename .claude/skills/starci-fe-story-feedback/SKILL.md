---
name: starci-fe-story-feedback
description: >
  Vòng QA 2 lượt cho FEEDBACK CODE/CẤU TRÚC (không phải content/copy) thầy đưa ra khi soi 1
  story/component trong Storybook design-system — vd bắt CSS phức tạp viết trần ở block, prop
  đặt tên sai/kiểu ẩn danh, thiếu state/prop, vi phạm tầng canon. LƯỢT 1: ghi nhớ nguyên văn
  feedback → hỏi lại xác nhận hiểu đúng + tầng sẽ sửa (atom/frame/composite — KHÔNG BAO GIỜ
  block/screen cho CSS phức tạp) TRƯỚC khi đụng code → chờ thầy "chốt" → sửa ĐÚNG 1 chỗ cụ thể
  thầy chỉ → chờ thầy chốt lần 2 xác nhận fix đúng. LƯỢT 2 (chỉ sau khi lượt 1 đã chốt): quét —
  scope CỐ ĐỊNH = TOÀN BỘ `.storybook/**` (components + stories, không phải `src/` app thật) —
  tìm cùng pattern → liệt kê danh sách nghi vấn (KHÔNG sửa vội). Bước quét này BẮT BUỘC, KHÔNG
  ĐƯỢC suy luận bỏ qua kể cả khi fix lượt 1 ở tầng atom và "có vẻ" tự lan — vẫn phải grep ra
  danh sách thật làm bằng chứng. → chờ thầy chốt danh sách → mới áp sửa hàng loạt + verify
  (tsc/9 gate/eslint/restart Storybook). Sau khi CẢ 2 lượt đã chốt: ghi lại vào
  `.claude/fe/steps/13-feedback-anatomy-
  registry.md` (nhật ký) VÀ canon `.claude/fe/rules/*.md` + `principles.md` (SSOT, neo ngày +
  before/after cụ thể). Dùng khi thầy gõ `/starci-fe-story-feedback` (kèm hoặc không kèm
  feedback cụ thể trong cùng câu), hoặc bất cứ lúc nào thầy sửa lưng trò về 1 quyết định CODE
  trong Storybook đang build/soi. KHÔNG phải audit chủ động đi tìm lỗi (đó là
  `starci-fe-story-audit`/`starci-fe-atom-audit`) — đây là PHẢN ỨNG với 1 câu feedback thầy vừa
  đưa. KHÔNG dùng cho feedback CONTENT/COPY (chữ/số/field dữ liệu sai) — loại đó sửa thẳng,
  không cần vòng QA 2 lượt.
---

# /starci-fe-story-feedback — vòng QA 2 lượt cho feedback CODE trong Storybook

> **Canon SSOT:** `.claude/fe/principles.md` §9 (chữ qua Typography) · §13 (ranh giới tầng,
> composite/block/screen không hand-roll CSS phức tạp) · `.claude/fe/rules/3-shape-tier.md`
> (tầng nào sở hữu gì, "className để restyle" bị cấm ở đâu).
> **Nền:** [`diagnose-before-fix`](../../discipline/diagnose-before-fix.md) (hiểu đúng feedback
> trước khi sửa) · [`safe-bulk-edit`](../../discipline/safe-bulk-edit.md) (lượt 2 = sweep, liệt
> kê hết + chờ chốt trước khi áp) · [`multi-session-git`](../../discipline/multi-session-git.md)
> (canon là file CHUNG nhiều session — fetch trước khi ghi).
> **Code:** `D:\Repositories\starci-academy\.storybook` (branch `mtp`).

## Trước tiên: đây có phải feedback CODE không?

Feedback thầy chia 2 loại, xử lý khác hẳn nhau:

| Loại | Ví dụ | Xử lý |
|---|---|---|
| **CONTENT/COPY** | chữ sai chính tả, số liệu sai, thiếu 1 field dữ liệu, icon sai loại | **KHÔNG chạy skill này.** Sửa thẳng, verify nguồn thật (`src/messages/*.json`, component gốc), báo lại. Không cần 2 lượt QA — copy chỉ có ĐÚNG/SAI, không có "tầng nào sở hữu". |
| **CODE/CẤU TRÚC** | CSS phức tạp viết trần ở block, prop đặt tên lệch, thiếu state/prop cần có, vi phạm tầng, kiểu ẩn danh, chọn sai cơ chế (spinner vs skeleton…) | **Chạy skill này**, đủ 2 lượt bên dưới. |

Không chắc thuộc loại nào → hỏi thầy trước khi chọn nhánh, đừng tự đoán.

## ⛔ Luật cứng

- **KHÁCH QUAN TƯ DUY, không theo ý thầy VÀ không tự ái bảo vệ ý mình.** (thầy chốt 2026-07-29,
  sau ca gap-system: thầy đưa ảnh Facebook phản bác 1 luật vừa đề xuất — đúng phép thử xem có tự
  đổi ý theo cảm tính không). Khi có bằng chứng MỚI xuất hiện (ảnh, ví dụ đối chứng, nguồn khác):
  ĐI KIỂM CHỨNG bằng dữ liệu đo được (đọc DOM/CSS thật, không đoán từ ảnh chụp), rồi kết luận dựa
  trên bằng chứng — không phải "thầy nói vậy nên đổi" và cũng không phải "tôi đã nói vậy nên giữ
  nguyên". Hai lỗi đối xứng đều bị cấm.
- **KHÔNG tổng quát hoá 1 luật CANON từ ĐÚNG 1 nguồn/1 ví dụ.** Nếu chỉ có 1 file `src` hay 1 lần
  quan sát làm căn cứ, ghi rõ "neo vào ĐÚNG case này" — không viết thành luật "universal"/"mọi
  chỗ đều vậy". Muốn nâng thành luật canon-wide phải có ≥2 nguồn ĐỘC LẬP xác nhận cùng kết luận,
  hoặc phải nói rõ "chưa đủ nguồn, đây là quy tắc cho case cụ thể, không phải luật chung".
- **PHẢN BIỆN, không phải vâng dạ.** Nhận feedback KHÔNG có nghĩa là đồng ý ngay rồi đi sửa —
  đọc code/nguồn thật, tự kiểm chứng đúng-sai, và nếu có góc nhìn/bằng chứng khác thì NÓI RA,
  kèm bằng chứng cụ thể (`file:line`, hoặc nguyên lý ngành đã được đặt tên — type scale,
  byline pattern…). Thầy hỏi ngược để kiểm tra hiểu đúng bản chất chứ không chỉ chép lại y
  nguyên — trả lời hời hợt hoặc chỉ vâng dạ là KHÔNG đạt. Nếu sau khi tra cứu thấy feedback
  đúng, XÁC NHẬN LẠI kèm bằng chứng (không phải "vâng thầy đúng"); nếu thấy chưa khớp, nói rõ
  KHÔNG khớp ở đâu và tại sao, để thầy quyết định cuối cùng — không tự động chiều theo hướng
  thầy gợi ý chỉ vì đó là thầy nói.
- **KHÔNG tự "chốt" thay thầy.** Mọi mốc "chốt" trong skill này phải là LỜI THẦY thật trong
  chat (`chốt`, `ok`, `đúng rồi`, hoặc tương đương rõ ràng) — im lặng / thầy chuyển sang chủ đề
  khác KHÔNG được suy diễn là đồng ý.
- **KHÔNG sửa vượt phạm vi đã chốt.** Lượt 1 chỉ sửa ĐÚNG 1 chỗ thầy chỉ ra — thấy chỗ khác
  giống hệt cũng KHÔNG tiện tay sửa luôn, để dành cho lượt 2 (có danh sách, có chốt riêng).
- **CSS phức tạp (arbitrary-value `[...]`, pseudo-class `group-hover:`/`peer-*`, animation) chỉ
  được đóng gói ở tầng atom, frame ("layouts"), hoặc composite — KHÔNG BAO GIỜ ở block/screen.**
  Một prop `className` passthrough CÓ SẴN ở khung KHÔNG miễn trừ luật này — khung phải sở hữu
  nó bằng 1 PROP RIÊNG có tên (neo: `Stack.nested`, 2026-07-28). Nếu fix đề xuất là "nhét CSS
  qua className có sẵn", đó vẫn là vi phạm, quay lại tìm prop/atom mới.
- **"Tin code chứ không tin concepts"** — khi 1 lựa chọn UI cụ thể của `src` thật (vd `Spinner`
  cho đúng 1 case) đụng độ với 1 QUY ƯỚC NỘI BỘ đã lặp lại ở MỌI nơi khác trong Storybook (vd
  `isSkeleton` ở mọi block khác), quy ước nội bộ thắng — trừ feedback về CHỮ/COPY, ở đó khớp
  `src` luôn thắng tuyệt đối.
- **Kiểu dữ liệu (type) luôn có TÊN** — không intersection ẩn danh tại chỗ khai prop.
- Canon (`principles.md`, `rules/*.md`) là file CHUNG — `git fetch` + xem `HEAD..origin/mtp`
  trước khi ghi (đừng đè bản của session khác).
- **Đừng lái Storybook qua Browser pane để soi mắt** ở bước verify — chậm/treo, để thầy tự xem
  sau khi báo xong; chỉ cần `preview_logs` xác nhận build không lỗi.
- ⭐ **KIỂM TỒN ĐỌNG TRƯỚC KHI TRẢ LỜI** (thầy chốt 2026-07-29, sau ca `ContentPager` hover: đề
  xuất "href = group-underline, bỏ ripple" đã được nêu và thầy KHÔNG bác, nhưng bị lạc giữa
  chừng khi trò rẽ sang việc gộp `.Pressable` — chưa bao giờ áp — rồi thầy phải hỏi lại 2 lượt
  sau khi thấy render vẫn ripple). **TRƯỚC MỌI round 1a/1b**, quét đủ 3 nguồn:
  1. `.claude/fe/steps/13-feedback-anatomy-registry.md` — feedback/quyết định nào đã ghi cho
     ĐÚNG file/component đang bị chỉ ra, đặc biệt mục có chữ "CHƯA áp"/"để dành"/"chưa quay
     lại" — đây chính là loại tồn đọng hay bị rơi.
  2. `principles.md` + `rules/*.md` — luật nào đã chốt liên quan tới đúng pattern này.
  3. Lượt hội thoại TRƯỚC trong CÙNG phiên — có đề xuất nào đã trình ra, thầy chưa bác bỏ,
     nhưng cuộc trò chuyện rẽ hướng (vd đổi sang 1 refactor lớn hơn) khiến đề xuất đó chưa bao
     giờ thực sự được áp?
  Nếu tìm thấy tồn đọng khớp — nói THẲNG ngay trong câu trả lời ("đây đúng là đề xuất từ lượt
  trước, chưa áp vì rẽ sang việc X") thay vì coi như feedback hoàn toàn mới rồi đi lại từ đầu.
  Bỏ qua bước này là cách chắc chắn nhất để lặp lại đúng lỗi vừa xảy ra.

---

## LƯỢT 1 — 1 chỗ cụ thể (ghi nhớ → hỏi confirm → sửa → chốt)

### 1a. Ghi nhớ nguyên văn
Chép lại đúng câu feedback thầy vừa nói + file/dòng/component đang nói tới (nếu thầy không nêu
rõ, hỏi lại "chỗ nào cụ thể" trước khi đoán).

### 1b. Chẩn đoán + đề xuất — HỎI LẠI TRƯỚC KHI SỬA
Đọc code thật tại chỗ bị chỉ ra. Trả lời 3 câu hỏi, viết ra cho thầy xem (không chỉ nghĩ trong
đầu):
1. **Cái gì đang sai?** — trích đúng đoạn code, gọi tên đúng loại lỗi (CSS phức tạp ở sai tầng
   · prop lệch tên · thiếu state · kiểu ẩn danh · chọn sai cơ chế…).
2. **Sửa đúng nghĩa là gì?** — nếu là CSS-sai-tầng: tên PROP MỚI sẽ thêm + tầng nó thuộc về
   (atom/frame/composite) + atom/frame nào sẽ giữ nó. Không đề xuất "route qua className có
   sẵn" — luật cấm ở trên.
3. **Còn chỗ nào khác NGHI giống vậy không** (chỉ liệt kê tên, KHÔNG đi sửa) — dọn đường cho
   lượt 2, đừng điều tra sâu ở bước này.

Hỏi thầy xác nhận đúng hiểu — **DỪNG, chờ thầy "chốt".**

### 1c. Sửa đúng 1 chỗ
Chỉ sau khi thầy chốt (1b). Implement đúng như đã trình bày (không đổi ý giữa chừng). Verify
nhanh: `tsc --noEmit` chỉ soi file vừa đổi đủ dùng ở bước này (chưa cần full-suite).

### 1d. Báo lại — chờ chốt lần 2
Trình bày diff/kết quả, hỏi thầy xác nhận fix đúng ý. **DỪNG, chờ thầy chốt.** Chưa chốt →
quay lại 1b/1c, đừng tự tiến sang lượt 2.

---

## LƯỢT 2 — quét đồng bộ toàn Storybook (chỉ sau khi lượt 1 đã chốt)

### 2a. Quét (read-only, KHÔNG sửa) — BẮT BUỘC scope TOÀN BỘ `.storybook/**`, không được suy diễn bỏ qua
**Scope cố định = toàn bộ `.storybook/**`** (cả `components/` lẫn `stories/`) — không phải
`src/` (app thật, cây riêng chưa sync). Grep/search HẾT cây đó tìm cùng pattern đã sửa ở lượt 1
(cùng chuỗi CSS · cùng kiểu prop lệch · cùng cơ chế sai). Liệt kê **TẤT CẢ hit** (`file:line` +
đoạn code + vì sao khớp/không khớp — có false positive thì loại và nói rõ vì sao loại, đừng âm
thầm bỏ qua).

⚠️ **Bước quét này KHÔNG BAO GIỜ được bỏ qua bằng suy luận** — kể cả khi fix lượt 1 nằm ở TẦNG
ATOM và "nhìn có vẻ" sẽ tự lan ra mọi call-site (thầy chốt 2026-07-29, sau ca lỗi
`Typography.weight`: dù sửa atom đúng là tự khớp lại UI cho mọi consumer, VẪN phải chạy grep
thật liệt kê hết những consumer đó ra thành danh sách — không được kết luận "coi như xong,
không có danh sách" chỉ vì suy luận logic. Danh sách là BẰNG CHỨNG cho thầy xem, không phải thứ
có thể thay bằng lý luận).

### 2b. Trình danh sách — chờ chốt
Đưa danh sách cho thầy, gắn kèm cách sửa (thường là gọi lại đúng prop/atom vừa thêm ở lượt 1).
**DỪNG, chờ thầy chốt danh sách** trước khi sửa bất kỳ file nào trong đó.

### 2c. Áp sửa hàng loạt
Sau khi chốt: sửa từng file theo đúng cách đã duyệt (dùng lại đúng prop/tên vừa thêm ở lượt 1,
không phát minh biến thể mới cho từng file).

### 2d. Verify full
- `npx tsc --noEmit` (từ FE repo) — sạch.
- Chạy đủ 9 gate: `check-no-namespace` · `check-story-ids` · `check-seams` ·
  `check-inline-types` · `check-padding` · `check-one-instance-per-state` ·
  `check-member-as-state` · `check-orphan-parts` · `check-passthrough-block` — xanh hết,
  không bỏ sót gate nào dù tưởng "chắc không liên quan".
- `eslint --fix` trên toàn bộ file đã đổi ở CẢ 2 lượt.
- Restart Storybook (`preview_stop` → `preview_start` tên `storybook`) — watcher Windows hay
  kẹt khi đổi story; `preview_logs` xác nhận build không lỗi. Không tự lái browser soi mắt.

---

## SAU KHI CẢ 2 LƯỢT ĐÃ CHỐT — ghi lại (bắt buộc, đừng bỏ qua)

1. **`.claude/fe/steps/13-feedback-anatomy-registry.md`** — thêm mục mới (theo mạch §2x hiện
   có): feedback nguyên văn (rút gọn) → chẩn đoán → fix (tên prop/atom mới) → danh sách lượt 2
   đã sửa → kết quả verify.
2. **Canon SSOT** (`principles.md` + `rules/3-shape-tier.md`, hoặc rule file khác nếu đúng chủ
   đề hơn) — `git fetch` trước, thêm đoạn NEO có ngày, trích code before/after cụ thể, và câu
   LUẬT CHUNG rút ra (không chỉ chép lại ca cụ thể — phải khái quát đủ để áp cho ca tương lai
   khác hình nhưng cùng bản chất).
3. Nếu feedback phát sinh 1 bài học không thuộc case CSS-sai-tầng (vd quy tắc đặt tên, quy tắc
   chọn cơ chế) → vẫn ghi, nhưng KHÔNG ép vào khuôn "CSS phức tạp" — ghi đúng bản chất luật đó.

## Ra cuối lượt
Báo thầy: cả 2 lượt đã chốt chưa · danh sách file đã sửa (lượt 1 + lượt 2) · kết quả verify ·
đã ghi steps + canon ở đâu. Nếu skill dừng giữa chừng (chưa chốt lượt 2) → nói rõ đang ở lượt
nào, đừng để lần gọi sau phải đoán lại từ đầu.
