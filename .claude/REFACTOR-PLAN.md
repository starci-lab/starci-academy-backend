# Kế hoạch refactor toàn bộ `.claude`

Trạng thái: **BẢN THẢO — chưa thực thi một dòng nào.** Chờ thầy duyệt từng pha.
Ngày lập: 2026-07-30. Người lập: Claude, theo yêu cầu "tham khảo hai repo rồi lên plan siêu chi tiết".

---

## Phần 0 — Mục tiêu, nói bằng lời thầy

Bộ `.claude` này không phải công cụ audit. Nó là **kho chuẩn**: atomics / frames / composites là
nguồn duy nhất, mọi component web lắp từ kho chứ không tự vẽ. Sáng tạo thì đi vào kho — thêm atom
mới, thêm frame mới — chứ không sáng tạo tại chỗ dùng. Đủ state, đủ skeleton. Để sau này sửa code
cũng y chang.

Refactor này phục vụ đúng ba việc đó, không thêm:

1. **Kho phải tồn tại thành file, tra được.** Hôm nay nó chưa tồn tại (xem Phần 1, phát hiện A).
2. **Chi phí đọc phải tỉ lệ với việc, không tỉ lệ với kích thước kho.**
3. **Giáo trình vẫn là giáo trình.** Không nén 15 trục thành CSV. Chỉ đổi *thời điểm* đọc.

Không mất một chữ tri thức nào trong refactor này. Tất cả thao tác là **di chuyển, tách, đánh mục
lục** — không xoá nội dung.

---

## Phần 1 — Hiện trạng, đo được

### Kiểm kê `.claude` (bỏ `worktrees/` vì là rác build, 200.828 file / 1,5 GB)

| Thư mục | File | KB | Ghi chú |
|---|---:|---:|---|
| `docs/` | 93 | **1.707** | trong đó **`references.md` một mình 1.042 KB** |
| `fe/` | 35 | 1.080 | 15 `context.md` = 220 KB · 15 `example.html` = 758 KB · `matrix.md` = 71 KB |
| `_canon_tmp/` | 215 | 787 | **gitignored** — đồ cũ, có nguy cơ mất vĩnh viễn |
| `patterns/` | 26 | 183 | `fe/` 16 file + `be/` 10 file |
| `skills/` | 16 | 98 | 3 skill |
| `workflows/` | 9 | 80 | script `.js` chạy fan-out |
| `discipline/` | 5 | 9 | |
| `settings.local.json` | 1 | 40 | permission phình |
| `CANON.md` | 1 | 1,2 | rule sync private/public repo |

### Phát hiện A — kho chuẩn CHƯA TỒN TẠI thành file

`.claude/fe/` hiện chỉ có `principles/` (15 trục nguyên tắc) + `boundary.md` + `environment.md`.
**Không có atoms/, không có frames/, không có composites/.** Kho mà thầy mô tả đang nằm rải trong
Storybook ở repo FE `D:\Repositories\starci-academy`, không có mục lục nào trong `.claude`.

Hệ quả trực tiếp: mọi lượt audit buộc phải suy ra chuẩn từ 15 bài nguyên tắc, thay vì đối chiếu
với danh mục kho. Đó là lý do gốc khiến ma trận phình thành *số vùng × 15 trục* — không có kho để
đối chiếu thì phải phán lại từ đầu mỗi lần.

### Phát hiện B — kho cũ đang nằm trong thùng rác gitignored

`_canon_tmp/fe/components/` có sẵn: `card.md` (32,6 KB), `input.md` (18 KB), `sidebar.md` (12,1 KB),
`list.md` (10,4 KB), `label.md` (9,5 KB), `header.md` (9 KB), `alert.md` (8,7 KB), `tabs.md` (7,7 KB),
kèm `INDEX.md` (9,1 KB), `foundations/INDEX.md`, `patterns/INDEX.md`, và 4 `prototypes/*.html`.

Đây **chính là hình hài đầu tiên của kho**, đã bị đẩy vào thư mục tạm bị gitignore. Refactor phải
cứu nó trước khi làm bất cứ việc gì khác — một lệnh `git clean` là mất sạch.

### Phát hiện C — `docs/references.md` = 1 MB trong một file

File lớn nhất toàn bộ `.claude`. Không thể đọc từng phần, không có mục lục ngoài. Mọi lượt chạm
tới nó đều là toàn-bộ-hoặc-không-gì.

### Phát hiện D — sổ phiên nằm lẫn trong canon

`fe/matrix.md` (71 KB, 662 dòng) là **sổ ghi kết quả của một phiên**, không phải luật, nhưng đang
nằm cùng cây với luật. Theo skill thì sổ phiên thuộc `.artifacts/feedback/`.

---

## Phần 2 — Rút gì từ hai repo tham khảo

### `obra/superpowers` — 14 skill, 69 file, 331 KB

| Điều quan sát được | Số |
|---|---|
| Namespace phẳng, mỗi skill một thư mục, `SKILL.md` là cửa duy nhất | 14/14 |
| Cỡ `SKILL.md` điển hình | 2,3 – 10 KB |
| Chỉ hai cái vượt cỡ | `writing-skills` 26 KB · `subagent-driven-development` 28 KB |
| Tài liệu nặng **tách khỏi** SKILL.md | `anthropic-best-practices.md` 46 KB nằm riêng |
| Prompt cho subagent tách file riêng | `implementer-prompt.md` · `task-reviewer-prompt.md` · `code-reviewer.md` |
| Script tách `scripts/` | brainstorming, subagent-driven-development, systematic-debugging |
| Index dispatch giữ nhỏ | `using-superpowers/SKILL.md` chỉ 3 KB |

Luật họ tự áp trong `writing-skills`:

- `description` = **khi nào dùng**, không phải **làm gì**. Mở đầu bằng "Use when…". Lý do họ nêu:
  agent có thể hành động theo mô tả mà không đọc thân skill, nên mô tả không được chứa workflow.
- Ngân sách chữ: dưới 150 từ cho bước khởi động, dưới 200 từ cho skill hay được nạp, dưới 500 từ
  cho phần còn lại. Kiểm bằng `wc -w`.
- Ba hình thái tổ chức: tự chứa (chỉ SKILL.md) · kèm công cụ tái dùng · kèm tài liệu nặng tách riêng.
- Skill kỷ luật phải có mục **red flags** liệt kê sẵn những câu nguỵ biện agent hay viện ra khi bị ép.
- "Không có skill nào ra đời trước một bài test thất bại." Viết skill trước rồi mới test thì xoá đi làm lại.

### `nextlevelbuilder/ui-ux-pro-max-skill` — 524 file, 2,8 MB

| Điều quan sát được | Số |
|---|---|
| Thứ duy nhất nạp vào context | `SKILL.md` **13,5 KB** |
| Kho dữ liệu, không nạp | `google-fonts.csv` 743 KB · `styles.csv` 143 KB · `products.csv` 73 KB · `ui-reasoning.csv` 53 KB |
| Cách truy | `python scripts/search.py --domain <miền> "<truy vấn>"` |
| Ngưỡng số đóng đinh trong SKILL.md | tương phản 4.5:1 · vùng chạm 44×44 · CLS < 0,1 · chuyển động 150–300 ms · thanh dưới ≤ 5 mục |
| Bảng ưu tiên | 10 bậc, mỗi bậc ghi rõ must-have và anti-pattern |
| Câu chốt về nạp | đọc `references/quick-reference.md` **khi cần**, không nạp mỗi lượt |
| Khi tra không ra | mở rộng từ khoá, rồi lùi về mặc định của bảng ưu tiên — **cấm bịa** |

**Điều đáng học và điều không đáng học.** Đáng học: một cửa vào nhỏ, kho to nằm sau một lệnh tra,
ngưỡng số viết thẳng vào cửa vào. Không đáng học: nén tri thức thành CSV không lý lẽ — canon của
thầy dạy nghề, họ bán tra cứu, hai mục đích khác nhau. Ta lấy **cơ chế**, giữ **thể loại**.

---

## Phần 3 — Kiến trúc đích

### Ba lớp nạp

```
  L0  LUÔN NẠP          .claude/CLAUDE.md            ≤ 200 từ, chỉ dispatch
        │                skills/INDEX.md              ≤ 300 từ, một dòng một skill
        ▼
  L1  NẠP KHI TRÚNG     skills/<tên>/SKILL.md        ≤ 500 từ
        │
        ▼
  L2  NẠP KHI CẦN       fe/kho/registry.json         tra bằng script, trả về vài dòng
                        fe/principles/<trục>/context.md   giáo trình, đọc khi ENRICH kho
                        skills/<tên>/references/*.md
                        docs/references/<mảnh>.md
```

### Cây thư mục đích

```
.claude/
├── CLAUDE.md                    ← cửa vào duy nhất, thay CANON.md làm điểm neo
├── skills/
│   ├── INDEX.md                 ← mục lục dispatch, một dòng một skill
│   └── <tên-skill>/
│       ├── SKILL.md             ← ≤500 từ, frontmatter "Use when…"
│       ├── references/          ← tài liệu nặng, đọc theo yêu cầu
│       ├── prompts/             ← prompt giao cho subagent
│       └── scripts/             ← script tra cứu, không phải văn bản
├── fe/
│   ├── kho/                     ← MỚI — SSOT của atomics/frames/composites
│   │   ├── INDEX.md             ← mục lục ngắn, ba tầng
│   │   ├── atoms/<tên>.md
│   │   ├── frames/<tên>.md
│   │   ├── composites/<tên>.md
│   │   └── registry.json        ← bản tra máy đọc: tên · tầng · states · skeleton · token
│   ├── principles/              ← GIỮ NGUYÊN 15 trục, không nén
│   └── scripts/lookup.mjs       ← tra registry, trả về đúng phần cần
├── patterns/                    ← giữ, nhưng gắn con trỏ hai chiều với kho
├── discipline/                  ← giữ nguyên
├── docs/                        ← references.md 1 MB bị chẻ nhỏ
└── workflows/                   ← giữ, thêm ngưỡng "khi nào KHÔNG fan-out"
```

### Luật vàng của kiến trúc này

> **Phán quyết đóng đinh ở tầng kho. Ở tầng màn chỉ hỏi một câu: có gì ở đây không đến từ kho?**

15 trục quét **đủ và nghiêm** lúc kết nạp một atom/frame mới vào kho — đó là lúc đáng tiền. Màn
lắp từ kho thì không phán lại 15 trục, chỉ đối chiếu danh mục. Chi phí chuyển từ
*số màn × 15 trục* sang *số lần enrich kho × 15 trục*.

---

## Phần 4 — Bảy pha, theo thứ tự bắt buộc

### Pha 0 — Cứu `_canon_tmp` (LÀM TRƯỚC MỌI THỨ)

**Vì sao trước:** 787 KB đang gitignored. Một lệnh `git clean -xdf` là mất vĩnh viễn, và đây là
hình hài đầu tiên của kho.

**Việc:**
1. Sao lưu nguyên trạng ra ngoài repo: `.artifacts/_canon_tmp_backup_2026-07-30/`.
2. Kiểm kê 215 file, phân ba loại: **giữ để chuyển vào kho** (`fe/components/*`, `fe/foundations/`,
   `fe/patterns/`) · **giữ để tham khảo** (`prototypes/*.html`, `proposals/*`) · **bỏ**
   (bản nháp trùng với `principles/` hiện tại).
3. Xuất bảng phân loại ra `.artifacts/canon-tmp-triage.md` để thầy duyệt trước khi động vào.

**Xong khi:** có bản sao lưu ngoài repo + bảng phân loại được thầy đánh dấu giữ/bỏ.
**Rủi ro:** thấp. **Lùi được:** hoàn toàn, chưa xoá gì.
**Không tự động:** việc bỏ file chờ thầy duyệt từng dòng.

---

### Pha 1 — Dựng `fe/kho/`, tầng ATOM trước

**Vì sao:** đây là phát hiện A — thứ thiếu quan trọng nhất. Mọi pha sau dựa vào nó.

**Việc:**
1. Đọc Storybook thật ở `D:\Repositories\starci-academy\.storybook\components\**` để lấy **danh
   sách atom có thật**, không bịa. Đây là nguồn, không phải `_canon_tmp`.
2. Với mỗi atom, viết `fe/kho/atoms/<tên>.md` theo khuôn cố định:

   ```
   # <Tên atom>
   Tầng: atom · Nguồn: <đường dẫn Storybook> · storyId: <id>
   ## Vai trò        (một câu, nó tồn tại để làm gì)
   ## API            (prop bắt buộc / tuỳ chọn, kiểu, mặc định)
   ## States         (empty · loading · error · content · pending — ghi ĐỦ, thiếu thì ghi "không có" kèm lý do)
   ## Skeleton       (mirror layout nào, đường dẫn tới code skeleton)
   ## Token          (màu · cỡ chữ · bo góc · khoảng cách — chỉ token, cấm giá trị thô)
   ## Cấm            (những biến thể KHÔNG được tự chế tại chỗ dùng)
   ## Phán quyết 15 trục   (ngày kết nạp + kết luận từng trục, một dòng một trục)
   ```
3. Sinh `fe/kho/registry.json` từ các file trên — máy đọc, để `lookup.mjs` tra.
4. `fe/kho/INDEX.md`: mục lục ba tầng, mỗi atom một dòng, dưới 300 từ.

**Xong khi:** mọi atom trong Storybook có một file kho, và `registry.json` khớp số lượng.
**Rủi ro:** trung bình — dễ sa vào chép lại code. **Chốt chặn:** file kho mô tả **hợp đồng**, không
chép thân component.
**Ngưỡng chia mẻ:** làm theo lô 5 atom, mỗi lô trình thầy duyệt khuôn trước khi chạy tiếp lô sau.

---

### Pha 2 — Tầng FRAME rồi COMPOSITE

Cùng khuôn với Pha 1, thêm hai mục:

- **Lắp từ:** liệt kê atom/frame con — đúng **một nấc**, không chuyền sâu (theo luật cây Deps một nấc).
- **Nhịp dọc:** khoảng cách giữa các cụm, viết bằng token.

**Xong khi:** mỗi composite truy được xuống tới atom qua registry mà không phải mở source.

---

### Pha 3 — Viết lại 3 skill FE theo chuẩn cửa-vào-nhỏ

**Hiện trạng:** `starci-fe-story-feedback-start/SKILL.md` chỉ 1,5 KB — nghe thì gọn, nhưng nó trỏ
sang **15 file bắt buộc đọc = 220 KB**. Con số 1,5 KB không phản ánh gì.

**Việc:**

1. **Đổi luật nạp trong `step-2`:** thay "nạp Phần A của cả 15 trục" bằng:
   > Đối chiếu bề mặt với `fe/kho/registry.json` trước. Chỉ mở `principles/<trục>/context.md` khi
   > (a) phát hiện thứ **không đến từ kho**, hoặc (b) đang **kết nạp/enrich** một mục kho.
2. **Thêm ba bậc fan-out** vào cùng chỗ đã có ngưỡng ≥15 vùng:
   - dưới ~6 ô nghi → **làm inline**, không spawn agent nào;
   - dưới 15 vùng → theo vùng;
   - từ 15 vùng → đảo theo trục (luật đã có, giữ nguyên).
3. **Chuẩn hoá frontmatter** cả 3 skill: `description` bắt đầu bằng "Dùng khi…", chỉ điều kiện kích
   hoạt, cắt hết phần mô tả workflow (hiện `starci-fe-story-create` mô tả cả 5 bước ngay trong
   description — đúng thứ `writing-skills` cấm).
4. **Ngân sách chữ:** mỗi `SKILL.md` ≤ 500 từ, mỗi `step-*.md` ≤ 800 từ. Phần vượt đẩy xuống
   `references/`. Kiểm bằng đếm từ, ghi số vào cuối file.
5. **Thêm mục red flags** cho `feedback-start` — liệt kê sẵn những câu nguỵ biện dễ gặp: "vùng này
   nhìn ổn rồi", "trục này chắc không liên quan", "để cuối phiên sửa luôn một thể".

**Xong khi:** ba SKILL.md đều dưới ngưỡng từ, và một phiên feedback mẫu chạy hết mà **không** nạp
quá 3 file `context.md`.

---

### Pha 4 — Chẻ `docs/references.md` (1.042 KB)

**Việc:**
1. Đọc mục lục trong file, cắt theo ranh giới chương sẵn có thành `docs/references/<chương>.md`.
2. Để lại `docs/references.md` **chỉ còn mục lục** — mỗi chương một dòng kèm đường dẫn và một câu
   mô tả khi nào cần mở.
3. Tìm mọi chỗ trỏ tới `references.md` trong `.claude` và cập nhật con trỏ.

**Xong khi:** không file nào trong `.claude` vượt 100 KB, trừ `example.html` (dành cho mắt người,
không vào context).
**Rủi ro:** con trỏ gãy. **Chốt chặn:** rà `grep -r "references.md"` trước và sau, đối chiếu số.

---

### Pha 5 — Dọn chỗ đứng của sổ phiên và permission

1. `fe/matrix.md` (71 KB) chuyển sang `.artifacts/feedback/` đúng chỗ skill quy định. Canon chỉ giữ
   luật, không giữ kết quả.
2. `settings.local.json` (40 KB): gom permission trùng, tách nhóm đọc-chỉ khỏi nhóm ghi. Không đụng
   quyền đang dùng — chỉ gộp và sắp lại.

---

### Pha 6 — `CLAUDE.md` làm cửa vào, `skills/INDEX.md` làm bàn phân phối

**Việc:**
1. Viết `.claude/CLAUDE.md` dưới 200 từ: repo này là gì · kho ở đâu · skill ở đâu · luật sync
   private/public (nội dung `CANON.md` hiện tại gộp vào đây) · một câu "đọc kho trước, đọc giáo
   trình sau".
2. Viết `skills/INDEX.md`: mỗi skill một dòng "Dùng khi… → đường dẫn". Dưới 300 từ.
3. `CANON.md` giữ lại như con trỏ một dòng sang `CLAUDE.md`, không xoá (còn được tham chiếu ngoài).

---

### Pha 7 — Đóng vòng: luật viết skill thành file nội bộ

Viết `.claude/skills/writing-skills-vi/SKILL.md` — bản Việt hoá **rút gọn** của luật `writing-skills`
cộng luật riêng của thầy đã có sẵn trong `feedback-end`:

- mô tả = khi-nào-dùng, không phải làm-gì;
- ngân sách chữ và cách kiểm;
- tài liệu nặng tách `references/`;
- một ví dụ không thành luật, cần đủ hai nguồn độc lập;
- luật phải neo ngày + số đo thật + câu nguyên văn của thầy;
- sửa `context.md` thì sửa luôn `example.html` cùng trục.

**Vì sao pha cuối:** viết luật trước khi có kinh nghiệm sáu pha kia là viết theo lý thuyết. Sau khi
làm xong, luật này ghi lại thứ **đo được**, đúng tinh thần neo-sự-việc của thầy.

---

## Phần 5 — Ngân sách token, trước và sau

| Tình huống | Hôm nay | Sau refactor |
|---|---:|---:|
| Mở một phiên feedback (nạp trước khi nhìn màn hình) | ~220 KB | **~8 KB** (CLAUDE.md + INDEX + SKILL.md + kho INDEX) |
| Tra một atom cụ thể | mở cả bài trục 15 KB | **~1 KB** (một mục registry) |
| Kết nạp một atom mới vào kho | 220 KB | **220 KB — giữ nguyên, cố ý** |
| Audit một màn 8 vùng | 8 × 15 ô phán quyết | **1 câu hỏi/vùng** + mở trục chỉ ở chỗ lệch |

Dòng thứ ba là điều quan trọng nhất của bảng này: **không cắt chi phí ở chỗ đáng tiền.** Kết nạp
vào kho vẫn phải quét đủ 15 trục, đọc đủ giáo trình. Chỉ cắt chi phí đọc-lại ở tầng dùng.

---

## Phần 6 — Thứ tự thực thi và điểm dừng chờ duyệt

```
Pha 0 cứu _canon_tmp ──► DỪNG, thầy duyệt bảng phân loại
   │
Pha 1 kho/atoms (lô 5) ──► DỪNG, thầy duyệt KHUÔN ở lô đầu
   │
Pha 2 frames + composites
   │
Pha 3 viết lại 3 skill ──► DỪNG, thầy duyệt luật nạp mới
   │
Pha 4 chẻ references.md
   │
Pha 5 dọn matrix.md + settings
   │
Pha 6 CLAUDE.md + INDEX
   │
Pha 7 writing-skills-vi
```

Ba điểm dừng bắt buộc là ba chỗ sai thì tốn: phân loại file có thể mất đồ, khuôn kho sai thì hàng
chục file phải viết lại, luật nạp sai thì mọi phiên sau chạy sai.

---

## Phần 7 — Việc đang dở, chưa mất

Năm mục B2b của phiên hiện tại vẫn treo, và theo khung mới chúng tách làm hai loại khác nhau:

| Mục | Loại | Xử theo pha |
|---|---|---|
| `oklab()` viết tay trong `WorkSessionHeader` | **sạn** — màn tự vẽ ngoài kho | sửa tại màn, kéo về token |
| màu field-label lệch | **sạn** | sửa tại màn |
| `StatGridCard` thiếu skeleton | **kho thiếu** | Pha 1 — enrich atom |
| thiếu state "chưa tự chấm" | **kho thiếu** | Pha 1 — enrich atom |
| TTL đếm ngược lệch | cần đo lại, chưa phân loại được | xác minh trước |

Loại "kho thiếu" nên làm trong Pha 1 vì vá một lần thì mọi màn dùng nó được vá cùng lúc.

---

## Phần 8 — Những gì kế hoạch này KHÔNG làm

- Không nén `principles/` thành CSV hay bảng. Giáo trình giữ nguyên thể loại văn xuôi.
- Không xoá `example.html` (758 KB) — chúng dành cho mắt thầy, chưa bao giờ vào context.
- Không đụng `discipline/`, `patterns/be/`, `workflows/*.js` về mặt nội dung.
- Không đổi tên bộ skill. Câu hỏi `starci-fe-ui-feedback` còn treo, chưa gộp vào plan này.
- Không tự chạy `git clean`, `git checkout`, hay bất cứ lệnh xoá nào trong Pha 0.
