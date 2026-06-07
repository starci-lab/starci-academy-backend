# System Design — Challenge rules · đúc kết

> Bản để audit/viết challenge **System Design**. SD dùng **CHUNG format V2 với Fullstack** — đọc **`../fullstack/challenges.md`** trước (cấu trúc file, H1 order, item-major, scoring outcome/approach, critical, parsing gotcha, gate). File này CHỈ liệt kê **SD deltas**. Content body → `contents.md`.
>
> **Đã verify với challenge thật (m0/m1):** SD challenge dùng ĐÚNG format FS V2 — `# score = 100` mọi tier; `submissions/0/en.md` = `outcomeCriterias` (Σ ### score = 30) + `approachCriterias` (Σ = 70, ≥1 `critical: true`). **Format 20/40/60/80 + inline `### promptText` trong `challenge-format.md` là STALE — KHÔNG dùng.**

---

## 1. Giống FS hoàn toàn (xem `../fullstack/challenges.md`)
- File: `challenges/<N>-<slug>-<difficulty>/{vi,en}.md` + `submissions/0/{en,vi}.md`. `<difficulty>` ∈ easy/medium/hard/insane, `<N>` = orderIndex.
- vi/en H1 order: `# title · # description · # requirements · # steps · # outputs · # prerequisites · # difficulty · # score · # verified`. **KHÔNG** `# references`/`# submissions` inline (= V1). `# score = 100` mọi challenge. `# description` plain text.
- Item-major (requirements: lang+title+body+score · steps: lang+title+body · outputs/prerequisites: lang+text). Sub-block trong `##### body` = callout `:::muted` (CẤM `### 1./2./3.`).
- `submissions/0/en.md`: `# type → githubUrl · # title · # description · # score → 100` + `# outcomeCriterias` (Σ ### score = **30**) + `# approachCriterias` (Σ = **70**, ≥1 `critical: true` = thường ô 40đ; rớt → zero cả bài). Criteria **English-only** (`vi.md` chỉ type/title/description). Mỗi `##### body` nêu **Kiểm gì / Bằng chứng quan sát được / Fail nếu** — proof cơ chế thật.
- Separator chẵn, children sâu hơn parent ≥1 cấp (parsing gotcha §5 FS).
- **Verify đã thấy m0 easy**: outcome 10+10+10=30 · approach 40(critical:true)+15+15=70 · total 100. ✓

---

## 2. SD deltas

### 2.1 Language set
- Lang trong challenge = subset của body lang. SD 4-lang → bucket `#### 0..3` (`typescript/java/csharp/go`) cho criteria/requirement có code per-lang. Bài **agnostic** (k8s) → 1 bucket `agnostic`. **Khác FS** (FS FE = luôn `agnostic`).
- outcomeCriterias thường **agnostic** (đo outcome quan sát được, không phụ thuộc lang); approachCriterias mới per-lang khi cần.

### 2.2 Tier per slot (observed m0–m9)
- **Slot 0–3 (nền tảng: fundamentals/database/k8s/communication)**: CHỈ **easy + medium** (2 challenge/lesson).
- **Slot ≥4 (kafka/rabbitmq/redis/monitoring/security/elasticsearch…)**: đủ **easy + medium + hard + insane** (full pyramid) — SD topic có độ sâu production thật.
- Giữ hard/insane theo **merit** (cơ chế production thật: consistency/concurrency/failure-mode/benchmark), KHÔNG nhồi build-exercise/overlap. Phân vân → ghi verdict + lý do vào `audited.md`, hỏi chủ nhiệm. (Đồng pha FS `challenges.md §6` nhưng SD slot≥4 thường ĐỦ 4 tier thay vì "by merit" thưa.)
- Premium: 1–2 lesson cuối module.

### 2.3 Proof = cơ chế quan sát từ ngoài (SD-flavored)
Criteria `##### body` phải đo cơ chế distributed thật, KHÔNG happy-path:
- consistent hashing: replay key → cùng node; rebalance trong ±N%.
- transaction/Saga: inject throw giữa flow → state revert hoàn toàn.
- cache: call thứ 2 latency ↓ / log `from cache`.
- replication/CDC: write primary → đọc replica sau lag bounded; Debezium emit đúng event shape.
- rate limiter: vượt quota → 429 đúng ngưỡng; phân tán nhiều instance vẫn đúng tổng.

### 2.4 KHÔNG có
- KHÔNG FE-idiom (`"use client"`/Thymeleaf), KHÔNG Playwright/DOM testid trong criteria — SD verify bằng curl/CLI/dashboard.

---

## 3. Quy trình duyệt (Opus) + Gate — như FS
- Script lo format (gate). Opus duyệt ngữ nghĩa: criteria đo đúng cơ chế distributed · outputs/requirements khớp topic · tier có nhồi không · lang set ⊆ body. Sai format → rewrite theo gold V2.
- Gate `./.audits/check-lesson.ps1`: score=100 · có verified · no `# references`/`# submissions` inline · no `### N.` heading · Σ outcome=30 · Σ approach=70 · ≥1 critical:true · separator chẵn · vn-có-dấu. PASS structure mới Opus duyệt.
