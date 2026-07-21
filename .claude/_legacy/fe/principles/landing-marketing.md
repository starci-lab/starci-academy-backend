# Concept — Landing / Marketing

> Heuristic (họ `concepts/*`, FE). Nguyên tắc DÙNG CHUNG cho mọi surface landing/marketing (grounded, định vị, viz, copy). Bổ trợ [[single-source-render]] · [[concepts/card]] · [[no-uppercase-text]] · [[no-emoji]].

## 1. Grounded-in-data — thiết kế cho DỮ LIỆU THẬT đang có, KHÔNG cho schema lý tưởng (STRICT)
- **Field TỒN TẠI trong schema nhưng content luôn `null`/rỗng ⇒ KHÔNG được phụ thuộc.** Layout phải đẹp khi field vắng; dùng field chỉ **cơ hội** (render khi có, bỏ khi không). Soi seed data thật + entity nullable TRƯỚC khi chọn pattern — đừng vẽ UI cho ảnh/tác giả/tag/search/count mà BE-DB không cấp.
- **Cover null / content text-only ⇒ TEXT-FIRST** (typography + whitespace + scale cỡ chữ gánh phân cấp), KHÔNG image-grid (ảnh null = hộp rỗng buồn).
- **Ít item (early-stage) ⇒ thêm 1 "featured anchor"** (1 điểm nhấn editorial + list text) để trang không trống. ĐỪNG chọn pattern "section theo nhóm/pillar" khi đa số nhóm còn RỖNG (5/6 pillar trống = trông hỏng — đó là shape v2).
- **KHÔNG bịa data cho UI:** không có count BE → đừng nhồi "n bài" vào chip; không có author → không byline. Chip/nhãn chỉ phản ánh field THẬT.
- **Tận dụng field đã có nhưng FE bỏ phí** thay vì thêm BE (vd `isPremium` → tag "Members"; `sourceUrl` → nút "đọc source ↗"; query cùng category → strip "related").
- **Landing CHỈ marketing track/course/hệ-thống CÓ THẬT trong curriculum.** Trước khi đưa 1 "track/lộ trình/proof" lên landing, kiểm data thật (vd `.mount/data/courses/`) — KHÔNG bịa track ma cho "nghe sang" (khách bấm vào không có gì). Proof "không CRUD" = liệt kê **hệ thống THẬT từ capstone**, số liệu (challenge/capstone/module) THẬT từ data.
- **Curated marketing copy** (systems list, tier, tracks) = i18n constant rút từ curriculum thật (highlight chọn lọc), KHÔNG query live. List động đầy đủ sống ở trang chuyên (vd `/courses`).

## 2. Reframe surface theo CONTENT THẬT đang có; KILL dead-bucket filter (STRICT)
- **Khi seed content của 1 surface đã "co" về 1 loại thật (vd mọi bài blog đều `codebase`), ĐỊNH VỊ + TAXONOMY phải đi theo content THẬT đó**, không giữ khung generic. Nhãn/eyebrow/taxonomy phản ánh content thật sự là gì (vd `/blog` = "sổ tay kiến trúc backend", không phải "blog học tập 6 pillar").
- **CHỈ render filter/category/facet cho bucket CÓ item** (gate `items.length > 0`). Filter trỏ bucket rỗng = anti-pattern (§1). Taxonomy hiển thị = **derive từ content thật**, không phải enum aspirational trong schema (giữ enum rộng ở BE cho tương lai, FE chỉ phơi cái populated).
- **Đọc seed THẬT trước khi chốt IA.**

## 3. Landing = render TRACK (curated), KHÔNG dump course-catalog; 1 entity = 1 SECTION
- **Landing kể chuyện CURATED** (chọn vài track/course tiêu biểu MẠNH), KHÔNG liệt kê hết mọi khóa (tránh khoe khóa mỏng/trống). Định vị bằng chiều SÂU + cấu trúc, không bề rộng (chợ khóa học). Catalog đầy đủ (search/enroll mọi khóa) sống ở trang `/courses`.
- **1 entity = 1 section duy nhất — KHÔNG tách 2 section render CÙNG N entity** (vd "Courses card" + "Roadmap tier" cùng 3 track = lặp). Gộp: mỗi card = identity + tier/path + CTA "Vào khóa". Cùng tinh thần [[single-source-render]] + [[concepts/card]] (đừng lặp khối).
- **CTA/track RA entity THẬT** (route course detail slug khớp DB), KHÔNG link catalog generic, KHÔNG bịa slug. Số (module count…) THẬT từ curriculum.

## 4. Sample / illustrative card = STATIC, KHÔNG fetch API; product-screenshot → ShowcaseMockup (STRICT)
- **Thẻ/khối ĐÓNG VAI "mẫu minh hoạ" (sample profile, ví dụ kết quả, preview sản phẩm) = render STATIC** (hard-code constant + i18n label), KHÔNG gọi API. Nó là **ảnh chụp sản phẩm** để bán câu chuyện, không phải data thật 1 user → luôn đầy đủ/đẹp (không rỗng khi DB trống), không loading/empty/error, không kéo BE contract.
- **Vì là MẪU minh hoạ (rõ trong ngữ cảnh) → được dùng số/chi tiết illustrative hợp lý** (vd CV 87/100) để thẻ "đậm". KHÁC thẻ hiển thị 1 USER THẬT (cấm bịa số, chỉ field thật). KHÔNG impersonate người thật (dùng persona minh hoạ, không link profile thật).
- **Card "đây là màn hình sản phẩm" (profile/leaderboard/submit mẫu) → bọc block `ShowcaseMockup`** (browser-chrome mac-dots + address bar) với **URL đọc như thật** (`starci.academy/profile/<slug>`), KHÔNG card trần. Khung trình duyệt + URL = tín hiệu "sản phẩm thật chạy được". Content bên trong **GROUNDED từ trang THẬT** (đọc component trang X thật → mirror đúng phần tử nhận diện + URL khớp route), KHÔNG bịa layout.
- **Phân biệt:** card là **data thật của trang** (record/receipt) → `SectionCard`/Card thường. Card là **ảnh chụp minh hoạ 1 màn** trên landing → `ShowcaseMockup` mini-web; sample data-object → static constant.
- **Khi nào VẪN API:** khối là PROOF thật (live count "N kỹ sư sẵn sàng", avatar người thật) → số thật + gate honest (ẩn khi < min). Phân biệt: *proof* = số thật/gate; *illustration* = static.

## 5. "Hứa build-in-public / tự đánh giá" phải SHOW bằng chứng, không claim suông
- Section HỨA công khai ("tự đánh giá chất lượng / làm công khai") phải GIỮ lời hứa: tối thiểu render câu hứa + đóng khung link thành **"đừng tin, đi mà kiểm"** (GitHub/blog = chứng cứ, không phải link trang trí); lý tưởng → SHOW artifact THẬT (ghi chú kỹ thuật mới nhất, activity heatmap, N hệ thống đã dựng). Hứa "công khai" mà không show gì = section yếu nhất. **Chỉ show artifact khi DATA THẬT có** (§1 — chưa wire hook thì làm editorial trước, nâng "kể→show" khi wire xong).
- **Đừng lặp section đã có** (vd founder section KHÔNG re-list systems/khóa đã là section riêng — [[single-source-render]]).

## 6. Public infra/architecture showcase: GROUNDED nhưng KHÔNG leak live prod state (STRICT)
- Surface CÔNG KHAI vẽ kiến trúc/hạ tầng → GROUNDED từ component THẬT + dây nối thật (số/tên không bịa), NHƯNG **KHÔNG phơi trạng thái LIVE up/down/latency của prod** ("Kafka down / Redis 0 keys" công khai = tín hiệu cho attacker). Grounded-in-data ≠ phơi-mọi-thứ.
- Tách 2 chế độ, 1 block: **Public** = topology curated + animated "đang sống" (decorative), luôn đọc operational, KHÔNG bind realtime down-state. **Live thật** (per-component status/latency) = gate sau auth admin (`/status`). → public showcase KHÔNG cần BE health query; đừng phản xạ build endpoint "công khai live health", hỏi "ai xem + lộ gì". Cùng họ [[secrets-env-in-script-out-protocol]].

## 7. Viz lib: graph 2D = `@xyflow/react` + `d3-force` (reuse), 3D wow-hero = R3F; KHÔNG kéo lib WebGL mới
- **Graph/network viz 2D (knowledge graph, force-directed) → ưu tiên `@xyflow/react` (đã có trong repo) + `d3-force` (layout-only)**, KHÔNG cài lib graph WebGL mới (react-force-graph/sigma/cosmograph) trừ khi scale >vài trăm node/cần GPU. Lý do: reuse dep team biết; **node = React component** → glow/màu/brand theo design token chuẩn (canvas phải vẽ tay, khó theme + a11y). Cùng tinh thần [[reimplement-dead-lib-natively-fb-reactions]].
- **NGOẠI LỆ = wow-hero 3D THẬT** (architecture scene 3D, globe, depth) → R3F/three.js là đúng tool (xyflow không làm 3D). Điều kiện: (a) 3D thật (không phải node-graph phẳng tô bóng); (b) CHỈ 1 hero (lazy `dynamic(ssr:false)`); (c) có precedent trong repo. → 3D cho hero, xyflow cho duyệt 2D; không lẫn. Block dùng chung nhiều nơi, không clone.
- **Diagram TĨNH/trang trí (hero, fixed layout)** → CSS keyframe / Framer thuần (packet chạy dây, marching-ants), KHÔNG kéo React Flow vào (vanity dependency cho hình tĩnh). React Flow chỉ cho diagram TƯƠNG TÁC. Component đã dùng Framer → giữ Framer cho motion mới (1 hệ animation, cùng `useReducedMotion`); CSS `@keyframes` chỉ cho thứ thuần trang trí tách biệt.

## 8. Showpiece tương tác KHÔNG auto = vanity — nó là FLEX hợp lệ; "trông ghê" → CONTAIN, đừng giết
- **Khi 1 viz/khối "trông ghê", TÁCH 'concept' khỏi 'thực thi' TRƯỚC khi quyết bỏ.** Ghê vì Ý TƯỞNG sai hay THỰC THI sai (full-bleed tràn lan + chaos layout)? → fix thực thi (contain + nắn), giữ concept. Đừng nhảy thẳng "thay bằng grid".
- **1 showpiece TƯƠNG TÁC (graph/animation/3D wow) trên landing = FLEX hợp lệ KHI sản phẩm bán chính "chất lượng kỹ thuật"** (vd force-graph live tự chứng minh trình engineering = proof on-brand, mạnh hơn grid "competent buồn"). Điều kiện KHÔNG thành vanity: **CONTAINED + gọn** (bounded, không sprawling/chaotic), grounded data thật, phục vụ thông điệp.
- **Cách contain 1 showpiece full-bleed bị chê:** (a) bọc khung bounded căn giữa (`max-w`, `rounded-3xl border`); HOẶC (b) split (showpiece 1 nửa, nửa kia copy flex + CTA). Khung HẸP hơn → PHẢI nắn lại layout/physics (giảm size variance, tăng collide pad, label không tràn, cân nhắc cap phần tử + "+N", center/zoom lại) — width hẹp không tự nhiên đẹp.
- **Đừng để "clean" giết "flex" theo phản xạ.** Landing là marketing — đôi khi MUỐN wow > đọc-nhanh. Hỏi mục tiêu section (*flex trình* → giữ showpiece contain; *quét nhanh* → grid), không mặc định "sạch = đúng".

## 9. N item chia chung 1 TRỤC → ma trận (trục hiện 1 LẦN), KHÔNG lặp scaffold ở từng card
- **≥3 item cùng bộ CỘT (tier/giai đoạn/tiêu chí so sánh) → render MA TRẬN: trục chung = CỘT hiện đúng 1 lần, mỗi item = 1 HÀNG** (cột đầu = identity item). ĐỪNG lặp cùng 1 ladder/tier-list trong từng card (lặp = nhiễu + che thông điệp "chung 1 cấu trúc"). Ma trận biến cái chung thành trục thị giác → đọc ra "cùng tư duy, khác nội dung". Cùng họ [[single-source-render]] + [[concepts/card]].
- **KHÔNG dùng ma trận** khi item không chia chung trục (mỗi cái cấu trúc khác → card thường) hoặc chỉ 1–2 item. Khác `TabsCard`/`SegmentedControl` (chọn 1-trong-N) — ma trận là HIỂN THỊ so sánh nhiều item cùng lúc.
- Impl (HeroUI `Table` compound) → DEFER `elements/` (xem note dưới).

## 10. Copy tiếng Việt (UI/landing): không lẫn English, dịch theo NGHĨA, label song nhịp (STRICT)
- **Câu tiếng Việt KHÔNG chèn từ tiếng Anh có sẵn từ Việt tốt** (`build → dựng`; `diagram-first → bắt đầu từ sơ đồ`). **Giữ English CHỈ cho thuật ngữ kỹ thuật chuẩn** (API, CI/CD, production, capstone, traffic, sharding, idempotency, leaderboard…). Phân biệt: từ phổ thông có từ Việt → dịch; thuật ngữ ngành đã quen English → giữ.
- **Dịch theo NGHĨA, không word-for-word** ("design for failure" → "thiết kế để chịu được sự cố", KHÔNG "thiết kế cho thất bại"). Idiom English dịch thẳng = sượng → tìm cách nói tự nhiên tiếng Việt cùng nghĩa.
- **Label/stat trong 1 hàng phải SONG NHỊP** (cùng độ dài/cấu trúc) — 1 label lệch dài phá nhịp editorial (vd "Huy hiệu đã trao" cạnh "Học viên · Bài học" → "Huy hiệu").
- **GIỮ wordplay/giọng cố ý** khi đã hay — chỉ làm mượt, đừng làm phẳng. Nắn copy = chỉ đụng `vi.json` (en.json giữ English), JSON hợp lệ.
- Cùng họ [[no-uppercase-text]] · [[no-emoji]].

## Liên quan
- [[single-source-render]] (1 entity/đại lượng = 1 chỗ render) · [[concepts/card]] (không lặp khối) · [[no-uppercase-text]] / [[no-emoji]] (copy) · [[fair-monetization-axiom]] (không khoe thứ không có).
