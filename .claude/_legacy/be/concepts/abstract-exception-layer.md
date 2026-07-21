# Concept — Abstract exception layer

> `src/modules/exceptions/errors/<domain>/` — mọi giá trị `throw` trong `src/` + `apps/` PHẢI extend `AbstractException`, mang `code` ổn định + `metadata` có cấu trúc → Sentry/log group được, caller `instanceof`-match được.

- **STRICT — cấm 2 thứ**: `throw new Error("...")` VÀ Nest built-in `*Exception` (`BadRequestException`, `ForbiddenException`, `NotFoundException`, `UnauthorizedException`, `ConflictException`, `HttpException`…) — không có `code` ổn định, không group log/Sentry, GraphQL transform interceptor không map đẹp.
- Mỗi tình huống lỗi = 1 exception riêng (vd `ActivitySelfReactionException` thay vì `ForbiddenException`). Thêm mới: `interface XMetadata extends AbstractExceptionMetadata` + `class extends AbstractException` truyền `code` ổn định vào `super()`, export ở `errors/<domain>/index.ts`.
- Domain thật (35+ folder): `ai/ ai-lab/ api/ backup/ cache/ cli/ coding/ community/ courses/ daily-quest/ discussion/ execa/ flashcard/ init/ job/ job-postings/ kafka/ keycloak/ league/ membership/ mixin/ notification/ pagination/ payment/ profile/ rag-playground/ rewards/ s3/ session/ socketio/ stdlib/ streak/` …
- Ngoại lệ raw `new Error()` chỉ hợp lệ trong helper normalize lỗi (biến `unknown` catch thành `Error`) — normalize **1 lần** tại catch site, không guard lặp ở mọi consumer.
- ⚠️ Nợ kỹ thuật: nhiều handler cũ (purchase-ai, course-enroll, sandbox-repo-url, github-oauth, keycloak-auth, nowpayments…) vẫn dùng Nest built-in exception — code MỚI không theo, gặp khi sửa thì migrate.
- GraphQL/REST surfacing qua [[envelope-response-shape]]; log qua [[observability-sentry-winston]].

> Nguồn: `src/modules/exceptions/`
