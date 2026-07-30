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

> ⛔ **Quyền ghi, đọc TRƯỚC mọi thứ:** [`fe/boundary.md`](../../fe/boundary.md)
> **Chọn component nào:** [`fe/matrix.md`](../../fe/matrix.md) — ma trận hình-dữ-liệu → component,
> đọc TRƯỚC khi dựng bất cứ gì mới (chọn sai vỏ thì 15 trục đúng cũng vô nghĩa)
> **Luật đúng/sai:** [`fe/principles/INDEX.md`](../../fe/principles/INDEX.md) — 15 trục
> **Nghiệp vụ (field thật, state phải vẽ):**
> `starci-academy/.artifacts/domain/INDEX.md` — mở đúng miền đang chạm TRƯỚC khi tra Postgres hay
> cắm agent đọc lại entity; miền nào đã có người rút sẵn thì đừng rút lại từ đầu
> **Môi trường (repo · 10 cổng · bẫy máy):** [`fe/environment.md`](../../fe/environment.md)
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
| [B2 · quét 15 trục](step-2-sweep-15-axes.md) | **B2a triage rẻ** (Phần A + số đo, không đọc source) đủ 15×N ô → **B2b đào sâu** chỉ ở ô `NGHI NGỜ` | ma trận vùng × trục **không còn ô trống** |
| [B3 · áp + lặp lại](step-3-apply-and-reloop.md) | thầy phản hồi, sửa cái đã duyệt, verify, ghi sổ vòng | ⛔ thầy quyết: còn vòng nữa → quay lại B2 |
| [B4 · tra khi canon câm](step-4-research-when-silent.md) | **chỉ khi B2 ra ô `CÂM`**: tra ngành, mang về ĐỀ XUẤT có dẫn nguồn | thầy đã thấy đề xuất |
| B5 | thầy gọi dừng | bàn giao `starci-fe-story-feedback-end` |

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
  ⛔ **Và khi thầy nói dừng thì dừng HẲN, cho hết phiên.** Neo 2026-07-30 (`ChallengePage/Graded`):
  Browser pane lỗi CDP/timeout liên tiếp, thầy chốt *"khoong can navigate, fix xong la dc, thay tu
  nhin = mat"* — từ lúc đó verify chỉ còn `tsc` + 10 cổng + eslint, báo bằng chữ, KHÔNG tự mở lại
  dù nghĩ là "lần này chắc chạy được". Ảnh thầy gửi trông như bản cũ thì nói nghi HMR ôi và **nhờ
  thầy mở tab mới**, đừng tự navigate để kiểm.
- **Feedback mơ hồ ⇒ BRAINSTORM trước, đừng code luôn.** Câu phê bình không kèm chỉ định cụ thể
  (*"sai rules"*, *"phèn"*, *"render kiểu khác đi"*, *"rườm rà"*) nghĩa là thầy CHƯA có hình dung
  cố định — tự chọn một cách hiểu rồi sửa là đoán mò, và cả phiên 2026-07-30 chứng minh nó luôn
  phải sửa lại vòng hai. Dựng 2-3 phương án CỤ THỂ rồi trình để thầy chọn, thầy tự chốt luật này:
  *"mỗi khi thầy kêu kiểu này thì brainstorm, và render lại với component mới, gửi thầy html"*.
  Trình bằng gì thì theo CỠ:
  | Cỡ | Trình bằng | Khi nào |
  |---|---|---|
  | nhỏ — so vài biến thể của MỘT cụm | `mcp__visualize__show_widget` (widget inline) | đổi một hàng, một chip, một cách xếp |
  | lớn — mô phỏng nguyên khối/nguyên trang | file HTML rồi mở qua preview cổng **`web-preview-8080`** (`:8080` trong `.claude/launch.json` của `starci-academy`) | cần đúng bối cảnh: theme thật, màu thật, bề ngang thật |
  Mockup lớn **phải phối theo giao diện THẬT của app**, không dùng theme nhẹ mặc định của widget —
  thầy cần thấy nó nằm trong màn thật trông ra sao. Dùng `:8080` (KHÔNG phải `:6006` Storybook —
  đó là canvas cô lập từng component, không có theme/nền/bề ngang thật của app) và KHÔNG phải
  `:3000` (`web-preview` — cổng đó có thể đang chạy phiên chat khác của thầy).
  ⚠️ Ngược lại: feedback ĐÃ CÓ chỉ định rõ (*"chip nằm bên trái, plain text bên phải"*, *"gap đều
  3 cái này"*, *"rounded-none"*) thì áp thẳng, KHÔNG brainstorm — hỏi lại chỗ đã rõ là làm chậm.
- **Chỗ nào confuse (khái niệm, quyết định, câu thầy hỏi lại để HIỂU chứ không phải feedback UI)
  ⇒ vẽ WIDGET giải thích, đừng chat một đoạn văn dài.** Đây khác luật brainstorm ở trên (luật đó
  là thầy feedback mơ hồ → mình dựng phương án; luật này là NGƯỢC LẠI — mình có điều cần giải
  thích cho thầy hiểu, ví dụ một khái niệm, một sự đánh đổi, lý do một quyết định). Dùng
  `mcp__visualize__show_widget` (sơ đồ, so sánh trước/sau, bảng) thay vì viết dài trong chat, rồi
  tiếp tục làm luôn — không dừng lại chờ hỏi thêm nếu việc đang làm không thực sự cần quyết định
  của thầy. Neo 2026-07-30: thầy chốt *"cái nào mà confuse thì đừng chat, vẽ widget ra giải
  thích"* sau khi bị hỏi lại một câu mình từng trả lời bằng văn xuôi trong chat.

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

## Model

B2 (quét 15 trục, dù chạy fan-out Workflow hay tuần tự) là **`sonnet`**, không phải opus — nó
là **quét** (đọc DOM đo được + đối chiếu cây quyết định của trục), đúng vai `sonnet` trong quy
ước 3 tầng đã có sẵn (`fable` = quyết hướng mơ hồ · `sonnet` = quét/action · `opus` =
finalize/tổng hợp). Neo 2026-07-29: lượt đầu tiên chạy lane này lỡ dùng `model: 'opus', effort:
'high'` cho cả 15 agent B2 — sai vai, thầy chốt lại *"lần sau sonnet thôi"*.

B4 (tra ngành khi canon câm) và bước tổng hợp cuối của `feedback-end` vẫn dùng `opus` — đó là
suy luận/tổng hợp thật, đúng vai của nó.

**Trong B2, cả B2a lẫn B2b đều `sonnet`** — hai nhịp không đổi VAI (vẫn là quét), chỉ đổi ĐỘ
SÂU (Phần A-only vs Phần A+B+source). Neo 2026-07-29: lượt sweep đầu ChallengePage tốn ~1,7
triệu token vì mọi ô, kể cả ô sẽ `ĐẠT`, đều bị đọc sâu ngang nhau. Tách B2a/B2b (xem
[step-2](step-2-sweep-15-axes.md)) để chi phí đọc-sâu chỉ trả cho ô có khả năng sai — không đổi
model, đổi kiến trúc.

⚠️ **Chạy B2 qua Workflow với nhiều vùng ⇒ fan-out theo TRỤC, không theo VÙNG** — xem
[step-2 § "Chạy B2 qua Workflow"](step-2-sweep-15-axes.md#chạy-b2-qua-workflow-nhiều-vùng-cùng-lúc-gom-theo-trục-không-theo-vùng).
Neo 2026-07-30: fan-out theo vùng khiến 15 file canon tĩnh bị đọc lặp N lần (N = số vùng); đảo
trục thành đơn vị fan-out đưa số lượt đọc về đúng 15, không phụ thuộc số vùng.
