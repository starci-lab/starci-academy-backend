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

**2. Kiểm tồn đọng trước khi làm gì thêm.** Quét ba nguồn xem đích này đã có nợ cũ chưa:

- `.artifacts/feedback/` — có phiên nào **chưa đóng** trên cùng đích không? Có thì **mở tiếp
  phiên đó**, đừng đẻ phiên thứ hai.
- `principles/<trục>/context.md` — luật nào đã chốt cho đúng pattern này.
- Lượt hội thoại trước trong cùng phiên chat — đề xuất nào đã trình, thầy chưa bác, mà chưa
  bao giờ áp.

Tìm thấy tồn đọng thì **nói thẳng ngay** ("đây là đề xuất từ lượt trước, chưa áp vì rẽ sang
việc X"), đừng coi như feedback hoàn toàn mới rồi đi lại từ đầu.

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
