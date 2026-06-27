# Draft — Reframe surface theo CONTENT THẬT (kill dead-filter) + public infra showcase GROUNDED nhưng KHÔNG leak prod state + 3D R3F chỉ cho wow-hero (2026-06-27)

- File/§ đích khi `/merge`: `concepts/` (grounded-in-data + security) + mở rộng [[design-for-data-that-exists-coverless-lowvolume]] · [[marketing-graph-viz-xyflow-d3force-not-new-webgl-lib]] · [[landing-grounded-real-courses-and-systems]].
- Bối cảnh: brainstorm lại `/blog`. Data thật: 12 bài seed ĐỀU `category=codebase` (mổ xẻ chính backend StarCi). Thầy: *"blog này tập trung cho hạ tầng StarCi Academy Backend thôi, có ý gì hay hơn không"* → reframe; rồi *"health-check các thành phần + vẽ threejs"* → *"công khai, public"*.

## Luật 1 (STRICT) — Reframe surface theo CONTENT THẬT đang có, KHÔNG theo schema/định-vị lý tưởng; KILL dead-bucket filter
- **Khi seed content của 1 surface đã "co" về 1 loại thật (vd mọi bài blog đều `codebase` = mổ xẻ backend), ĐỊNH VỊ + TAXONOMY của surface phải đi theo content THẬT đó, không giữ khung generic.** Vd `/blog` không phải "blog học tập generic 6 pillar" → nó LÀ "ấn phẩm kỹ thuật / sổ tay kiến trúc backend". Nhãn, eyebrow, taxonomy phải phản ánh điều content thật sự là.
- **CHỈ render filter/category/facet cho bucket CÓ bài.** 6-pillar filter mà 5 cái rỗng = anti-pattern (đúng họ [[design-for-data-that-exists-coverless-lowvolume]]: đừng vẽ UI cho data không tồn tại / filter trỏ bucket rỗng). Filter phải gate theo `items.length > 0`; taxonomy hiển thị = **derive từ content thật** (vd subsystem: CQRS/Kafka/RAG/CDC…), KHÔNG phải enum aspirational trong schema.
- **Tận dụng field "đúng bản chất content" còn bỏ phí:** content "mổ xẻ codebase" → `sourceUrl` ("đọc source ↗") là hệ số tin cậy số 1; bỏ trống = mất điểm. Ghim entry-point tự nhiên ("Start here") thay vì chỉ newest-first.
- Nguyên tắc: **đọc seed THẬT trước khi chốt IA**; định v/taxonomy bám "content đang có", giữ enum rộng ở BE cho tương lai nhưng FE chỉ phơi cái populated.

## Luật 2 (STRICT) — Public infra/architecture showcase: GROUNDED real components, NHƯNG KHÔNG leak live prod up/down/latency
- **Surface CÔNG KHAI (landing/blog/marketing) vẽ kiến trúc/hạ tầng → phải GROUNDED từ component THẬT + dây nối thật (số/tên không bịa), NHƯNG KHÔNG được phơi trạng thái LIVE up/down/latency của prod.** Lý do: "Kafka down / Redis 0 keys" công khai = lộ trạng thái vận hành = **tín hiệu cho attacker** (biết lúc nào hệ yếu). Grounded-in-data ≠ phơi-mọi-thứ.
- **Tách 2 chế độ, 1 block dùng chung:**
  - **Public** = topology curated (component thật + connection thật) + animated "đang sống" (pulse/packet decorative), **luôn đọc operational** — KHÔNG bind realtime down-state per-component.
  - **Live thật** (per-component status/latency) = **gate sau auth admin** (vd `/status`, giống trang admin `aiBalancer`). Đây mới bind `systemHealthStatus` thật (màu success/warning/danger).
- **Hệ quả engineering:** public showcase **KHÔNG cần BE health query** (topology = constant curated, như landing systems-list). Health query (`systemHealthStatus`) chỉ cần cho admin → defer, KHÔNG block public hero. → đừng tự build BE endpoint "công khai live health" theo phản xạ; hỏi "ai xem + lộ gì".
- Cùng họ [[secrets-env-in-script-out-protocol]] (ranh giới lộ thông tin) + [[landing-grounded-real-courses-and-systems]] (grounded nhưng curated, không dump).

## Luật 3 — 3D (three.js/R3F) CHỈ cho wow-hero 3D thật; node-graph 2D giữ xyflow (mở rộng rule cũ)
- **Đính chính/bổ sung [[marketing-graph-viz-xyflow-d3force-not-new-webgl-lib]]:** rule đó ưu tiên xyflow+d3-force cho graph/network 2D. NGOẠI LỆ rõ = **wow-hero 3D thật** (architecture scene 3D, globe, depth) → R3F/three.js LÀ đúng tool (canvas vẽ tay khó theme; nhưng 3D thì xyflow không làm được). Điều kiện: (a) là 3D THẬT, không phải node-graph phẳng tô bóng; (b) chỉ **1 hero** (lazy `dynamic(ssr:false)`, bundle ~300–400KB gz); (c) có precedent/stub trong repo (vd `ArchitectureScene` đã intended ở Landing).
- **Browse map / knowledge graph 2D → vẫn xyflow** (+ d3-force nếu cần force layout). KHÔNG kéo three.js vào việc 2D. → 3D cho hero, xyflow cho duyệt; không lẫn.
- Single source: block 3D dùng chung nhiều nơi (vd `ArchitectureScene` cho blog masthead + landing hero), không clone.

## Áp đầu (CHỐT 2026-06-27, CHƯA code — defer `/starci-fe-ux-apply`)
- Blog `/blog` → reframe Hướng A "Hệ thống StarCi, mổ xẻ" (eyebrow ENGINEERING, taxonomy=subsystem thật, ghim "Start here", wire `sourceUrl`, filter chỉ render bucket có bài).
- Masthead blog + Landing hero = block R3F `ArchitectureScene` (public showcase grounded: 13 component thật, animated, operational, KHÔNG leak prod state).
- BE `systemHealthStatus` (ping 13 component, pattern `aiBalancerHealth`) = **task riêng, cho ADMIN live `/status`, optional/defer** — KHÔNG block public hero.
- Doc đầy đủ: `starci-academy/src/components/layouts/blog/UX-BRAINSTORM.md` (vòng 2 + masthead 3D).
