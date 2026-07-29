---
name: starci-fe-story-feedback-start
description: >
  Mở một PHIÊN FEEDBACK DÀI trên một bề mặt Storybook (story, component, page, overlay) và
  chạy nó theo VÒNG cho tới khi thầy gọi dừng. Phiên là một file bền trong
  `.artifacts/feedback/`, nên nó sống sót qua mất context và phiên sau mở lại chạy tiếp được.
  Vòng lặp: B0 mở phiên, B1 thầy khoanh VÙNG muốn sửa (ảnh chụp có khoanh màu, hoặc lớp phủ
  đánh số do skill render), B2 đề xuất sửa bằng cách quét ĐỦ MƯỜI LĂM TRỤC của `principles/`
  trên từng vùng, KHÔNG được sót trục nào, B3 thầy phản hồi rồi áp sửa và ghi sổ, xong quay
  lại B2 quét lại từ đầu. Lặp tới khi thầy gọi dừng, lúc đó bàn giao sang
  `starci-fe-story-feedback-end`. Mọi phán quyết phải đến từ SỐ ĐO thật (getComputedStyle,
  dòng source thật), không bao giờ từ nhìn ảnh. Dùng khi thầy gõ
  `/starci-fe-story-feedback-start <đích>`, hoặc nói "mở phiên feedback", "soi lại màn này",
  "bắt đầu feedback story X", "sửa mấy chỗ này trên story X". KHÔNG dùng cho một câu sửa lẻ
  không cần phiên (sửa thẳng). KHÔNG dùng để sinh màn mới (đó là `starci-fe-story-create`).
---

# /starci-fe-story-feedback-start — mở phiên feedback, chạy theo vòng

> **Luật đúng/sai:** [`fe/principles/INDEX.md`](../../fe/principles/INDEX.md) — 15 trục
> **Code:** `D:/Repositories/starci-academy/.storybook`, branch `mtp`
> **Chỗ lưu phiên:** `D:/Repositories/starci-academy/.artifacts/feedback/`

## Lane này là gì

Một phiên feedback **không phải một lượt sửa**. Nó là cuộc trao đổi chạy qua nhiều vòng, và
thường vắt qua vài cửa sổ context. Nên trạng thái phiên nằm **trên đĩa, không nằm trong
context**: quyết định nào chốt thì ghi vào file phiên ngay lúc đó, để lượt sau mở lên là chạy
tiếp được từ đầu lạnh.

Ranh giới lane cố ý hẹp: **thầy chọn vùng**, skill đưa phán quyết, và **chỉ thầy mới đóng một
vòng**. Skill không bao giờ tự kết luận là xong.

## Vòng lặp

| Bước | Làm gì | Đóng khi |
|---|---|---|
| [B0 · mở phiên](step-0-open-session.md) | dựng file phiên, ghim đích, chụp số đo nền | file phiên có `storyId` đã tra thật |
| [B1 · chọn vùng](step-1-select-regions.md) | thầy khoanh vùng cần làm, mỗi vùng một id bền | mọi vùng có id + một dòng ý định |
| [B2 · quét 15 trục](step-2-sweep-15-axes.md) | với TỪNG vùng, đi đủ **mười lăm trục**, phán quyết từng trục, đề xuất sửa | ma trận vùng × trục **không còn ô trống** |
| [B3 · áp + lặp lại](step-3-apply-and-reloop.md) | thầy phản hồi, sửa cái đã duyệt, verify, ghi sổ vòng | ⛔ thầy quyết: còn vòng nữa → quay lại B2 |
| B4 | thầy gọi dừng | bàn giao `starci-fe-story-feedback-end` |

B2 và B3 lặp. **Không có hạn mức vòng** — chỉ lời thầy mới thoát vòng lặp.

## Một luật làm nên giá trị của lane này

**B2 phải VÉT CẠN.** Mười lăm trục, mọi vùng đã chọn, mọi vòng. Trục nào không áp được thì ghi
`N/A` **kèm lý do** — không bao giờ được lặng lẽ bỏ qua.

Đây không phải thủ tục hành chính, đây là toàn bộ lý do lane tồn tại. Đo ngày 2026-07-29: một
caret render sai một bậc cỡ trong khi `tsc`, cả mười cổng và eslint đều xanh, vì không cổng nào
phủ trục `icon`. Quét mà bỏ trục là tái lập đúng điểm mù đó; **ma trận chính là thứ làm chỗ sót
lộ ra**.

## Luật cứng

- **ĐO, đừng nhìn.** Mọi phán quyết dẫn một con số thật (`getComputedStyle`,
  `getBoundingClientRect`) hoặc một dòng source thật. Ảnh chụp chứng minh được nó **trông** thế
  nào, không bao giờ chứng minh được **giá trị nào** tạo ra nó.
- **Kiểm viewport trước khi tin bất kỳ số đo nào.** `document.hidden` bật hoặc
  `window.innerWidth` bằng 0 thì mọi rect trả về 0, và code lành trông y như đang vỡ.
- **Cổng xanh không phải một phán quyết.** Mười cổng phủ một phần nhỏ của mười lăm trục. "Cổng
  xanh" không bao giờ là câu trả lời cho "trục này đúng chưa".
- **Không đóng vòng thay thầy.** Im lặng không phải đồng ý; thầy chuyển chủ đề cũng không phải.
- **Không nới phạm vi.** Chỉ sửa vùng đã chọn. Thấy vi phạm chỗ khác thì ghi vào file phiên ở
  mục `ngoài-phạm-vi`, không tiện tay sửa trong vòng này.
- **Một ví dụ không thành luật.** Đề xuất nào đụng tới canon thì cần **hai nguồn độc lập**, nếu
  không thì ghi rõ là neo vào đúng ca này.
- **Đừng lái browser để soi mắt.** Đo DOM thì được; mở Storybook ra nhìn thì chậm và hay treo.
  Báo số rồi để thầy tự xem.

## File phiên

Mỗi phiên một thư mục: `.artifacts/feedback/<YYYY-MM-DD>-<đích-slug>/`

```
session.md        sổ bền: đích · vùng · từng vòng · việc còn treo
baseline.json     số đo lúc B0, trước khi đụng vào bất cứ thứ gì
round-<n>.md      ma trận 15 trục đầy đủ của vòng n
```

`session.md` là **hợp đồng với `starci-fe-story-feedback-end`** — skill đó đọc nó để viết bản
ghi cuối và để quyết xem có trục nào của `principles/` cần sửa không. Giữ nó cập nhật **ngay
trong lúc vòng đang chạy**, không phải để dồn tới cuối.
