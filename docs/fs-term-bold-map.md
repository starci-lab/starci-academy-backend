# FS Keyword Bold Map

## MÔ HÌNH 3 LOẠI (SSOT — thầy chốt 2026-06-15)

Mọi từ phải **đọc kĩ context (Sonnet)** rồi mới phân loại:

| Loại | Là gì | Xử lý |
|---|---|---|
| **1. Phổ thông / trợ từ** | từ thường, không chuyên ngành | nếu đang EN → **dịch sang tiếng Việt tự nhiên** (nghĩa người dùng, KHÔNG dùng từ chuyên ngành). Không bold. |
| **2. EN khó dịch (foundational)** | lifecycle, event, source, request, response, scope, container, provider, module, controller, service, pipe, guard, interceptor, middleware, transport, log, instance, payload, endpoint, config, namespace, factory, profile, stack trace | **giữ English mọi bản, KHÔNG bold** |
| **3. EN chuyên ngành (jargon)** | **dependency graph**, **dependency injection**, **inversion of control**, **IoC container**, **edge case**, **single source of truth**, **bounded context**, **public surface**, **transport fan-out**, **structured logging**, **error envelope**, **fail-fast**, **idempotent**, **loose coupling**, **testability**, **separation of concerns**, **cross-cutting**, **first-match-wins**, **precedence**, **short-circuit**, **throughput**, **invariant**, **PII**, **DoS**, **Twelve-Factor App**, **composition root**, **type-safe** | **English + BOLD** |

**Polysemy — context quyết định (KHÔNG map mù):**
- `source` (config/log) = Loại 2 giữ "source" *hoặc* "nguồn" (đời thường) · `source code` = "mã nguồn" (Loại 1) · `nguồn gốc bug` = "nguồn" (Loại 1).
- `đích` = destination → per-lib **transport**(Winston)/**sink**(Serilog)/**appender**(Logback); đừng ép 1 từ.
- `chuỗi` = **chain** (jargon, Loại 3) ≠ "chuỗi tự do/string" (Loại 1).
- `phụ thuộc` = "phụ thuộc vào" động từ (Loại 1) ≠ **dependency** danh từ (Loại 3).
- `container` = IoC container (Loại 2) ≠ Docker container (Loại 1).
- `boundary` = "ranh giới module" (Loại 1) ≠ async **boundary** (Loại 3).

---

Convention cho content Fullstack (ngành EN-heavy):

- **Văn xuôi**: tiếng Việt phổ thông. KHÔNG dịch ép, KHÔNG bold.
- **`**bold**`**: CHỈ dành cho **keyword kỹ thuật** = thuật ngữ EN canonical / khái niệm lõi.
- **`inline code`**: định danh / API / literal (`useQuery`, `requestCert`, `Scope.REQUEST`, `ca.crt`).
- **Bold = 2 nhóm** (theo `.claude/docs/rules/terminology-bold.md §3A` — authority): (1) jargon Loại 3; (2) **nhãn cấu trúc theo template** (ĐƯỢC bold): `Phần 2.1`/`Phần 2.2` + `thực hành`/`lý thuyết` (bridge §1), `Senior Engineer`/`Mid-level Developer`, `Thực hành dẫn dắt Lý thuyết`, `Câu hỏi N:` (đồng nhất 3 câu), `Giải pháp:`/`Trade-off:`/`Cơ chế:`/`Lưu ý:`, challenge `Bước N:` + tên mục README (`Smoke Test`…).
- **CẤM bold**: nhấn ad-hoc cả câu/cụm, từ Loại 1/2 giữa văn xuôi (constructor/NestJS/contract…), bold quanh/lấn inline-code, bold trùm nhiều câu.
- **De-bold** chỉ dọn nhóm CẤM; **GIỮ** jargon Loại 3 + nhãn template. (KHÔNG còn rule "strip mọi `**...:**`".)

Sweep là **nesting-safe**: nếu cụm VN đã nằm trong `**...**` thì chỉ đổi sang EN (không thêm bold mới); nếu plain thì bọc `**EN**`.

---

## Tier 1 — auto-bold sang EN (jargon chuẩn, sweep được)

| VN jargon | → keyword EN (bold) |
|---|---|
| đồ thị phụ thuộc | **dependency graph** |
| nhất quán cuối cùng | **eventual consistency** |
| bề mặt công khai | **public surface** |
| vòng đời | **lifecycle** |
| ranh giới | **boundary** |
| nguồn sự thật (duy nhất) | **source of truth** |
| máy đọc được | **machine-readable** |
| leo thang đặc quyền | **privilege escalation** |
| danh tính liên kết | **federated identity** |
| cập nhật lạc quan | **optimistic update** |
| phân vùng | **partitioning** |
| đánh chỉ mục | **indexing** |
| bản sao (dữ liệu) | **replica / replication** |
| khoá ngoại | **foreign key** |
| tầng / lớp | **layer** |
| sự kiện (log/domain) | **event** |
| luồng (control flow) | **flow** |
| phạm vi | **scope** |
| bản ghi (log) | **record** |
| mắt xích | **stage** |
| đích (log transport) | **sink** — chừa "chủ đích"/"mục đích" |
| nguồn (config/log) | **source** |

## Tier 2 — review tay (tần suất cao / dễ ồn, không auto-sweep)

| VN | → EN | Lý do hoãn |
|---|---|---|
| phân mảnh | sharding | ĐA NGHĨA: cũng = fragment/split (schema/data) → KHÔNG auto, dễ dịch nhầm |
| chuỗi | chain / string | ĐA NGHĨA NẶNG: ở bài logging = string ("chuỗi SQL/màu/thô"), ở pipeline = chain → KHÔNG auto (đã revert ở M0) |
| phụ thuộc | dependency | THƯỜNG LÀ ĐỘNG TỪ ("phụ thuộc vào" = depends on) → giữ VN; chỉ "đồ thị phụ thuộc" mới auto |
| biến đổi | transform | động từ → văn xuôi, giữ VN |
| bản sao | replica | ĐA NGHĨA: cũng = "copy" thường (bản sao riêng) → KHÔNG auto |
| khoá (trần) | key/lock | quá ngắn, đa nghĩa → chỉ auto "khoá ngoại" |
| tầng / lớp | layer | xuất hiện rất nhiều → bold hết sẽ rối |
| hợp đồng | contract | "hợp đồng" cũng dùng nghĩa thường |
| tài nguyên | resource | đôi chỗ nghĩa hạ tầng (dọn tài nguyên) |
| định danh | identifier / id | |
| nhúng / tham chiếu | embed / reference | |

## Tier 3 — GIỮ tiếng Việt (đã chuẩn trong giới)

`xác thực` (auth), `phân quyền` (authorization), `phiên` (session), `luồng` (flow),
`làm mới` (refresh), `khai báo` (declarative), `chuẩn hoá` (normalize), `khởi tạo` (instantiate).

## Bỏ qua (đã là EN / không phải jargon)

`instance, interceptor, filter, decorator, idempotent, rebind, envelope`; động từ văn xuôi
`lái, nhồi, gắn, bọc, rẽ nhánh`.

---

## Đã áp dụng

- **M0–M5** (2026-06-15): EN + bold MỌI lần. Sweep nesting-safe (chừa `**bold**`) + tự vá `***`
  italic-collision. Body parse 100% OK.
  - Cụm thực sự áp: dependency graph, public surface, source of truth, machine-readable,
    privilege escalation, foreign key, lifecycle, boundary, optimistic update.
  - GOTCHA: "phân mảnh"→sharding bị revert (false-positive ở M5 forms = "schema chia theo page",
    ở M1 = "data denormalized") → đã loại khỏi auto.
- **M0 round-2** (2026-06-15): thêm layer/event/flow/scope/record/stage/sink/source (Sonnet đọc kĩ inventory).
  Guard: đích→sink chừa "chủ đích/mục đích". REVERT: chuỗi→chain (đa nghĩa string/chain). GIỮ VN: phụ thuộc
  (động từ), biến đổi (động từ), + Nhóm B verbs + Nhóm C. Parse 20/20 OK, 0 collision.
- **M0 de-bold** (2026-06-15): bỏ ~114 nhãn/emphasis/fragment/số/bold-quanh-code qua 5 pass (curated → generic colon/fragment/number → whitelist multi-word → inline-code). Bold spans M0 còn 256, TOÀN keyword. Parse 20/20 OK. (1 `***` còn lại = bold+italic hợp lệ có sẵn.) Bắt thêm bug: "Mục đích"(viết hoa) bị →"Mục **sink**" do guard chỉ phủ lowercase → đã fix 20 chỗ. GUARD PHẢI phủ cả viết hoa.
- M1–M5: mới áp Tier-1 distinctive (đợt 1). CHƯA áp đợt-2 (layer/event/sink/source...) và CHƯA de-bold. 
- M6–M20: CHƯA. Quy trình: sweep map an toàn → GREP context từ đa nghĩa trước khi tin → verify parse + 0 collision.
