# Audit code-style: BE Exceptions

Rubric: `d/Repositories/starci-claude-canon/patterns/be/exceptions.md`
Scope quét: `src/` (toàn bộ), đối chiếu luật "LUÔN AbstractException".

## Findings

| file:line | rule vi phạm | trích | fix |
|---|---|---|---|
| `src/features/api/core/http/mount/foundations/mount-foundations.service.ts:28` | Luật 2 — cấm Nest built-in exception trong `src/features/api/**` | `throw new NotFoundException()` | Đổi thành 1 domain exception mới, vd `MountFoundationsFileNotFoundException extends AbstractException` (đặt tại `src/modules/exceptions/errors/mixin/` hoặc domain phù hợp), truyền `HttpStatus.NOT_FOUND` làm arg 4 nếu muốn giữ 404 |
| `src/features/api/core/http/mount/foundations/mount-foundations.service.ts:37` | Luật 2 — cấm Nest built-in exception trong `src/features/api/**` | `throw new NotFoundException()` | Cùng fix như trên (context filesystem không tồn tại) |
| `src/features/api/core/http/mount/foundations/mount-foundations.controller.ts:55` | Luật 2 — cấm Nest built-in exception trong `src/features/api/**` | `throw new NotFoundException()` (trong `catch` block khi đọc file lỗi) | Cùng fix — dùng lại domain exception ở trên thay vì bắt lỗi rồi ném Nest built-in |

## Kiểm tra sạch (không vi phạm)

- `throw new Error(...)` trong code chạy thật: **0** chỗ (chỉ còn trong `*.spec.ts` mock) — đúng luật 1.
- `throw new AbstractException(...)` trực tiếp (không qua subclass): **0** chỗ — đúng luật ("không throw base trực tiếp").
- Nest built-in exception (`BadRequestException`, `NotFoundException`, `UnauthorizedException`, `ForbiddenException`, …) trong `src/features/tools/**` (7 file) và `src/features/mock/**` (5 file): có dùng nhưng đây là nợ cũ đã được rule cho phép ("Nợ cũ chỉ còn ở `features/mock` + `features/tools` — đừng thêm mới") → không tính là vi phạm mới, không đưa vào bảng.
- Sample anatomy (`course-not-found.ts`, `installment-plan-not-found.ts`, `flashcard-card-not-found.ts` mẫu chuẩn): đúng đủ 4 phần — metadata interface extends `AbstractExceptionMetadata`, constructor destructure object, code SCREAMING_SNAKE + suffix `_EXCEPTION`, message tiếng Anh có id liên quan.

## Tổng

**3 vi phạm** (cùng 1 nguồn: module `mount-foundations` mới, chưa migrate sang `AbstractException`), mức độ **nhỏ** (2 file, ném lỗi 404 static-file — không ảnh hưởng domain logic, dễ sửa bằng 1 exception class mới). Toàn bộ phần còn lại của `src/modules/**` và `src/features/api/**` tuân thủ luật throw AbstractException.
