# BIÊN BẢN — Sự cố audit mock-interview lệch DB↔.mount + kế hoạch sửa theo .mount (SSOT)

> Ngày: 2026-07-19 · Phạm vi: toàn bộ mock-interview checklist grading (devops · fullstack · system-design)

---

## 1. TL;DR (đọc cái này trước)

- Audit checklist ban đầu chạy trên **nguồn DB** (`_all.json`, 660 câu dump từ Postgres local).
- **DB fullstack + SD đã CŨ, lệch hoàn toàn so với `.mount` git** (SSOT hiện tại). Chỉ **devops còn khớp**.
- Hệ quả: **devops checklist ĐÚNG**, **fullstack + SD checklist bị sinh/ghi nhầm folder**.
- Bản đã push **main data `24c5319e4`**: devops đúng (giữ), **fullstack 166 folder SAI → phải bỏ**.
- **Session kia đang chạy SD DB-driven → output cũng SẼ SAI → phải DỪNG.**
- **Cách sửa duy nhất đúng: audit FOLDER-DRIVEN từ `.mount` git** — đọc `prompt`/`idealAnswer` thẳng từ mỗi folder, ghi checklist trở lại chính folder đó (key = đường dẫn folder, không thể ghi nhầm). Bỏ hẳn DB/`_all.json`.

---

## 2. Bằng chứng (prompt match: DB vs .mount folder cùng vị trí)

| Khóa | DB (`_all.json`) | `.mount` (SSOT) | Prompt khớp | Kết luận |
|---|---|---|---|---|
| **devops** | 280 | 280 | **280 / 280 (100%)** | DB = .mount → **ĐÚNG** |
| **fullstack** | 188 | 345 | **1 / 188** | DB lệch hẳn .mount |
| **system-design** | 192 | 360 | **0 / 192** | DB lệch hoàn toàn |
| Tổng | 660 | **985** | — | — |

*(Script: `scratch/_verify_all660.py` — normalize bỏ markdown/backtick, so `# prompt` DB vs .mount folder ánh xạ qua id-factory.)*

---

## 3. Nguyên nhân gốc

1. `_all.json` dump từ **DB local**, mà DB được seed từ một phiên bản `.mount` **CŨ**.
2. **id-factory sinh id theo VỊ TRÍ** `(courseIndex, bankIndex, questionIndex)` — **KHÔNG theo nội dung**. Khi map `DB-id → .mount folder` cùng id, chỉ khớp *vị trí*, không khớp *câu hỏi*.
3. Fullstack + SD đã được **author lại / mở rộng** trong `.mount` (FS 188→345, SD 192→360 câu). Cùng một vị trí bank/question giờ là **câu khác** → checklist (sinh từ `idealAnswer` của câu DB) bị ghi vào folder chứa câu khác.
4. **devops không đổi** (280 = 280) → id-factory match trùng luôn nội dung → tình cờ đúng.

---

## 4. Hậu quả hiện tại (đã push những gì)

| Nơi | Commit | Trạng thái |
|---|---|---|
| **data / main** | `077808e4 → 24c5319e4` | devops 280 folder = **checklist ĐÚNG (giữ)**. fullstack 166 folder = **checklist SAI (bỏ)**. `# rubric` được giữ ở cả hai. |
| **backend / mtp** | `315990d5 → 42500e39` | Batch results audit (`results/batch_*.json`) + `_id2folder.json`. **devops results dùng được**; **fullstack/SD results KHÔNG map được .mount** (checklist "đúng với câu DB" nhưng câu DB không còn trong .mount). |
| **Session kia** | đang chạy | Audit SD idx 450–659 **DB-driven → sẽ map nhầm → DỪNG NGAY.** |

⚠️ **Mức độ nguy hiểm hiện tại: THẤP nhưng phải sửa.** Parser hiện **chưa đọc `# checklist`** → checklist sai đang nằm trơ trong `.md`, prod không dùng tới. Nhưng **phải dọn trước khi build parser**, nếu không parser sẽ nạp dữ liệu sai.

---

## 5. KẾ HOẠCH SỬA — folder-driven, `.mount` git = SSOT

### 5.1 Nguyên tắc
- Nguồn câu hỏi **DUY NHẤT = `.mount` git folders (985 câu)**. Bỏ `_all.json` / DB.
- Mỗi folder: đọc `# prompt` + `# idealAnswer` (+ bản vi) → audit (Sonnet gen+review checklist · 5 mức trả lời · Sonnet+Haiku batch-grade · enhance ≤5) → ghi `# checklist` + `# exampleResults` **trở lại chính folder đó**. **Key = folder path** → không thể ghi nhầm.
- **Giữ `# rubric`** (option A an toàn), xóa rubric sau khi build parser đọc checklist.

### 5.2 Per-course
| Khóa | .mount | Việc |
|---|---|---|
| **devops** | 280 | ✅ **ĐÃ ĐÚNG** (280/280). Giữ nguyên trên main, **không đụng**. |
| **fullstack** | 345 | ① Bỏ 166 checklist sai trên main (revert fullstack folder về `077808e44`, hoặc để bước ③ ghi đè). ② Audit folder-driven **toàn bộ 345**. ③ Ghi + push. |
| **system-design** | 360 | Audit folder-driven **toàn bộ 360** (hiện sạch, chưa có checklist). Ghi + push. |

→ Tổng cần audit folder-driven: **345 + 360 = 705 câu**.

### 5.3 Các bước kỹ thuật
1. **Dừng session kia** (SD DB-driven vô nghĩa).
2. **Fix main**: revert 166 folder fullstack về pristine `077808e44` (giữ devops) → commit + push. *(Hoặc gộp vào bước 5 khi ghi đè checklist đúng.)*
3. **Build `_mount_todo.json`**: quét mọi folder mock-interview `.mount` của fullstack + SD (705). Mỗi entry `{folder(rel), prompt_en, ideal_en, prompt_vi, ideal_vi}` đọc thẳng từ `en.md`/`vi.md`.
4. **Sửa workflow** đọc `_mount_todo.json` theo index (thay `_all.json`); phần write **map index → folder trực tiếp** (bỏ id-factory).
5. **Chạy audit** (chia batch ~100/lần; có thể 2 session chia đôi 705). Ghi `.mount`. Push data main.
6. **Kiểm chứng**: sau ghi, `# prompt` của folder = nguồn checklist (luôn đúng vì đọc từ chính folder). Đếm folder có `# checklist` = 985 (devops 280 cũ + FS 345 + SD 360).

### 5.4 Lưu ý dữ liệu cũ
- `results/batch_*.json` (DB-driven): **devops giữ** (đúng), **fullstack/SD bỏ** (map sai) — sẽ tạo `results-mount/` mới cho lần folder-driven.
- `_all.json` + `_id2folder.json`: giữ lại làm hồ sơ, **không dùng làm nguồn nữa**.

---

## 6. Cần thầy quyết

1. **Fix main fullstack**: revert ngay (commit riêng) hay để bước ghi-đè folder-driven tự sửa?
2. **Chia 705 câu**: 1 session làm hết, hay 2 session chia (vd session này FS 345, session kia SD 360)?
3. **devops**: có cần spot-check thêm `idealAnswer` (ngoài prompt 280/280) trước khi tin tuyệt đối không?

---

## Phụ lục — script kiểm chứng
- `scratch/_verify_all660.py` — prompt match DB vs .mount per course (ra bảng §2).
- `scratch/_verify_prompt_match2.py` — chi tiết mismatch idx per course.
- `.artifacts/interview-audit/_id2folder.json` — map id→folder (985), path tương đối `.mount/data/...`.
