# Plan soạn Challenge - RBAC & Guards

> Rules: `.rules/challenges/base.md` + `.rules/challenges/fullstack/{1-easy,2-medium,3-hard}.md`.

## Bài học dạy gì
- ***RBAC*** (Role-Based Access Control); `@Roles()` decorator + `RolesGuard`.
- Reflector đọc metadata từ handler/class.

---

## EASY (bắt buộc)
- **Context:** App `SchoolPortal`. 3 role: `student`, `teacher`, `admin`. Endpoint `GET /grades` (student/teacher/admin), `POST /grades` (teacher/admin), `DELETE /grades/:id` (admin).
- **Requirements:** `@Roles('admin')` decorator, `RolesGuard` dùng `Reflector`; JwtAuthGuard chạy trước; role trong JWT payload.
- **Submission:** 1 `githubUrl`.
- **Prompt binary:**
  - Gọi `DELETE` với role `student` -> 403 shape chuẩn; role `admin` -> 200: có/không.
  - `RolesGuard` chỉ đọc metadata qua `Reflector.getAllAndOverride` (class + method): có/không.
  - Order guard đúng: `JwtAuthGuard` trước `RolesGuard`: có/không.
- **Bẫy strict:** role check bằng `if (user.role === 'admin')` trong controller -> **0 toàn challenge**.

---

## MEDIUM
- **Context:** **Resource-level authorization**: user chỉ update được `Grade` của lớp mình dạy; dùng ***CASL*** hoặc tự viết `PolicyGuard` với `@CheckPolicies(ability => ability.can('update', grade))`. Hỗ trợ role hierarchy (admin > teacher > student).
- **Edge case:** teacher của lớp A sửa grade lớp B -> 403; admin sửa mọi lớp -> 200.
- **Submission:** 1 `githubUrl`. Test ≥ 5 case ma trận (role x owner/non-owner x action).
- **Bẫy strict:** check ownership sau khi đã fetch entity nhưng không rollback nếu fail -> OK nếu read; nhưng ví dụ `DELETE` thì phải check trước.

---

## HARD
- **Context:** Production-grade: **ABAC** (Attribute-Based) với policy engine (***OPA*** / ***Cerbos*** integration) - policy viết trong file .rego hoặc .cerbos.yaml, service query engine để quyết định allow/deny. **Policy cache** (in-memory, invalidate on change), **audit** mọi deny decision.
- **Benchmark:** 10k auth decision/s, p99 < 5ms với cache hit; cache miss p99 < 20ms.
- **Submission:** 1 `githubUrl` + docs policy examples.
- **Bẫy strict:** tự viết policy engine kiểu `eval()` string -> **0 toàn challenge** (security fail). Không có audit deny -> **0 prompt audit**.

---

## Checklist
- [ ] `easy` có `@Roles` + `RolesGuard` via Reflector, order guard đúng.
- [ ] `medium` có resource-level + policy + test matrix.
- [ ] `hard` có OPA/Cerbos integration + cache + audit + benchmark.
- [ ] Score 20 / 40 / 60.
