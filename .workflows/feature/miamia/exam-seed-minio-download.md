<!-- starci-workflow: v2 -->
# Seed đề lên MinIO và tải bằng presigned URL

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Khóa luồng seed dựng tài liệu tải, upload private lên MinIO và chỉ cấp presigned URL sau khi kiểm tra quyền tải. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\exam-seed-minio-download.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không ghi source sản phẩm trong Plan. |

### EVIDENCE

| Evidence | Result |
|---|---|
| Live schema | `http://localhost:3071/graphql` từ chối kết nối; đã fallback liệt kê toàn bộ operation folder theo skill. Không có operation cấp URL tải đề. |
| Dataset hiện tại | `.gitmounts/data/data/exams` có 36 file và tất cả đều là `en.md`; không có PDF/DOCX gắn 1:1 với 36 paper. |
| Seeder hiện tại | `ExamSeederService` gọi `importExamsDir`, chỉ upsert PostgreSQL; chưa upload artifact. |
| S3 seam | `S3UploadService.buffer`, `S3ReadService.exists` và `S3BuildService.buildSignedGetObjectUrl` đã hỗ trợ MinIO; bucket policy hiện chỉ public các prefix công khai, nên prefix đề tải phải giữ private. |
| CQRS sibling | Query mới mirror family CQRS có `query`, `handler`, handler twin, `service`, `resolver`, module và GraphQL response; không đặt nghiệp vụ trong resolver/service. |
| Quyền tải | Entitlement mua một lần đang được thêm bởi workflow PayOS r2; chỉ tier `personal` hoặc `commercial` được mint URL, Pro 49k/tháng không tự mở quyền tải. |

### PRODUCT CONTRACT

| Rule | Brief |
|---|---|
| Artifact | Mỗi paper sinh hai DOCX: bản đề không lộ đáp án và bản đáp án–giải thích. |
| Object key | `exam-downloads/<paper-slug>/<source-sha256>/de-thi.docx` và `.../dap-an-giai-thich.docx`; key theo hash cho cache/version bất biến. |
| Seed idempotency | Hash source + renderer version; nếu metadata DB khớp và cả hai object tồn tại thì bỏ qua, nếu thiếu object thì repair upload. |
| Privacy | Không thêm prefix vào public bucket policy; object chỉ đọc qua presigned GET. |
| Authorization | Bắt buộc user authenticated, paper published, entitlement lifetime `personal` hoặc `commercial`; membership Pro riêng không đủ quyền tải. |
| URL | TTL lấy từ MinIO presigned config hiện có; GET gắn `Content-Disposition: attachment` với filename tiếng Việt an toàn. |
| Failure | Không entitlement trả domain 403; paper/artifact không tồn tại không mint URL; lỗi render/upload làm seed fail rõ, không ghi metadata thành công giả. |

### PROPOSED FILE TREE

| Path | Purpose / shape owner |
|---|---|
| `apps/api/src/modules/databases/postgresql/primary/enums/exam-download-asset-kind.ts` | Enum `paper` / `answer`; contract sản phẩm. |
| `apps/api/src/modules/databases/postgresql/primary/entities/exam-download-asset.entity.ts` | Metadata artifact theo paper/kind/hash/object key/size; DATA canon. |
| `apps/api/src/modules/databases/postgresql/primary/entities/paper.entity.ts` | Thêm relation tới downloadable assets. |
| `apps/api/src/modules/databases/postgresql/primary/primary.module.ts` | Register entity đúng primary database. |
| `apps/api/src/modules/databases/postgresql/primary/migrations/1786860000000-AddExamDownloadAssets.ts` | Tạo enum/table/index/FK; migration boundary. |
| `apps/api/src/modules/exceptions/errors/exam/exam-download-asset-not-found.ts` | Domain 404 khi paper chưa có artifact seed hợp lệ. |
| `apps/api/src/modules/exam-download/exam-download-document.renderer.ts` | Parse house Markdown và dựng hai DOCX deterministic, tách answer khỏi đề. |
| `apps/api/src/modules/exam-download/exam-download-document.renderer.spec.ts` | Twin cho renderer, Unicode, thứ tự câu và không rò đáp án. |
| `apps/api/src/modules/exam-download/exam-download-asset.service.ts` | Upload/repair private MinIO, persist metadata và mint signed GET sau authorization. |
| `apps/api/src/modules/exam-download/exam-download-asset.service.spec.ts` | Twin cho hash skip, missing-object repair, upload failure, entitlement và URL. |
| `apps/api/src/modules/exam-download/exam-download.module.ts` | Export renderer/asset service trong capability hiện có. |
| `apps/api/src/modules/init/seeders/exams/exam-seeder.service.ts` | Sau DB import, materialize/upload artifact cho từng paper. |
| `apps/api/src/modules/init/seeders/exams/exam-seeder.service.spec.ts` | Chứng minh scope-off, empty, seed count và upload failure propagation. |
| `scripts/import-exams-md.ts` | Trả manifest paper gồm id/slug/source path/hash để app seeder không scan/parse lần hai. |
| `apps/api/src/modules/s3/types/build.ts` | Cho signed GET nhận filename/content-disposition server-controlled. |
| `apps/api/src/modules/s3/s3-build.service.ts` | Gắn `ResponseContentDisposition` vào `GetObjectCommand`. |
| `apps/api/src/modules/s3/s3-build.service.spec.ts` | Chứng minh bucket/key/TTL/content-disposition đúng và không public URL. |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.query.ts` | CQRS message mang request/user/locale. |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.handler.ts` | Load paper, kiểm tra entitlement + asset rồi mint URL. |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.handler.spec.ts` | Handler twin cho mọi guard và hai asset kind. |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.service.ts` | Dispatch-only service. |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.resolver.ts` | Authenticated GraphQL door. |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.module-definition.ts` | Configurable module definition. |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.module.ts` | Operation wiring. |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/graphql-types/request.ts` | `paperSlug` + asset kind input. |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/graphql-types/response.ts` | URL, filename, MIME, expiry và asset kind. |
| `apps/api/src/features/api/core/graphql/queries/exam/exam.module.ts` | Register query operation. |
| `test/e2e/exam-download.e2e-spec.ts` | GraphQL auth/entitlement/presign e2e và HTTP GET MinIO proof. |

### TEST MATRIX

| Layer | Cases |
|---|---|
| Renderer | 0 câu bị reject; Unicode giữ nguyên; câu đúng thứ tự; bản đề không chứa answer/explanation; bản đáp án chứa đủ đáp án; cùng input cho cùng bytes/hash. |
| Seed | scope off = 0 upload; empty = 0/0; new paper upload 2 object; rerun hash+objects intact = skip; metadata có nhưng object mất = repair; source đổi = key/version mới; một upload fail = không claim metadata hoàn tất. |
| Authorization | anonymous bị guard; no entitlement 403; Pro-only 403; Personal pass; Commercial pass; unknown/unpublished paper không lộ tồn tại; missing artifact 404. |
| Presign | hai kind map đúng key/filename; TTL hợp lệ; signed host là MinIO public endpoint; `Content-Disposition` attachment; object không public trực tiếp. |
| E2E | Seed fixture vào MinIO thật, mua/grant entitlement test, gọi GraphQL, GET signed URL nhận DOCX, URL hết hạn/invalid không tải được; user khác không thể mint khi chưa mua. |

### ASSUMPTIONS AND EXCLUSIONS

| Item | Decision |
|---|---|
| 100.000 đề tương lai | Thiết kế streaming/batch theo paper và hash; không gom toàn kho vào RAM, nhưng Plan chỉ proof bằng fixture nhỏ. |
| Original DOCX | Dataset canonical hiện chỉ có Markdown, nên không giả định original DOCX tồn tại. |
| White-label | Không cấp download qua White-label vì tier này chưa có SKU/entitlement backend. |
| Frontend | Không nằm trong capability này; FE gọi query sau một Review/Apply riêng nếu cần UI nút tải. |
| Bulk archive | Không tạo ZIP toàn kho trong revision này; mỗi request cấp URL cho một paper/kind. |

### OUTPUTS

| Concept | Result |
|---|---|
| Private exam artifact pipeline | Seed dựng tài liệu tải có version, upload MinIO private và repair idempotent. |
| Authorized download | Chỉ chủ sở hữu Personal/Commercial được nhận presigned GET ngắn hạn cho đề hoặc đáp án. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/miamia/exam-seed-minio-download.md` | added — brief, source evidence, exact boundary và test matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt artifact canonical từ 36 Markdown hiện có | **A (đề xuất): sinh 2 DOCX/paper: đề + đáp án–giải thích**; B: chỉ upload Markdown; C: chờ bổ sung original PDF/DOCX rồi mới seed. |
| Chốt quyền Pro 49k/tháng | **A (đề xuất): Pro không bao gồm tải kho đề**, chỉ Personal/Commercial; B: Pro cũng được tải. |
| Chốt đơn vị download | **A (đề xuất): presign từng paper/kind**, phù hợp 100.000 đề; B: tạo ZIP theo batch; C: ZIP toàn kho. |

### WARNINGS

| Warning | Impact |
|---|---|
| API port 3071 đang tắt khi Plan dump schema | Live schema phải được dump lại trước Review/Apply proof. |
| 36 source hiện chỉ là Markdown, chưa phải 100.000 artifact | Pipeline scale-ready nhưng số lượng nội dung thực tải phụ thuộc data repository được bổ sung. |
| PayOS Apply r2 đang có diff chưa hoàn tất | Apply MinIO phải dùng baseline riêng sau khi PayOS được đóng, tránh baseline chụp implementation dở. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Public bucket/prefix cho kho đề | Private objects + presigned GET | URL public sẽ bỏ qua entitlement mua gói. |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge file tree và product choices | Chạy `starci-be-feature-review` trên plan r1. |
| Production implementation và live MinIO proof | Chỉ chạy `starci-be-feature-apply` sau khi một Review revision được duyệt rõ. |

## review r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Phản biện và khóa exact production boundary cho seed artifact MinIO và query cấp presigned download. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\exam-seed-minio-download.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; Review không ghi handler, entity, migration, script hay test sản phẩm. |

### REVIEW FINDINGS

| Finding | Revision |
|---|---|
| `html-to-docx` tạo container ZIP nên không được giả định byte-for-byte deterministic | Idempotency dựa trên SHA-256 của source Markdown + hằng `rendererVersion`, không dựa trên hash output DOCX. |
| Object key chứa hash sẽ để lại version cũ không có owner cleanup | Dùng key ổn định `exam-downloads/<slug>/<kind>.docx`; source đổi thì overwrite có chủ đích, presigned URL cũ tự hết hạn. |
| HEAD hai object cho 100.000 paper mỗi startup là 200.000 network calls | Fast path chỉ đọc metadata DB và skip khi `sourceSha256 + rendererVersion` khớp; repair object thiếu nằm trong explicit seed `--verify-assets`, có concurrency hữu hạn. |
| Renderer không được launch Chromium cho từng paper | Dùng `html-to-docx` thuần buffer; xử lý từng paper và concurrency hữu hạn, không gom toàn kho vào RAM. |
| Response filename có thể gây header injection | Backend tự tạo filename ASCII-safe từ slug và gắn `attachment`; không nhận filename từ client. |
| `paper not found` và `unpublished` không được phân biệt | Reuse `PaperNotFoundException`; chỉ `ExamDownloadAssetNotFoundException` sau khi paper published + user entitled. |
| PayOS entitlement đang dở trong worktree | MinIO Apply chỉ bắt đầu sau khi PayOS r2 đã test/commit, rồi tạo baseline mới; không chụp partial implementation làm baseline. |

### FROZEN CONTRACT

| Concern | Exact rule |
|---|---|
| Canonical source | House Markdown trong mounted data repo. |
| Outputs | Hai private DOCX/paper: `paper` không answer/explanation; `answer` có đáp án và giải thích. |
| Ownership | Personal và Commercial lifetime được tải cả hai loại; Pro-only và Free không được tải. |
| Seed | Upsert DB trước, render/upload artifact theo từng paper, chỉ persist metadata sau khi cả upload tương ứng thành công. |
| Idempotency | `sourceSha256 + rendererVersion`; normal startup skip không gọi MinIO khi metadata khớp; explicit verify mode HEAD và repair missing objects. |
| Object keys | `exam-downloads/<paper-slug>/de-thi.docx` và `exam-downloads/<paper-slug>/dap-an-giai-thich.docx`. |
| Delivery | Authenticated GraphQL query nhận `paperSlug` + `kind`, trả một presigned MinIO GET; object không public. |
| Scale | Streaming/per-paper, concurrency mặc định 4 cho upload/verify; không ZIP toàn kho. |

### EXACT PRODUCTION TOUCHING

| Path | Verdict |
|---|---|
| `apps/api/src/modules/databases/postgresql/primary/enums/exam-download-asset-kind.ts` | ADD |
| `apps/api/src/modules/databases/postgresql/primary/entities/exam-download-asset.entity.ts` | ADD |
| `apps/api/src/modules/databases/postgresql/primary/entities/paper.entity.ts` | MODIFY |
| `apps/api/src/modules/databases/postgresql/primary/primary.module.ts` | MODIFY |
| `apps/api/src/modules/databases/postgresql/primary/migrations/1786860000000-AddExamDownloadAssets.ts` | ADD |
| `apps/api/src/modules/exceptions/errors/exam/exam-download-asset-not-found.ts` | ADD |
| `apps/api/src/modules/exam-download/exam-download-document.renderer.ts` | ADD |
| `apps/api/src/modules/exam-download/exam-download-document.renderer.spec.ts` | ADD |
| `apps/api/src/modules/exam-download/exam-download-asset.service.ts` | ADD |
| `apps/api/src/modules/exam-download/exam-download-asset.service.spec.ts` | ADD |
| `apps/api/src/modules/exam-download/exam-download.module.ts` | MODIFY |
| `apps/api/src/modules/init/seeders/exams/exam-seeder.service.ts` | MODIFY |
| `apps/api/src/modules/init/seeders/exams/exam-seeder.service.spec.ts` | MODIFY |
| `apps/api/src/modules/init/scope/seed-scope.service.ts` | MODIFY — expose explicit verify-assets switch. |
| `apps/api/src/modules/init/scope/seed-scope.service.spec.ts` | MODIFY |
| `apps/api/src/modules/filesystem/types/seed.ts` | MODIFY — type optional `verifyExamAssets`. |
| `scripts/import-exams-md.ts` | MODIFY — return paper manifest/source hash. |
| `apps/api/src/modules/s3/types/build.ts` | MODIFY |
| `apps/api/src/modules/s3/s3-build.service.ts` | MODIFY |
| `apps/api/src/modules/s3/s3-build.service.spec.ts` | ADD |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.query.ts` | ADD |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.handler.ts` | ADD |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.handler.spec.ts` | ADD |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.service.ts` | ADD |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.resolver.ts` | ADD |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.module-definition.ts` | ADD |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/exam-download-url.module.ts` | ADD |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/graphql-types/request.ts` | ADD |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/graphql-types/response.ts` | ADD |
| `apps/api/src/features/api/core/graphql/queries/exam/exam.module.ts` | MODIFY |
| `test/e2e/exam-download.e2e-spec.ts` | ADD |

### ACCEPTANCE PROOF

| Gate | Exact proof |
|---|---|
| Unit | Focused Jest cho renderer, asset service, seeder, seed scope, S3 builder và query handler. |
| Build/lint | Frozen repository build, typecheck và lint; không suppression/new lint error. |
| Database | Migration up/down trên PostgreSQL primary; unique `(paper_id, kind)`. |
| Runtime seed | Seed fixture lần 1 upload 2 DOCX; lần 2 skip; verify mode xóa 1 object rồi repair. |
| Live API | Login test user, no entitlement bị 403; grant Personal, gọi query cho cả hai kind và GET URL nhận DOCX bytes. |
| Privacy | Direct unsigned MinIO GET bị 403; signed URL pass; query từ user Pro-only bị 403. |

### OUTPUTS

| Concept | Result |
|---|---|
| Review revision | `exam-seed-minio-download-review-r1` khóa private DOCX pipeline, idempotency và entitlement boundary. |
| Scale correction | Normal startup không HEAD 200.000 object; verify/repair là explicit mode có concurrency hữu hạn. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/miamia/exam-seed-minio-download.md` | modified — thêm review findings, frozen contract, exact boundary và acceptance proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Duyệt format | **A (đề xuất): hai DOCX/paper**; B: Markdown; C: chờ original PDF/DOCX. |
| Duyệt entitlement | **A (đề xuất): chỉ Personal/Commercial**; B: cộng thêm Pro 49k/tháng. |
| Duyệt delivery | **A (đề xuất): từng paper/kind**; B: batch ZIP; C: ZIP toàn kho. |

### WARNINGS

| Warning | Impact |
|---|---|
| Dataset hiện có 36 Markdown | Code hỗ trợ quy mô tương lai; chưa thể chứng minh 100.000 nội dung khi data chưa tồn tại. |
| PayOS r2 chưa đóng | Apply revision này chưa được phép tạo baseline tới khi PayOS diff được hoàn tất và commit. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Output-hash làm idempotency | Source hash + renderer version | DOCX ZIP bytes không được đảm bảo deterministic. |
| Hash trong object key | Stable object key + overwrite | Tránh orphan version vô hạn. |
| HEAD mọi object mỗi startup | DB fast path + explicit verify mode | 100.000 đề không chịu được 200.000 HEAD khi restart. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval cho revision và A/A/A | User nói `Duyệt exam-seed-minio-download-review-r1, A/A/A`. |
| Apply | Hoàn tất/commit PayOS r2, tạo baseline mới, rồi chạy `starci-be-feature-apply`. |

## review r2

Approved revision: exam-seed-minio-download-review-r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Ghi nhận phê duyệt explicit A/A/A cho exact production boundary của review r1. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\exam-seed-minio-download.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; chưa ghi source sản phẩm. |

### APPROVAL

| Decision | Approved result |
|---|---|
| Format | A — sinh hai DOCX cho mỗi paper: đề và đáp án–giải thích. |
| Entitlement | A — chỉ Personal/Commercial; Free và Pro-only không được tải. |
| Delivery | A — presigned URL cho từng paper/kind; không ZIP batch/toàn kho. |

### OUTPUTS

| Concept | Result |
|---|---|
| Approved capability | `exam-seed-minio-download-review-r1` được duyệt nguyên boundary với A/A/A. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/feature/miamia/exam-seed-minio-download.md` | modified — ghi explicit approval A/A/A. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| PayOS r2 phải hoàn tất trước baseline MinIO | Bảo toàn baseline-to-worktree diff của từng capability. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| Apply approved revision | Hoàn tất PayOS r2, commit, rồi chạy `starci-be-feature-apply`. |

## apply r1

Baseline commit: `2c3a2b22ef1c717de37401c91438598ec05d8a26`.

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\mia-mia-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | miamia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | api |
| Repo / branch | D:\Repositories\mia-mia-backend @ main |
| Purpose | Apply seed 2 DOCX/paper lên MinIO private và cấp presigned URL theo Personal/Commercial entitlement. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\miamia\exam-seed-minio-download.md |
| Language | vi |
| Phase | apply |
| Touching | Đúng exact production boundary của `exam-seed-minio-download-review-r1`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Artifact pipeline | Mỗi canonical Markdown sinh hai DOCX: đề không lộ đáp án và đáp án–giải thích. |
| Scale | Normal seed dùng source hash + renderer version trong DB để skip, không HEAD 72/200.000 objects; verify mode chạy bằng `--verify-assets`, concurrency tối đa 4. |
| Privacy | Bucket policy được canonicalize chỉ public `repo/*` và `assets/*`; `exam-downloads/*` private. |
| Delivery | Authenticated Personal/Commercial nhận URL 15 phút cho từng paper/kind với filename ASCII do server tạo. |

### CHANGES

| Tree | Details |
|---|---|
| `apps/api/src/modules/databases/postgresql/primary/enums/exam-download-asset-kind.ts` | Thêm enum `paper`/`answer`. |
| `apps/api/src/modules/databases/postgresql/primary/entities/exam-download-asset.entity.ts` | Metadata object key, source SHA-256, renderer version, size và unique paper/kind. |
| `apps/api/src/modules/databases/postgresql/primary/entities/paper.entity.ts` | Thêm relation download assets. |
| `apps/api/src/modules/databases/postgresql/primary/primary.module.ts` | Register entity mới. |
| `apps/api/src/modules/databases/postgresql/primary/migrations/1786860000000-AddExamDownloadAssets.ts` | Tạo enum/table/unique/FK và down path. |
| `apps/api/src/modules/exam-download/exam-download-document.renderer*` | Render DOCX thuần buffer, giữ Unicode và tách candidate/answer content. |
| `apps/api/src/modules/exam-download/exam-download-asset.service*` | Materialize, DB fast-skip, verify/repair MinIO 404, private policy, entitlement và presign. |
| `apps/api/src/modules/init/**`, `apps/api/src/modules/filesystem/types/seed.ts` | Seed manifest theo paper, concurrency 4 và explicit `--verify-assets`. |
| `scripts/import-exams-md.ts` | Trả manifest gồm paper id, slug, source, path và SHA-256 mà không parse file lần hai. |
| `apps/api/src/modules/s3/s3-build.service*`, `apps/api/src/modules/s3/types/build.ts` | Signed GET hỗ trợ server-controlled `Content-Disposition`. |
| `apps/api/src/features/api/core/graphql/queries/exam/exam-download-url/**` | Thêm authenticated CQRS query cho một paper/kind. |
| `test/e2e/exam-download.e2e-spec.ts` | Real PostgreSQL E2E cho Free/Pro-only deny và Personal allow. |

### TEST RESULTS

| Gate | Result |
|---|---|
| Focused unit | PASS — renderer, asset, seeder, seed scope, S3 builder và handler; 17/17 trước final corrections, 11/11 focused regression sau privacy correction. |
| Full unit | PASS — 118 suites, 556 tests. |
| Exam download E2E | PASS — 2/2 trên PostgreSQL container thật. |
| Build | PASS — `nest build api`. |
| Lint | PASS — 0 error. |
| Migration | PASS — `AddExamDownloadAssets1786860000000` chạy trên PostgreSQL MiaMia local; unique `(paper_id, kind)` tồn tại. |
| First seed | PASS — 36 papers, 72 metadata rows và 72 MinIO objects. |
| Normal rerun | PASS — metadata cùng source hash/renderer version trả `skipped`, unit chứng minh không gọi MinIO HEAD. |
| Verify/repair | PASS — xóa `exam-downloads/de-so-an-giang-lan-2/de-thi.docx`, MinIO trả generic 404, service sửa và upload lại thành công. |
| Live authorization | PASS — cùng test account: trước entitlement bị deny; sau fixture Personal nhận URL cho `Paper` và `Answer`. |
| Live download | PASS — hai signed GET trả HTTP 200 và magic bytes DOCX `PK`; `Content-Disposition` là attachment với filename server-owned. |
| Privacy | PASS — unsigned GET cùng object trả HTTP 403; signed GET trả 200. |

### NEED APPROVALS

| Need | Status |
|---|---|
| None | Capability đã đủ bằng chứng local để commit. |

### WARNINGS

| Warning | Impact |
|---|---|
| Dataset hiện có 36 đề, không phải 100.000 đề. | Pipeline không gom toàn kho vào RAM và normal startup không HEAD MinIO; throughput 100.000 cần đo lại khi data thật được nhập. |
| Test account local được cấp fixture Personal để chứng minh tải thật. | Đây là state local phục vụ QA, không phải PayOS payment production. |
| PayOS live vẫn thiếu API key. | Không ảnh hưởng seed/presign; vẫn cản xác minh giao dịch tiền thật của workflow PayOS. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Bucket policy public toàn bucket đang stale | Canonical policy chỉ public `repo/*`, `assets/*` | Public toàn bucket làm unsigned exam URL trả 200 và phá entitlement. |
| Tin riêng `NoSuchKey` khi verify | Nhận cả MinIO generic `NotFound`/HTTP 404 | MinIO local trả `NotFound: UnknownError`, nếu không xử lý thì repair fail. |

### OWED

| Owed | Cleared by |
|---|---|
| Commit diff từ baseline | Commit production source sau khi record Apply này được ghi. |

Implementation commit: `8cdef704d4e18a514028c4244aa6566a09fa3626`.
