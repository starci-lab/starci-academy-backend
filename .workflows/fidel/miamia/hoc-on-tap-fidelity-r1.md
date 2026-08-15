<!-- starci-workflow: v2 -->
# Học & ôn tập — fidelity r1

## start

Session id: `hoc-on-tap-fidelity-r1`

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ `a662e371e2e073fcabfda650ce999ce8abe65dd4` + Study worktree; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | So khớp toàn luồng Study vừa Apply với direction A r2 đã duyệt và sửa ngay các lệch nhỏ có bằng chứng |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\hoc-on-tap-fidelity-r1.md |
| Language | vi |
| Phase | start |
| Touching | Workflow này; `src/app/[lang]/(app)/study/**`; `src/components/pages/Study*/**`; `src/components/blocks/study/**`; `src/components/layouts/MiaMiaAppLayout/**`; Study rows trong contracts/messages/hooks/GraphQL docs/tests đã duyệt |

### BINDING EVIDENCE

| Field | Value |
|---|---|
| Expected result | Direction A r2: Study landing ưu tiên Học tiếp, có catalogue tìm chủ đề riêng, detail và phrase practice dùng dữ liệu thật |
| Approved evidence | `D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-on-tap.md` — `hoc-on-tap-review-r1` và Apply result |
| Live origin | `http://localhost:3070` |
| Routes | `/vi/study`; `/vi/study/explore`; `/vi/study/topics/ordering-food`; `/vi/study/topics/ordering-food/practice` |
| Frozen states | locale `vi`; light theme; anonymous discovery và authenticated test persona; topic seed `ordering-food` |
| Viewports | desktop `1440×900`; mobile CSS `390×844` |
| Comparison identity | FE baseline `a662e37` + current Study worktree; BE contract `a486a58` |

### OUTPUTS

| Concept | Result |
|---|---|
| Fidelity Học & ôn tập | Session đã mở; chuẩn so sánh là A r2 đã duyệt và production runtime `localhost:3070` |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\hoc-on-tap-fidelity-r1.md` | added — khóa session, binding evidence, route/state/viewport và source boundary |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không cần approval để đo và sửa lệch nhỏ trong Study boundary đã duyệt |

### WARNINGS

| Warning | Impact |
|---|---|
| Study source hiện nằm trong worktree sau baseline, chưa có final commit | Mọi fidelity diff phải được đọc theo identity `a662e37..worktree`, không theo `HEAD..worktree` riêng lẻ |
| Full-suite FE và lint mirror có nợ ngoài Study đã ghi ở Design Apply | Không tự mở rộng Fidelity để sửa debt không liên quan |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Chưa có feedback bị bác trong session này |

### OWED

| Owed | Cleared by |
|---|---|
| Capture/đo lại bốn route và hai viewport | Browser runtime proof trong cùng session |
| User acceptance | Feedback xác nhận của thầy sau khi xem correction |
| Closing proof | `starci-fe-fidelity-end`, sau đó `starci-fe-fidelity-finality` khi thầy muốn đóng |

## feedback r1

Session id: `hoc-on-tap-fidelity-r1`

Session status: open

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | FE `codex/miamia-thi-thu` @ `a662e371e2e073fcabfda650ce999ce8abe65dd4` + Study worktree; BE `main` @ `a486a58856206d1dc8e9d36a562cc371670763d2` |
| Purpose | Sửa hydration mismatch của Study landing và khôi phục hero-first hierarchy theo A r2 |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\hoc-on-tap-fidelity-r1.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow này; `src/components/blocks/study/StudyContinue/index.tsx`; `src/components/blocks/study/StudyProgress/index.tsx`; Study home contract trong `src/components/contracts/index.ts`; Study skin trong `src/app/globals.css` |

### FEEDBACK CLASSIFICATION

| Item | Class | Evidence | Action |
|---|---|---|---|
| Fresh navigation đổi số CTA/stat children giữa SSR và restored client session | within-boundary | Console báo React hydration mismatch và diff React-Aria ids trong `study-resume-hero`/`study-progress-card` | Giữ first client tree ở pending cho tới mount, chỉ sau đó query/render guest hoặc authenticated state |
| Landing production là hai neutral peer cards, không có hero-first hierarchy A r2 | within-boundary | So ảnh production `/vi/study` với proposal `http://127.0.0.1:8081/` | Đưa Study về một reading column và skin `study-resume-hero` bằng accent-soft + heading weight/scale |
| “Sắp tới/Ôn nhanh” trong proposal | new-finding | Backend/Review hiện không có owner hoặc query contract cho next review item | Không dựng fixture; giữ ngoài correction này |

### PROOF

| Gate | Result |
|---|---|
| Fresh desktop landing | PASS — authenticated session restore; hero “Tiếp tục chủ đề gần nhất” full-width; progress theo sau; không console error |
| Hydration | PASS — tab fresh sau correction không còn hydration mismatch; chỉ còn hai warning `PressResponder` từ shared navigation |
| Mobile landing | PASS — `390×844`, `scrollWidth=375`, không overflow; hero/progress đúng source order; footbar hiện đúng |
| Mobile catalogue | PASS — `390×844`, hai topic thật hiển thị; search/filter/cards không overflow; không console error |
| Focused Study tests | PASS — 9 files, 9 tests |
| Typecheck | PASS — `npm run typecheck` |
| ESLint source | PASS — `npx eslint .`; 0 error, warning cấu hình React version lịch sử |
| Production build | PASS — `npm run build`; đủ bốn Study routes |

### OUTPUTS

| Concept | Result |
|---|---|
| Stable Study hydration | SSR và first client render cùng một pending tree; session thật chỉ thay state sau mount |
| A r2 hero hierarchy | Học tiếp là pink primary sticker chiếm trọn reading width; tiến độ là evidence surface phía sau |
| Responsive parity | Desktop dùng sidebar, mobile dùng footbar; catalogue và landing không overflow |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\miamia-fe\src\components\blocks\study\StudyContinue\index.tsx` | modified — gate query và visible state bằng mounted boundary để ổn định SSR/client tree |
| `D:\Repositories\miamia-fe\src\components\blocks\study\StudyProgress\index.tsx` | modified — giữ pending tree qua hydration trước khi hiện guest/authenticated progress |
| `D:\Repositories\miamia-fe\src\components\contracts\index.ts` | modified — Study home dùng một hero-first reading column thay vì hai peer columns |
| `D:\Repositories\miamia-fe\src\app\globals.css` | modified — MiaMia Study hero dùng accent-soft, display heading mạnh theo approved preview |
| `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\hoc-on-tap-fidelity-r1.md` | modified — append feedback classification, corrections và proof |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Correction nằm hoàn toàn trong Study boundary và binding A r2 đã duyệt |

### WARNINGS

| Warning | Impact |
|---|---|
| Shared navigation còn warning HeroUI `PressResponder was rendered without a pressable child` | Không làm hỏng Study/hydration; owner ngoài Study boundary, cần fidelity/audit riêng |
| Proposal có “Sắp tới/Ôn nhanh” nhưng backend chưa có owner | Không được dựng giả trong Fidelity; landing hiện chỉ dùng capability thật |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Dựng fixture cho “Sắp tới/Ôn nhanh” | Chỉ giữ resume và progress response-backed | Fidelity không mở capability hoặc dữ liệu giả |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance cho hero/hydration correction | Thầy xác nhận giao diện hiện tại đạt |
| Closing proof và related-bug scan | `starci-fe-fidelity-end` sau khi thầy muốn chốt session |
| Final closure | `starci-fe-fidelity-finality` sau End |
