<!-- starci-workflow: v2 -->

## start

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35; D:\Repositories\starci-academy-backend / mtp @ 0a590f2b58768a3b7e4183e998470c33fc05d726 |
| Purpose | Khôi phục ảnh khóa học và bắt buộc render empty-content khi danh sách bằng 0. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-assets-and-empty-state.md |
| Language | vi |
| Phase | start |
| Touching | Courses page/list/card asset owner, empty-state branch, focused tests và workflow; không chạm AI. |

Session id: fidel-courses-assets-empty-20260815-01

Session status: open

Binding evidence: ảnh thầy gửi tại `localhost:3000/vi/courses` cho thấy cả năm thumbnail bị broken; thầy xác nhận khi có `0` khóa học phải render empty-content thay vì ẩn vùng kết quả.

Frozen state: route `/vi/courses`, origin `http://localhost:3000`, locale `vi`, dark theme trong ảnh, list view, anonymous reader; worktree FE hiện hữu được giữ nguyên.

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | Khôi phục asset URL hợp lệ và empty-content branch có chủ sở hữu rõ ràng. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/courses-assets-and-empty-state.md` | `added` — mở fidelity session và khóa hai defect. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Hai expected results đã được thầy xác nhận trực tiếp. |

### WARNINGS

| Warning | Impact |
|---|---|
| Stack vừa đổi port MinIO từ `9000` sang `9001`. | URL thumbnail persisted hoặc resolver cũ có thể vẫn trỏ origin trước khi sync. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Ẩn vùng kết quả khi danh sách rỗng | Render empty-content state | Thầy yêu cầu trạng thái rỗng phải hiện rõ. |

### OWED

| Owed | Cleared by |
|---|---|
| Root cause, production patch và focused proof | Đọc owner hiện tại, sửa nhỏ nhất và chạy tests/typecheck/live proof phù hợp. |
| User acceptance | Thầy xem lại render và xác nhận. |

## feedback

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35; D:\Repositories\starci-academy-backend / mtp @ 0a590f2b58768a3b7e4183e998470c33fc05d726 |
| Purpose | Restore course covers and prove the zero-course empty-content branch. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-assets-and-empty-state.md |
| Language | vi |
| Phase | feedback |
| Touching | Five deterministic course seed URLs in PostgreSQL, ten derived ES projections, one focused FE test, and this workflow only. |

Session id: fidel-courses-assets-empty-20260815-01

Session status: open

Binding evidence: the broken covers all used the stale `http://localhost:9000/` prefix after the stack offset moved MinIO to `9001`; the existing pure page already owns an `empty` branch and `EmptyNotice` slot.

Frozen state: `/vi/courses`, `http://localhost:3000`, locale `vi`, anonymous catalog; the user's unrelated FE and workflow changes remain untouched.

### OUTPUTS

| Concept | Result |
|---|---|
| Runtime assets | All five PostgreSQL course URLs and both five-document locale projections now use `http://localhost:9001/`. |
| Live proof | All ten projected image requests return `HTTP 200`; browser reports five course images complete with `naturalWidth: 1920`. |
| Empty state | Focused pure-page test proves the shell, search, `0 khóa học`, message and recovery action remain visible while result group and pager are absent. |

### CHANGES

| Tree | Details |
|---|---|
| PostgreSQL `courses.thumbnail_url` | `modified runtime data` — exact prefix replacement on 5 matching seed rows. |
| Elasticsearch `courses-en`, `courses-vi` | `modified derived projection` — exact prefix replacement on 10 matching documents. |
| `src/components/pages/CoursesCatalogPage/component.test.tsx` | `added` — regression proof for the zero-course EmptyNotice contract. |
| `.workflows/fidel/starci-academy/courses-assets-and-empty-state.md` | `modified` — recorded diagnosis, correction and proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| User acceptance | Reload the catalog and confirm the restored covers and empty-state contract. |

### WARNINGS

| Warning | Impact |
|---|---|
| Keycloak `8081` remains blocked by the previously recorded Docker Desktop reservation. | Does not affect public catalog/image rendering; authenticated flows still await the stack-port session resolution. |
| Vitest emits its existing Vite native-config warning; ESLint emits its existing React-version settings warning. | Both focused gates pass; neither warning comes from this patch. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hide the catalog result area at zero courses | Render `EmptyNotice` inside the retained page shell | Zero is product state, not an absent page. |
| Rewrite image URLs inside `CoverImage` | Repair persisted seed data and derived projections | The leaf must render the supplied asset, not conceal invalid backend ownership. |
| Delete volumes or full reseed | Exact reversible prefix replacement | Only deterministic stale asset origins were wrong. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Teacher reloads `/vi/courses` and confirms. |
| Fidelity End/Finality | Run only when the teacher requests end/finality for this still-open session. |

## end

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree |
| Purpose | Đóng catalog asset và empty-state fidelity. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-assets-and-empty-state.md |
| Language | vi |
| Phase | end |
| Touching | Workflow record, recorded session source boundary và final evidence only. |

Session id: fidel-courses-assets-empty-20260815-01
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Không có cover image cùng cơ chế bị vỡ trong live catalog. | Source scan, focused tests và localhost closure proof | not-a-bug | None |
| Owed ngoài production boundary | None — user chốt closure. | new-boundary | None |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | fidel-courses-assets-empty-20260815-01 tại FE baseline 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree. |
| Current proof | CoursesCatalogPage focused test đạt; live catalog có 6 ảnh hoàn tất và 0 ảnh vỡ; public catalog trả 200. |
| Shared gates | TypeScript pass; 14 focused files / 50 tests pass; Next production build pass. |
| Whole-suite audit | 630/645 tests pass; 15 failures được phân loại là concurrent stale tests/environment ngoài session boundary. |

### CHANGES

| Tree | Details |
|---|---|
| Session production boundary | Giữ nguyên correction đã được feedback chấp nhận; End không mở rộng source. |
| Workflow | Append proof, related-bug classification và closure readiness. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã chốt closure run cho toàn bộ fidelity sessions. |

### WARNINGS

| Warning | Impact |
|---|---|
| Whole-repo ESLint quét cả artifacts và mirror đang có 104 lỗi ngoài boundary | Focused lint/proofs đã đạt; không sửa artifacts hoặc concurrent lint source trong Finality. |
| Workflow validator có legacy schema errors | Closure record mới vẫn giữ đủ canonical tables; trust-tree cleanup thuộc Upgrade boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mở rộng End sang lỗi concurrent | Route theo owning capability | End chỉ sửa same-boundary regression và không chiếm work của session khác. |

### OWED

| Owed | Cleared by |
|---|---|
| None — user chốt closure. | None |
| Session closure | Fidelity Finality ngay sau End theo yêu cầu đã chốt. |

## finality

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
| Repo / branch | FE main @ 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE mtp @ 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree |
| Purpose | Finalize fidel-courses-assets-empty-20260815-01 sau End proof đã được user chốt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\courses-assets-and-empty-state.md |
| Language | vi |
| Phase | finality |
| Touching | Workflow record và final evidence only; không production correction. |

Session id: fidel-courses-assets-empty-20260815-01
Session status: finalized
Session finalized: fidel-courses-assets-empty-20260815-01
Final diff identity: FE 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree.

### OUTPUTS

| Concept | Result |
|---|---|
| Closure | Session finalized sau current End evidence. |
| Accepted | Toàn bộ feedback cuối cùng và superseding corrections trong record. |
| Routed | None — user chốt closure. |
| Continuation | Feedback mới phải mở Fidelity Start mới với Continuation of: fidel-courses-assets-empty-20260815-01. |

### CHANGES

| Tree | Details |
|---|---|
| Workflow | Added immutable Finality closure identity. |
| Production | None — Finality không sửa source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã nói “ok chốt đi”. |

### WARNINGS

| Warning | Impact |
|---|---|
| Linked owed không bị tuyên bố hoàn thành | None |
| Concurrent whole-repo failures vẫn được giữ nguyên | Không làm sai lệch focused proof của session này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Append feedback vào session đã finalized | Mở linked continuation session | Finality đóng vĩnh viễn session id này. |

### OWED

| Owed | Cleared by |
|---|---|
| None — user chốt closure. | None |
