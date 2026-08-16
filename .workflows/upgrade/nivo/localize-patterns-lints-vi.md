<!-- starci-workflow: v2 -->

# Việt hóa patterns và lints, giữ nguyên nghĩa

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\starci-academy-backend @ mtp |
| Purpose | Khóa một bản dịch tiếng Việt cho patterns và lints mà không đổi luật, ví dụ, cấu trúc hay hành vi gate. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\localize-patterns-lints-vi.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\localize-patterns-lints-vi.md |

### YÊU CẦU GỐC

| Điều người dùng chốt | Cách hiểu bị khóa |
|---|---|
| Dịch patterns và lints của `.claude` sang tiếng Việt | Dịch phần văn xuôi tiếng Anh trong các shelf pattern/lint; không sáng tác hoặc diễn giải lại luật. |
| Trừ `INDEX` | Mọi file có tên `INDEX.*` nằm ngoài write boundary và phải có diff rỗng. |
| Không sửa nội dung | Rule id, modal strength, điều kiện, ngoại lệ, thứ tự, ví dụ, code, link, path, command, API/identifier và kết luận phải giữ nguyên. Chỉ ngôn ngữ trình bày thay đổi. |

### INVENTORY

| Shelf được đo | File ngoài `INDEX.*` | Hiện trạng | Quyết định Plan |
|---|---:|---|---|
| `.claude/be/patterns/**` | 60 | Đã có tiếng Việt | Audit-only; không rewrite nếu không còn câu văn tiếng Anh độc lập. |
| `.claude/be/lints/**` | 60 | Đã có tiếng Việt | Audit-only; không rewrite nếu không còn câu văn tiếng Anh độc lập. |
| `.claude/be/canon/patterns/**` | 15 | Thuần tiếng Anh | Dịch prose sang tiếng Việt. |
| `.claude/fe/patterns/**` | 72 | Đã có tiếng Việt | Audit-only; không rewrite nếu không còn câu văn tiếng Anh độc lập. |
| `.claude/fe/lints/**` | 64 | Đã có tiếng Việt | Audit-only; không rewrite nếu không còn câu văn tiếng Anh độc lập. |
| `.claude/fe/canon/patterns/**` | 18 | Thuần tiếng Anh | Dịch prose sang tiếng Việt. |
| Tổng | 289 | 33 file thuần tiếng Anh; 256 file đã có tiếng Việt | Exact production candidates là 33 canon pattern. |

### EXACT CANDIDATE TREE

| Root | Exact files |
|---|---|
| `.claude/be/canon/patterns/` | `authorization.md`, `cdc.md`, `comments.md`, `cqrs.md`, `data-access.md`, `e2e-flow.md`, `event-delivery.md`, `exception-identity.md`, `exceptions.md`, `module-layering.md`, `naming.md`, `observability.md`, `testing.md`, `transport.md`, `type-safety.md` |
| `.claude/fe/canon/patterns/` | `cache-key.md`, `comments.md`, `contract.md`, `file-layout.md`, `icon.md`, `landmark.md`, `lint-adoption.md`, `lint-escape-hatch.md`, `loading.md`, `naming.md`, `props-and-slots.md`, `served-locale.md`, `the-split.md`, `tokens.md`, `translation.md`, `type-safety.md`, `typography.md`, `vendor-boundary.md` |

### TRANSLATION INVARIANTS

| Bất biến | Cách chứng minh |
|---|---|
| Không đổi code | Mọi fenced code block giữ byte-for-byte; không dịch comment nằm trong code block. |
| Không đổi vocabulary máy | Inline code, rule id, enum, class/function/type, package, file path, command, URL và Markdown link target giữ nguyên. |
| Không đổi luật | Giữ nguyên số rule, thứ tự rule, từ bắt buộc/cấm/được phép, điều kiện, ngoại lệ, owner và hậu quả. |
| Không đổi bảng | Giữ nguyên số bảng, thứ tự dòng/cột và giá trị kỹ thuật; chỉ dịch ô prose. |
| Không đổi gate anchors | Giữ nguyên literal `Implementation anchors in `starci-academy-fe`:` vì parity test đang parse nó; trong `icon.md` giữ `| Meaning (` và heading `## Forbidden` vì twin test đang parse hai mốc này. |
| Không đụng INDEX | Snapshot hash mọi `INDEX.*` trước/sau phải trùng; `git diff -- '**/INDEX.*'` rỗng. |
| Không làm mất liên kết | Tập Markdown link target trước/sau phải giống nhau theo từng file. |

### REVIEW QUESTIONS

| Câu hỏi Review phải đóng | Mặc định đề xuất |
|---|---|
| Dịch file nào | Chỉ 33 canon pattern thuần tiếng Anh; 256 file đã Việt hóa là audit-only. |
| Dịch heading hay không | Dịch heading prose khi không phải parser anchor; giữ nguyên ba machine anchors đã đo. |
| Xử lý thuật ngữ kỹ thuật | Giữ nguyên inline-code/identifier; dịch phần giải thích xung quanh bằng tiếng Việt tự nhiên, không phiên âm ép buộc. |
| Cách tránh “dịch hay nhưng sai luật” | Dịch từng file theo đoạn, rồi đối chiếu cấu trúc và modal meaning; không dùng bulk replace theo từ khóa. |

### ACCEPTANCE EVIDENCE

| Gate | Kỳ vọng |
|---|---|
| `git diff -- .claude/be/canon/patterns .claude/fe/canon/patterns` | Chỉ 33 file đã khóa; prose tiếng Việt, không có file ngoài boundary. |
| Code-fence snapshot checker | PASS: số block, language tag và nội dung block giống baseline. |
| Inline-code/link/rule-id structural checker | PASS: các token kỹ thuật và link target không đổi. |
| `git diff -- '**/INDEX.*'` | Rỗng. |
| `npm --prefix .claude test` | PASS; parity, rule twins và parser-dependent canon vẫn xanh. |
| Manual bilingual parity review | Mỗi rule giữ đúng chủ thể, mức bắt buộc, điều kiện, ngoại lệ và lý do của bản tiếng Anh. |

### OUTPUTS

| Concept | Result |
|---|---|
| Bản địa hóa trust canon | Đề xuất dịch 33 canon pattern còn thuần tiếng Anh; không phát minh hoặc sửa một luật nào. |
| Phạm vi lints/patterns hiện hữu | 256 file ngoài `INDEX.*` đã là tiếng Việt nên được bảo toàn, chỉ audit ngôn ngữ. |
| Bất biến máy đọc | Code, identifier, rule id, link, command và ba parser anchor được giữ nguyên. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/nivo/localize-patterns-lints-vi.md` | added — inventory, exact candidate tree, translation invariants và proof gates. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chuyển sang Upgrade Review với boundary r1 này? | Khuyến nghị: duyệt Review cho đúng 33 canon pattern, 256 file còn lại audit-only, mọi `INDEX.*` bất khả xâm phạm; phương án khác: mở rộng rewrite cả 256 file đã Việt hóa, nhưng tăng diff và rủi ro đổi nghĩa không cần thiết. |

### WARNINGS

| Warning | Impact |
|---|---|
| Một số canon text là input của test, không chỉ tài liệu đọc. | Dịch literal parser anchor sẽ làm gate đỏ dù nghĩa không đổi. |
| Dịch hơn 4.000 dòng prose có rủi ro làm yếu modal meaning. | Review/Apply phải đối chiếu từng rule, không được báo hoàn tất chỉ dựa vào language detection. |
| Upgrade Plan thông thường đòi refusal lặp lại; yêu cầu này là migration bản dịch trực tiếp, không phải luật mới. | Workflow không dùng yêu cầu này làm chứng cứ để thêm hoặc sửa semantics của canon. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dịch hoặc format lại mọi file ngoài `INDEX.*` | Chỉ dịch 33 file còn thuần tiếng Anh; audit-only với 256 file đã Việt hóa | Người dùng yêu cầu dịch, không yêu cầu churn hay viết lại nội dung đã là tiếng Việt. |
| Dịch code fence, identifier và machine anchors | Giữ nguyên byte/token | Dịch chúng làm thay đổi ví dụ, contract hoặc phá parser. |
| Cập nhật `INDEX.*` cho đồng bộ ngôn ngữ | Giữ diff rỗng cho toàn bộ `INDEX.*` | Người dùng loại trừ INDEX rõ ràng. |

### OWED

| Owed | Cleared by |
|---|---|
| Khóa wording, exact tree và test obligations | `starci-fe-upgrade-review` trên revision `localize-patterns-lints-vi-r1`, sau đó người dùng duyệt rõ revision. |
| Thực hiện bản dịch | `starci-fe-upgrade-apply` sau Review approval; Apply ghi baseline commit trước production write. |

## review

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\starci-academy-backend @ mtp |
| Purpose | Phản biện và khóa exact write boundary, bất biến nghĩa, thuật ngữ và proof gates cho bản dịch. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\localize-patterns-lints-vi.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\localize-patterns-lints-vi.md; chưa sửa canon. |

### REVISION

Revision under review: `localize-patterns-lints-vi-r1`

| Trục | Verdict r1 |
|---|---|
| Mục tiêu | ACCEPT — bản địa hóa prose, không thay đổi luật. |
| Exact tree | ACCEPT — chỉ 15 BE canon pattern và 18 FE canon pattern đã liệt kê trong Plan. |
| `INDEX.*` | FREEZE OUT — không đọc lại để đồng bộ wording, không ghi, diff bắt buộc rỗng. |
| 256 file đã Việt hóa | FREEZE OUT — audit-only; không format hoặc “sửa tiếng Việt cho hay hơn”. |
| Machine anchors | FREEZE — giữ nguyên ba literal parser anchor đã đo. |
| Code và kỹ thuật | FREEZE — code fence, inline code, rule id, identifier, command, path, URL và link target bất biến. |
| Ngữ nghĩa | FREEZE — chủ thể, modal strength, điều kiện, ngoại lệ, owner, hậu quả, thứ tự và kết luận bất biến. |

### WORDING CONTRACT

| Loại source | Cách viết được duyệt |
|---|---|
| Câu luật | Tiếng Việt trực tiếp, giữ đúng mức `phải`, `không được`, `chỉ`, `có thể`; không làm mềm `must/never/only` thành lời khuyên. |
| Thuật ngữ code | Giữ identifier trong backtick; phần giải thích dùng tiếng Việt. Không dịch tên class, API, package, rule hoặc layer. |
| Thuật ngữ đã thành vocabulary StarCi | Giữ từ kỹ thuật khi bản dịch gây mơ hồ (`handler`, `resolver`, `command`, `query`, `event`, `contract`, `leaf`, `branch`, `composite`, `block`, `page`, `shell`), nhưng câu bao quanh phải là tiếng Việt tự nhiên. |
| Heading prose | Dịch sang tiếng Việt, trừ literal machine anchor. Không đổi cấp heading hoặc thứ tự section. |
| Ví dụ văn xuôi ngoài code | Dịch sát tình huống và kết luận; giữ nguyên tên giả, số liệu, key và quoted source token. |
| Bảng | Dịch header/cell prose khi không phải parser token; không gộp/tách/reorder hàng hoặc cột. |

### TEST OBLIGATION

| Proof | Điều kiện PASS |
|---|---|
| Boundary proof | `git diff --name-only <baseline>` bằng đúng 33 canon files cộng workflow; không có source/test/skill/INDEX file. |
| Structure proof | Theo từng file: heading level sequence, fenced block sequence/content, rule-id sequence, inline-code multiset và Markdown link targets bằng baseline, ngoại trừ heading prose được duyệt dịch. |
| Machine-reader proof | `npm --prefix .claude test` xanh nguyên vẹn; không sửa test để hợp thức hóa bản dịch. |
| Language proof | 33 file có prose tiếng Việt; phần tiếng Anh còn lại chỉ là exact technical token, quote evidence hoặc machine anchor đã freeze. |
| Meaning proof | Review song ngữ theo từng rule xác nhận không mất chủ thể/modal/condition/exception/owner/consequence. |
| INDEX proof | `git diff --exit-code <baseline> -- '**/INDEX.*'` PASS. |

### WRITE BOUNDARY

| Included | Excluded |
|---|---|
| 33 exact canon pattern files trong Plan | Mọi `INDEX.*`; 256 pattern/lint docs đã là tiếng Việt; `.claude/sources/**`; `.claude/scripts/**`; `.claude/skills/**`; product source; generated mirror. |
| Workflow hiện tại để ghi Apply evidence | Mọi workflow khác và lịch sử cũ. |

### OUTPUTS

| Concept | Result |
|---|---|
| Revision r1 | Đã khóa một translation-only migration cho đúng 33 canon pattern, không có semantic rule change. |
| Translation contract | Tiếng Việt tự nhiên cho prose; giữ nguyên modal strength và toàn bộ vocabulary kỹ thuật có định danh. |
| Proof contract | Bất biến cấu trúc/token/link/code + canon test + INDEX diff rỗng + manual meaning parity. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/nivo/localize-patterns-lints-vi.md` | modified — appended Review r1, wording contract, exact write boundary và test obligations. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt revision `localize-patterns-lints-vi-r1` để Apply? | Khuyến nghị: **Duyệt r1** — dịch đúng 33 canon pattern, không chạm `INDEX.*` và 256 file đã Việt hóa; hoặc yêu cầu sửa revision trước khi ghi canon. |

### WARNINGS

| Warning | Impact |
|---|---|
| Exact prose từng câu chỉ xuất hiện khi Apply dịch, vì Review không tạo bản sao song song của 33 canon file. | Apply phải quay lại Review nếu một câu không thể dịch mà vẫn giữ đủ modal/condition/exception; không được tự diễn giải. |
| Ba literal tiếng Anh phải còn trong canon vì test hiện parse chúng. | 33 file sẽ không đạt “zero English token” tuyệt đối, nhưng vẫn đạt prose tiếng Việt và gate không đổi. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dịch cả literal mà test đang parse rồi sửa test theo | Giữ literal và giữ test nguyên | Yêu cầu là dịch nội dung mà không đổi hành vi gate, không phải migration parser. |
| Rephrase 256 file đã Việt hóa để đồng nhất giọng | Không chạm | Đó là editorial rewrite, vượt yêu cầu “không sửa nội dung”. |
| Bulk word replacement | Dịch theo đoạn/rule với parity check | Cùng một từ tiếng Anh có nghĩa khác nhau theo owner và modal context. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval | Người dùng trả lời `Duyệt localize-patterns-lints-vi-r1`. |
| Production translation and gates | `starci-fe-upgrade-apply` sau approval. |

## review r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\starci-academy-backend @ mtp |
| Purpose | Sửa boundary theo phản hồi: viết lại toàn bộ prose tiếng Việt Claude còn lủng củng trong patterns/lints, không chỉ dịch 33 canon tiếng Anh. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\localize-patterns-lints-vi.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\localize-patterns-lints-vi.md; chưa sửa trust source. |

Revision under review: `localize-patterns-lints-vi-r2`

Approved revision: `localize-patterns-lints-vi-r2`

### USER CORRECTION

| Người dùng sửa | Nghĩa đã hiểu lại |
|---|---|
| “Tiếng Việt nhưng do Claude viết nên rất là lỏ” | Các file đã là tiếng Việt vẫn phải được biên tập lại cho tự nhiên, mạch lạc và dễ hiểu; không được lấy presence của dấu tiếng Việt làm bằng chứng chất lượng. |
| “Không sửa nội dung” | Được sửa câu chữ và cấu trúc câu, nhưng không được sửa semantic payload của luật, ví dụ, phản biện, changelog hay lint behavior. |

### REVISED EXACT TREE

| Root | Module set | File set ngoài INDEX | Số file |
|---|---|---|---:|
| `.claude/be/patterns/` | `authorization`, `cdc`, `comments`, `cqrs`, `data-access`, `e2e-flow`, `event-delivery`, `exception-identity`, `exceptions`, `module-layering`, `naming`, `observability`, `testing`, `transport`, `type-safety` | Mỗi module: `vi.md`, `example.md`, `audit.md`, `changelog.md` | 60 |
| `.claude/be/lints/` | Cùng 15 module BE ở trên | Mỗi module: `vi.md`, `example.md`, `audit.md`, `changelog.md` | 60 |
| `.claude/be/canon/patterns/` | Cùng 15 module BE ở trên | `<module>.md` | 15 |
| `.claude/fe/patterns/` | `cache-key`, `comments`, `contract`, `file-layout`, `icon`, `landmark`, `lint-adoption`, `lint-escape-hatch`, `loading`, `naming`, `props-and-slots`, `served-locale`, `the-split`, `tokens`, `translation`, `type-safety`, `typography`, `vendor-boundary` | Mỗi module: `vi.md`, `example.md`, `audit.md`, `changelog.md` | 72 |
| `.claude/fe/lints/` | `comments`, `contract`, `file-layout`, `icon`, `landmark`, `lint-escape-hatch`, `loading`, `naming`, `props-and-slots`, `served-locale`, `the-split`, `tokens`, `translation`, `type-safety`, `typography`, `vendor-boundary` | Mỗi module: `vi.md`, `example.md`, `audit.md`, `changelog.md` | 64 |
| `.claude/fe/canon/patterns/` | Cùng 18 module FE pattern ở trên | `<module>.md` | 18 |
| Tổng |  | Mọi Markdown hiện hữu trong sáu root, trừ mọi `INDEX.*` | 289 |

### VIETNAMESE EDITORIAL CONTRACT

| Phải sửa | Phải giữ |
|---|---|
| Câu dịch sát chữ nhưng trái khẩu ngữ hoặc khó hiểu | Chủ thể và hành động của luật |
| Câu quá dài, nhiều mệnh đề khiến người đọc phải đoán quan hệ | `must/never/only/may` tương ứng đúng `phải/không bao giờ/chỉ/có thể` |
| Cụm từ lai Anh–Việt không cần thiết | Identifier, API, layer vocabulary và code token trong backtick |
| Đại từ/chủ ngữ mơ hồ như “nó”, “cái này”, “thứ đó” khi có nhiều đối tượng | Điều kiện, ngoại lệ, owner, hậu quả và kết luận |
| Cách nói máy móc, tối nghĩa hoặc mang trật tự câu tiếng Anh | Rule id, thứ tự rule, section, table row và evidence identity |
| Heading prose còn tiếng Anh hoặc tiếng Việt lủng củng | Heading cấp, anchor máy đọc, file name và link target |

### IMMUTABLE CONTENT

| Nhóm | Bất biến r2 |
|---|---|
| Code | Fenced code block byte-for-byte; không dịch comment trong code. |
| Kỹ thuật | Inline code, rule id, identifier, enum, package, command, path, URL, Markdown link target và exact error/lint message không đổi. |
| Evidence | Source quote của người dùng, historical rejection wording, ngày/version và measured result không viết lại. |
| Cấu trúc | Frontmatter key/id/slug/title/sidebar position, heading level sequence, bảng và thứ tự section không đổi; prose value như `description` được biên tập nhưng không đổi nghĩa. |
| Parser | Giữ nguyên mọi literal test đang parse, gồm `Implementation anchors in `starci-academy-fe`:`, `| Meaning (` và `## Forbidden`. |
| INDEX | Mọi `INDEX.*` ngoài boundary và diff bắt buộc rỗng. |

### APPLY STRATEGY

| Batch | Nội dung | Checkpoint |
|---|---|---|
| 1 | 15 BE canon patterns | Structure/token/link snapshot + manual rule parity + canon tests. |
| 2 | 60 BE pattern docs | Theo từng module: `vi`, `example`, `audit`, `changelog`; kiểm rule/evidence parity. |
| 3 | 60 BE lint docs | Giữ exact lint name/message/behavior; kiểm rule mapping. |
| 4 | 18 FE canon patterns | Structure/token/link snapshot + parser anchors + canon tests. |
| 5 | 72 FE pattern docs | Theo từng module; giữ layer vocabulary và component ownership. |
| 6 | 64 FE lint docs | Giữ exact lint name/message/trigger/escape; kiểm rule mapping. |
| Final | 289-file boundary audit | INDEX diff rỗng, no out-of-boundary changes, full `.claude` tests PASS. |

### TEST OBLIGATION R2

| Proof | PASS condition |
|---|---|
| Manifest | Baseline manifest khóa đúng 289 target file và hash toàn bộ excluded `INDEX.*`. |
| Code/evidence snapshot | Code blocks, inline technical tokens, source quotes, rule ids, dates/versions và link targets không đổi. |
| Structure snapshot | Frontmatter keys/identity, heading levels, section/table order và rule count không đổi. |
| Semantic review | Mỗi rule/lint giữ nguyên subject, modal, condition, exception, owner, trigger, escape và consequence. |
| Language review | Không còn câu tiếng Việt tối nghĩa do dịch sát chữ; câu có chủ ngữ rõ và quan hệ nguyên nhân–kết quả đọc một lần hiểu được. |
| Canon suite | `npm --prefix .claude test` PASS mà không sửa test/source để nới gate. |
| Boundary | Diff chỉ có 289 target files cộng workflow; `git diff --exit-code <baseline> -- '**/INDEX.*'` PASS. |

### OUTPUTS

| Concept | Result |
|---|---|
| Revision r2 | Mở đúng phạm vi thành toàn bộ 289 pattern/lint docs ngoài INDEX, bao gồm cả tiếng Việt Claude viết lủng củng. |
| Mục tiêu biên tập | Tiếng Việt tự nhiên, rõ chủ thể và quan hệ; semantic payload tuyệt đối bất biến. |
| Delivery shape | Chia sáu batch BE/FE canon-pattern-lint, mỗi batch có checkpoint trước khi tiếp tục. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/nivo/localize-patterns-lints-vi.md` | modified — appended Review r2 theo correction của người dùng, mở exact tree từ 33 lên 289 file. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt revision `localize-patterns-lints-vi-r2` để Apply toàn bộ 289 file? | Khuyến nghị: **Duyệt r2** — viết lại tiếng Việt cho toàn bộ patterns/lints ngoài INDEX, giữ nguyên semantics/code/token/gate; hoặc sửa boundary trước Apply. |

### WARNINGS

| Warning | Impact |
|---|---|
| Đây là khoảng 56.000 dòng tài liệu, không phải bulk translation nhỏ. | Apply phải chạy theo batch và checkpoint; một pass khổng lồ sẽ khó phát hiện semantic drift. |
| “Tiếng Việt hay hơn” là tiêu chí chủ quan nếu không khóa semantic fields. | R2 dùng subject/modal/condition/exception/owner/consequence làm parity contract, không đánh giá bằng văn phong đơn thuần. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| R1 coi 256 file đã có dấu tiếng Việt là audit-only | R2 biên tập lại toàn bộ 289 file ngoài INDEX | Người dùng: “tiếng Việt nhưng do Claude viết nên rất là lỏ”. |
| Presence của ký tự tiếng Việt làm quality gate | Đọc và sửa độ rõ nghĩa theo từng rule/lint | File có thể là tiếng Việt nhưng vẫn máy móc, lủng củng và khó hiểu. |
| Chỉ dịch 33 canon tiếng Anh | Dịch 33 canon và biên tập 256 docs tiếng Việt hiện hữu | Không giải quyết phần tiếng Việt kém chất lượng mà người dùng đang chỉ ra. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval r2 | Người dùng trả lời `Duyệt localize-patterns-lints-vi-r2`. |
| Apply 289 files | `starci-fe-upgrade-apply` theo sáu batch và toàn bộ proof contract r2. |

## apply

Applied revision: `localize-patterns-lints-vi-r2`
Baseline commit: `42f640ae`
Tracked diff: `42f640ae..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\starci-academy-backend @ mtp |
| Purpose | Biên tập tiếng Việt tự nhiên cho toàn bộ patterns/lints ngoài INDEX, giữ nguyên semantics và machine contract. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\localize-patterns-lints-vi.md |
| Language | vi |
| Phase | apply |
| Touching | 289 Markdown ngoài `INDEX.*` trong sáu root `.claude/be|fe/{patterns,lints,canon/patterns}`; workflow này để ghi proof. |

### BATCH STATUS

| Batch | Status |
|---|---|
| 1 — BE canon patterns, 15 files | In progress |
| 2 — BE patterns, 60 files | Pending |
| 3 — BE lints, 60 files | Pending |
| 4 — FE canon patterns, 18 files | Pending |
| 5 — FE patterns, 72 files | Pending |
| 6 — FE lints, 64 files | Pending |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved revision | Apply r2 đã bắt đầu với baseline commit `42f640ae`. |
| Write boundary | Đã khóa 289 file ngoài `INDEX.*`; chưa có target source thay đổi tại thời điểm ghi start. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/nivo/localize-patterns-lints-vi.md` | modified — ghi Applied revision, baseline, tracked diff, Apply context và batch status. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Người dùng đã duyệt `localize-patterns-lints-vi-r2`. |

### WARNINGS

| Warning | Impact |
|---|---|
| Bản dịch 289 file cần nhiều batch để giữ semantic parity. | Chỉ kết luận PASS sau khi đủ sáu batch và full gate. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Không có proposal nào bị reject trong Apply r2. |

### OWED

| Owed | Cleared by |
|---|---|
| Sáu batch biên tập và full proof | Diff target, snapshot invariant, `.claude` test và INDEX diff rỗng. |

## review r3

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\starci-academy-backend @ mtp |
| Purpose | Mở boundary từ patterns/lints sang toàn bộ patterns, lints và principles trong `.claude`, vẫn loại mọi INDEX.md. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\localize-patterns-lints-vi.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; target source chưa được sửa trong r3. |

Revision under review: `localize-patterns-lints-vi-r3`

### REVISED SCOPE

| Nhóm | Exact roots | File ngoài INDEX.md |
|---|---|---:|
| Patterns | `.claude/be/patterns/**`, `.claude/be/canon/patterns/**`, `.claude/fe/patterns/**`, `.claude/fe/canon/patterns/**` | 163 |
| Lints | `.claude/be/lints/**`, `.claude/fe/lints/**` | 124 |
| Principles | `.claude/fe/principles/**` | 104 |
| Tổng | Mọi `.md` có ancestor directory tên `patterns`, `lints` hoặc `principles`, trừ basename chính xác `INDEX.md` | 391 |

### BOUNDARY RULE

| Included | Excluded |
|---|---|
| 391 Markdown thuộc ba nhóm patterns/lints/principles | Tất cả `INDEX.md`, kể cả nested INDEX; mọi thư mục `.claude` khác; mọi file không phải Markdown. |
| Prose tiếng Việt do Claude viết lủng củng | ChatGPT biên tập lại cho rõ, tự nhiên và nhất quán. |
| Prose tiếng Anh còn sót trong target | ChatGPT dịch sang tiếng Việt, giữ nguyên technical tokens và parser anchors. |

### INVARIANTS R3

| Bất biến | Proof |
|---|---|
| Code fence/comment trong code | Byte-for-byte snapshot. |
| Rule/principle/lint identity | ID, tên rule, tên principle, tên lint, exact message và thứ tự không đổi. |
| Technical vocabulary | Inline code, API, class/function/type, package, path, URL, command và link target không đổi. |
| Semantics | Subject, modal, condition, exception, owner, trigger, escape, consequence và evidence không đổi. |
| Structure | Frontmatter identity, heading level, section order, table shape và row order không đổi. |
| INDEX | Mọi `INDEX.md` hash trước/sau giống nhau; diff rỗng. |

### BATCH PLAN R3

| Batch | Scope | Count |
|---|---|---:|
| 1 | BE patterns + BE canon patterns | 74 |
| 2 | BE lints | 60 |
| 3 | FE patterns + FE canon patterns | 90 |
| 4 | FE lints | 64 |
| 5 | FE principles: alignment → grid | 44 |
| 6 | FE principles: margin → typography | 60 |
| Final | All target proof + `.claude` tests | 391 |

### OUTPUTS

| Concept | Result |
|---|---|
| Revision r3 | Mở đúng phạm vi theo phản hồi: patterns + lints + principles toàn tree, trừ INDEX.md. |
| Target | 391 Markdown files được ChatGPT biên tập/dịch prose sang tiếng Việt tự nhiên. |
| Safety contract | Giữ nguyên semantics, technical tokens, structure, code và mọi INDEX.md. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/nivo/localize-patterns-lints-vi.md` | modified — ghi exact inventory 391 file và batch plan r3. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Người dùng đã trực tiếp mở rộng scope sang patterns, lints, principles và loại INDEX.md. |

### WARNINGS

| Warning | Impact |
|---|---|
| Scope tăng từ 289 lên 391 file. | Apply phải chạy sáu batch, không thể xem một vài file đại diện là hoàn tất. |
| Principles có vocabulary thị giác và quy tắc ownership riêng. | Không được dịch thành lời khuyên chung làm mất điều kiện/ngoại lệ của principle. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Chỉ tập trung `.claude/be|fe/{patterns,lints}` | Bao gồm cả canon patterns và `.claude/fe/principles` | Người dùng yêu cầu toàn bộ patterns, lints, principles. |
| Dịch INDEX.md | Giữ nguyên mọi INDEX.md | Người dùng loại INDEX.md rõ ràng. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply 391 file theo r3 | Sáu batch, invariant proof, `.claude` tests và INDEX hash proof. |

### APPROVAL

Approved revision: `localize-patterns-lints-vi-r3`

Approval basis: Người dùng đã chốt mở rộng toàn bộ `patterns`, `lints`, `principles`, loại mọi `INDEX.md` và yêu cầu thực hiện ngay.

## review r4

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\starci-academy-backend @ mtp |
| Purpose | Viết lại tự nhiên phần prose của 360 file patterns/lints/principles theo boundary r4, không đổi nghĩa. |
| Phase | review |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Language | vi |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\localize-patterns-lints-vi.md |
| Touching | Chỉ workflow này; target canon không thuộc revision r4. |

Revision under review: `localize-patterns-lints-vi-r4`

### USER CORRECTION

| Chốt mới | Boundary |
|---|---|
| Năm thư mục, 360 file `.md` | `.claude/be/patterns`, `.claude/fe/patterns`, `.claude/be/lints`, `.claude/fe/lints`, `.claude/fe/principles` |
| Bỏ qua INDEX | Loại mọi file có basename chính xác `INDEX.md`. |
| Không chạm canon | Mọi `.claude/**/canon/**` nằm ngoài revision r4, dù có tên `patterns`. |
| Viết lại tự nhiên | Prose tiếng Việt được biên tập lại rõ ràng, tự nhiên; giữ nguyên nghĩa, rule, code, token và cấu trúc. |

### EXACT INVENTORY R4

| Root | Files ngoài INDEX.md |
|---|---:|
| `.claude/be/patterns/**` | 60 |
| `.claude/fe/patterns/**` | 72 |
| `.claude/be/lints/**` | 60 |
| `.claude/fe/lints/**` | 64 |
| `.claude/fe/principles/**` | 104 |
| Tổng | 360 |

### INVARIANTS R4

| Bất biến | Proof |
|---|---|
| Nội dung kỹ thuật | Code fence, code, identifier, rule/lint/principle ID, message, link, path, command và token kỹ thuật giữ nguyên. |
| Nghĩa | Chủ thể, mức bắt buộc, điều kiện, ngoại lệ, owner, trigger, escape, consequence và evidence không đổi. |
| Cấu trúc | Frontmatter, heading level, section order, table shape và row order giữ nguyên. |
| INDEX/canon | Hash `INDEX.md` không đổi; không stage bất kỳ file canon nào. |

### APPROVAL

Approved revision: `localize-patterns-lints-vi-r4`

Approval basis: Người dùng đã chỉ rõ lại boundary 5 thư mục/360 file và yêu cầu xử lý bằng nhiều agent.

### OUTPUTS

| Concept | Result |
|---|---|
| Revision r4 | Chốt đúng 5 thư mục non-canon, tổng 360 file ngoài INDEX.md. |
| Target | Biên tập tiếng Việt tự nhiên, giữ nguyên nghĩa và machine contract. |
| Safety contract | Không stage canon, không sửa INDEX.md, không đổi code/token/structure. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/upgrade/nivo/localize-patterns-lints-vi.md` | modified — ghi correction r4, inventory 360 và proof contract. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Người dùng đã chốt boundary r4 và yêu cầu thực hiện. |

### WARNINGS

| Warning | Impact |
|---|---|
| Các file canon từng xuất hiện trong revision trước | R4 loại hoàn toàn canon khỏi write set; chỉ kiểm tra để bảo đảm không stage. |
| `.claude` bị Git ignore | Apply phải force-add đúng 360 file, không dùng `git add .`. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| 391 file gồm canon patterns | 360 file trong 5 thư mục người dùng chỉ rõ | Người dùng đã thu hẹp boundary. |
| Dịch hoặc sửa INDEX.md | Giữ nguyên mọi INDEX.md | Người dùng yêu cầu bỏ qua. |

### OWED

| Owed | Cleared by |
|---|---|
| Apply r4 | Full target structural check, INDEX exclusion check, exact force-add và commit. |

## apply r4

Applied revision: `localize-patterns-lints-vi-r4`
Baseline commit: `42f640ae`
Tracked diff: `42f640ae..worktree`

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Repo / branch | D:\Repositories\starci-academy-backend @ mtp |
| Purpose | Áp dụng bản biên tập tự nhiên cho đúng 360 file non-canon, giữ nguyên cấu trúc và nghĩa. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Language | vi |
| Phase | apply |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\nivo\localize-patterns-lints-vi.md |
| Target | 360 Markdown ngoài INDEX.md trong 5 root r4; canon excluded. |
| Touching | Chỉ 360 file r4 và workflow; không stage canon hoặc INDEX.md. |

### BATCH STATUS

| Batch | Status |
|---|---|
| 1 — BE patterns, 60 files | Complete — agent proof received |
| 2 — BE lints, 60 files | Complete — agent proof received |
| 3 — FE patterns, 72 files | Complete — agent proof received |
| 4 — FE lints, 64 files | Complete — agent proof received |
| 5 — FE principles, 104 files | Audited — Sol 6 output checked within r4 boundary |
| Final — structural, exclusion, force-add and commit proof | Complete with unrelated `.claude` test debt recorded below |

### OUTPUTS

| Concept | Result |
|---|---|
| Apply revision | `localize-patterns-lints-vi-r4` completed against the exact 360-file boundary. |
| Commit | `.claude` commit `223778d` — 214 changed files; 360-file manifest audited. |
| Canon | Excluded from write set and commit. |
| INDEX.md | Excluded from write set and commit. |

### CHANGES

| Tree | Details |
|---|---|
| `.claude/be/patterns/**` | 60 files assigned/completed. |
| `.claude/be/lints/**` | 60 files assigned/completed. |
| `.claude/fe/patterns/**` | 72 files assigned/completed. |
| `.claude/fe/lints/**` | 64 files assigned/completed. |
| `.claude/fe/principles/**` | 104 files audited for structural consistency; no INDEX staged. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | R4 đã được người dùng chốt. |

### WARNINGS

| Warning | Impact |
|---|---|
| `.claude` bị Git ignore | Commit phải stage đúng manifest bằng `git add -f`; không stage canon/INDEX. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Stage toàn bộ `.claude` | Stage đúng 360 path r4 | Tránh đưa canon/INDEX hoặc file ngoài scope vào commit. |

### OWED

| Owed | Cleared by |
|---|---|
| FE principles và final commit | Structural gates, exact staged manifest and commit `223778d`. |

### LIVE / STRUCTURAL PROOF

| Check | Result |
|---|---|
| Exact target inventory | PASS — 360 files: 60 BE patterns, 72 FE patterns, 60 BE lints, 64 FE lints, 104 FE principles. |
| Per-module shape | PASS — each module has `vi.md`, `example.md`, `audit.md`, `changelog.md`; all `INDEX.md` excluded. |
| Frontmatter | PASS — 0 malformed target files. |
| Code fence | PASS — 0 odd-fence target files. |
| Conflict markers | PASS — 0 target files. |
| Staged boundary | PASS — 214 changed target files staged; 0 INDEX, 0 canon, 0 outside-scope paths. |
| `.claude` full test | OWED — existing unrelated failures: duplicate/missing BE rules, dead canon links, incomplete `starci-fe-layer` lifecycle, and missing canon `naming.md`; not caused by staged r4 prose diff. |
