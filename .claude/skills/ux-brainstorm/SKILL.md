---
name: ux-brainstorm
description: >
  Re-imagine the UX of a given page in the MAIN StarCi Academy web app (`C:\Repositories\starci-academy`)
  from first principles. Researches the BACKEND (GraphQL queries/mutations + Postgres entities = what
  data truly exists) and the CURRENT/legacy UX (ONLY as an inventory of features/data shown + pain
  points — NOT as the design to copy), then brainstorms a fresh information architecture and several
  design directions grounded in the real data + the design mindset. Output = a brainstorm doc +
  recommendation, NO code. Run with MAX reasoning effort (Opus). Trigger when the user types
  `/ux-brainstorm <page>` or asks to rethink/redesign a page's UX.
---

# /ux-brainstorm — Re-imagine a page's UX from data + first principles (Opus · MAX effort)

Thiết kế LẠI UX 1 trang. **Legacy + BE + DB chỉ để biết CÓ GÌ; tư duy thiết kế đến từ mindset, KHÔNG từ legacy.**
Bước này KHÔNG viết code — chỉ brainstorm + chốt hướng. CHẠY MAX EFFORT (đào rộng, nghĩ kỹ, nhiều hướng).

## Nguyên tắc
- **Legacy = inventory, KHÔNG phải design authority.** Đọc trang hiện tại (`PublicProfileLegacy`/`layouts`/
  `reuseable` …) CHỈ để liệt kê: đang cho xem dữ liệu/tính năng gì + điểm đau gì. ĐỪNG bê cấu trúc/tư duy legacy sang.
- **Grounded in data:** mọi ý tưởng tựa trên field BE/DB THẬT — đừng vẽ UI cho dữ liệu không tồn tại. Field CÓ
  nhưng CHƯA dùng = cơ hội.
- **Mindset-first:** áp `main.md` §1 (triết lý) + skill **`ui-ux-pro-max`** (purpose trước pixel · 1 primary action
  · empty/loading/error · recruiter/user-first · nội dung > vanity · ăn cắp pattern đã chứng minh).

## Quy trình (MAX effort)
1. **Khoanh vùng trang:** route + cây component hiện tại (mới + legacy).
2. **Research SONG SONG — spawn Explore agents (đừng đoán):**
   - **BE** `C:\Repositories\ac\starci-academy-backend`: GraphQL query/mutation phục vụ trang + resolver + field trả về.
   - **DB**: Postgres entities (`src/modules/databases/postgresql/**/entities`) — field/quan hệ thật → dữ liệu KHẢ DỤNG (kể cả field chưa khai thác).
   - **Legacy UX**: trang hiện cho xem gì + pain (loãng / vanity / thiếu state / khó đọc / phân cấp sai).
3. **Skill `ui-ux-pro-max`**: chạy `--design-system` + domain `product`/`ux` cho loại trang này → style/pattern/anti-pattern.
4. **Brainstorm:**
   - Mục tiêu trang: AI dùng, cần gì trong ≤30s → cắt vanity, nâng cái "làm được".
   - **Information architecture mới**: section nào · thứ tự · cái gì PRIMARY · cái gì gộp/cắt/thêm.
   - **≥2–3 HƯỚNG khác nhau** (vd recruiter-first vs learner-first), nêu trade-off, rồi **CHỐT 1 + lý do**.
   - Map mỗi section → field BE/DB cụ thể; đề xuất tận dụng field chưa dùng.
   - Empty/loading/error + a11y tính từ đầu.
5. **Output:** ghi **`<Feature>/UX-BRAINSTORM.md`** (cạnh trang, kiểu `NEW-PROFILE.spec.md`) + tóm tắt trong chat:
   mục tiêu · IA mới · các hướng + hướng chốt · bảng section→dữ liệu BE/DB · điều cắt/thêm. **KHÔNG code.**

→ Thầy duyệt hướng → `/ux-apply` để dựng. **Thầy feedback bất cứ lúc nào → tự ghi `.claude/rules/drafts/<temp>.md`** (rút nguyên tắc tổng quát), KHÔNG sửa main.md/starci-*.md trực tiếp.
