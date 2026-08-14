# Trust refactor — cut the ceremony, keep the law

## Goal

Plan vẽ screen để chọn → Preview chốt state + propose backend → Apply sửa backend + code FE. Xong.
Không seal, không hash, không record json, không context-lock file. Contract và canon giữ nguyên vì
máy giữ chúng, không tốn lời.

## Skill shape — cả 9 skill đều 3 phần

### 1 · SCOPE — kẻ bảng ngay khi gọi, trước khi làm gì

| | |
|---|---|
| Làm gì | một câu |
| Repo / branch | đường dẫn thật |
| Chạm | đường dẫn được ghi |
| Không chạm | phần còn lại |
| Xong thì có | cái sờ được |

### 2 · PROCESS — chạy tới khi kẹt thật, rồi trả output ngay

```
làm  ──►  kẹt?  ──yes──►  OUTPUT dạng A  ──thầy confirm──┐
          │                                              │
          └──no──►  hết việc  ──►  OUTPUT dạng B         │
                                                          │
          ◄───────────────── làm tiếp ◄───────────────────┘
```

Kẹt thì trả liền, không ngồi im. Confirm xong thì **làm tiếp trong cùng skill**, không bắt gọi lại.
Vòng A có thể lặp vài lần — không biết trước hết mọi cái vướng là chuyện bình thường.

Hai điều kiện trong một vòng A:

- Gom hết cái đang biết vào một lần hỏi. Biết 3 cái mà hỏi 3 lần là sai.
- Chỉ trả A khi **thật sự không đi tiếp được**. Cái không chặn thì tự quyết, ghi một dòng, đi tiếp.

UX/UI vụn luôn tự quyết. Chỉ cái có thể SAI mới lên A.

### 3 · OUTPUT — đúng hai dạng, không có dạng thứ ba

**Dạng A — có cái cần thầy chốt:**

```
CHỌN      <việc> — a) <mặc định đang dùng>  b) <cách kia>
TÀI NGUYÊN <thứ cần> — chạy: <lệnh sẵn>  → em đọc lại và làm tiếp
SKILL KHÁC <tên skill> — nó làm <gì>, xong QUAY VỀ đây
```

**Dạng B — không vướng gì. Phải nói rõ bước sau làm gì:**

```
Xong. <cái đã làm>.

Bước sau — <tên skill>:
  làm gì      <một câu>
  chạm        <đường dẫn>
  hỏi thầy    <câu duy nhất nó sẽ hỏi, hoặc "không">
  xong thì có <cái sờ được>

Thầy bảo là chạy.
```

Apply ở dạng B thì không mời ai nữa — in trang chạy được rồi hết.

Không dạng nào khác. Không "đang chờ", không "cần làm rõ", không báo cáo tiến độ.

## Một task = một file `.claude/workflows/<id>.md`

Thay toàn bộ record cũ (`context-lock.*.json`, `plan-record.json`, `design-record.json`,
`consolidation-*.json`, screenshot hash). Ba phase ghi nối vào **cùng một file**, không đẻ file mới.

```markdown
# refactor-authentication

## plan
SCOPE   <bảng>
CHỌN    hướng B — <lý do thầy chọn>
Đã tự quyết: <UX vụn, mỗi cái một dòng>

## review
SCOPE   <bảng>
STATE   <owner → state → đã render chưa>
BACKEND <field còn thiếu → skill nào lo>
DUYỆT   <thầy duyệt gì>

## apply
SCOPE   <bảng>
ĐÃ GHI  <file>
XANH    tsc / lint / build
CÒN NỢ  <hoặc "không">
```

Phase sau đọc file này, không dò lại. Đọc một file thay vì bảy.

**Đây cũng là chỗ thay seal — bằng thứ mạnh hơn.** Seal chỉ giữ được một run lúc nó đang chạy. File
này ở lại, nên thêm skill thứ 10:

**`starci-workflow-drift`** — đọc mọi `.claude/workflows/*.md`, hỏi source còn khớp không:
file trong `WROTE` còn không, có file lạ nào trong `Touching` mà `WROTE` không nhắc, state trong
`STATES` còn render đúng không. Chạy được bất cứ lúc nào, trên toàn bộ task cũ.

Đổi từ *chặn drift* sang *tìm drift*: chặn thì tốn một hash mỗi file và một phase từ chối kết thúc;
tìm thì tốn một lần chạy skill trên cả lịch sử.

**Lưu ý:** `.claude/workflows/` cũng là chỗ Claude Code tìm workflow script. File `.md` ở đây không
va vào script `.js`, nhưng nếu sau này thầy dùng tool đó thì hai thứ ở chung thư mục.

## Disposition

| Giữ nguyên | Vì sao |
|---|---|
| `fe/canon/**` (35k từ) | lint + type giữ, không phải văn xuôi giữ |
| `fe/design/**` | phán đoán, đọc khi cần chứ không bắt buộc |
| `sources/**` + gates | máy chạy, rẻ |
| `serve_preview.py` | thật sự dùng |

| Xoá | Vì sao |
|---|---|
| `CONTEXT-LOCK.md` (1.385) | thay bằng 1 dòng: xác nhận repo/branch trước khi ghi production |
| `handoff.md` (3.006) | gộp vào shape 3 phần, còn ~300 từ |
| 12 × `verify_*.mjs` + test | không còn record để verify |
| `*-record.md`, `*-plan.md` refs (2.858) | không còn record |
| 5 × `steps-table.md` (2.078) | đã nằm trong SCOPE |
| `parity-gate.md`, `executable-spec.md` | gộp vào Preview |
| `assets/review-lab/` | Preview render thẳng candidate |

| Viết lại gọn | Từ → đích |
|---|---|
| `starci-fe-design-plan` | 2.852 → ~350 |
| `starci-fe-design-preview` | 5.029 → ~450 |
| `starci-fe-design-apply` | 2.240 → ~350 |
| `starci-be-feature-plan/apply` | 4.192 → ~600 |
| `starci-fe-consolidate-plan/apply` | 3.519 → ~450 |
| `starci-fe-fidelity-fix` | 1.654 → ~250 |
| `starci-fe-lint-sync` | 1.444 → ~250 |
| `CLAUDE.md` + `INDEX.md` | 3.176 → ~600 |

**Đọc bắt buộc trước khi Plan vẽ 1 dòng: 12.100 → ~1.200 từ.**

## Ba phase, sau khi cắt

**Plan** — đọc backend schema + component đã có, vẽ 2–4 screen HTML thật, host 8080, thầy chọn một.
Không record, không lock. Output: screen đã chọn + danh sách owner/contract sẽ dùng.

**Preview** — dựng candidate bằng đúng component/contract production, render đủ state, chạy
tsc/lint/build. Propose backend update nếu thiếu field. Output: state matrix + backend proposal.
Thầy duyệt.

**Apply** — xác nhận repo/branch một lần, sửa backend theo proposal, viết FE, chạy tsc/lint/build,
mở trang thật xem. Output: trang chạy được + việc còn nợ.

## Luật còn sống sau khi cắt

1. Contract/canon: tier đúng, không `className`, reuse trước khi tạo mới.
2. So sánh cùng state (đừng so loading với populated).
3. tsc + lint + build phải xanh, không suppress.
4. UX/UI vụn thì tự quyết, ghi một dòng; cái có thể SAI thì hỏi.
5. Vướng thì gom một form: chọn / tài nguyên kèm script / cần chạy skill khác rồi quay về.
6. Xác nhận repo + branch trước khi ghi production.

## Thứ tự làm

1. Viết `skill-shape.md` (~300 từ) — thay `handoff.md` + `CONTEXT-LOCK.md`.
2. Viết lại 3 skill FE design.
3. Xoá script + refs chết, sửa `sources/skills.test.mjs` cho khớp.
4. Viết lại 4 skill còn lại + `CLAUDE.md` + `INDEX.md`.
5. Chạy `npm test`.
6. Chạy thật `contact-page` tới khi `src/app/[lang]/contact/page.tsx` render được.

Bước 6 là cái quyết định luật mới đúng hay sai.
