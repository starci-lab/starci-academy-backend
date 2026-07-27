# STEP 0 — ĐỒNG BỘ · ĐO BASELINE · DỰNG CLOSURE

> Phase 0 của workflow. Gồm 3 bước **S0 · S1 · S2**. Chạy TUẦN TỰ, 1 agent.
> Luật cần đọc: [`rules/4-organization.md`](../rules/4-organization.md) (dao gác).
> Mỗi bước có 5 ô: **VÀO · LÀM · CỔNG ĐO · RA · DỪNG KHI**.

---

## S0 · Đồng bộ + đọc luật

| | |
|---|---|
| **VÀO** | — |
| **LÀM** | `git pull` **cả hai repo** (FE + BE canon). Đọc `principles.md` §6c·§10·§11·§12g·§13·§14, rồi 4 file trong `rules/`. |
| **CỔNG ĐO** | `git rev-list --left-right --count origin/mtp...HEAD` → `0 0` ở **cả hai** repo |
| **RA** | biết luật hiện hành + biết luật nào đang **tự đá nhau** |
| **DỪNG KHI** | hai file canon nói ngược nhau về đúng thứ mình sắp làm ⇒ hỏi thầy chốt TRƯỚC, **đừng chọn hộ** |

Neo thật: `principles.md` §14d.2 ghi *"skeleton KHÔNG phải leaf"* còn `screen-playbook.md` B5 ghi *"skeleton là leaf riêng"* — cùng một ngày. Chọn hộ là làm sai một nửa số file.

---

## S1 · Đo BASELINE

| | |
|---|---|
| **VÀO** | S0 xong |
| **LÀM** | chạy đủ bộ đo và **ghi số xuống**: `tsc` · `eslint .storybook` · 3 scanner · số leaf · số chuỗi tiếng Việt · số marker |
| **CỔNG ĐO** | mỗi con số phải **kiểm chéo 1 file bằng tay**. Số nào lớn bất thường so với tổng ⇒ **instrument sai**, sửa instrument trước khi tin |
| **RA** | bảng "trước", để cuối phiên đặt cạnh bảng "sau" |
| **DỪNG KHI** | lệnh verify **quét rỗng** (exit 0, không in gì) ⇒ đó không phải "sạch", đó là **chưa quét** |

```bash
npx tsc --noEmit
npx eslint .storybook                      # KHÔNG dùng glob trong ngoặc kép
node scripts/check-story-ids.mjs
node scripts/check-seams.mjs
node scripts/check-story-coverage.mjs
```

Neo thật: `npx eslint ".storybook/**/*.{ts,tsx}"` exit 0 không in gì; `npx eslint .storybook` ra **11 error**. Và 5 bộ đếm sai trong một phiên: 8188→305 · 49→6 · 154→73 · 993→2 · 663→156.

---

## S2 · Dựng CLOSURE (đồ thị import)

| | |
|---|---|
| **VÀO** | tên screen |
| **LÀM** | đi đồ thị `import` từ file screen, phân loại theo tầng |
| **CỔNG ĐO** | in ra tổng file + số file mỗi tầng. Ca `CourseContents`: **38 file** — 1 screen · 6 block · 4 design · 15 layout · 11 atom · 1 util |
| **RA** | danh sách file **được phép sửa**. Ngoài danh sách = **ngoài phạm vi** |
| **DỪNG KHI** | closure chạm `src/**` ⇒ sai, `.storybook` là **bản vẽ** (§0) |

---

## Ra khỏi Phase 0 khi

- [ ] hai repo `0 0` với origin
- [ ] bảng baseline có số, mỗi số truy được về một lệnh
- [ ] không lệnh nào quét rỗng
- [ ] closure liệt kê xong, không file nào thuộc `src/**`
