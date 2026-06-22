---
name: starci-business-brainstorm
description: >
  Brainstorm chiến lược KINH DOANH thiên MARKETING cho 1 sản phẩm/codebase StarCi, GROUNDED từ
  source code thật. Đọc source (FE + BE: GraphQL queries/mutations, Postgres entities, payment
  gateways, AI, gamification, modules) để biết sản phẩm THẬT SỰ làm được gì → từ đó suy ra
  positioning, ICP/phân khúc, value prop, pricing/packaging, growth loop, kênh acquisition, góc
  content/KOL, ý tưởng campaign & monetization. Output = doc brainstorm + BẮT BUỘC vẽ WIDGET bản đồ
  "source code → cơ hội thị trường". KHÔNG viết code. Chạy MAX effort (Opus). Trigger khi user gõ
  `/starci-business-brainstorm`, hoặc nói "brainstorm business/marketing", "ý tưởng kinh doanh từ
  source", "go-to-market", "định vị sản phẩm", "monetize cái này".
---

# /starci-business-brainstorm — Từ SOURCE CODE ra chiến lược marketing (Opus · MAX effort)

Biến **codebase thật** thành **chiến lược kinh doanh thiên marketing**. Source code = nguồn sự thật về
"ta BÁN ĐƯỢC gì"; tư duy marketing đến từ framework + thị trường, KHÔNG từ phỏng đoán. Bước này KHÔNG
viết code — chỉ brainstorm + chốt hướng + **vẽ widget**. CHẠY MAX EFFORT (đào rộng, nhiều hướng).

## Nguyên tắc

- **Grounded in source — KHÔNG bịa tính năng.** Mọi value prop/định vị phải neo vào capability CÓ THẬT
  trong code (1 GraphQL mutation, 1 entity, 1 gateway, 1 module). Tính năng CÓ trong code nhưng CHƯA
  marketing = "hidden gem" → cơ hội. Tính năng KHÔNG có code = KHÔNG được hứa.
- **Marketing-first lens.** Mỗi capability hỏi: *bán cho AI · giải quyết JTBD gì · khác đối thủ chỗ nào ·
  hook 1 câu là gì · gói/giá thế nào · vòng tăng trưởng (growth loop) ra sao · góc content/KOL nào?*
- **Ref-grounded — KHÔNG bịa framework/đối thủ.** Nếu domain/loại sản phẩm CHƯA có ref trong memory/
  rules, **BẮT BUỘC `WebSearch` + `WebFetch`**: đọc 2–3 đối thủ/đầu ngành thật + 1 framework marketing
  phù hợp (Positioning của April Dunford · Value Proposition Canvas · JTBD · AARRR funnel · Hook/Loops ·
  Category Design). Mỗi hướng neo vào ref cụ thể (tên sản phẩm/nguyên tắc), liệt kê link.
- **≥2–3 hướng khác nhau, rồi CHỐT 1.** (vd: education-led KOL vs product-led freemium vs B2B/white-label.)
  Nêu trade-off, ai mua, vì sao thắng.
- **Số liệu thì nói rõ là giả định.** Không bịa traffic/doanh thu/đối thủ; ước lượng = ghi "(giả định)".

## Quy trình (MAX effort)

1. **Khoanh phạm vi:** sản phẩm/repo nào (mặc định FE `starci-academy` + BE `starci-academy-backend`),
   hay 1 module/feature cụ thể user chỉ định.

2. **Đọc source — spawn Explore agents SONG SONG (đừng đoán):**
   - **BE capabilities:** `src/modules/api` (GraphQL apollo + rest) — liệt kê query/mutation = "hành động
     user làm được"; `src/modules/databases/**/entities` = dữ liệu/đối tượng kinh doanh thật.
   - **Monetization có sẵn:** payment gateways (`sepay/payos/paypal/stripe/nowpayments`), `membership`,
     subscription/credit, premium-lock → **đòn bẩy doanh thu đã code**.
   - **Moat/khác biệt:** `ai` (balancer/langchain), gamification (league/streak/achievement/flashcard),
     `judge0` (coding sandbox), `elasticsearch` (search), CQRS/realtime → điểm "khó copy".
   - **FE bề mặt:** trang/feature người dùng thấy (course/learn/profile/dashboard/feed) = nơi gắn CTA.
   → Ra **bảng INVENTORY**: capability → file:nguồn → trạng thái (đang dùng / hidden gem).

3. **Map capability → tài sản marketing.** Mỗi nhóm capability → {JTBD nó giải · value prop 1 câu ·
   phân khúc mua · hook/headline · gói+giá gợi ý · kênh phân phối · góc content/KOL}.

4. **Brainstorm chiến lược:**
   - **Định vị (positioning):** ta là CATEGORY gì, cho AI, khác alternative ra sao (điền mẫu Dunford).
   - **ICP & phân khúc:** 2–3 chân dung khách mua thật, ưu tiên 1.
   - **Packaging & pricing:** free/pro/team hoặc credit — gắn THẲNG vào feature đã có gateway.
   - **Growth loop:** vòng lan (content→signup→tạo content→lan tiếp / referral / UGC challenge).
   - **Go-to-market & KOL:** 3–5 ý content/campaign cụ thể tận dụng thế mạnh "tech KOL · automation ·
     blockchain"; mỗi ý nêu kênh + thông điệp + tài sản code làm bằng chứng.
   - **≥2–3 HƯỚNG** trade-off → **CHỐT 1 + lý do**.

5. **Output doc:** ghi **`.business/BUSINESS-BRAINSTORM-<scope>-<topic>.md`** (tạo thư mục `.business/` nếu
   chưa có) + tóm tắt trong chat: inventory · positioning · ICP · packaging · growth loop · GTM/KOL · các
   hướng + hướng chốt · rủi ro/giả định. **KHÔNG code.**

6. **VẼ WIDGET — BẮT BUỘC (sau khi append doc).** Sau khi xuất doc, PHẢI render **widget bản đồ
   "SOURCE CODE → CƠ HỘI THỊ TRƯỜNG"** bằng `show_widget` (gọi `read_me` module `diagram` + `data_viz`
   TRƯỚC). Widget gồm:
   - **Cột trái = capability THẬT trong source** (gom nhóm: monetization / moat / engagement / content),
     mỗi node ghi rõ nguồn (module/mutation).
   - **Cột phải = tài sản marketing** (value prop · phân khúc · kênh · gói giá) — nối mũi tên từ capability.
   - **Tô đậm hướng CHỐT** (viền accent `#00a898` / `--color-border-info`); hidden-gem highlight khác màu.
   - Flat, dùng CSS vars, đẹp cả light/dark; **NHÌN là hiểu code nào → bán cái gì**, không chỉ tả bằng chữ.
   - Loading messages giữ trung tính nếu topic nhạy cảm; còn lại được phép chơi chữ.

→ Thầy duyệt hướng → triển khai (content/landing/pricing) ở bước riêng. **Thầy feedback bất cứ lúc nào →
tự ghi `.business/drafts/<temp>.md`** (rút nguyên tắc business/marketing tổng quát) để lần sau tái dùng.
