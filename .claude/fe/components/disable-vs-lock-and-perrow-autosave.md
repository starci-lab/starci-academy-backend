# Concept — DISABLE (không khả dụng) ≠ LOCK (chưa mua gói) icon riêng + auto-save PER-ROW không gate global

> Heuristic (họ `concepts/*`, FE states/form). Rút từ panel Nộp bài challenge: (1) model "lock" hết dù có gói active; (2) URL nộp không persist qua submission + F5.

## Luật 1 (STRICT) — Hai lý do "khoá" KHÁC NHAU → icon/visual KHÁC NHAU
- **DISABLE** = tạm không khả dụng vì hệ thống/cấu hình (model down, **provider key không hợp lệ**, feature flag off) → icon **`WarningCircleIcon`**, tooltip "tạm không khả dụng", **KHÔNG** click, KHÔNG CTA mua.
- **LOCK** = khoá theo quyền (chưa mua gói / chưa enroll) → icon **`LockIcon`**, tooltip "mua gói", click → route tới trang mua/nâng cấp.
- **CẤM dùng chung 1 icon (LockIcon) cho cả hai** — user không phân biệt "tôi cần mua gói" vs "hệ thống lỗi key". Vd `GradeModelDropdown`: `!model.available` → `WarningCircleIcon` (disable); `!canPremium` → `LockIcon` (lock). (`canPremium` đã true khi có sub active → model lock-hết ở local thực ra là DISABLE do key invalid.)
- **Nguyên tắc:** trước khi vẽ "khoá", hỏi *khoá VÌ SAO* → mỗi nguyên nhân 1 affordance riêng (icon + tooltip + hành vi click).

## Luật 2 (STRICT) — Auto-save PER-ROW: cờ lỗi GLOBAL không được chặn lưu của row hợp lệ
- Form nhiều row (vd nhiều submission requirement) auto-save (debounced): **điều kiện lưu tính THEO TỪNG ROW**, KHÔNG gate bằng cờ lỗi GLOBAL (`hasErrors = errors.some(...)`). Vụ này: `if (!isOpen || hasErrors) return` → chỉ cần MỘT requirement trống/invalid (mặc định khi chưa điền hết) là **chặn auto-save MỌI row** → URL gõ không bao giờ sync → 0 row DB → mất khi F5.
- **Fix:** bỏ gate `hasErrors` global; trong filter `changed`, mỗi row tự kiểm **url non-empty + valid** (`!validateUrl(type,url)`) → row hợp lệ tự lưu độc lập.
- **Nguyên tắc:** "1 field sai làm hỏng cả form" = anti-pattern cho auto-save/draft. Validate + lưu **độc lập theo đơn vị** (row/field). Cờ tổng (disable nút Submit CUỐI) thì OK; auto-save nháp phải per-unit.

## Liên quan
- [[submit-requires-valid-input-fe-disable-be-throw]] (submit gate + BE throw) · [[elements/icon]] §2 (WarningCircle vs Lock) · [[status-icon-overrides-base]].
