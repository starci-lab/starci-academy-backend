<!-- starci-workflow: v2 -->

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-backend / mtp @ 7acd312a858be7ed58dc847c25ec86d801be17f8 |
| Purpose | Đề xuất bảng canon quyết định khi nào dùng text-base, text-sm và text-xs. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\typography-rank-table.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\upgrade\starci-academy\typography-rank-table.md |

Window: toàn bộ workflow của app starci-academy đến 2026-08-15.

### Evidence group: body-title rank

| The refusals | What the rules said at the time | What they should have said | Where it belongs |
|---|---|---|---|
| dashboard-content-typography.md, REJECTED: “Mixed default text-base and explicit text-sm” và “Heavy long-copy treatment” | typography.md định nghĩa md/sm/xs nhưng im lặng về điều kiện chọn md hay sm cho title trong card/list | text-base chỉ dành cho title ngắn, dominant của card lớn; title compact, repeated hoặc dài dùng text-sm font-medium | .claude/fe/canon/patterns/typography.md |
| course-detail-content-typography.md, REJECTED: “text-base/semibold signal values and plain long module titles” | TYPE-7 chỉ giới hạn text-xs; chưa phân loại title accordion và signal | Accordion/row/compact fact dùng text-sm; title dùng medium, body dùng normal | .claude/fe/canon/patterns/typography.md |
| dashboard-identity-stats-typography.md, REJECTED: “Nhãn text-base, giá trị text-xs” | Canon chưa nói hai peer facts trong DailyStats/IdentityStats cùng rank nào | Peer facts compact dùng text-sm; tone/weight tạo phân cấp mà không nhảy cỡ | .claude/fe/canon/patterns/typography.md |

Machine-check verdict: WATCHED, không đề xuất lint. “Dominant”, “large card”, “repeated” và “long” là ngữ nghĩa bề mặt; suy từ class hoặc hover sẽ tạo false positive.

### OUTPUTS

| Concept | Result |
|---|---|
| Body-title rank table | Đề xuất một bảng phân biệt dominant card title, compact/long title, body, peer fact và caption. |
| Hover criterion | Hover chỉ chứng minh interaction, không tự cấp text-base. |
| Heading boundary | Page/section headings tiếp tục dùng Heading level, không nhập vào body-title table. |

### CHANGES

| Tree | Details |
|---|---|
| .workflows/upgrade/starci-academy/typography-rank-table.md | added — evidence, proposal và write boundary. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Proposed wording | User đã nói “ok chốt” sau phản biện: text-base cho dominant large-card title; text-sm medium cho compact/long title; text-sm normal cho content; hover không quyết định rank. |

### WARNINGS

| Warning | Impact |
|---|---|
| Existing canon already reserves Heading levels and text-xs muted captions. | Bảng mới phải bổ sung, không thay thế hai luật đó. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dùng hover làm điều kiện bắt buộc cho text-base | Dùng semantic dominance; hover chỉ là interaction cue | Hover và typography trả lời hai câu hỏi khác nhau. |
| Thêm lint suy đoán card lớn/quan trọng | Canon prose + examples | Máy không có đủ ngữ nghĩa để kiểm tra trung thực. |

### OWED

| Owed | Cleared by |
|---|---|
| Review wording, home, test obligation và write boundary | starci-fe-upgrade-review. |
