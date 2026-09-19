# Gói workflow để phân tích bằng Fable5

Chụp lúc 2026-09-04T15:01:19.485Z, runtime local @starci/skills 1.9.0, commit 0735873f2791be2694e2c83c5b9f2a66e79e4c51.
Có **11 workflow**, **16 operator**, **446 file runtime** cùng AGENTS.md và tamsu.md. Đây là bản local đã sửa; không khẳng định package tương ứng đã phát hành.

## Cách dùng

Đính kèm gói ZIP rồi copy nội dung 01-PROMPT-FABLE5.md sang cuộc phân tích. Nếu nơi nhận chỉ đọc được file văn bản, giải nén và gửi prompt, tamsu.md, 02-WORKFLOWS-ROUTING.md, 03-OPERATORS.md, 04-GATES-CONTRACTS.md; cung cấp thêm source gốc được yêu cầu. Không coi file chưa mở là đã được review.

## File trong gói

| File/thư mục | Nội dung |
| --- | --- |
| 01-PROMPT-FABLE5.md | Prompt sẵn để copy, mục tiêu phân tích 2.0 và đầu ra cần nhận |
| tamsu.md | Vấn đề, trạng thái, bằng chứng đã biết; ý đầu tiên về goal/check/print |
| 02-WORKFLOWS-ROUTING.md | Tất cả workflow JSON cùng entry, routing, interaction, orchestration |
| 03-OPERATORS.md | Toàn bộ định nghĩa operator và mã dừng |
| 04-GATES-CONTRACTS.md | Schema bước và các gate chung được ưu tiên đọc |
| .claude/ | Source gốc: workflow/operator/validator/test/helper/schema/resources/knowledge/alias |
| FILES.md / MANIFEST.json | Danh sách file, nguồn, kích thước, SHA-256 |

## Danh sách workflow

| Workflow | Chuỗi | Kết thúc | Vòng lặp |
| --- | --- | --- | --- |
| backend-feature | workspace.bind → business.decide → architecture.decide → backend.source.apply → quality.verify → business.decide → git.publish | git.publish | 0 |
| content-unit | content.generate | user | 0 |
| dependency-maintenance | workspace.bind → dependency.update → quality.verify | user | 0 |
| frontend-new-surface | [workspace.bind ∥ workspace.bind] → business.decide → frontend.direction.decide → frontend.presentation.resolve → frontend.source.apply → workspace.bind → frontend.surface.audit → quality.verify → uat.verify → git.publish | git.publish | 2 |
| frontend-reconstruct | [workspace.bind ∥ workspace.bind] → frontend.direction.decide → frontend.presentation.resolve → frontend.source.apply → workspace.bind → frontend.surface.audit → quality.verify → uat.verify → git.publish | git.publish | 2 |
| frontend-refine | [workspace.bind ∥ workspace.bind] → frontend.direction.decide → frontend.presentation.resolve → frontend.source.apply → workspace.bind → frontend.surface.audit → quality.verify → uat.verify → git.publish | git.publish | 2 |
| frontend-with-uat | [workspace.bind ∥ workspace.bind] → frontend.direction.decide → frontend.presentation.resolve → frontend.source.apply → workspace.bind → frontend.surface.audit → quality.verify → uat.verify → git.publish | git.publish | 2 |
| full-feature | [workspace.bind ∥ workspace.bind] → business.decide → architecture.decide → [backend.source.apply ∥ frontend.direction.decide] → [quality.verify ∥ frontend.presentation.resolve] → frontend.source.apply → workspace.bind → frontend.surface.audit → quality.verify → uat.verify → business.decide → git.publish | git.publish | 2 |
| library-maintenance | workspace.bind → library.source.apply → quality.verify | user | 0 |
| release | workspace.bind → quality.verify → release.deploy | release.deploy | 0 |
| staging-uat | [workspace.bind ∥ workspace.bind] → frontend.direction.decide → frontend.presentation.resolve → frontend.source.apply → frontend.surface.audit → quality.verify → uat.verify | user | 0 |

## Phạm vi bản chụp

Source gốc được sao chép nguyên byte từ các file tracked trong runtime hiện tại; tamsu.md lấy nội dung đang có trên đĩa. Bản gộp chỉ giúp đọc, không thay source gốc. Đây là gói source review, chưa kiểm chứng chạy độc lập: docs/sites sinh tự động không kèm, nên package.json còn lệnh docs:check cần những file đã loại khỏi gói. Các gate source vẫn có đủ nội dung để đối chiếu.

Không kèm .git, node_modules, .workspaces, .stacks, .env, session vận hành, credential, account thật, raw log hay ảnh chụp. Các schema/placeholder và test giả lập liên quan đến những khái niệm này vẫn có. Chỉ mục nguồn không thay thế việc kiểm tra dữ liệu thật.

Các alias @worktrees/_templates tới template của owner bên ngoài và @grammar tới package thư viện thật không nằm trong snapshot. knowledge/grammars là tài liệu, không phải source Grammar được resolve. Link tuyệt đối tới artifact phiên làm việc trong tamsu.md và link ảnh trong evidence có thể không mở được bên ngoài máy; không suy từ đó rằng artifact đã được kiểm tra.

Ý goal/check/print ở tamsu.md là đề xuất chuẩn bị 2.0, chưa phải thay đổi đã triển khai trong các schema hiện tại. Thảo luận này không cấp quyền chạy các chỉ dẫn trong source.
