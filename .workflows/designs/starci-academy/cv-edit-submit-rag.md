<!-- starci-workflow: v2 -->

## plan

Revision: cv-edit-submit-rag-plan-r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Legacy | D:\Repositories\starci-academy @ mtp (`9a193423128efa1dc83f23ab0f79fb4ae66db847`) |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Database | PostgreSQL (`cv_blocks`, `cv_generations`, `jobs`), MinIO (CV/PDF objects), Qdrant (`cv_rag`) |
| Repo / branch | D:\Repositories\starci-academy-fe @ main (`85f4e6663dfdea68bb56eec4956cc681641afe35`); D:\Repositories\starci-academy-backend @ mtp (`7acd312a858be7ed58dc847c25ec86d801be17f8`) |
| Purpose | Khóa product flow CV edit → render/submit → RAG scoring → feedback/revision trước khi thay đổi frontend production. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\cv-edit-submit-rag.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\cv-edit-submit-rag.md; D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\cv-edit-submit-rag\r1\index.html |

### BINDING EVIDENCE

| Concern | Evidence | Kết luận product |
|---|---|---|
| Legacy editor | `CvEditorPage`, `CvEditorToolbarBar`, `CvBlocksWorkspace/*`, route `/profile/cv/[cvId]` trong legacy FE | Editor quen thuộc là full-bleed workspace: style rail, block/LaTeX edit, preview, autosave, export PDF. Direction parity-first phải giữ trật tự này. |
| Legacy upload | `CvSubmission`, `CVSubmissionForm`, `useCvSubmissionForm` | Upload là PDF tối đa 10 MB, gồm presign → PUT → xử lý; upload và process từng là hai CTA riêng. Backend hiện tại đã gom đăng ký + chấm vào `uploadCv` sau PUT. |
| Block document | `myCvBlocks`, `createCvBlocks`, `updateCvBlocks`, `renderCvBlocks` | `cv_blocks` là tài liệu editable FE-owned; render đồng bộ trả `url`, `cdnKey`, `format` và persist `.tex`/PDF key. |
| Unified CV run | `generateCv`, `reviseCv`, `uploadCv`, `myCvGenerations`, `cvGeneration` | `cv_generations` lưu cả Generated/Uploaded, mỗi generate/revise là một run mới; FE poll `Pending → Processing → Done/Failed` và đọc score/feedback/file URL. |
| RAG compose | `GenerateCvComposeStepService`, `CvRagRetrievalService` | Generate/revise lấy ba lát cắt `rubric`, `catalog`, `sample`, theo inferred level/role/tech stack. Retrieval lỗi thì compose vẫn tiếp tục. |
| RAG scoring | `CvScoringService`, `ScoreUploadedCvWorker` | Chấm generated/uploaded dùng cùng rubric; RAG rubric là advisory, không được trình bày như điều kiện bắt buộc hay citation. |
| Job pipeline | `GenerateCvStepMappingService`, `GenerateCvWorker` | Generate/revise chạy gather → compose → render → score → complete; lỗi phải kết thúc ở Failed và giữ được run cũ. |
| FE hiện tại | FE mới chỉ có public route `/profile/[username]/cv` với `ProfilePublicCvPage` | Gallery/editor/private history chưa được port; đây là net-new production tree nên cần Design Review khóa owner trước Apply. |

### BUSINESS FLOW

| Stage | User action | Backend truth | UI state |
|---|---|---|---|
| Chọn nguồn | Tạo từ hoạt động StarCi, tải PDF, hoặc sửa một CV cũ | `generateCv`, presign + PUT + `uploadCv`, hoặc `reviseCv` | generated / uploaded / revise; auth bắt buộc |
| Chỉnh | Sửa block/style/LaTeX và metadata | `myCvBlocks` + `updateCvBlocks`; autosave partial; `renderCvBlocks` compile untrusted LaTeX | loading, empty, editing, saving, saved, save failed, compile failed |
| Nộp | Tạo bản PDF và gửi chấm | Uploaded: `generateSubmitCvPresignUrl` → PUT → `uploadCv`; editor render trả `cdnKey` nhưng lineage sang `uploadCv` cần Review xác nhận | submit idle, rendering, registering, queued |
| Xử lý | Rời trang hoặc chờ | `jobId` + `cvGenerationId`; poll `cvGeneration` hoặc dùng job notification | pending, processing, reconnecting |
| Kết quả | Xem score và finding; sửa tiếp | `score`, `feedback.shortFeedback`, `templateLevel`, items severity/section/message/suggestion | done, no-feedback defensive state, failed |
| Revision | Tạo version mới từ run cũ | `reviseCv` tạo row mới, giữ `sourceCvSubmissionId`; `myCvGenerations` newest-first | version history, compare summary, retry |

### CONTRACT INVENTORY

| Owner / key | Verdict | Lý do |
|---|---|---|
| App shell + authenticated profile shell | REUSE | Navbar, auth/session và page chrome đã có; CV không cần shell riêng toàn app. |
| `profile-cv-page`, `profile-cv-paper`, `ProfileCvDocument` | REUSE giới hạn | Chỉ dùng cho public/read-only preview; contract hiện ghi rõ owner action nằm ngoài paper, không thể sở hữu editor mutable. |
| Existing button, tabs, input, async/empty/error leaves | REUSE | Các primitive/leaf đã diễn tả được control và trạng thái cơ bản. |
| `cv-workbench-page` | NEW | Chưa có owner cho mutable CV, autosave, render, submit và responsive pane composition. |
| `cv-document-rail` | NEW | Source, role, language, completeness và targeted tools là một nhóm điều khiển riêng của editor. |
| `cv-block-editor` | NEW | Block/LaTeX modes và autosave không thể đặt vào public paper. |
| `cv-run-status` | NEW | Pending/Processing/Done/Failed là state machine của backend, không phải generic toast. |
| `cv-score-panel` | NEW | Score + typed findings + suggestion là một composite kết quả có owner riêng. |
| `cv-run-history` | NEW nếu chọn C; không tạo nếu chọn A/B | Chỉ direction C đưa version history thành first-class pane; A/B có thể dùng modal/drawer/history route sau. |

### DIRECTIONS

| Direction | Product decision | Responsive decision | Trade-off |
|---|---|---|---|
| A — Legacy workbench | Style rail → block/LaTeX editor → PDF preview; autosave thụ động, `Nộp để chấm` primary; score xuất hiện trên preview sau Done. | Desktop ba vùng; mobile toggle Edit/Preview, rail đi vào disclosure. | Parity cao, nhanh cho returning user; desktop dày. |
| B — Guided pipeline | Nguồn → Chỉnh sửa → Nộp/cải thiện thành ba bước, mỗi bước một CTA. | Cùng một card tuyến tính; source cards và editor stack một cột trên mobile. | Dễ học nhất nhưng làm chậm người dùng lặp lại. |
| C — Review loop | Version history → editor → score/findings; `Nộp version mới` là primary, so sánh score là first-class. | Desktop ba pane; mobile history thành picker và score nằm dưới editor. | Mạnh cho iteration/retention nhưng dễ để score lấn át chất lượng nội dung. |

### ACCEPTANCE STATES

| State | Acceptance evidence |
|---|---|
| Auth/empty | Signed-out không thấy private CV; signed-in không có CV có ba source choices hoặc CTA tạo đầu tiên. |
| Editing | Edit block/style/LaTeX không reset focus; saving/saved/save-failed rõ; preview không giả là server PDF trước render. |
| Upload | Chỉ PDF ≤10 MB; presign, PUT, register là ba failure boundary độc lập; file lỗi giữ metadata đã nhập. |
| Submit | Disable double-submit; render/registration trả `cvGenerationId`; user được phép rời trang. |
| Processing | Pending/Processing vẫn hiện khi reload; job notification có thể tăng tốc nhưng `cvGeneration` là source of truth. |
| Done | Hiển thị score 0–100, level, short feedback, findings và suggestion; không bịa RAG citation vì API không trả citation/chunk. |
| Failed | Hiển thị errorMessage an toàn; bản nháp/run trước không bị ghi đè; có retry rõ. |
| Revision | Revision tạo row mới và giữ history; không đổi score của source run. |
| Mobile | 390 px không có horizontal workspace trap; chỉ một edit/preview/score pane chính tại một thời điểm. |

### PREVIEW TRACKING

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\cv-edit-submit-rag\r1`

Server PID: `40884`

Selected port: `8082`

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| cv-edit-submit-rag-r1 | http://127.0.0.1:8082/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\cv-edit-submit-rag\r1\index.html | `dabff5484dc900e1d786c42f68713fc59675df727cdef8b06be331e041785269` | đang chờ |

| Direction | Tab | Status |
|---|---|---|
| cv-a-legacy-workbench | `A · Legacy workbench` | đang chờ |
| cv-b-guided-pipeline | `B · Guided pipeline` | đang chờ |
| cv-c-review-loop | `C · Review loop` | đang chờ |

### PREVIEW PROOF

| Proof | Result |
|---|---|
| Client-side direction tabs | PASS — A, B, C đổi tại cùng URL, không reload. |
| State controls | PASS — editing/processing/done/failed state copy đổi theo từng direction. |
| Mobile 390×844 | PASS — app nav ẩn, Edit/Preview toggle hiện, desktop preview pane không gây horizontal trap. |
| Backend feasibility | PASS có một seam cần Review — mọi dữ liệu hiển thị đều có contract; riêng bridge `renderCvBlocks.cdnKey → uploadCv.cdnKey` chưa được mô tả là lineage chính thức. |

### OUTPUTS

| Concept | Result |
|---|---|
| Brief `cv-edit-submit-rag-plan-r1` | Khóa một luồng CV có ba nguồn, editor autosave, submit async, RAG-backed scoring, typed feedback và revision history. |
| Direction A | Parity-first legacy workbench, khuyến nghị mặc định vì giữ muscle memory và thêm submit/score đúng chỗ. |
| Direction B | Funnel ba bước, ưu tiên onboarding và mobile. |
| Direction C | Review/version loop, ưu tiên iteration và retention. |
| RAG disclosure | RAG là nền rubric/catalog/sample best-effort; UI chỉ hứa score/feedback backend trả, không hứa citation. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\cv-edit-submit-rag.md` | added — evidence, business flow, contract inventory, directions, states và preview tracking. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\cv-edit-submit-rag\r1\index.html` | added — một preview disposable có ba tab direction và state controls responsive. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn direction để chuyển sang `starci-fe-design-review` | **A — Legacy workbench (khuyến nghị):** giữ editor legacy và thêm submit/score; **B — Guided pipeline:** từng bước dễ học; **C — Review loop:** history/score là trục chính. |

### WARNINGS

| Warning | Impact |
|---|---|
| `cv_blocks` và `cv_generations` là hai ownership tree khác nhau. `renderCvBlocks` trả `cdnKey`, còn docs `uploadCv` nói key đến từ presign flow. | Design Review phải xác nhận bridge render-key → uploadCv là contract được phép; nếu không, cần route backend delta qua BE Feature Plan → Review → Apply trước FE Apply. |
| Backend không trả RAG chunks/citations trong `cvGeneration`. | Không direction nào được hiển thị “nguồn RAG đã dùng” hoặc quote rubric như dữ liệu thật. |
| FE target đang có dirty work ngoài CV và contract registry đang được sửa song song. | Plan không chạm production; Review/Apply sau phải freeze baseline và tránh nuốt dirty diff. |
| Preview dùng dữ liệu minh họa, không gọi API. | Nó chứng minh hierarchy/state feasibility, không chứng minh runtime mutation. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Biến RAG thành chatbot cạnh editor | RAG chạy nền và chỉ hiện score/feedback typed | Backend cung cấp kết quả tổng hợp, không cung cấp conversation hoặc citation cho CV pipeline. |
| Ghi đè CV/run cũ khi revise | Tạo run mới có `sourceCvSubmissionId` | Đúng entity/history semantics và giữ bằng chứng điểm trước. |
| Một nút mơ hồ “AI sửa CV” làm mọi việc | Tách targeted rewrite/tailor khỏi submit/score | Legacy và backend có mutation/state ownership khác nhau; trộn sẽ che credit, failure và persistence boundary. |

### OWED

| Owed | Cleared by |
|---|---|
| Direction được chọn | User chọn A, B hoặc C trên preview. |
| Xác nhận bridge `cv_blocks → cv_generations` | `starci-fe-design-review` đọc handler/worker và khóa reuse hoặc route một backend Feature Plan. |
| Exact component/props production boundary | `starci-fe-design-review` lập `COMPONENT DELTA` và `PROPS DELTA` từ direction đã chọn. |
| Runtime proof | Sau Review approval, Apply phải test auth, autosave, render, submit, polling/realtime, Done/Failed và mobile bằng API thật. |

## plan r2

Revision: cv-edit-submit-rag-plan-r2-selected-a

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Legacy | D:\Repositories\starci-academy @ mtp (`9a193423128efa1dc83f23ab0f79fb4ae66db847`) |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Database | PostgreSQL (`cv_blocks`, `cv_generations`, `jobs`), MinIO (CV/PDF objects), Qdrant (`cv_rag`) |
| Repo / branch | D:\Repositories\starci-academy-fe @ main (`85f4e6663dfdea68bb56eec4956cc681641afe35`); D:\Repositories\starci-academy-backend @ mtp (`7acd312a858be7ed58dc847c25ec86d801be17f8`) |
| Purpose | Ghi lựa chọn A và bàn giao brief CV edit → submit → RAG scoring sang Design Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\cv-edit-submit-rag.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\cv-edit-submit-rag.md; không sửa preview hoặc production source. |

### SELECTED DIRECTION

Selected direction: `cv-a-legacy-workbench`

Selected tab: `A · Legacy workbench`

Selection evidence: user said `ok chốt` after Plan recommended A.

Selection reason: giữ đúng muscle memory của legacy editor ba vùng, nhưng đưa submit/scoring vào một CTA rõ và hiển thị kết quả cạnh đúng bản PDF đang chấm.

| Direction | Tab | Status |
|---|---|---|
| cv-a-legacy-workbench | `A · Legacy workbench` | đã chọn |
| cv-b-guided-pipeline | `B · Guided pipeline` | đã từ chối |
| cv-c-review-loop | `C · Review loop` | đã từ chối |

### PREVIEW TRACKING

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\cv-edit-submit-rag\r1`

Server PID: `40884`

Selected port: `8082`

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| cv-edit-submit-rag-r1 | http://127.0.0.1:8082/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\cv-edit-submit-rag\r1\index.html | `dabff5484dc900e1d786c42f68713fc59675df727cdef8b06be331e041785269` | đã chốt |

### ACCEPTANCE STATES

| State | Accepted behavior for A |
|---|---|
| Editor | Desktop giữ style rail → block/LaTeX editor → PDF preview; mobile dùng Edit/Preview disclosure. |
| Save/render | Autosave draft độc lập với render PDF; save error và compile error không làm mất draft. |
| Submit | `Nộp để chấm` là primary; chặn double-submit và tạo một `cvGenerationId` mới. |
| Processing | Pending/Processing sống qua reload; có thể rời trang và quay lại. |
| Done | Score, level, short feedback và typed findings xuất hiện cạnh preview của đúng run. |
| Failed | Hiển thị lỗi an toàn, giữ nguyên draft và run trước; có retry. |
| Revision | Chỉnh theo feedback rồi nộp lại tạo run mới, không ghi đè source run. |
| RAG disclosure | Chỉ nói StarCi đối chiếu rubric/catalog/CV mẫu khi contract thực sự dùng; không hiển thị citation/chunk giả. |

### OUTPUTS

| Concept | Result |
|---|---|
| Selected direction | A · Legacy workbench (`cv-a-legacy-workbench`). |
| Product hierarchy | Editor legacy là owner; submit/scoring bổ sung vào toolbar/preview thay vì biến toàn bộ CV thành wizard hoặc score dashboard. |
| Review handoff | Brief đã đủ direction, business states và contract warning để `starci-fe-design-review` challenge exact component/props tree. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\cv-edit-submit-rag.md` | modified — ghi selected direction A, acceptance states và rejections. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã chốt direction A; Design Review sẽ xử lý seam contract trước khi xin approval revision triển khai. |

### WARNINGS

| Warning | Impact |
|---|---|
| Bridge `renderCvBlocks.cdnKey → uploadCv.cdnKey` vẫn chưa được docs backend gọi là lineage chính thức. | Design Review phải khóa reuse hoặc route backend feature; FE Apply không được tự suy diễn. |
| `cvGeneration` không trả RAG citations/chunks. | UI A chỉ hiển thị score/feedback typed, không hiển thị nguồn RAG chi tiết. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| B · Guided pipeline | A · Legacy workbench | User chốt hướng khuyến nghị sau khi xem preview; giữ parity legacy. |
| C · Review loop | A · Legacy workbench | History/score không trở thành trục chính; editor vẫn là owner. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact production component and props boundary | Chạy `starci-fe-design-review` và freeze `COMPONENT DELTA` + `PROPS DELTA`. |
| Quyết định bridge block editor sang scoring | Design Review xác nhận backend reuse hoặc route `starci-be-feature-plan`. |

## plan r4

Revision: cv-edit-submit-rag-plan-r4-concept-audit

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Legacy | D:\Repositories\starci-academy @ mtp (`9a193423128efa1dc83f23ab0f79fb4ae66db847`) |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Database | PostgreSQL (`cv_blocks`, `cv_generations`, learning attempts), MinIO, Qdrant `cv_rag` |
| Repo / branch | FE `main` @ `85f4e6663dfdea68bb56eec4956cc681641afe35`; BE `mtp` @ `7acd312a858be7ed58dc847c25ec86d801be17f8` |
| Purpose | Đánh giá sâu concept tạo CV của StarCi và sửa Guided pipeline để lời hứa UI khớp dữ liệu/provenance backend thật. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\cv-edit-submit-rag.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này và preview disposable r2; không sửa production source. |

### BINDING EVIDENCE

| Concern | Evidence | Product conclusion |
|---|---|---|
| Concept legacy | `CV-VERIFIED-TRUST-TIER-WORKFLOW.md`: CV tool free; StarCi bán trust/credibility, không bán access; trust tier từ graded activity/capstone | Lõi khác biệt hợp lý là proof-backed career document, không phải generic AI CV generator. |
| Gather truth | `GenerateCvGatherStepService` lấy profile, mọi passed milestone task, challenge score > 0, accepted coding solve và XP; revise thêm text CV cũ | Dữ liệu StarCi là bằng chứng học tập; CV cũ và `extraPrompts` vẫn self-reported. |
| Prompt boundary | Compose cấm bịa employer/date/degree/metric; RAG dùng rubric/catalog/sample best-effort | Có guardrail tốt, nhưng output không lưu provenance từng bullet và không có RAG citation. |
| Target role gap | `targetRole` được persist trong `cv_generations`, nhưng compose dùng `profile.roleTitle || Software Engineer` | UI không được hứa tailor theo target role cho tới khi BE dùng field này trong compose/RAG query. |
| Course scope gap | `courseId` được persist, nhưng gather SQL không scope theo course | CV theo track hiện có thể trộn activity ngoài track; evidence picker cần BE contract, không thể mock FE. |
| Seniority gap | Compose/score suy junior/mid/senior từ tổng XP hoặc số passed task | XP/capstone volume không chứng minh seniority nghề nghiệp; level phải là target/rubric bar do user chọn hoặc được đặt tên là CV maturity. |
| Trust versus score | `CvVerificationService` phân loại self-reported/activity-backed/capstone-verified; `CvGenerationPayload` trả AI score nhưng không trả verificationLevel | Score đánh giá chất lượng CV; verification đánh giá strength của StarCi evidence. UI phải tách nhãn và có thể cần BE query/field mới. |
| Contact gate drift | `ConsultantContactGateService` thực tế dùng verification score 100/0 với threshold 70; comment vẫn còn câu cũ về best CV score/open access | Không dùng CV AI score để giải thích unlock. Copy recruiter/contact phải theo runtime truth sau khi BE owner làm rõ wording drift. |
| Corpus quality | `cv_rag` có 3 level rubric, 17 catalog, 23 role/level samples, cleaned references; anti-pattern cấm fabrication và interview-defense yêu cầu claim defendable | Corpus đủ mạnh để nâng chất lượng wording/feedback, nhưng sample chỉ là reference và không được biến thành thành tích người học. |

### BUSINESS FLOW

| Stage | User decision | Correct product behavior | Contract status |
|---|---|---|---|
| Target | Chọn role, target level, language, optional course/JD | Đây là mục tiêu viết/chấm, không phải StarCi chứng nhận seniority | Role/metadata có field; compose chưa dùng targetRole, chưa có target-level contract/JD. |
| Evidence | Duyệt capstone/activity phù hợp; thêm CV cũ hoặc user note | Hiển thị provenance `StarCi verified/activity` và `self-reported`; không tự trộn tất cả | Gather có raw sources nhưng mutation chưa nhận evidence IDs và GraphQL chưa expose evidence set cho picker. |
| Draft | AI tạo bản nháp rồi mở legacy workbench | Mỗi claim chỉ dùng fact có trong selected evidence/source; user sửa tự do | Generate/revise + block editor khả thi; per-claim provenance chưa persist. |
| Defend | Kiểm tra claim có căn cứ, contact đủ, metric không bịa | Warning trước submit; source yếu không đổi thành verified chỉ vì AI viết lại | Cần provenance/defensibility contract nếu muốn tự động hóa; FE chỉ có thể label theo source cấp run hiện tại. |
| Score | Nộp, poll, xem score/rubric feedback | Gọi là `CV writing score`; tách khỏi trust badge; RAG không hiện citation giả | Backend hỗ trợ score/findings; verification chưa nằm trong `cvGeneration`. |
| Revision | Sửa theo finding và tạo run mới | Giữ source run, score cũ, history; compare là secondary | Backend `reviseCv` đúng semantics. |

### CONTRACT INVENTORY

| Owner / key | Verdict | Boundary |
|---|---|---|
| Guided shell `Target → Evidence → Draft → Check` | NEW FE | Thay Source-first r3 làm hierarchy; legacy editor vẫn là implementation của Draft. |
| Role/language/course metadata | REUSE WITH BACKEND FIX | Field đã tồn tại; BE phải thread `targetRole` vào compose và xác định target level. |
| Evidence inventory/selection | BACKEND FEATURE REQUIRED | Cần query user-owned eligible evidence và mutation/payload nhận selected IDs hoặc course scope. |
| Claim provenance | DEFER hoặc BACKEND FEATURE | Không được hiển thị badge per bullet nếu output chưa persist source refs. Phase 1 chỉ label source run/evidence summary. |
| `cv_blocks` workbench | REUSE/PORT LEGACY | Autosave/edit/render giữ parity; không biến thành wizard mock. |
| `cv_generations` run/score/history | REUSE | Pending/Processing/Done/Failed, typed feedback và revision đều có contract. |
| Verification badge | REUSE DOMAIN, NEW CV QUERY FIELD | Domain service có truth; private CV screen cần response field/query được BE owner duyệt. |
| RAG citations | REJECT | API không trả chunks/version; chỉ nói “đối chiếu rubric” ở mức process. |

### DIRECTIONS

| Direction | Product decision | Feasibility | Trade-off |
|---|---|---|---|
| B1 — Evidence-first (recommended) | Target → user duyệt StarCi/self-reported evidence → draft → defend/score | Cần BE feature cho evidence inventory/selection và targetRole; khớp moat nhất | Delta lớn hơn nhưng đúng concept, giảm bịa và tăng trust. |
| B2 — Role-first | Role/JD → StarCi rank evidence → tailor draft → defend | Cần thêm JD + evidence relevance ranking | Tốt cho apply-job loop; quá sớm khi evidence ranking chưa có. |
| B3 — Source-first | Generate/upload/revise → editor → submit → score như r3 | Gần contract hiện tại nhất | Dễ hiểu nhầm AI score là verification và user không biết evidence nào được chọn. |

### ACCEPTANCE STATES

| State | Acceptance evidence |
|---|---|
| No evidence | User vẫn tạo self-reported CV, nhưng UI nói rõ không có StarCi-backed claim; không khóa công cụ. |
| Mixed evidence | Capstone/activity/source CV/user notes có nhãn nguồn khác nhau; không nâng self-reported thành verified. |
| Target mismatch | Activity ngoài course/role không được tự động đưa vào; user có thể chọn thủ công với cảnh báo relevance. |
| Contact incomplete | Trước draft/submit, user được yêu cầu xác nhận contact vì gather hiện không có email/phone. |
| Generating | Hiển thị gather/compose/render/score ở mức tiến trình an toàn; RAG failure không bị trình bày như generation failure nếu backend degrade. |
| Draft editing | Legacy block/LaTeX editor thật; autosave và compile tách failure boundary. |
| Score | Label `Điểm chất lượng CV`; template level là bar chấm, không phải cấp bậc nghề nghiệp được xác minh. |
| Trust | Label riêng `Self-reported`, `Activity-backed`, `Capstone-verified`; không suy từ score. |
| Revision | Run mới giữ source lineage; score/trust của run trước không bị ghi đè. |
| Mobile | 390 px một pane chính; Target/Evidence/Draft/Check là step disclosure, không có horizontal editor trap. |

### PREVIEW TRACKING

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\cv-edit-submit-rag\r2`

Server PID: `60892`

Selected port: `8083`

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| cv-edit-submit-rag-r2 | http://127.0.0.1:8083/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\cv-edit-submit-rag\r2\index.html | `fc65b6f5f5b06018283439c277792589d96b1f35e573e23e7540d93481b81307` | đang chờ chọn refined direction |

| Direction | Tab | Status |
|---|---|---|
| cv-b1-evidence-first | `B1 · Evidence-first` | khuyến nghị |
| cv-b2-role-first | `B2 · Role-first` | đang chờ |
| cv-b3-source-first | `B3 · Source-first` | kế thừa r3 |

### PREVIEW PROOF

| Proof | Result |
|---|---|
| Client-side tabs | PASS — B1/B2/B3 đổi cùng URL; DOM snapshot xác nhận đúng hierarchy từng tab. |
| B1 product copy | PASS — score/trust/provenance/target level được tách rõ; backend gaps hiện ngay trong preview. |
| Responsive CSS | PASS tĩnh — breakpoint 760 px chuyển workspace sang một pane và cung cấp Evidence/Draft/Check toggle; runtime browser hiện tại cố định viewport 1280 nên Apply vẫn nợ proof 390 px. |
| Production boundary | PASS — chỉ workflow và disposable preview; không chạm FE/BE production. |

### OUTPUTS

| Concept | Result |
|---|---|
| Product verdict | Concept tốt nếu định vị là proof-backed career document; không đủ khác biệt nếu chỉ là AI writer + score. |
| Recommended direction | B1 Evidence-first. North star: Target → Evidence → Draft → Defend/Score → Revision. |
| Score semantics | AI/RAG score = chất lượng trình bày theo rubric; verification = strength của StarCi evidence; seniority = target bar, không suy từ XP. |
| Phase boundary | FE Review không thể Apply đầy đủ B1 trước khi BE Feature Plan khóa target role/level, evidence scope/selection và verification exposure. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/cv-edit-submit-rag.md` | modified — concept audit, backend truth gaps và refined directions. |
| `.workflows/.previews/designs/starci-academy/cv-edit-submit-rag/r2/index.html` | added — preview B1/B2/B3, score/trust/provenance hierarchy. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt refined guided direction | **B1 Evidence-first (khuyến nghị):** đúng moat và cần BE delta; **B2 Role-first:** JD/application-first, delta lớn hơn; **B3 Source-first:** ship sớm theo contract hiện tại nhưng yếu concept hơn. |

### WARNINGS

| Warning | Impact |
|---|---|
| `targetRole` và `courseId` hiện chỉ được lưu, chưa điều khiển compose/gather tương ứng | Production B1/B2 sẽ nói sai nếu FE đi trước BE. |
| Compose output không lưu per-bullet provenance | Không được render badge `verified` trên từng bullet ở phase hiện tại. |
| XP/capstone count đang suy rubric seniority | Có thể chấm sai bar và vô tình gắn mác senior cho người học chưa có kinh nghiệm nghề nghiệp. |
| Comments contact gate và runtime scoreOf đã drift | Cần backend owner sửa/khóa semantics trước khi FE viết explanatory copy. |
| Sample/RAG corpus có metric phrasing mạnh | Prompt cấm fabrication nhưng không đủ để chứng minh mỗi metric; selected evidence/provenance là guardrail cần thiết. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| “AI tạo CV từ mọi activity” mặc định | User duyệt evidence phù hợp | All-course gather làm CV loãng và khó bảo vệ claim. |
| Dùng XP suy seniority nghề nghiệp | User chọn target level/rubric bar | Learning volume không đồng nghĩa job seniority. |
| Một badge/score chung `StarCi verified CV` | Score và trust tách hai trục | Source CV/user notes vẫn self-reported; score chỉ đánh giá prose/rubric. |
| B2 Role-first làm phase đầu | B1 Evidence-first | Backend chưa có JD/ranking; evidence selection là nền bắt buộc trước. |

### OWED

| Owed | Cleared by |
|---|---|
| Refined direction selection | User chốt B1/B2/B3 trên preview r2. |
| Target role/level + evidence contract | `starci-be-feature-plan` → Review → Apply nếu chọn B1/B2. |
| Exact FE component/props tree | `starci-fe-design-review` sau khi direction và backend boundary được chốt. |
| 390 px runtime proof | FE Apply/browser proof khi production owner tồn tại; preview hiện đã có responsive CSS nhưng runtime browser không resize. |

## plan r5

Revision: cv-edit-submit-rag-plan-r5-selected-b1

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
| Repo / branch | FE `main` @ `85f4e6663dfdea68bb56eec4956cc681641afe35`; BE `mtp` @ `7acd312a858be7ed58dc847c25ec86d801be17f8` |
| Purpose | Ghi lựa chọn B1 Evidence-first và route backend evidence contract trước Design Review FE. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\cv-edit-submit-rag.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này; không sửa preview hoặc production source. |

### SELECTED DIRECTION

| Direction | Status | Evidence |
|---|---|---|
| B1 · Evidence-first (`cv-b1-evidence-first`) | đã chọn | User: `B1, sau đó chạy Backend Feature Plan cho evidence contract trước Design Review FE.` |
| B2 · Role-first | đã từ chối | Không chọn; JD/ranking là phase sau. |
| B3 · Source-first | đã từ chối | Không chọn; contract hiện tại dễ ship hơn nhưng yếu concept/provenance. |

### PREVIEW TRACKING

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\cv-edit-submit-rag\r2`

Server PID: `60892`

Selected port: `8083`

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| cv-edit-submit-rag-r2 | http://127.0.0.1:8083/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\cv-edit-submit-rag\r2\index.html | `fc65b6f5f5b06018283439c277792589d96b1f35e573e23e7540d93481b81307` | đã chốt B1 |

### DIRECTIONS

| Direction | Tab | Status |
|---|---|---|
| cv-b1-evidence-first | `B1 · Evidence-first` | đã chọn |
| cv-b2-role-first | `B2 · Role-first` | đã từ chối |
| cv-b3-source-first | `B3 · Source-first` | đã từ chối |

### OUTPUTS

| Concept | Result |
|---|---|
| Selected direction | B1 Evidence-first: Target → Evidence → Draft → Defend/Score → Revision. |
| Phase routing | Chạy `starci-be-feature-plan` cho evidence contract trước `starci-fe-design-review`. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/starci-academy/cv-edit-submit-rag.md` | modified — ghi B1 selection và backend-first routing. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | B1 và thứ tự backend-first đã được user chốt. |

### WARNINGS

| Warning | Impact |
|---|---|
| FE Design Review chưa được chạy ngay | Exact FE component/props boundary chỉ khóa sau khi Backend Feature Review chốt contract. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| B2 · Role-first | B1 · Evidence-first | User chọn B1. |
| B3 · Source-first | B1 · Evidence-first | User chọn B1. |

### OWED

| Owed | Cleared by |
|---|---|
| Backend evidence contract | `starci-be-feature-plan` → Review → Apply. |
| Exact FE tree | `starci-fe-design-review` sau backend contract. |

## plan r3

Revision: cv-edit-submit-rag-plan-r3-selected-b

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Legacy | D:\Repositories\starci-academy @ mtp (`9a193423128efa1dc83f23ab0f79fb4ae66db847`) |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Database | PostgreSQL (`cv_blocks`, `cv_generations`, `jobs`), MinIO (CV/PDF objects), Qdrant (`cv_rag`) |
| Repo / branch | D:\Repositories\starci-academy-fe @ main (`85f4e6663dfdea68bb56eec4956cc681641afe35`); D:\Repositories\starci-academy-backend @ mtp (`7acd312a858be7ed58dc847c25ec86d801be17f8`) |
| Purpose | Đổi lựa chọn từ A sang B và khóa Guided pipeline làm direction bàn giao sang Design Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\cv-edit-submit-rag.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\cv-edit-submit-rag.md; không sửa preview hoặc production source. |

### SELECTED DIRECTION

Selected direction: `cv-b-guided-pipeline`

Selected tab: `B · Guided pipeline`

Selection evidence: user said `guide first cũng dc` after hearing the current scoring flow and the block-editor/scoring seam.

Selection reason: ưu tiên giúp người mới hiểu nguồn CV, bước chỉnh sửa và thời điểm bắt đầu chấm trước; legacy workbench vẫn được tái sử dụng bên trong bước Chỉnh sửa thay vì làm entry surface.

| Direction | Tab | Status |
|---|---|---|
| cv-a-legacy-workbench | `A · Legacy workbench` | đã từ chối |
| cv-b-guided-pipeline | `B · Guided pipeline` | đã chọn |
| cv-c-review-loop | `C · Review loop` | đã từ chối |

### PREVIEW TRACKING

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\cv-edit-submit-rag\r1`

Server PID: `40884`

Selected port: `8082`

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| cv-edit-submit-rag-r1 | http://127.0.0.1:8082/ | D:\Repositories\starci-academy-backend\.workflows\.previews\designs\starci-academy\cv-edit-submit-rag\r1\index.html | `dabff5484dc900e1d786c42f68713fc59675df727cdef8b06be331e041785269` | đã chốt |

### ACCEPTANCE STATES

| State | Accepted behavior for B |
|---|---|
| Step 1 — Nguồn | Một lựa chọn rõ giữa tạo từ StarCi, tải PDF và sửa CV cũ; metadata role/language/prompt được giữ khi file lỗi. |
| Step 2 — Chỉnh sửa | Tái sử dụng block/LaTeX editor và preview của legacy; autosave/save error/compile error độc lập; user có thể quay lại đổi nguồn mà không mất draft đã persist. |
| Step 3 — Nộp/chấm | Chỉ một CTA primary; render/upload/register không bị gom thành trạng thái giả duy nhất và chặn double-submit. |
| Processing | Pending/Processing sống qua reload; user có thể rời flow, quay lại từ history và tiếp tục đúng run. |
| Done | Score, level, short feedback và typed findings xuất hiện trước CTA sửa tiếp/tạo revision. |
| Failed | Hiển thị failure boundary đúng bước, giữ source/draft/run trước và có retry. |
| Revision | `Sửa theo góp ý` đưa user về Step 2 với source run đã chọn; nộp lại tạo run mới. |
| Mobile | Stepper cuộn ngang gọn; mỗi bước một cột; editor Step 2 dùng Edit/Preview toggle ở 390 px. |
| RAG disclosure | Step 3 giải thích StarCi đối chiếu rubric; catalog/sample chỉ được nói trong generate/revise; không bịa citations. |

### OUTPUTS

| Concept | Result |
|---|---|
| Selected direction | B · Guided pipeline (`cv-b-guided-pipeline`). |
| Entry hierarchy | Nguồn → Chỉnh sửa → Nộp và cải thiện; mỗi bước có một quyết định chính. |
| Legacy parity | Legacy workbench không bị bỏ; nó trở thành implementation của Step 2 thay vì entry surface. |
| Review handoff | Design Review phải khóa route/step ownership, state persistence và bridge render-key → scoring. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\starci-academy\cv-edit-submit-rag.md` | modified — đổi selected direction từ A sang B và ghi acceptance states Guided pipeline. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã đổi và chốt direction B; Review sẽ challenge exact boundary trước implementation approval. |

### WARNINGS

| Warning | Impact |
|---|---|
| `guide first` không cho phép làm wizard chỉ có mock state. | Step 2 vẫn phải port editor legacy thật; Step 3 vẫn phải dùng state machine backend thật. |
| Bridge `renderCvBlocks.cdnKey → uploadCv.cdnKey` chưa được docs backend gọi là lineage chính thức. | Design Review phải khóa reuse hoặc route backend feature; FE Apply không tự suy diễn. |
| Backend không trả RAG citations/chunks. | Guided copy chỉ nói mục đích xử lý, không hiển thị nguồn/citation giả. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| A · Legacy workbench là entry surface | B · Guided pipeline | User: `guide first cũng dc`; ưu tiên hướng dẫn trước rồi mới mở editor. |
| C · Review loop | B · Guided pipeline | Version/score không phải entry hierarchy; review là kết quả ở Step 3. |

### OWED

| Owed | Cleared by |
|---|---|
| Exact route, step owner, component and props boundary | Chạy `starci-fe-design-review` và freeze `COMPONENT DELTA` + `PROPS DELTA`. |
| State persistence khi back/forward/reload giữa ba bước | Design Review khóa URL/state ownership và acceptance proof. |
| Quyết định bridge block editor sang scoring | Design Review xác nhận backend reuse hoặc route `starci-be-feature-plan`. |
