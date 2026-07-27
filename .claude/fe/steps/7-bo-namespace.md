# BƯỚC 7 — BỎ NAMESPACE ✅ XONG 2026-07-28

> FE `mtp` · commit `5721f7a9` · **298 file** · `check-no-namespace` = 0 · `tsc` 0 lỗi ·
> eslint 17 (mốc trước: 34).
>
> Luật đã vào canon: `rules/4-organization.md` §3b.

---

## 1. Đã làm gì

| | |
|---|---|
| namespace xoá | **65** |
| member làm phẳng | **111** |
| file đụng | 300 (198 lượt đổi tên + 95 file story đổi tên + cổng mới) |
| lượt thay | 4620 |
| storyId tính lại | 401 |

`X.Base` → `X` · `X.Member` → `XMember`. File story cũng đổi tên
(`Button.Base.stories.tsx` → `Button.stories.tsx`), title theo, storyId tính lại bằng chính
`toId` của Storybook.

---

## 2. Bốn cái bẫy — và cái nào tự phát hiện được

Chi tiết ở `rules/4-organization.md` §3b. Điều đáng ghi ở đây là **cái gì đã bắt được chúng**:

| Bẫy | Ai bắt |
|---|---|
| CRLF (regex `\n` khớp 0 mà báo xanh) | **so số với lần đếm trước** — 66 trùng khít số cũ, trùng khít là dấu hiệu chứ không phải xác nhận |
| compound của HeroUI | **cổng vendor** dựng trước khi ghi: 294 lượt phải còn nguyên |
| alias nội bộ | quét import từng file |
| tên phẳng đâm nhau | **`tsc`** — nhưng chỉ khi kiểu prop tình cờ lệch |

Cái thứ tư là cái đáng sợ nhất và **không có cổng nào bắt trọn**: đổi vào một tên đã bị chiếm
thì call-site âm thầm trỏ sang component khác. Ở đây `tsc` bắt được 3 chỗ vì prop lệch; nếu
prop trùng thì nó im. Cách duy nhất đóng lỗ này là **không bao giờ đổi vào tên đang bị bind**,
tức phải đọc binding của từng file — không phải kiểm tra sau.

---

## 3. Thu hoạch ngoài dự kiến: 14 chỗ đụng tên = danh sách trùng lặp

| Đụng | Số chỗ |
|---|---|
| atom `Progress.Meter` vs composite `ProgressMeter` | 5 |
| atom `Button.Group` vs composite `ButtonGroup` | 2 |
| atom `Tabs.Base` vs HeroUI `Tabs` (Toolbar) | 3 |
| atom `Avatar.Base` vs HeroUI `Avatar` | 2 |
| `List.Row` trong `SurfaceCard` | 1 |
| còn lại | 1 |

> **Làm phẳng tên là cách rẻ nhất để lộ trùng lặp.** Dấu chấm che chúng đi: `Progress.Meter`
> và `ProgressMeter` trông như hai thứ khác nhau cho tới lúc cả hai phải là một cái tên.

---

## 4. Ngoại lệ đã giữ

- **`PriceTag`** tách thành `PriceTagProminent` / `PriceTagInline`, KHÔNG gộp về prop
  `emphasis` — §14d.1 nói người gọi chọn component chứ không chọn cỡ. Bỏ namespace là đổi
  cách gọi, không được nhân tiện lật một ruling.
- **`_legacy`** đổi tên cùng lượt. Đóng băng legacy là đóng băng NỘI DUNG; nó tiêu thụ cùng
  module nên bỏ lại chỉ làm gãy build.
- **Node vendor trong anatomy** đổi thành `HeroAvatar` / `HeroTypography` — trước đây phân
  biệt với ta bằng hậu tố `.Base`, phẳng rồi thì trùng key.

---

## 5. Còn lại

- `Stepper` 3 margin của con — điểm đỏ duy nhất của `check-padding`, cần tách sub-row
  `items-center` chứ không đổi class.
- `_legacy`: 5 storyId gãy (nợ đã ghi sổ), 378 leaf thiếu `code`.
- eslint 17 (15 `no-unused-vars` + 2 `no-adjacent-chip`) — đều có từ trước.
- Dọn 14 chỗ trùng ở §3 — đang điều tra, xem `8-tinh-gon-trung-lap.md`.
