# Draft — Phân biệt DISABLE (không khả dụng) vs LOCK (chưa mua gói) + auto-save PER-ROW không gate global (2026-06-23)

- File/§ đích khi `/merge`: `starci-ui.rules` (states/icon) + `main.md` §14 (heuristics) + §7 (async/form).
- Bối cảnh: panel Nộp bài (challenge) — (1) dropdown chọn model chấm: model "lock" hết dù pakoo có gói plus active;
  (2) URL bài nộp không persist qua submission + F5. Thầy: *"phân biệt disable (key không hợp lệ) vs lock (chưa mua gói)"*
  + *"sao url không persist qua các lần submission và f5"*.

## Luật 1 — Hai lý do "khoá" KHÁC NHAU phải có icon/visual KHÁC NHAU
- **DISABLE** = phần tử *tạm không khả dụng* vì lý do hệ thống/cấu hình (model down, **provider key không hợp lệ**,
  feature flag off) → icon **cảnh báo** (`WarningCircleIcon`), tooltip "tạm không khả dụng", **KHÔNG** click được, KHÔNG CTA mua.
- **LOCK** = phần tử *bị khoá theo quyền* (chưa mua gói / chưa enroll) → icon **ổ khoá** (`LockIcon`), tooltip "mua gói",
  click → route tới trang mua/nâng cấp.
- **CẤM dùng chung 1 icon (LockIcon) cho cả hai** — user không phân biệt được "tôi cần mua gói" vs "hệ thống đang lỗi key".
  Vụ này: `GradeModelDropdown` cũ dùng `LockIcon` cho CẢ `!model.available` (disable) lẫn `!canPremium` (lock) → sửa:
  `!available` → `WarningCircleIcon`; `!canPremium` → giữ `LockIcon`. (Ở local, model lock-hết thực ra là DISABLE do key
  provider invalid, KHÔNG phải do thiếu gói — `canPremium` đã true khi có sub active.)
- **Nguyên tắc rút ra:** trước khi vẽ "khoá", hỏi *khoá VÌ SAO* → mỗi nguyên nhân 1 affordance riêng (icon + tooltip + hành vi click).

## Luật 2 — Auto-save PER-ROW: cờ lỗi GLOBAL không được chặn lưu của row hợp lệ
- Form nhiều row (vd nhiều submission requirement) có auto-save (debounced): **điều kiện lưu phải tính THEO TỪNG ROW**,
  KHÔNG được gate bằng cờ lỗi GLOBAL (`hasErrors = errors.some(...)`). Vụ này: `useEditSubmissionForm` cũ
  `if (!isOpen || hasErrors) return` → chỉ cần MỘT requirement còn trống/invalid (mặc định khi chưa điền hết) là
  **chặn auto-save MỌI row** → URL gõ vào không bao giờ được sync → 0 row trong DB → mất khi F5.
- **Fix:** bỏ gate `hasErrors` global; trong filter `changed`, mỗi row tự kiểm **url non-empty + valid** (`!validateUrl(type,url)`)
  → row hợp lệ tự lưu độc lập, row trống/invalid không kéo theo. (BE `syncSubmission` đã nhận + validate + persist `url` sẵn
  → chỉ FE chặn nhầm.)
- **Nguyên tắc rút ra:** "1 field sai làm hỏng cả form" là anti-pattern cho auto-save/draft. Validate + lưu **độc lập theo đơn vị**
  (row/field). Cờ tổng (disable nút Submit cuối) thì OK; nhưng auto-save nháp thì phải per-unit.

## ĐÃ ÁP DỤNG 2026-06-23 (FE D:\Repositories\starci-academy)
- `GradeModelDropdown`: `!available` → `WarningCircleIcon` (disable), tách khỏi `!canPremium` `LockIcon` (lock). tsc/lint sạch.
- `useEditSubmissionForm`: bỏ `hasErrors` global gate → filter per-row (url non-empty + `!validateUrl`). URL giờ auto-save
  từng row hợp lệ → persist qua F5/submission. tsc/lint sạch.
- Còn ngỏ: vì sao 1 vài model `available=false` ở local (key provider) — đó là config env, không phải bug FE.
