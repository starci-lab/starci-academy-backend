# Draft — Thẻ "mẫu" minh hoạ trên landing/marketing = STATIC mockup, KHÔNG fetch API (2026-06-26)

- File/§ đích khi `/merge`: `concepts/` (landing/marketing) + liên quan [[design-for-data-that-exists-coverless-lowvolume]] (grounded-in-data) + [[landing-rebuild]] (show-don't-tell).
- Bối cảnh: section "Hai hướng đáng giá" (talent marketplace) — tấm thẻ ứng viên bên phải ban đầu fetch `useQueryOpenToWorkUsersSwr` (lấy 1 open-to-work user thật làm mẫu, fallback card chung khi rỗng). Thầy: *"cái này trò render non-API, static được không"*.

## Luật (STRICT)
- **Thẻ/khối ĐÓNG VAI "mẫu minh hoạ" trên landing/marketing (sample profile, ví dụ kết quả, preview sản phẩm) → render STATIC (hard-code trong constants), KHÔNG gọi API.** Nó là **ảnh chụp sản phẩm** (product screenshot) để bán câu chuyện, không phải dữ liệu thật của 1 user → không cần (và không nên) phụ thuộc fetch. Lợi: luôn đầy đủ/đẹp (không rỗng khi DB trống — vd incognito, chưa ai bật open-to-work), không loading/empty/error, không kéo theo BE contract.
- **Vì là MẪU minh hoạ (rõ ràng trong ngữ cảnh) → được phép dùng số/chi tiết illustrative** (CV 87/100, challenge 12·TB84, skills) để thẻ "đậm" như thật — KHÁC với thẻ hiển thị 1 USER THẬT (chỗ đó cấm bịa số, chỉ show field có thật). Phân biệt: *thẻ-1-người-thật* = grounded, chỉ field thật; *thẻ-mẫu-marketing* = static mockup, số đại diện hợp lý OK. Đặt số ở 1 constant (`LANDING_SAMPLE_CANDIDATE`) + label qua i18n.
- **KHÔNG impersonate người thật**: thẻ mẫu dùng persona minh hoạ (tên chung, không link tới profile thật), không bê 1 user thật ra "trưng" trừ khi có chủ đích + đồng thuận.
- **Khi nào VẪN nên API:** khối là PROOF thật (live count "N kỹ sư đang sẵn sàng", avatar group người thật) — cái đó phải số thật + gate honest (ẩn khi < min). Phân biệt: *proof* = số thật/gate; *illustration* = static mockup. Vụ này: bỏ luôn live-count (proof) theo ý "non-API", chỉ giữ thẻ mẫu static.

## Đã áp 2026-06-26 (FE)
- `Landing/TalentMarketplace`: gỡ `useQueryOpenToWorkUsersSwr` + AvatarGroup live-count → `SampleCandidateCard` static (đọc `LANDING_SAMPLE_CANDIDATE`: name/skills/xp/cvScore/challenge). i18n `landing.outcome.card.{role,openToWork,cvScore,challenges,challengeValue,xp}`. Revert thay đổi GraphQL `openToWorkUsers` (thêm points/roleTitle/githubUsername) vì không còn dùng. tsc/eslint sạch.
