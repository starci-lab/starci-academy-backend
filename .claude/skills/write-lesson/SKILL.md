---
name: write-lesson
description: >
  Write or rewrite lesson content files (vi.md, en.md, test.md) for StarCi Academy
  System Design Mastery course. Use this skill whenever the user asks to "write lesson",
  "viết lesson", "tạo lesson", "viết content cho lesson", "viết bài SD", or whenever
  creating/updating lesson markdown files in .mount/data/courses/1-system-design-mastery/.
  Also trigger when the user asks to draft lesson body, flows, theory sections, codeExplaining,
  codeImplementations sections for a System Design lesson.
---

# write-lesson (System Design Mastery)

Write the full set of lesson files — **vi.md**, **en.md**, and **test.md** — for a System Design
Mastery lesson, matching the exact format and tone found in existing lessons.

This skill is tuned for SD lessons (Docker-first backend, multi-service architecture). For Fullstack
Mastery lessons, do NOT use this skill yet — it will be authored separately.

---

## Step 0 — Gather inputs

Before writing, confirm:

| Input | Example |
|---|---|
| **Module slot slug** | `4-kafka-streaming-and-reliability` |
| **Module repo number** | `5` (off-by-one: mount slot `4-...` → repo `module-5-...`) |
| **Lesson slug** | `0-log-based-messaging-fundamentals` |
| **Lesson topic** | Free text: what concept does this teach? |
| **Source code reference** | Path under `.repo/` if code exists; or describe the planned architecture |

The mount path is:
`.mount/data/courses/1-system-design-mastery/modules/<slot-slug>/contents/<lesson-slug>/`

If any input is missing, ask before proceeding.

---

## Step 1 — Read rules and ground in real lessons

Before drafting, read the canonical SD content rules file (this is the **only** content rules file
that applies — all `*.legacy.md` files in the same directory are historical and must NOT be used as
the source of truth):

```
.mount/data/rules/content-system-design.md    ← the v1 SD content rules — single source of truth
.mount/data/templates/content.md              ← canonical separator template
```

The strict wording table is in `content-system-design.md §3`. Every phrase listed there — including
`Ý interviewer muốn nghe`, `Trả lời mẫu (ngắn)`, `*Kết luận:*`, `# Bước 1:`, `Câu trả lời thiếu chiều
sâu:`, `Bài tuân theo **Thực hành dẫn dắt Lý thuyết**.`, the `ConfigModule` blockquote, etc. — is
reproduced verbatim. No paraphrasing.

**Read at least 1 representative existing lesson to mirror tone and depth.** Good references:
- `.mount/data/courses/1-system-design-mastery/modules/4-kafka-streaming-and-reliability/contents/0-log-based-messaging-fundamentals/vi.md` — clean infra demo, 5 flows
- `.mount/data/courses/1-system-design-mastery/modules/18-distributed-locks-and-leader-election/contents/0-redlock-and-fencing-tokens/vi.md` — algorithm depth, 4 flows
- `.mount/data/courses/1-system-design-mastery/modules/0-fundamentals-of-system-design/contents/0-core-concepts-and-metrics/vi.md` — load balancer, 3 flows

If code in `.repo/` exists, read the producer/consumer/service files to ground `codeExplaining` and `codeImplementations` in real method bodies — NEVER fabricate code that doesn't exist in the repo.

---

## Step 2 — The separator (CRITICAL)

The real separator in this codebase is the HTML comment:

```
<!-- @starci/seperator -->
```

Note the misspelling: **"seperator"** (not "separator"). This is the canonical token — the parser keys off this exact string. Do NOT "fix" it.

**Rules:**
- Every leaf-level value sits between two `<!-- @starci/seperator -->` lines.
- `# body` content (the entire `## 1. ... ## 3. ...` markdown) wraps as ONE block between two separators.
- Inside ` ``` ` code fences, do NOT add separators — they would be treated as content.

---

## Step 3 — Tone and style guide (mirror existing lessons)

**Voice (VI):**
- Address reader as **"Bạn"** — second person, warm but professional.
- IT terminology stays in English and is **bold** on first/important mention: `**Kafka**`, `**Redlock**`, `**ConfigModule**`, `**TypeORM**`, `**KRaft**`, `**partition assignment**`.
- Use inline backticks for filenames, env vars, function names: `kafka.topic`, `KAFKA_GROUP_ID`, `ClientKafka.emit()`.
- No slang, no "siêu", no exaggerated tone.

**Opening pattern (`## 1. Lời mở đầu`) — STRICT:**

Two paragraphs. The first opens with an italicized interview quote followed by a wrong/incomplete answer:

```
*"<Câu hỏi mở của Senior Engineer>"* — một **Senior Engineer** đặt câu hỏi.
**Mid-level Developer** đáp: *"<câu trả lời nông>"*. Câu trả lời thiếu chiều sâu:
<1-2 câu chỉ ra lỗ hổng — đây là pain point>.
```

Second paragraph is the "bridge": describe what `## 2.1` hands-on will do + what `## 2.2` theory
will systematize. End with a sentence about what the learner can do after the lesson.

**Flow conclusions** in `## 2.1.4`: end every flow with an italicized `*Kết luận: ...*` line that
ties the observed output back to the concept being taught.

**Theory subsections** (`## 2.2.N`): each subsection is one tightly-written paragraph (2-5 sentences),
NOT a wall of bullets. Save bullets for edge cases or numbered algorithm steps.

**Interview questions** (`### 3.1`): 3 questions, each formatted as:

```
- **Câu hỏi N: <text>?**
  - Ý interviewer muốn nghe: <1 câu>.
  - Trả lời mẫu (ngắn): <3-5 câu hoàn chỉnh dạng văn nói>.
```

---

## Step 4 — Structural skeleton for vi.md

Use this as the literal template. Fill each `<placeholder>` with lesson-specific content.

```
# title
<!-- @starci/seperator -->
<Tên bài học — plain text, IT terms in original English>
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
<1-3 câu mô tả bài, **bold IT terms cho phép**, no inline code, no links>
<!-- @starci/seperator -->
# body
<!-- @starci/seperator -->
## 1. Lời mở đầu

*"<Câu hỏi Senior>"* — một **Senior Engineer** đặt câu hỏi. **Mid-level Developer** đáp: *"<câu trả lời nông>"*. Câu trả lời thiếu chiều sâu: <chỉ ra lỗ hổng — 1-2 câu>.

Bài học triển khai <stack mô tả>:
- **Phần 2.1**: **thực hành** <mô tả ngắn>.
- **Phần 2.2**: **lý thuyết** <mô tả ngắn>.

<Câu chốt 1 dòng về capability sau khi học xong>.

## 2. Các khái niệm cốt lõi

Bài tuân theo **Thực hành dẫn dắt Lý thuyết**. <Câu mô tả lộ trình: clone → chạy → quan sát → lý thuyết>.

### 2.1. Thực hành

#### 2.1.1. Chuẩn bị source code và môi trường

Mục đích: <1 câu mục đích>.

Source: [StarCi-Academy/system-design-mastery-module-<N>-<slug>](https://github.com/StarCi-Academy/system-design-mastery-module-<N>-<slug>) trên GitHub — thư mục bài học: [`<lesson-slug>`](https://github.com/StarCi-Academy/system-design-mastery-module-<N>-<slug>/tree/main/<lesson-slug>); **Docker Compose** và file hands-on nằm trong [`<lesson-slug>/.docker`](...).

​```bash
# Bước 1: Clone repository về máy local
git clone https://github.com/StarCi-Academy/system-design-mastery-module-<N>-<slug>.git

# Bước 2: Vào thư mục chứa file compose của bài học
cd system-design-mastery-module-<N>-<slug>/<lesson-slug>/.docker
​```

#### 2.1.2. Kiến trúc/thành phần (stack + luồng)

<1-2 câu describe stack purpose nếu cần>:

- **<Service A> (:<port>):** <1 câu vai trò>.
- **<Service B> (:<port>):** <1 câu vai trò>.
- **<Service C>:** <vai trò>.

| Thành phần | Cổng (Port) | Vai trò |
|---|---|---|
| <name> | <port> | <1-phrase> |
| <name> | <port> | <1-phrase> |

​```mermaid
flowchart LR
    Client((Client)) -->|<verb>| A[<service-a>]
    A -->|<verb>| B[<service-b>]
​```

Hình 1: <1 câu diễn giải sơ đồ>.

#### 2.1.3. Chuẩn bị & khởi chạy

##### 2.1.3.1. Điều kiện cần trước

- **Docker Desktop** / **Docker Engine** + **Compose plugin**. <Yêu cầu RAM nếu cần>.
- **Windows:** dùng **`Invoke-RestMethod`** thay cho **`curl`**.

> **Lưu ý:** Các biến môi trường mặc định đã được cấu hình sẵn qua **`ConfigModule`** trong repository; không cần tạo hay sửa **`.env`** khi chạy qua **Docker Compose**. Chỉ chỉnh **`.env`** khi chạy service trực tiếp ngoài Compose.

##### 2.1.3.2. Khởi động stack

​```bash
# Bước 1: Khởi động toàn bộ stack
docker compose up -d --build
​```

Kiểm tra:
- <service A>: `http://localhost:<port>` (<1 phrase>)
- <service B>: `http://localhost:<port>`

#### 2.1.4. Kiểm thử

<N> luồng: <comma-separated short flow names>.

##### 2.1.4.1. Luồng 1 — <tên luồng action-oriented>

​```bash
# Windows (PowerShell)
Invoke-RestMethod -Uri "http://localhost:<port>/<path>" -Method <verb> -Body (@{ <field> = "<value>" } | ConvertTo-Json) -ContentType "application/json"

# macOS / Linux
# → Dán cURL vào Postman: Import → Raw text
curl -s -X <VERB> http://localhost:<port>/<path> -H "Content-Type: application/json" -d '{"<field>":"<value>"}'
​```

*Kết luận:* <1-2 câu — response chính, gắn với khái niệm bài học>.

##### 2.1.4.2. Luồng 2 — ...

[same pattern]

##### 2.1.4.N. Luồng N — ...

#### 2.1.5. Dọn tài nguyên

Sau khi kết thúc bài, bạn có thể dọn tài nguyên để tiết kiệm bộ nhớ.

​```bash
docker compose down -v
​```

#### 2.1.6. Đọc thêm

- [<Title>](<URL>) — <1 phrase>.
- [<Title>](<URL>) — <1 phrase>.

### 2.2. Lý thuyết

#### 2.2.1. <Khái niệm A>

<1 đoạn 2-5 câu — định nghĩa + nguyên lý hoạt động + liên hệ với phần thực hành vừa rồi>.

#### 2.2.2. <Khái niệm B>

<1 đoạn ngắn>.

#### 2.2.<N-1>. <Khái niệm cuối>

<1 đoạn ngắn>.

#### 2.2.<N>. Các trường hợp biên (edge cases) cần lưu ý

- **<Edge case 1>:** <vấn đề> → <giải pháp 1 câu>.
- **<Edge case 2>:** <vấn đề> → <giải pháp 1 câu>.
- **<Edge case 3>:** <vấn đề> → <giải pháp 1 câu>.

## 3. Tổng kết

### 3.1. Các câu hỏi dễ bị phỏng vấn

- **Câu hỏi 1: <text>?**
  - Ý interviewer muốn nghe: <1 câu>.
  - Trả lời mẫu (ngắn): <3-5 câu>.
- **Câu hỏi 2: <text>?**
  - Ý interviewer muốn nghe: <1 câu>.
  - Trả lời mẫu (ngắn): <3-5 câu>.
- **Câu hỏi 3: <text>?**
  - Ý interviewer muốn nghe: <1 câu>.
  - Trả lời mẫu (ngắn): <3-5 câu>.
<!-- @starci/seperator -->
# codeExplaining

## 0

### code
<!-- @starci/seperator -->
​```typescript
<snippet thực tế từ .repo/ — 8-20 dòng>
​```
<!-- @starci/seperator -->
### explain
<!-- @starci/seperator -->
<2-3 câu — WHY không phải WHAT. Liên hệ với pattern. Đề cập gotcha production nếu phù hợp>.
<!-- @starci/seperator -->

## 1

### code
<!-- @starci/seperator -->
​```typescript
<snippet 2 — usually consumer/handler/service complement to snippet 0>
​```
<!-- @starci/seperator -->
### explain
<!-- @starci/seperator -->
<2-3 câu>.
<!-- @starci/seperator -->

# codeImplementations

## 0

### lang
<!-- @starci/seperator -->
typescript
<!-- @starci/seperator -->
### guide
<!-- @starci/seperator -->
Dùng **<thư viện chính bold>** (`<package>`) — <1 dòng vai trò>.

**Mapping API:**
- <NestJS API> → <tương đương typescript pure>.
- <Concept khác> → <tương đương>.

**Khác biệt/gotcha quan trọng:**
- <gotcha 1 — 1 câu>.
- <gotcha 2 — 1 câu>.
<!-- @starci/seperator -->
### example
<!-- @starci/seperator -->
​```typescript
<5-15 dòng pattern chính, không port nguyên codebase>
​```
<!-- @starci/seperator -->

## 1
### lang
<!-- @starci/seperator -->
csharp
<!-- @starci/seperator -->
### guide
<!-- @starci/seperator -->
Dùng **<lib>** (NuGet `<package>`) — ...

**Mapping API:**
- ... → ...

**Khác biệt/gotcha quan trọng:**
- ...
<!-- @starci/seperator -->
### example
<!-- @starci/seperator -->
​```csharp
<5-15 lines>
​```
<!-- @starci/seperator -->

## 2
### lang
<!-- @starci/seperator -->
go
<!-- @starci/seperator -->
### guide
<!-- @starci/seperator -->
Dùng **<lib>** (`<github.com/...>`) — ...

**Mapping API:**
- ... → ...

**Khác biệt/gotcha quan trọng:**
- ...
<!-- @starci/seperator -->
### example
<!-- @starci/seperator -->
​```go
<5-15 lines>
​```
<!-- @starci/seperator -->

## 3
### lang
<!-- @starci/seperator -->
java
<!-- @starci/seperator -->
### guide
<!-- @starci/seperator -->
Dùng **<lib>** (`<package coord>`) — ...

**Mapping API:**
- ... → ...

**Khác biệt/gotcha quan trọng:**
- ...
<!-- @starci/seperator -->
### example
<!-- @starci/seperator -->
​```java
<5-15 lines>
​```
<!-- @starci/seperator -->

# references

## 0
### alias
<!-- @starci/seperator -->
<Display name — official docs / engineering blog>
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
<URL>
<!-- @starci/seperator -->

## 1
### alias
<!-- @starci/seperator -->
<name>
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
<URL>
<!-- @starci/seperator -->

## 2
### alias
<!-- @starci/seperator -->
<name>
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
<URL>
<!-- @starci/seperator -->

# minutesRead
<!-- @starci/seperator -->
<15-30>
<!-- @starci/seperator -->
# isPremium
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
```

---

## Step 5 — Flow design rules

- **Count:** 3-10 flows (hard rule). Typical SD lesson: 4-6 flows.
- **Naming:** action-oriented. Pattern: `Luồng N — <verb phrase>`. Examples from real lessons:
  - `Luồng 1 — Publish 1 event`
  - `Luồng 2 — Xem log consumer`
  - `Luồng 3 — Publish 10 event với 2 partitionKey`
  - `Luồng 1 — Acquire + release cơ bản`
  - `Luồng 2 — Demo safety fencing token`
  - `Luồng 3 — Quorum sống khi mất 1 node`
- **Dual-platform commands:** every flow with an API call uses the two-block pattern:
  ```
  # Windows (PowerShell)
  Invoke-RestMethod ...

  # macOS / Linux
  # → Dán cURL vào Postman: Import → Raw text
  curl ...
  ```
  Even when the command is identical (e.g. `docker logs`), keep both blocks — convention beats DRY.
- **Conclusion line:** end every flow with `*Kết luận: <observation tying to concept>.*` (italic).
- **Last flow ideas:** include at least one flow that demonstrates an *edge case*, *failure mode*, or
  *observable property unique to this pattern* (e.g. "reset offset to replay", "kill 1 node and observe quorum survives", "send stale fencing token → storage rejects").

---

## Step 6 — codeImplementations (SD-specific)

4 entries in fixed order: **typescript (0) → csharp (1) → go (2) → java (3)**.

For SD lessons, treat each entry as a *production-stack port* of the lesson's core pattern:
- TypeScript entry: **non-NestJS** alternative (Express/Fastify/Hono + raw client library).
- C# entry: ASP.NET Core + the idiomatic .NET client (e.g. `Confluent.Kafka`, `StackExchange.Redis`).
- Go entry: idiomatic Go (e.g. `confluent-kafka-go`, `go-redis`, `gorilla/websocket`).
- Java entry: Spring Boot + the canonical Spring Starter (e.g. `spring-kafka`, `spring-data-redis`).

Each `### guide` MUST cover three things explicitly (look at the Kafka lesson for reference):
1. **Thư viện chính** (bold) — exact package name.
2. **Mapping API** — concrete NestJS-to-target-stack API translations as bullets.
3. **Khác biệt/gotcha quan trọng** — 2-3 bullets of production gotchas (cold start, threading, native deps, batching defaults, etc.).

Skip `# codeImplementations` entirely ONLY if the lesson is pure infra/YAML/k8s — extremely rare for SD.

---

## Step 7 — Write en.md

Same skeleton, EN wording per `content-common.md §A.4`:
- `## 1. Opening`, `## 2. Core concepts`, `### 2.1. Hands-on`, `### 2.2. Theory`, `## 3. Wrap-up`, `### 3.1. Common interview questions`.
- Flow headings: `##### 2.1.4.<N>. Flow N — <action name>`
- Flow labels: `*Conclusion: ...*`
- Bash comments use EN: `# Step 1: Clone the repository locally`
- Postman hint: `# → Paste cURL into Postman: Import → Raw text`
- Interview Q format: `**Question N:** ... / What interviewers want to hear: ... / Sample answer (concise): ...`
- Italic style and bold-IT-term style: keep identical to vi.md.

Identical: separator positions, flow count, code snippets, table structure, mermaid diagram source.

---

## Step 8 — Write test.md

One file at lesson root, mirrors `## 2.1.4` flows 1:1. Format:

```markdown
# Test flows for <lesson-slug>

## Flow 1 — <name matching §2.1.4.1>

**Purpose:** <1 sentence>

**Steps:**
1. <action>
2. <action>

**Command (PowerShell):**
​```powershell
Invoke-RestMethod ...
​```

**Command (curl):**
​```bash
curl ...
​```

**Expected response:**
​```json
{ "...": "..." }
​```

**Pass criteria:** <specific observable assertion — e.g., "response has `acquired: true` and `acquiredOn: 3/3`">

---

## Flow 2 — ...
```

`test.md` has NO separators — it's a plain markdown file. Flow count and flow names must match `vi.md` `## 2.1.4` exactly.

---

## Step 9 — Write files

Write to:
```
.mount/data/courses/1-system-design-mastery/modules/<slot>/contents/<lesson>/vi.md
.mount/data/courses/1-system-design-mastery/modules/<slot>/contents/<lesson>/en.md
.mount/data/courses/1-system-design-mastery/modules/<slot>/contents/<lesson>/test.md
```

After writing, report:
- Files written (paths)
- Flow count (and confirm `vi.md`, `en.md`, `test.md` all match)
- Which existing lesson(s) you mirrored for tone
- Whether code snippets were grounded in `.repo/` files (and which) or fabricated against described architecture
- minutesRead chosen and justification (e.g. "22 — 5 flows + 5 theory subsections, similar to the Kafka reference lesson")
