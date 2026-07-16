---
name: starci-fe-consolidate-components-scan
description: >
  SCAN half of the consolidate pair (sibling of `starci-fe-consolidate-components-apply`). Scans a SCOPE of the MAIN
  StarCi FE app (`C:\Repositories\starci-academy`) — `all` (whole app) · a page/route · a feature · a file set — for
  DUPLICATED or near-duplicate component code (copy-pasted JSX clusters, repeated className blobs, parallel components
  that should be ONE). Groups the clusters, decides reuse-existing-block vs extract-new (grounded in `fe/components/` +
  MEMORY of past consolidations so it never re-proposes what's done), and writes a CONSOLIDATION PROPOSAL to
  `fe/proposals/` (a PENDING row in the backlog). **NO code change** — the apply half builds it. Offers same-session
  apply. Wide scope → fan-out scanners. Trigger when the user types `/starci-fe-consolidate-components-scan <scope>`, or
  asks to "scan/tìm component trùng · quét lặp code · tìm chỗ gom component".
---

# /starci-fe-consolidate-components-scan — TÌM component trùng → proposal (không sửa code)

Nửa SCAN của cặp gom-component. Quét scope → gom cụm trùng → chốt block đích → **ghi proposal** vào hàng đợi. **KHÔNG
đụng code** (apply mới build).

## Model policy (rẻ ở chỗ nhiều, khôn ở chỗ quyết)
**Scan/fan-out = HAIKU** (rẻ, quét rộng bắt cụm lặp) · **rank + chốt cụm trùng + viết plan/proposal = OPUS** · (apply: Opus spec → Sonnet code). Haiku quét, Opus chốt.

## Scope (arg)
`all` (toàn app) · `page <route>` · `feature <name>` · tập file. Rộng → **fan-out** HAIKU scanner per subtree.

## Quy trình
1. **SCAN tìm trùng** — quét scope, bắt: JSX cluster copy-paste · `className` blob lặp · component **cùng cấu trúc khác data** · 2+ chỗ tự-dựng cùng 1 primitive. **Ground source thật**; scope rộng → fan-out, gom kết quả.
2. **ĐỐI CHIẾU** — cụm này **đã có block canonical trong `fe/components/`** chưa (→ đề xuất DÙNG LẠI) hay cần **block mới** (element-aware, props `WithClassNames`, 1 folder). Check **MEMORY** (đợt trước gom gì → khỏi đề xuất lại).
3. **GHI PLAN NGẦM (đầy đủ, nền)** — `fe/proposals/consolidate-<scope>.plan.md` = **MỌI cụm potential**, rank theo IMPACT (số call-site · độ trùng · nợ), mỗi cụm 1 dòng + status (⬜ chưa · 🔨 đang · ✅ done). Đây là **plan NGẦM** — ghi HẾT ra đây nhưng **KHÔNG đổ hết ra duyệt**. Re-chạy → cập nhật plan (thêm cụm mới, GIỮ status cũ, bỏ cụm đã ✅).
4. **LIST 3 CỤM / LẦN** (dễ duyệt) — mỗi lần chạy chỉ lấy **3 cụm ⬜ rank cao nhất** từ plan → ghi `consolidate-<scope>-<batch>.proposal.md` (3 cụm: call-sites · block đích [tái dùng tên / trích mới] · files-to-touch · verify) + 1 dòng **PENDING** vào `fe/proposals/BACKLOG.md`. **Chỉ 3.** Chỉ ≥2-3 call-site (rule-of-three), ngữ nghĩa > hình (bỏ cụm khác-nghĩa). **STOP.**
   - Plan ngầm = "list những cái sắp làm" đầy đủ (thầy mở xem/đổi rank khi muốn); mỗi batch chỉ hiện 3. **Cạn cụm ⬜ → báo "hết trùng trong scope".**
5. **→ GỢI Ý APPLY NGAY:** hỏi thầy "gom luôn session này không?" → đồng ý → `starci-fe-consolidate-components-apply <scope>`; không → để sau (BACKLOG bàn giao).

## §Widget (BẮT BUỘC) — vẽ bản đồ gom
Mỗi lần scan → `show_widget` (gọi `read_me` module `diagram`/`mockup` trước) render **bản đồ dedup**: MỌI cụm xếp theo impact-rank · đánh dấu **3 cụm batch này** (accent) vs **sắp-làm** (plan ngầm, muted) vs **giữ-riêng** (khác nghĩa) · mỗi cụm kèm **block đích** + **số call-site**. Thầy NHÌN map là thấy toàn cảnh + chọn nhanh, không chỉ đọc bảng.

## ★ Tự phản biện TRƯỚC khi trình cụm (bắt buộc — `.claude/fe/principles/self-critique-before-presenting.md`)
Trước khi list 3 cụm cho thầy: (1) **phản biện mỗi cụm** — có phải trùng THẬT (ngữ nghĩa) không, hay chỉ giống HÌNH mà khác nghĩa (đừng ép gom 2 thứ khác job)? đủ rule-of-three call-site chưa? (2) **phản biện độ phủ** — quét đủ scope chưa hay báo "hết trùng" khi mới soi 1 nửa? Đừng trình cụm chưa tự-đập.

## Ràng
- Report + proposal, **KHÔNG sửa code / KHÔNG tạo block** (đó là apply).
- Không đoán — cụm trùng phải neo call-sites thật. Nghi 2 thứ khác-nghĩa → giữ riêng, ghi rõ.

## Liên quan
- Build proposal → `starci-fe-consolidate-components-apply` · block design mới → `starci-fe-block-brainstorm` · canon `fe/components/` · hàng đợi `fe/proposals/BACKLOG.md`.
