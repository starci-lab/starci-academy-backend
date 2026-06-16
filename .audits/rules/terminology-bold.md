# RULE — Terminology & Bold (content + challenges)

> **STRICT. KHÔNG ĐÙA.** Rule này quyết định: từ nào để tiếng Việt, từ nào giữ tiếng Anh, từ nào English+bold.
> Đã có feedback thực tế vì làm sai. Đọc HẾT trước khi đụng 1 ký tự. Sai 1 chỗ = sai cả module.
>
> **AUTHORITY (precedence)**: rule này là **NGUỒN DUY NHẤT** quyết định bold + terminology. Khi xung đột → theo rule này.
> Bold ĐƯỢC dùng cho **2 nhóm** (chi tiết §3B): (1) **jargon Loại 3**; (2) **nhãn cấu trúc theo template** (vị trí cố định,
> lặp mọi lesson — định nghĩa ở `fullstack/contents.md §1`). **CHỈ CẤM** bold: nhấn ad-hoc cả câu/cụm giữa đoạn, từ Loại 1/2
> giữa văn xuôi, và bold quanh/lấn inline code.
>
> Áp dụng cho **CẢ content LẪN challenges** của mọi khóa (Fullstack, System Design, DevOps):
> - **Content**: `contents/<lesson>/bodies/<lang>/{vi,en}.md` — phần văn xuôi trong `# body`.
> - **Challenges**: `contents/<lesson>/challenges/<N>-<slug>/{vi,en}.md` — văn xuôi trong `# title`, `# description`,
>   các `##### body` của `# requirements`/`# steps` (gồm block `:::muted ... :::`), `# outputs`, `# prerequisites`.
>   (Phần `##### lang`, `### score`, tên field heading KHÔNG đụng — chỉ chỉnh prose mô tả.)
> SSOT từ điển kèm theo: `docs/fs-term-bold-map.md`.

---

## 0. NGUYÊN TẮC TỐI THƯỢỢNG: đọc context trước, KHÔNG map mù

**MỌI quyết định phân loại PHẢI dựa trên đọc cả cụm + ngữ cảnh.** Cùng một mặt chữ có thể rơi vào loại khác nhau tùy câu. **CẤM** search-replace mù một từ ra một từ. Trước mỗi đợt sửa: dùng model đọc-hiểu tốt (Sonnet trở lên) đọc kĩ context → phân loại → mới sửa.

Câu hỏi gốc (spoken test): **"Một senior VN ngồi họp sẽ nói từ này bằng tiếng Việt hay tiếng Anh?"**

---

## 1. BA LOẠI TỪ (bắt buộc phân đúng)

| Loại | Định nghĩa | Format BẮT BUỘC | Ví dụ |
|---|---|---|---|
| **1 — Phổ thông / trợ từ** | Từ thường, KHÔNG chuyên ngành | Nếu đang English → **DỊCH sang tiếng Việt tự nhiên** (nghĩa đời thường, không dùng từ đao to búa lớn). **KHÔNG bold.** | available→"sẵn sàng", layer→"tầng", flow→"luồng", boundary(module)→"ranh giới", record/log entry→"bản ghi", phụ thuộc(động từ "depends on") |
| **2 — English khó dịch (foundational)** | Từ EN nền tảng, dịch ra nghe gượng | **GIỮ tiếng Anh ở MỌI bản (vi + en). KHÔNG bold.** | lifecycle, event, source, request, response, scope, container, provider, module, controller, service, pipe, guard, interceptor, middleware, transport, log, instance, payload, endpoint, config, namespace, factory, profile, stack trace, handler |
| **3 — English chuyên ngành (jargon)** | Thuật ngữ chuyên sâu, "named concept" | **English + `**bold**`** | **dependency graph**, **dependency injection**, **inversion of control**, **IoC container**, **edge case**, **single source of truth**, **bounded context**, **public surface**, **transport fan-out**, **structured logging**, **error envelope**, **fail-fast**, **idempotent**, **loose coupling**, **testability**, **separation of concerns**, **cross-cutting**, **first-match-wins**, **precedence**, **short-circuit**, **throughput**, **invariant**, **PII**, **DoS**, **Twelve-Factor App**, **composition root**, **type-safe**, **eventual consistency**, **sharding** |

**Loại 4 — Code/định danh/literal** (`useQuery`, `Scope.REQUEST`, `exports`, `ca.crt`, URL): luôn `inline code` (backtick). **KHÔNG bold, KHÔNG dịch.**

---

## 2. POLYSEMY — context QUYẾT ĐỊNH (đây là chỗ hay sai NHẤT)

| Mặt chữ | Context A | Context B | Context C |
|---|---|---|---|
| source | config/log "source" → Loại 2 giữ "source" | "source code" → Loại 1 **"mã nguồn"** | "nguồn gốc bug" → Loại 1 "nguồn" |
| đích | log destination → per-lib **transport**(Winston)/**sink**(Serilog)/**appender**(Logback) — đọc lang | "mục đích/chủ đích" = purpose → Loại 1, GIỮ "mục đích" | — |
| chuỗi | "chuỗi middleware/phụ thuộc" = **chain** (Loại 3) | "chuỗi tự do / chuỗi SQL" = string → Loại 1 giữ "chuỗi" | — |
| phụ thuộc | "service phụ thuộc service" = depends on → Loại 1 (động từ) | "một dependency / đồ thị" = **dependency** (Loại 3) | — |
| container | IoC container → Loại 2 "container" | Docker container → Loại 1 "container Docker" | — |
| boundary | "ranh giới module" → Loại 1 "ranh giới" | async **boundary** → Loại 3 | — |

---

## 3. BOLD — dùng ở đâu

### 3A. ĐƯỢC bold (đúng 2 nhóm)
1. **Jargon Loại 3** (English chuyên ngành — danh sách §1).
2. **Nhãn cấu trúc theo template** — vị trí CỐ ĐỊNH, lặp mọi lesson (CLOSED LIST, thầy chốt):
   - §1 Opening: vai phỏng vấn `**Senior Engineer**` / `**Mid-level Developer**`; bridge bullet `- **Phần 2.1**: **thực hành** …` / `- **Phần 2.2**: **lý thuyết** …`; slogan §2 `**Thực hành dẫn dắt Lý thuyết**`.
   - §3.1 phỏng vấn: nhãn `**Câu hỏi N: …?**` — bold ĐỒNG NHẤT cả 3 câu (không để câu bold câu không).
   - Nhãn edge-case/giải pháp (lý thuyết §2.2.2): `**Giải pháp:**`, `**Trade-off:**`, `**Cơ chế:**`, `**Lưu ý:**`.
   - Challenge: step label `**Bước N:**`; tên mục README `**Smoke Test**`, `**Code Execution Trace**`, `**Design Decisions**`, `**Architecture / Stack**`.

### 3B. CẤM bold
1. Nhấn **ad-hoc** cả câu/cụm giữa đoạn (vd `**Guard chạy trước pipe**`, `**framework giành lấy quyền…**`).
2. Từ **Loại 1/2** giữa văn xuôi: `constructor`, `NestJS`, `custom provider`, `contract`, `provider`, `module`, `service`, `pipe`, `guard`…
3. Bold **quanh/lấn inline code** hoặc URL: `**\`curl\`**` → `\`curl\``.
4. Bold **trùm nhiều câu / xuống dòng**.

### 3C. CẤM (terminology)
1. Dịch ép Loại 3 ra VN literal (đồ thị phụ thuộc, nhất quán cuối cùng, điểm hội tụ lỗi). → để English (+bold).
2. Dịch token code/định danh (Loại 4).
3. Search-replace MÙ 1 từ → false-positive (§5).

---

## 4. DE-BOLD (chỉ dọn bold SAI, GIỮ nhãn template)

Bỏ `**` ở:
- bold quanh inline-code/URL: `**\`x\`**` → `\`x\``, `**https://...**` → URL plain.
- bold cụm nhiều-từ **KHÔNG phải** jargon Loại 3 **VÀ KHÔNG phải** nhãn template §3A (= nhấn ad-hoc).
- bold trùm cả câu / xuống dòng.
- từ Loại 1/2 bị bold giữa văn xuôi.

**GIỮ bold**: jargon Loại 3 + **mọi nhãn template §3A** (Phần/Bước/Câu hỏi/Giải pháp/Trade-off/Cơ chế/persona/README-section). → KHÔNG còn rule "strip mọi `**...:**`": nhãn colon theo template thì GIỮ; chỉ bỏ nhãn-colon ad-hoc/lạc.

---

## 5. BẪY FALSE-POSITIVE ĐÃ DÍNH (học thuộc, đừng lặp lại)

| Sai | Vì sao | Đúng |
|---|---|---|
| "phân mảnh" → **sharding** | "phân mảnh" cũng = fragment/split (schema/data) | đọc context; thường GIỮ "phân mảnh" |
| "Mục đích" → "Mục **sink**" | guard chỉ phủ lowercase "mục đích", sót VIẾT HOA | guard phải phủ cả viết hoa |
| "đích" → **sink** (mọi lang) | "sink" là term Serilog/C#; TS=transport, Java=appender | per-lib hoặc giữ VN |
| "chuỗi" → **chain** (bài logging) | bài logging "chuỗi" = string | đọc context |
| "source" → "nguồn" (clone source) | "clone source" = source code | "mã nguồn" |

→ **Quy tắc vàng: grep context TRƯỚC khi đổi. Guard phải phủ cả viết hoa, cả dạng số nhiều.**

---

## 6. KỸ THUẬT SWEEP (bắt buộc)

1. **Nesting-safe**: tokenize `(\*\*[\s\S]*?\*\*)`. Trong segment đã-bold → chỉ đổi nội dung (KHÔNG thêm `**` lồng). Trong segment plain → mới bọc `**`.
2. **Protect**: code fence ```` ``` ```` và inline code `` `...` `` — KHÔNG đụng tới chữ bên trong.
3. **Guard collocation** trước khi replace (vd "source code", "single source of truth", "mục đích", "chủ đích", "chuỗi tự do") bằng placeholder → replace → restore.
4. **Fix collision** sau sweep: `**X***` → `X*`, `***X**` → `*X` (tránh bold lồng italic).

---

## 7. VERIFY BẮT BUỘC SAU MỖI ĐỢT (không verify = không xong)

Chạy parser thật để chắc body không vỡ:
```
ExtractJsonFromMdService.extract(<file>)  // src/modules/init/seeders/shared/extracts
```
Checklist:
- [ ] `body` parse ra string > 200 ký tự cho MỌI `bodies/<lang>/vi.md` (0 file BAD).
- [ ] `***` còn lại chỉ là bold+italic hợp lệ có sẵn (`**X *y***`), KHÔNG phải keyword vỡ.
- [ ] grep lại từng cụm guard (mục đích/source code/single source of truth/chuỗi tự do) còn nguyên.
- [ ] grep 0 chỗ dịch nhầm (vd "nguồn code", "single nguồn", "Mục sink").
- [ ] bold còn lại = TOÀN Loại 3 jargon + tên tech; KHÔNG còn nhãn/số/Loại-1/Loại-2.

---

## 8. QUY TRÌNH CHUẨN (làm theo đúng thứ tự)

1. Sonnet đọc kĩ body 1 module → lập từ điển từ → 3 loại (kèm context, polysemy) như §1–§2.
2. Build map deterministic theo từ điển. Chỉ auto cụm distinctive; từ ngắn/đa nghĩa → grep context tay.
3. Sweep nesting-safe + guard + fix collision (§6).
4. Verify (§7). Có lỗi → sửa → verify lại. Sạch mới qua module sau.
5. Cập nhật `docs/fs-term-bold-map.md` (từ nào đã xử, gotcha mới).

**Mật độ bold**: nếu 1 jargon Loại 3 xuất hiện quá nhiều trong 1 lesson → bold lần-đầu-mỗi-lesson, các lần sau plain (tránh rối). Loại 3 distinctive (dependency graph…) bold hết cũng được.
