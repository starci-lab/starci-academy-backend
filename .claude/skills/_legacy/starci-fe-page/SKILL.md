---
name: starci-fe-page
description: >
  Lane đi từ GỐC LÀ MỘT PAGE (hoặc layout / overlay) trong Storybook design-system
  `.storybook/components/<app>/`. Một luồng, HAI CHẾ ĐỘ: **DỰNG** một màn mới (từ `src/` có
  sẵn, hoặc sáng tạo từ biz spec thầy mô tả cho app chưa có source như `miamia`/`nivo`) và
  **SOI** một màn đã dựng (audit). Cùng năm bước, cùng thứ tự trục, chỉ đổi động từ: DỰNG thì
  quyết từng giá trị, SOI thì kiểm từng quyết định đã có. Năm bước bám bộ 15 trục
  `principles/`, mỗi trục xuất hiện đúng một lần và ở đúng chỗ nó không còn phụ thuộc cái
  chưa quyết: **1 ý định** (`reading-flow` · `prominence` · `async`) → **2 cấu trúc**
  (`frame` · `naming`) ⛔BARRIER thầy duyệt cây → **3 không gian** (`seam` · `inset` ·
  `surface`) → **4 nội dung** (`text` → `icon` · `color` · `button` → `press` · `markdown`) →
  **5 chờ + cổng** (`skeleton`, rồi 10 cổng · tsc · eslint · đo DOM · bàn giao). Dùng khi thầy
  gõ `/starci-fe-page <tên màn>` kèm hoặc không kèm mô tả, hoặc nói "dựng page X", "sinh
  overlay Y", "audit màn Z", "soi lại page Z theo canon", "app miamia chưa có page nào, làm
  đi". KHÔNG dùng để phản ứng với một câu feedback thầy vừa đưa (đó là
  `starci-fe-story-feedback`), KHÔNG dùng khi gốc là một ATOM (`starci-fe-atom-audit`) hay khi
  quét toàn bộ primitives (`starci-fe-primitives-audit`).
---

# /starci-fe-page — lane page-root, dựng hoặc soi

> **Môi trường** (repo · 10 cổng · restart · bẫy máy): [`fe/environment.md`](../../fe/environment.md)
> **Luật đúng/sai:** [`fe/principles/INDEX.md`](../../fe/principles/INDEX.md) — 15 trục
> **Kỷ luật làm việc:** [`discipline/INDEX.md`](../../discipline/INDEX.md)

## Một màn là một CHUỖI QUYẾT ĐỊNH

Không phải "dựng rồi kiểm". Mỗi quyết định thuộc **đúng một trục**, và việc của lane này chỉ là
xếp thứ tự sao cho **không quyết định nào bị chốt trước cái nó phụ thuộc vào**.

Ba ràng buộc thứ tự đã trả giá mới rút ra được, đừng đảo:

- **`icon` đứng SAU `text`** — cỡ icon tra theo cỡ chữ nó đứng cạnh. Chốt icon trước rồi chữ
  đổi cỡ là icon đứng lại một mình (neo `ContentModeNav`, và caret `Select`/`Accordion` 2026-07-29).
- **`naming` đứng SỚM, ở bước 2** — tên quyết `storyId`, đổi `storyId` gãy chéo mọi dep. Luồng
  cũ đặt tên ở gần cuối nên buộc bước ấy phải tuần tự, cấm song song. Đó không phải luật, đó là
  **triệu chứng của việc đặt tên muộn**.
- **`skeleton` đứng CUỐI** — shimmer là soi gương một hình, nên hình phải chốt xong trước. Viết
  skeleton lúc hình chưa ổn định là cách sinh ra bug chỉ lộ nhiều tháng sau (neo
  `TrialEnrollBanner`: `<div>` trong `<p>`, copy nguyên từ block khác, chưa từng render thật).

## Năm bước

| Bước | Quyết cái gì | Nạp trục | Phạm vi |
|---|---|---|---|
| [1 · ý định](step-1-y-dinh.md) | màn phục vụ việc gì · cái gì quan trọng nhất · đọc theo thứ tự nào · chỗ nào rỗng/lỗi/đang tải | `reading-flow` `prominence` `async` | cả màn, MỘT lần |
| [2 · cấu trúc](step-2-cau-truc.md) | cây tầng · khung nào · **tên** · bảng state | `frame` `naming` | cả màn, MỘT lần ⛔ **BARRIER** |
| [3 · không gian](step-3-khong-gian.md) | mọi `gap` · mọi `padding` · bo góc viền bóng | `seam` `inset` `surface` | **LẶP** từng component, `atom → page` |
| [4 · nội dung](step-4-noi-dung.md) | cỡ/đậm/màu từng chuỗi → icon → nút → bấm được không → markdown tới đâu | `text` → `icon` `color` `button` → `press` `markdown` | **LẶP** cùng vòng với bước 3 |
| [5 · chờ + cổng](step-5-cho-va-cong.md) | hình shimmer · 10 cổng · tsc · eslint · đo DOM · bàn giao | `skeleton` | cả màn, MỘT lần |

Bước 1-2 và bước 5 chạy **một lần cho cả màn**. Bước 3-4 **lặp theo component**, đi từ `atom`
lên `page`; trong mỗi component thì không gian trước, nội dung sau.

## Hai chế độ

| | **DỰNG** (màn mới) | **SOI** (màn đã có) |
|---|---|---|
| 1 | viết ra ý định | đọc màn, rút ngược ý định, hỏi "có đúng thế không" |
| 2 | vẽ cây, đặt tên | dựng closure, đối chiếu cây thật với cây nên có |
| 3-4 | quyết từng giá trị | kiểm từng giá trị **có đi qua cây quyết định của trục không** |
| 5 | dựng skeleton, chạy cổng | chạy cổng, đo DOM, báo lệch |

Chế độ SOI đi qua **đủ 15 trục**, nên nó bắt được loại lỗi mà audit cũ (chỉ bốn trục
import/khung/deps/chữ) không có ô nào để bắt. Neo 2026-07-29: caret `size-4` sai trục `icon`
trong khi `tsc` + cả 10 cổng + eslint đều xanh.

## Ba nhánh vào

Chọn trước bước 1, nhập chung đường ống từ bước 2:

| Nhánh | Khi nào | Việc đầu |
|---|---|---|
| **A · từ source** | app có màn thật trong `src/` | đọc `src/app/**/page.tsx` + `src/components/features/**` của đúng màn đó |
| **B · sáng tạo** | app chưa có source (`miamia`, `nivo`), hoặc thầy mô tả màn chưa tồn tại | viết BIZ SPEC trước: màn làm gì · switch giữa những cấu trúc nào · dữ liệu gì |
| **C · soi** | màn đã dựng trong `.storybook` | dựng closure theo import |

Không rõ nhánh nào ⇒ **hỏi thầy**, đừng đoán.

## Luật cứng của lane

- ⛔ **CẤM đụng `src/`** — chỉ ĐỌC, kể cả "sync cho khớp" ([`rules/0-boundary.md`](../../fe/rules/0-boundary.md)).
- ⛔ **DỪNG ở bước 2 chờ thầy duyệt cây.** Không có duyệt thì không gõ `.tsx`. Cây sai thì mọi
  thứ dưới hỏng hết.
- **Không tự chốt thay thầy** — "chốt" phải là lời thầy thật trong chat; im lặng không phải đồng ý.
- **Đừng đẻ trùng.** Trước khi dựng component mới, grep `.storybook/components/**`. Sinh bản
  `SurfaceCard` thứ hai là hỏng chính cái design-system đang dựng.
- **Tin số đo, không tin báo cáo agent.** Mọi phát biểu "đã xong / đã sạch" phải kèm output cổng
  hoặc số đo DOM.

## Luật giữ file này mỏng

Mỗi file bước **chỉ được giữ**: thứ tự · cổng đo của riêng bước đó · điều kiện dừng · neo đã cắn
ở đúng bước đó. Mọi thứ khác thì **link ra**: luật đúng/sai về `principles/<trục>`, kỷ luật về
`discipline/`, đường dẫn và lệnh về `fe/environment.md`.

🧭 Phép thử một dòng: **dòng này còn đúng khi đổi sang lane khác không?** Còn ⇒ nó không thuộc
file bước. Đây chính là phép thử mà nếu có từ đầu thì đường dẫn repo đã không bị chép sai bốn lần.

## Model

Bước 1-2 (ý định + cây + tên) chạy main-loop Opus — phán đoán tầng là việc khó, sai là hỏng hết.
Bước 3-4 khi số component trong một tầng ≥ 5 thì được đẩy Workflow Sonnet fan-out **trong cùng
một tầng**, vẫn giữ barrier giữa các tầng, và spec agent phải chặn cứng `"KHÔNG đụng src/"`.
