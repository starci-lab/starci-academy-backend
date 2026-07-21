# Concept — Bản đồ hệ thống: node = ĐƠN VỊ KHÁI NIỆM (năng lực + health độc lập), KHÔNG 1:1 container; bản đồ LỚN → gom POD + drill-down 2 tầng; honesty xuyên suốt (no-fake-status)

> Heuristic visualization (họ `concepts/*`). Rút từ trang "Hệ thống StarCi, đang sống" (`/architecture`, System Atlas).

## Luật 1 (STRICT) — Node = đơn vị KHÁI NIỆM, không phải container
- **Node trên bản đồ hệ thống/status = ĐƠN VỊ KHÁI NIỆM (năng lực có nghĩa), KHÔNG buộc map 1:1 docker container/process.** 1 node tách riêng khi nó **(a)** đáng kể về mặt sản phẩm (người xem cần thấy nó là 1 thứ), HOẶC **(b)** có **tín hiệu health ĐỘC LẬP** đo được — kể cả khi nó chạy **in-process** bên trong service khác.
  - Vd: **AI Balancer** chạy in-process trong Core API (không phải container riêng) nhưng vẫn là node first-class vì có health riêng = key-pool liveness (`activeKeys > 0`). Gộp nó vào "Core API" sẽ giấu mất 1 tín hiệu/đánh-đổi mà hệ thật sự có.
- **Dot xanh/đỏ map vào TÍN HIỆU THẬT của node đó, không phải trạng thái container:** AI = 🟢 `activeKeys>0` · 🟡 có key disable nhưng còn sống · 🔴 `activeKeys===0`. Node "đường dẫn" (Core/Gateway/Postgres) = xanh khi 1 request public đi xuyên path đó trả data thật (probe), đỏ khi lỗi.
- **Trung thực về phụ thuộc ẩn:** node in-process phụ thuộc host của nó (AI chết theo nếu Core chết) → ghi rõ trong panel "mổ xẻ", nhưng dot vẫn đo tín hiệu RIÊNG của node, không đo host.
- **CẤM tô xanh khi chưa có tín hiệu thật:** node không probe được/chưa có health query → xám "unknown", không giả lập.
- **Nguyên tắc rút ra:** khi vẽ "kiến trúc/hệ thống" cho người xem, hỏi *"đơn vị có NGHĨA + có tín hiệu đo được là gì?"* trước, rồi mới tới "nó chạy ở container nào". Tài nguyên hạ tầng (container) là chi tiết triển khai; node là **năng lực + sức khỏe**.

## Luật 2 (STRICT) — Bản đồ LỚN (>~10 node) → gom POD chức năng + drill-down 2 TẦNG, KHÔNG dàn phẳng
- **Overview mặc định = ~8 POD chức năng xếp QUANH 1 lõi (Core API) ở giữa**, KHÔNG dàn N node trên 1 mặt phẳng (đè nhau khi >~10 node). Pod = 1 nhóm năng lực (payment, auth, AI, data…), có dot sức khoẻ GỘP (§3). Xếp pod quanh Core → tự đọc ra "1 hệ thống", chống fragmentation (mỗi pod thành 1 hòn đảo rời). Giữ map phẳng đầy-đủ làm "god-view" (nút "Xem toàn bộ") cho power-user — nhưng pod-view là DEFAULT.
- **Click pod → chuyển sang 1 SUB-SCENE RIÊNG** (không phải highlight trên map cũ): vẽ lõi nối gần nhất (thường Core API) + các thành viên pod + edge THẬT (kể cả 2 chiều, vd webhook chạy ngược). **DỪNG ở 2 tầng** (overview pod → pod detail) — KHÔNG tầng 3 (rối); "bóc tách sâu" = sub-scene GIÀU CHI TIẾT thật, không phải thêm cấp nav. Sub-scene LUÔN vẽ kèm lõi Core (không vẽ node lơ lửng).
- **Chuyển cảnh = semantic zoom** (nếu 3D: lerp camera), gate `prefers-reduced-motion` → cắt cứng khi reduce. **State qua URL** (`?pod=<key>`) → deep-link/share. Breadcrumb "‹ Về toàn hệ thống".
- **Sidebar/rail đồng bộ theo POD** (accordion: pod → thành viên); mobile → chip-row cuộn ngang ([[master-detail-rail-as-filter-and-mobile-chips]]).

## Luật 3 (STRICT) — Dot sức khoẻ của POD = ROLL-UP theo NGƯỠNG, không thuần worst-of
- Pod dot gộp từ status THẬT của thành viên (tính trên member đã resolved):
  - Tất cả `up` → **XANH**.
  - `(down + unknown) / total ≥ 75%` → **ĐỎ** (ngưỡng đặt CONSTANT, vd `POD_RED_RATIO = 0.75`, dễ chỉnh).
  - Còn lại → **VÀNG** (degraded/hỗn hợp — 1 provider lẻ chết không kéo cả pod đỏ ngay, chỉ vàng; đỏ khi ≥ngưỡng cùng chết).
- **Trước probe đầu tiên: cả overview XÁM "đang kiểm tra…"** (honesty, không tô xanh giả) — chỉ áp ngưỡng SAU khi có status thật.
- **A11y:** dot kèm CHỮ (up/down/degraded/checking), không chỉ màu.

## Luật 4 — Logo THẬT nơi có (hybrid), KHÔNG icon generic cho brand
- Dùng `simple-icons` (SVG monochrome) cho brand có sẵn (Kafka/Redis/Postgres/Elasticsearch/Stripe/PayPal/GitHub/Keycloak/MinIO/NATS…); SVG chính chủ hoặc fallback Phosphor cho brand thiếu icon (giữ nhất quán, đừng chỗ xịn chỗ generic lệch nhau). Render logo trong HTML label của node (không extrude 3D — nhẹ + rõ). Pháp lý: nominative use ("tôi tích hợp với X") — chuẩn cho trang marketing công khai.

## Luật 5 (STRICT) — Khu "TƯƠNG LAI/roadmap" = Coming soon, KHÔNG dot sống (honesty)
- Toggle "Hiện tại" (thật, dot live) ⇄ "Tương lai" (roadmap, topology tự vẽ). Khu tương lai BẮT BUỘC: badge **"Coming soon"** rõ ràng · edge **nét đứt** · tone **ghost/mờ** · **KHÔNG health dot, KHÔNG "checking"** (không probe được vì chưa tồn tại). Cùng luật no-fake-status ở Luật 1.
- Đây là flex build-in-public: "đây là cái tôi chạy HÔM NAY — đây là chỗ tôi SẼ tách." Khi thật sự triển khai → chuyển service từ "Tương lai" sang "Hiện tại" + thêm probe thật, bỏ badge Coming soon.

## Nguyên tắc rút ra
- Bản đồ hệ thống LỚN → gom theo NĂNG LỰC (pod) + drill-down 2 tầng khi 1 mặt phẳng bắt đầu đè nhau (>~10 node). Overview = pod (thở), detail = sub-scene giàu. Status gộp theo ngưỡng, không thuần worst-of. Honesty xuyên suốt: dot chỉ do probe thật (xám trước, màu sau); khu tương lai = Coming soon không dot.

## Trạng thái (System Atlas, `/architecture`)
- MVP flat-map (17 node) + poll live + curl tester: đã dựng.
- Pod grouping + drill-down + roll-up ngưỡng + logo thật + khu Tương lai: **CHỜ BUILD** — luật này là spec cho lượt build tiếp theo.
