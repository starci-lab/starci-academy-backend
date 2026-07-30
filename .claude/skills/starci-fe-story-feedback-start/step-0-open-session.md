# B0 — MỞ PHIÊN

> **Phạm vi:** một lần cho cả phiên. Read-only, chưa sửa dòng code nào.

Bước này tồn tại vì một lý do đo được: phiên feedback hay vắt qua nhiều cửa sổ context, và thứ
duy nhất sống sót qua ranh giới đó là **file trên đĩa**. Neo 2026-07-29: một đề xuất đã trình,
thầy không bác, nhưng cuộc trò chuyện rẽ hướng nên nó **chưa bao giờ được áp** — thầy phải hỏi
lại hai lượt sau mới lộ ra. File phiên là thứ chặn đúng lỗi đó.

---

## VÀO

Tên đích thầy đưa: một story, component, page hoặc overlay.

## LÀM

**1. Tra `storyId` THẬT, cấm đoán.**

```bash
curl -s http://localhost:6006/index.json
```

Id thật có tên thư mục lặp (`frames-cluster-cluster-base--gaps`), và kebab không theo trực giác
(`Link.SeeMore` ra `link-seemore`, không phải `link-see-more`). Đoán theo title là trượt, mà
trượt kiểu **gãy câm** — không lỗi build nào báo.

Storybook chưa chạy thì bật (`preview_start` tên `storybook`, cổng 6006). Cổng bị chiếm thì
**kill rồi chạy lại**, đừng né sang cổng khác: tìm PID bằng `Get-NetTCPConnection -LocalPort
6006`, xác minh là `node.exe`, rồi `Stop-Process -Force`.

**1.5. Nạp nghiệp vụ ĐÚNG MỘT miền, trước khi soi bất kỳ pixel nào.** Mở
`starci-academy/.artifacts/domain/INDEX.md`, tìm đích đang mở phiên khớp miền nào, rồi đọc đúng
file `domain/<miền>.md` đó — không đọc cả chín miền. Đây là bước giống hệt nhánh A/B của
[`starci-fe-story-create/step-1-intent.md`](../starci-fe-story-create/step-1-intent.md) (dùng
lại, không viết luật domain-grounding riêng lần hai): domain/ là **bản đồ để tra nhanh**, không
phải trọng tài — nghiệp vụ thật vẫn là backend entity + layout `src` thật, domain/ chỉ rút gọn
đường tới đó. Thấy miền này nằm trong danh sách "15 chỗ backend-FE nói ngược nhau" của
`INDEX.md` thì **ghi cả hai phía vào `session.md`**, đừng tự chọn bên nào đúng.

**2. Kiểm tồn đọng trước khi làm gì thêm.** Quét bốn nguồn xem đích này đã có nợ cũ chưa:

- `.artifacts/feedback/` — có phiên nào **chưa đóng** trên cùng đích không? Có thì **mở tiếp
  phiên đó**, đừng đẻ phiên thứ hai.
- **`.artifacts/feedback/<đích-slug>/audit.md`** — có bản audit đã CHỐT của đích này không? Xem
  mục 2b dưới, đây là chỗ tránh quét lại toàn bộ.
- `principles/<trục>/context.md` — luật nào đã chốt cho đúng pattern này.
- Lượt hội thoại trước trong cùng phiên chat — đề xuất nào đã trình, thầy chưa bác, mà chưa
  bao giờ áp.

Tìm thấy tồn đọng thì **nói thẳng ngay** ("đây là đề xuất từ lượt trước, chưa áp vì rẽ sang
việc X"), đừng coi như feedback hoàn toàn mới rồi đi lại từ đầu.

**2b. Cache — đích đã có `audit.md` thì đừng quét lại toàn bộ.**

Mỗi lần B2 quét xong và thầy đã **đóng vòng cuối**, `feedback-end` ghi một file bền cạnh
`session.md`:

```
.artifacts/feedback/<đích-slug>/audit.md
```

Gồm: ma trận vùng × trục **cuối cùng** (chỉ giữ phán quyết đã chốt, không giữ lịch sử từng
vòng) + một **hash** của tổ hợp DOM đo được và source đã đọc lúc chốt.

Mở phiên mới trên **cùng đích** thì B0 kiểm hash trước:

```
hash cũ (audit.md) == hash mới (đo lại DOM + đọc lại source ngay bây giờ)?
```

- **Khớp** ⇒ mọi ô `ĐẠT` trong `audit.md` **được giữ nguyên, không quét lại**. B2 chỉ cần quét
  vùng/trục MỚI (nếu B1 chọn vùng chưa từng audit) hoặc trục nào trước đó là `LỆCH`/`CÂM` mà
  chưa sửa.
- **Không khớp** ⇒ code đã đổi từ lần audit trước. **Quét lại toàn bộ** vùng đó — hash lệch
  nghĩa là `audit.md` không còn đáng tin, không được tin một phần.

⚠️ Hash phải bao cả DOM lẫn source, không được chỉ hash source. Vendor có thể ghi đè className
mà source không đổi một dòng nào (neo caret `Select`/`Accordion` 2026-07-29) — hash chỉ source
sẽ báo "khớp" trong khi hình đã đổi thật.

Không có `audit.md` cho đích này ⇒ đây là lần đầu, quét đầy đủ như bình thường.

**3. Dựng thư mục phiên** `.artifacts/feedback/<YYYY-MM-DD>-<đích-slug>/` và ghi `session.md`:

```markdown
# Phiên feedback — <đích>

- storyId: <id đã tra từ index.json>
- file component: <đường dẫn thật>
- mở: <ngày>       trạng thái: ĐANG CHẠY
- tồn đọng tìm thấy ở B0: <có/không, nếu có thì cái gì>

## Vùng
(B1 điền)

## Vòng
(B3 điền, mỗi vòng một mục)

## Ngoài phạm vi
(vi phạm thấy ở chỗ khác, ghi lại chứ không sửa trong phiên này)

## Còn treo
(thứ đã nêu mà chưa chốt — đây là mục hay bị rơi nhất)
```

**4. Chụp số đo NỀN vào `baseline.json`** — trước khi đụng vào bất cứ thứ gì.

Đo bằng DOM thật, không phải đọc source: mọi `getComputedStyle` liên quan tới cỡ chữ, cỡ icon,
gap, padding, bo góc của bề mặt đang xét.

⚠️ **Kiểm viewport trước.** `document.hidden` bật hoặc `window.innerWidth` bằng 0 thì mọi rect
trả 0 và code lành trông y hệt đang vỡ. Đã cắn thật 2026-07-29.

```js
JSON.stringify({ hidden: document.hidden, w: innerWidth, h: innerHeight })
```

## CỔNG ĐO

- `storyId` tra từ `index.json`, không suy từ title.
- `session.md` tồn tại, có đủ năm mục.
- `baseline.json` có số đo thật, và viewport đã được xác nhận không degenerate.

## RA

Đường dẫn thư mục phiên + một câu tóm tắt cho thầy: đích là gì, có tồn đọng cũ không.

## DỪNG KHI

- Đích thầy đưa mơ hồ (nhiều story khớp) ⇒ **hỏi**, đừng chọn đại một cái.
- Tìm thấy phiên cũ chưa đóng trên cùng đích ⇒ hỏi thầy: mở tiếp hay đóng cái cũ rồi mở mới.
