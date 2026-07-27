# STEP 4 — TÊN · CÂY · REINDEX · CỔNG CUỐI

> Phase 4 của workflow. Gồm **S8 · S9**. **1 agent, TUẦN TỰ** — đổi story id ảnh hưởng chéo
> mọi dep nên không song song được.
> Luật cần đọc: [`rules/4-organization.md`](../rules/4-organization.md) §2 (tên) · §6 (dao gác).

---

## S8 · Tên + cây + reindex

| | |
|---|---|
| **VÀO** | hình đã đúng (Phase 3) |
| **LÀM** | title 4 nấc `Tier/Family/Component/Component.Member`. Đổi title thì **cập nhật MỌI `storyId` trỏ tới** |
| **CỔNG ĐO** | `check-story-ids` live gãy **0** · **kill PID 6006 + restart** · `curl :6006/index.json` → tổng entry **khớp đúng** số scanner |
| **RA** | cây sidebar đọc đúng dạng |
| **DỪNG KHI** | index live vẫn cũ sau restart ⇒ watcher Windows, restart lại. **Đừng** báo xong khi số chưa khớp |

```bash
netstat -ano | grep ":6006.*LISTENING"     # lấy PID
taskkill //PID <pid> //F
npm run storybook
curl -s http://localhost:6006/index.json   # đếm entry, so với scanner
```

Hai bẫy đã cắn:
1. **Watcher Windows giữ index cũ** khi đổi export bên trong file — sidebar vẫn hiện leaf đã xoá. Sửa nội dung thì HMR ổn; thêm/xoá/đổi tên/đổi export thì **phải restart**.
2. **Đếm khớp ≠ TẬP khớp.** Scanner từng ra đúng `1362 = 1362` so với `index.json` mà **sai 233 id** (trang docs là `--overview`, scanner sinh `--docs`). Phải `comm` hai tập, không chỉ so tổng:

```bash
node scripts/check-story-ids.mjs --list | sort > /tmp/scanner.txt
curl -s :6006/index.json | node -e "..." | sort > /tmp/live.txt
comm -23 /tmp/scanner.txt /tmp/live.txt    # scanner CÓ mà live KHÔNG = id bịa
comm -13 /tmp/scanner.txt /tmp/live.txt    # live CÓ mà scanner KHÔNG = id bị bỏ sót
```

---

## S9 · CỔNG CUỐI + NEGATIVE CONTROL

| | |
|---|---|
| **VÀO** | S5-S8 xong |
| **LÀM** | chạy đủ 6 dao. Với **mỗi gate mới**: nhét lỗi giả vào, phải thấy **ĐỎ**, rồi xoá lỗi giả |
| **CỔNG ĐO** | xem bảng dưới — mọi ô phải xanh, **và** mọi gate mới phải đỏ đúng khi bị thử |
| **RA** | bảng "trước / sau" đặt cạnh bảng baseline Phase 0 |
| **DỪNG KHI** | gate báo xanh mà **chưa qua negative control** ⇒ **chưa được báo xong** |

| Dao | Lệnh | Xanh nghĩa là |
|---|---|---|
| kiểu + off-scale tại call-site | `npx tsc --noEmit` | không lỗi |
| style + rule riêng | `npx eslint .storybook` | **không dùng glob trong ngoặc kép** |
| dep trỏ story thật | `node scripts/check-story-ids.mjs` | live gãy 0 |
| seam | `node scripts/check-seams.mjs` | 0 bố cục tay · 0 off-scale mới |
| block có story | `node scripts/check-story-coverage.mjs` | 0 thiếu |
| part rơi ngoài cây | `node scripts/check-orphan-parts.mjs` | 0 part thiếu `storyId` thật/`tier: "heroui"` |
| import đã khai badge | `node scripts/check-deps-coverage.mjs` | 0 import không khai |
| id live == id tĩnh | `curl :6006/index.json` + `comm` | lệch 0 cả hai chiều |
| hình | đo `getComputedStyle` | khớp cây khai |

**`check-orphan-parts` và `check-deps-coverage` hỏi hai câu KHÁC NHAU** (`rules/1-decompose.md`
§4a): xanh cái này không nói gì về cái kia, luôn chạy CẢ HAI. Neo đo được 2026-07-27: câu "import
gì mà không khai" chỉ báo **9**, câu "badge gì mà rơi ngoài cây" báo **153 part / 56 file**.

### Negative control — khuôn làm

```bash
# 1. nhét lỗi giả
printf 'export const x = { storyId: "khong-he-ton-tai--nope" }\n' > .storybook/utils/__negctl.tsx
# 2. gate PHẢI đỏ (exit 1)
node scripts/check-story-ids.mjs; echo "exit=$?"
# 3. xoá
rm .storybook/utils/__negctl.tsx
```

Neo thật: `check-story-ids` lần đầu báo **"✅ sạch"** trong khi đang **mù 10 storyId** nằm trong `_shared.tsx` — vì nó chỉ quét `*.stories.tsx`. Chỉ negative control mới lộ ra.

---

## Ra khỏi Phase 4 khi

- [ ] 8 dao xanh, lệnh eslint không có glob
- [ ] `comm` hai tập id lệch **0 cả hai chiều**
- [ ] `check-orphan-parts` VÀ `check-deps-coverage` đều đã chạy, cả hai đều xanh
- [ ] mỗi gate mới đã đỏ đúng một lần khi bị thử
- [ ] bảng trước/sau có đủ số, mỗi số truy được về một lệnh
