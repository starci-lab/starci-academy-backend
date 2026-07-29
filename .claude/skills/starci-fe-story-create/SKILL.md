---
name: starci-fe-story-create
description: >
  Tạo hoặc sửa một PAGE / LAYOUT / OVERLAY (modal, drawer) trong Storybook design-system
  `.storybook/components/<app>/`. Một luồng, HAI CHẾ ĐỘ: TẠO một màn mới (đọc màn thật trong
  `src/` rồi rút cây, hoặc sáng tạo từ biz spec thầy mô tả cho app chưa có source như `miamia`
  và `nivo`) và SOI một màn đã dựng (audit rồi sửa). Cùng các bước, cùng thứ tự trục, chỉ đổi
  động từ: TẠO thì quyết từng giá trị, SOI thì kiểm từng quyết định đã có. Các bước bám bộ 15
  trục `principles/`, mỗi trục xuất hiện đúng một lần và đúng chỗ nó không còn phụ thuộc cái
  chưa quyết: B1 ý định (`reading-flow` · `prominence` · `async`) → B2 cấu trúc (`frame` ·
  `naming`) DỪNG chờ thầy duyệt cây → B3 không gian (`seam` · `inset` · `surface`) → B4 nội
  dung (`text` → `icon` · `color` · `button` → `press` · `markdown`) → B5 skeleton và 10 cổng.
  Phiên lưu trong `.artifacts/feedback/` cùng khuôn với lane feedback, và đóng bằng
  `starci-fe-story-feedback-end`. Dùng khi thầy gõ `/starci-fe-story-create <tên màn>` kèm hoặc
  không kèm mô tả, hoặc nói "dựng page X", "sinh overlay Y", "tạo layout Z", "audit màn Z",
  "soi lại page Z theo canon", "app miamia chưa có page nào, làm đi". KHÔNG dùng để phản ứng
  với một câu feedback thầy vừa đưa (đó là `starci-fe-story-feedback-start`), KHÔNG dùng khi
  gốc là một ATOM.
---

# /starci-fe-story-create — tạo hoặc sửa một page/layout/overlay

> ⛔ **Quyền ghi, đọc TRƯỚC mọi thứ:** [`fe/boundary.md`](../../fe/boundary.md)
> **Luật đúng/sai:** [`fe/principles/INDEX.md`](../../fe/principles/INDEX.md) — 15 trục
> **Môi trường (repo · 10 cổng · bẫy máy):** [`fe/environment.md`](../../fe/environment.md)
> **Code:** `D:/Repositories/starci-academy/.storybook`, branch `mtp`
> **Chỗ lưu phiên:** `D:/Repositories/starci-academy/.artifacts/feedback/`

## Một màn là một CHUỖI QUYẾT ĐỊNH

Không phải "dựng rồi kiểm". Mỗi quyết định thuộc **đúng một trục**, và việc của lane này chỉ là
xếp thứ tự sao cho **không quyết định nào bị chốt trước cái nó phụ thuộc vào**.

```
1  reading-flow  ─┐
2  prominence  ───┼─→ 4 frame ──→ 6 seam ──┐
3  async  ────────┘     ├→ 7 inset ────────┼─→ 15 skeleton
                        └→ 8 surface ──────┘
                  5 naming
   prominence ───→ 9 text ──→ 10 icon
              ├──→ 11 color
              └──→ 12 button ──→ 13 press
                   14 markdown
```

Ba ràng buộc thứ tự đã trả giá mới rút ra được, **đừng đảo**:

- **`icon` sau `text`** — cỡ icon tra theo cỡ chữ nó đứng cạnh. Chốt icon trước rồi chữ đổi cỡ
  là icon đứng lại một mình. Neo `ContentModeNav`, và caret `Select`/`Accordion` 2026-07-29.
- **`naming` SỚM, ở B2** — tên quyết `storyId`, đổi `storyId` gãy chéo mọi dep, mà gãy kiểu
  **câm**. Luồng cũ đặt tên gần cuối nên buộc bước ấy phải tuần tự, cấm song song. Đó không
  phải luật, đó là **triệu chứng của việc đặt tên muộn**.
- **`skeleton` CUỐI** — shimmer soi gương một hình, nên hình phải chốt xong. Neo
  `TrialEnrollBanner`: skeleton chép từ block khác, mang theo bug `<div>` nằm trong `<p>`, sống
  nhiều tháng vì chưa từng render thật.

## Các bước

| Bước | Quyết cái gì | Nạp trục | Phạm vi |
|---|---|---|---|
| [B0 · mở phiên](step-0-open-session.md) | dựng file phiên, chọn chế độ và nhánh nguồn | — | một lần |
| [B1 · ý định](step-1-intent.md) | màn phục vụ việc gì · cái gì quan trọng nhất · đọc thứ tự nào · chỗ nào rỗng/lỗi/tải | `reading-flow` `prominence` `async` | một lần |
| [B2 · cấu trúc](step-2-structure.md) | cây tầng · khung nào · **tên** · bảng state | `frame` `naming` | một lần ⛔ **DỪNG chờ duyệt** |
| [B3 · không gian](step-3-space.md) | mọi `gap` · mọi `padding` · bo góc viền bóng | `seam` `inset` `surface` | **LẶP** từng component, `atom → page` |
| [B4 · nội dung](step-4-content.md) | cỡ/đậm/màu chữ → icon → nút → bấm được không → markdown tới đâu | `text` → `icon` `color` `button` → `press` `markdown` | **LẶP** cùng vòng với B3 |
| [B5 · skeleton + cổng](step-5-skeleton-and-gates.md) | hình shimmer · 10 cổng · tsc · eslint · đo DOM | `skeleton` | một lần |
| B6 | thầy gọi dừng | — | bàn giao `starci-fe-story-feedback-end` |

B1, B2 và B5 chạy **một lần cho cả màn**. B3 và B4 **lặp theo component**, đi từ `atom` lên
`page`; trong mỗi component thì không gian trước, nội dung sau.

## Hai chế độ

| | **TẠO** (màn mới) | **SOI** (màn đã có) |
|---|---|---|
| B1 | viết ra ý định | đọc màn, rút ngược ý định, hỏi "có đúng thế không" |
| B2 | vẽ cây, đặt tên | dựng closure, đối chiếu cây thật với cây nên có |
| B3-B4 | quyết từng giá trị | kiểm từng giá trị **có đi qua cây quyết định của trục không** |
| B5 | dựng skeleton, chạy cổng | chạy cổng, đo DOM, báo lệch |

Chế độ SOI đi qua **đủ 15 trục**, nên nó bắt được loại lỗi mà audit kiểu cũ (chỉ soi bốn thứ:
import, khung, deps, chữ) không có ô nào để bắt. Neo 2026-07-29: caret sai trục `icon` trong khi
`tsc` + cả mười cổng + eslint đều xanh.

## Ba nhánh nguồn

Chọn ở B0, nhập chung đường ống từ B2:

| Nhánh | Khi nào | Việc đầu |
|---|---|---|
| **A · từ source** | app có màn thật trong `src/` | đọc `src/app/**/page.tsx` + `src/components/features/**` của đúng màn đó |
| **B · sáng tạo** | app chưa có source (`miamia`, `nivo`), hoặc thầy mô tả màn chưa tồn tại | viết BIZ SPEC trước: màn làm gì · switch giữa cấu trúc nào · dữ liệu gì |
| **C · soi** | màn đã dựng trong `.storybook` | dựng closure theo import |

Không rõ nhánh nào ⇒ **hỏi thầy**, đừng đoán.

## Luật cứng

- ⛔ **CẤM đụng `src/`** — chỉ ĐỌC, kể cả "sync cho khớp". `.storybook` là bản vẽ, `src` là công
  trình, và bản vẽ lệch công trình là trạng thái **bình thường**.
- ⛔ **DỪNG ở B2 chờ thầy duyệt cây.** Không có duyệt thì không gõ `.tsx`. Cây sai thì mọi bước
  dưới hỏng hết, và hỏng theo kiểu không cổng nào bắt được.
- **Không tự chốt thay thầy** — "chốt" phải là lời thầy thật trong chat; im lặng không phải
  đồng ý.
- **Đừng đẻ trùng.** Trước khi dựng component mới, grep `.storybook/components/**`. Sinh bản
  `SurfaceCard` thứ hai là hỏng chính cái design-system đang dựng.
- **Tin số đo, không tin báo cáo agent.** Mọi phát biểu "đã xong / đã sạch" phải kèm output cổng
  hoặc số đo DOM. Lỗi tầng layout **không làm vỡ `tsc`**: class Tailwind sai tên thì im lặng
  không sinh CSS.
- **Canon CÂM thì TRA, đừng chọn đại.** Đi hết cây quyết định của một trục mà không nhánh nào
  nhận ca đang gặp ⇒ đó là lỗ hổng canon, không phải cớ để tự chọn một giá trị. Chạy
  [`feedback-start/B4`](../starci-fe-story-feedback-start/step-4-research-when-silent.md): phân
  loại câm-tra-được với câm-vì-quyết-định-sản-phẩm, tra ngành đủ hai nguồn độc lập, dịch sang
  thang nhà mình, rồi trình ĐỀ XUẤT cho thầy. Tự chọn rồi đi tiếp là biến một quyết định thành
  tiền lệ giả mà không ai biết.
- **Đừng lái browser để soi mắt.** Đo DOM thì được; mở Storybook ra nhìn thì chậm và hay treo.

## Model

B1-B2 (ý định + cây + tên) chạy main-loop Opus — phán đoán tầng là việc khó, sai là hỏng hết.
B3-B4 khi số component trong một tầng từ năm trở lên thì được đẩy Workflow Sonnet fan-out
**trong cùng một tầng**, vẫn giữ barrier giữa các tầng, và spec agent phải chặn cứng
`"KHÔNG đụng src/"`.
