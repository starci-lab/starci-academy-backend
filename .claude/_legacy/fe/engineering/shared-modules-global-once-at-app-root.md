# Concept — Module HẠ TẦNG/DÙNG CHUNG đăng ký GLOBAL đúng 1 LẦN ở app root; feature module KHÔNG import lại

> Heuristic engineering NestJS (họ `concepts/*`, backend). Thầy chốt 2026-07-01: *"import tất cả ở app đi"* — sau khi phát hiện `RagModule` bị import lẻ ở 5 feature module + `LangchainModule` (vốn đã global) còn bị import thừa ở 1 module → "logic lệch lệc kiểu chắp vá".

## Quy tắc (STRICT)
- **Mọi module HẠ TẦNG / DÙNG CHUNG (Langchain · Qdrant · Rag · Cache · Crypto · Filesystem · databases · Winston · Github · GoogleApis…) đăng ký GLOBAL đúng 1 LẦN ở APP ROOT** (`apps/core/src/app.module.ts`) bằng `XModule.register({ isGlobal: true })`. Đó là **1 nguồn** khai báo.
- **Feature / processor / bussiness module KHÔNG import lại module đã global.** Inject thẳng service nó export (`EmbeddingModelService`, `GradingRetrievalService`, `QdrantClient`…) vào constructor — Nest resolve global, khỏi khai `imports`. Nếu module không còn dep cục bộ nào → **bỏ luôn mảng `imports`** (đừng để `imports: []` mồ côi hay import thừa).
- **Đừng đăng ký global cùng 1 ConfigurableModule ở NHIỀU chỗ** (app root + InitModule + feature module). Mỗi lần `.register()` tạo 1 DynamicModule mới → trùng provider / 2 instance / khó lần. Gom về **1 lần ở app root**.

## Vì sao
- `ConfigurableModuleClass.register({ isGlobal: true })` ở app root làm mọi provider export của module đó **injectable toàn app** — feature module KHỎI import. Import lại = thừa (module đã global) HOẶC tạo instance cục bộ thứ 2 (khi import plain-class dùng default `isGlobal:false`) → 2 bản của cùng service.
- **Triệu chứng "chắp vá":** cùng 1 nhu cầu mà chỗ import `XModule`, chỗ không (vì X vốn global) → đọc ra "lệch/vá". Chuẩn hoá: X global 1 lần ở app root → **mọi feature module giống nhau** (không import X).
- **Cách kiểm 1 module đã global chưa:** grep `XModule.register` ở `apps/*/src/app.module.ts` xem có `isGlobal: true`. Có → mọi `imports: [XModule]` ở feature là thừa, xoá. Hoặc: 1 service của X đã được inject ở 1 module KHÁC mà module đó không import X (vd `LessonRagIndexService` inject `EmbeddingModelService` mà module chỉ import `RagModule`) = bằng chứng X đang global.

## Thêm 1 module dùng chung mới
1. Khai `@Module({ providers, exports })` + `extends ConfigurableModuleClass` (để `.register()` nhận `isGlobal`).
2. Đăng ký **1 lần** ở app root: `XModule.register({ isGlobal: true })`.
3. Feature module cần service của X → **inject thẳng**, KHÔNG thêm `imports: [XModule]`.
4. Chỉ app KHÁC (cli/backup/mock/tools) mới phải tự đăng ký nếu nó dùng X — nhưng đa số infra chỉ chạy ở `apps/core`.

## Phân biệt
- Khác [[no-barrel-imports]] (đó là FE, cấm barrel `export *`). Đây là **BE NestJS module wiring** — cấm re-import module đã global.
- Module CÓ TRẠNG THÁI per-scope / cần config KHÁC nhau theo nơi dùng → mới cân nhắc import cục bộ (hiếm; hầu hết infra service stateless → global 1 lần là đúng).

## Áp đầu (2026-07-01) — RagModule → global at app root
- **`apps/core/src/app.module.ts`:** thêm `RagModule.register({ isGlobal: true })` (cạnh Langchain/Qdrant/Cache).
- **Bỏ import lẻ `RagModule`** ở 5 module: `process-git-submission` · `process-google-docs-submission` · `review-milestone-task` (3 grade-step processor) · `content-ai` (bussiness) · `init` (bỏ `RagModule.register` global trùng trong `InitModule`).
- **Bỏ `LangchainModule` thừa** ở `process-google-docs-submission.module` (Langchain vốn đã `isGlobal: true` ở app root; grade-step sau refactor RAG cũng hết dùng `EmbeddingModelService` trực tiếp).
- Kết quả: `RagModule` global 1 lần; mọi processor grade-step inject `GradingRetrievalService` global, không module nào import RagModule. tsc sạch (0 lỗi mới), 16/16 test grade-step pass.
- Đi kèm refactor tách biz↔RAG (grade-step chỉ gọi `GradingRetrievalService.retrieveGradingExcerpt`, RAG lo chunk/embed/retrieve).
