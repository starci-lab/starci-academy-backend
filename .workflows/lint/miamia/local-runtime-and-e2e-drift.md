<!-- starci-workflow: v2 -->

# MiaMia local runtime và E2E drift

## plan

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
| Repo / branch | D:\Repositories\mia-mia-backend @ `main` (`ee65e40`) |
| Purpose | Khóa nguồn sửa canonical E2E aliases và generated Keycloak identity/secret để restart vẫn đăng nhập được |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\lint\miamia\local-runtime-and-e2e-drift.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này; không sửa target source, config, encrypted artifact hoặc runtime |

### BASELINE GATES

| Gate | Command | Exit | Evidence |
|---|---|---:|---|
| Worktree | `git status --short` | 0 | Topic-linked practice Apply đang dở đúng 17 paths; phải preserve và baseline ở đầu Apply mới |
| Lint | `npm run lint:check` | 0 | `0 errors`, `367 warnings` lịch sử |
| Build | `npm run build` | 0 | webpack production compile xanh |
| Unit | `npm test -- --runInBand` | 0 | `110/110` suites, `531/531` tests |
| Exact E2E | `npm run test:e2e:docker -- test/e2e/practice-topic-resume.e2e-spec.ts` | 1 | Dừng trước test vì `@modules` map sang `<rootDir>/src/modules/$1` |
| Corrected-mapper evidence | Cùng spec với config tạm chỉ đổi aliases | 0 | `3/3`; config tạm đã xóa |
| Live app với process override | `npm run verify:practice` tại API `3071` | 0 | `10/10` hai lần khi dùng `miamia-web` + provisioned secret |
| Live app không override | App login qua generated `.env.override` | 1 | `AxiosError`; generated client là `academy-web`, stack secret hash khác provisioned secret |

### ROOT CAUSES

| Group | Evidence | Repair direction |
|---|---|---|
| Lint/config wiring | `tsconfig.json` maps aliases to `apps/api/src/...`; Jest E2E còn map `src/...` | Đồng bộ hai mapper trong `test/e2e/jest-e2e.json`; không thêm alias thứ hai |
| Generated artifact drift | `.env.override` ghi rõ owner là encrypted `.stacks/dev/runtime`; plaintext source hiện có `KEYCLOAK_CLIENT_ID=academy-web` | Đổi encrypted env authority sang `miamia-web`, rồi regenerate thay vì sửa `.env.override` tay |
| Secret owner split | App mặc định đọc `.stacks/dev/runtime/files/keycloak-client-secret.key`; provisioner chỉ ghi `.gitmounts/data/terraform/...`; hai SHA-256 khác nhau | Chốt `.stacks` là owner; provisioner cập nhật encrypted twin và plaintext runtime copy mà không log secret |
| Legacy provision defaults | Script mặc định Keycloak `4008`, redirect/origin `4000/4001`, cuối cùng bảo sửa `.env.override` tay | Resolve host ports từ root `metadata.json` (`8151`, `3070`, `3071`) và bỏ manual generated-file instruction |
| Pre-existing source state | Current HEAD là baseline cũ `ee65e40`, implementation topic practice còn ở worktree | Apply mới phải commit toàn bộ trạng thái này trước write; không reset/squash/drop |

### CANDIDATE TREE

| Action | Exact path | Responsibility |
|---|---|---|
| MODIFY | `test/e2e/jest-e2e.json` | Map `@modules` và `@features` đúng `apps/api/src/...` |
| MODIFY | `.stacks/dev/runtime/env/services.env.enc` | Encrypted authority đặt `KEYCLOAK_CLIENT_ID=miamia-web` |
| MODIFY | `.stacks/dev/runtime/files/keycloak-client-secret.key.enc` | Encrypted authority chứa đúng secret của client `miamia-web`; diff không lộ plaintext |
| MODIFY | `scripts/provision-keycloak.ts` | Dùng metadata ports/origins; ghi client secret qua stack-secret encryption và phục hồi runtime plaintext; không ghi legacy owner hoặc log value |
| MODIFY | `.stacks/dev/runtime/env/KEYS.md` | Ghi đúng confidential client, canonical stack secret owner và provision/sync lifecycle |

Generated-but-ignored evidence sau Apply: `.stacks/dev/runtime/env/services.env`, `.stacks/dev/runtime/files/keycloak-client-secret.key`, `.env.override`. Chúng được regenerate để test nhưng không trở thành tracked change.

### REPAIR ORDER

| Order | Step |
|---:|---|
| 1 | Review encrypted-write boundary, canonical secret owner và baseline commit chứa topic-practice Apply |
| 2 | Apply commit current target state làm baseline mới trước mọi edit |
| 3 | Sửa Jest aliases; chạy exact topic/practice và progress E2E |
| 4 | Sửa provisioner/docs và encrypted service env; provision `miamia-web` để encrypted secret được cập nhật atomically |
| 5 | Chạy `npm run sync -- --quiet`; verify generated `.env.override` client ID và secret-file SHA-256 khớp provisioned runtime copy mà không xuất value |
| 6 | Restart API không process override; chạy live verifier hai lần; kiểm tra port, terminal và network |
| 7 | Chạy lint, build, full unit, exact E2E lanes và `git diff <baseline> --check` |

### CLOSURE COMMANDS

| Lane | Exact proof |
|---|---|
| Sync | `npm run sync -- --quiet` — generated files lấy đúng encrypted authorities |
| E2E capability | `npm run test:e2e:docker -- test/e2e/practice-topic-resume.e2e-spec.ts` — chạy không config tạm |
| E2E related | `npm run test:e2e:docker -- test/e2e/progress.e2e-spec.ts` |
| Static | `npm run lint:check`; `npm run build` |
| Unit | `npm test -- --runInBand` |
| Live | Restart normal `node --enable-source-maps dist/apps/api/main` không Keycloak override; `npm run verify:practice` hai lần |
| Runtime | Port `3071` listen; API stderr/network không auth/GraphQL/connection failure |
| Secret safety | Chỉ so path/hash; git diff và logs không chứa client secret plaintext |
| Diff | `git diff <baseline> --check`; exact tracked tree khớp Review |

### OUTPUTS

| Concept | Result |
|---|---|
| E2E authority | Jest E2E sẽ dùng cùng monorepo alias owner với TypeScript |
| Keycloak authority | `.stacks` encrypted artifacts là nguồn duy nhất cho client identity/secret của local MiaMia |
| Provision lifecycle | Provision → encrypt → sync → restart không cần process override hoặc sửa generated file tay |
| Closure meaning | Exact E2E và live login phải xanh sau restart bình thường, không chỉ bằng config/runtime tạm |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\lint\miamia\local-runtime-and-e2e-drift.md` | added — baseline matrix, root causes, candidate tree và closure proof |

### NEED APPROVALS

| Question | Options |
|---|---|
| Baseline của Apply mới | Khuyến nghị: commit nguyên current worktree topic-practice trước config write; hoặc dừng để thầy review/commit feature diff riêng |
| Canonical Keycloak secret owner | Khuyến nghị: `.stacks/dev/runtime/files/keycloak-client-secret.key.enc`; retire provision write vào `.gitmounts`; hoặc giữ dual-write và chấp nhận hai owner có thể drift |
| Encrypted mutation | Khuyến nghị: cho phép provisioner cập nhật tracked `.enc` bằng `stack-secret.mjs`, không log plaintext; hoặc cập nhật `.enc` thủ công mỗi lần provision |

### WARNINGS

| Warning | Impact |
|---|---|
| Provisioning gọi Keycloak admin và thay đổi local client/test account | External local runtime mutation; phải idempotent và chỉ chạy đúng `miamia` metadata/port |
| Encrypted file diff là opaque | Review dựa vào key names, hash match, sync/live proof; không thể code-review secret value |
| `npm run sync` có thể pull mounted data repo | Apply phải preserve mounted repo state và không commit unrelated mounted changes |
| Current API process đang sống nhờ Keycloak overrides | Trước fix, restart bình thường sẽ quay lại login failure |
| Root workflow validator có lỗi lịch sử | Chỉ task record này phải đạt `0` local errors; không mở cleanup ngoài boundary |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Sửa tay `.env.override` | Sửa encrypted source rồi regenerate | File generated sẽ bị ghi đè ở lần sync kế tiếp |
| Chỉ copy provisioned secret sang stack plaintext | Cập nhật encrypted twin và runtime plaintext | Sync sẽ phục hồi stale encrypted secret nếu chỉ copy plaintext |
| Giữ mapper override trong command | Sửa canonical Jest config | CI và mọi developer phải chạy exact command bình thường |
| Đưa secret value vào env/log/diff | Dùng file, SOPS và hash-only evidence | Không để credential rò qua process/log/git |

### OWED

| Owed | Cleared by |
|---|---|
| Challenge exact five-file boundary và external encrypted write | `starci-be-audit-review` |
| Explicit approval cho baseline + canonical owner + encrypted mutation | Feedback của thầy trên Review revision |
| Source/config/encrypted implementation | `starci-be-audit-apply` sau approved Review |
| Đóng topic-linked practice Apply | Exact E2E command và normal-restart live proof xanh, rồi append linked closure vào workflow feature |

## review r1

Approved revision: `local-runtime-and-e2e-drift-review-r1`

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
| Repo / branch | D:\Repositories\mia-mia-backend @ `main` (`ee65e40`) |
| Purpose | Phản biện và khóa exact repair boundary cho E2E mapper cùng Keycloak stack authority |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\lint\miamia\local-runtime-and-e2e-drift.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này và read-only evidence; chưa sửa target |

### REVIEW FINDINGS

| Finding | Evidence | Revision verdict |
|---|---|---|
| Five-file tracked boundary là đủ | Mapper, env cipher, secret cipher, provision owner và contract docs đều đã named; generated plaintext không được track | Giữ đúng 5 paths, không thêm `.env.override`, metadata hoặc lockfile |
| Provisioner phải đọc stack authority, không chỉ đổi output path | Defaults `4008`, `4000/4001`, admin fallback và legacy secret path có thể tái drift trên fresh machine | Resolve Keycloak/web/API ports từ `metadata.json`; read admin credentials từ stack files khi env absent |
| Provisioner không được lộ test password | Current log in nguyên `Learner123!` | Log chỉ “password reset”; không in password/client secret |
| Encrypted update phải fail closed | `stack-secret.mjs` đã verify `sops`, master identity, path containment và xóa plaintext source sau encryption | Provisioner gọi helper bằng `--from-file`; non-zero exit aborts; sau đó chỉ restore canonical ignored runtime plaintext |
| Không giữ dual secret owner | App config hiện mặc định stack file; live pass dùng legacy file chỉ là emergency override | Bỏ write vào `.gitmounts`; `.stacks/...key.enc` là authority duy nhất |
| Baseline không chứa unrelated unknown state | `git status` có đúng 17 entries của approved topic-practice Apply; stack/Jest/provision paths đều clean | Apply commit 17-path prior capability trước config write; không reset/squash |
| Warning policy không phải zero-warning | Baseline lint exit `0`, CI command không có `--max-warnings=0` | Closure giữ `0 errors`; 367 historical warnings không thuộc boundary |

### CLASSIFICATION

| Path | Class | Approved responsibility candidate |
|---|---|---|
| `test/e2e/jest-e2e.json` | test config defect | Đồng bộ aliases với `tsconfig.json`; không ignore/skip |
| `.stacks/dev/runtime/env/services.env.enc` | generated encrypted authority | `KEYCLOAK_CLIENT_ID=miamia-web` |
| `.stacks/dev/runtime/files/keycloak-client-secret.key.enc` | generated encrypted secret authority | Secret hiện hành của exact client; value không xuất log/diff |
| `scripts/provision-keycloak.ts` | runtime/ops source | Metadata ports, stack admin credentials, canonical encrypted secret lifecycle, sanitized logs |
| `.stacks/dev/runtime/env/KEYS.md` | contract documentation | Confidential-client và canonical-owner contract đúng source |

### FROZEN APPLY ORDER

| Order | Exact action |
|---:|---|
| 1 | Commit current 17-path topic-practice worktree làm baseline; record SHA; stack/Jest/provision files phải còn clean tại SHA đó |
| 2 | Sửa Jest aliases và chạy hai exact E2E commands ngay; không dùng config override |
| 3 | Sửa provisioner + docs; cập nhật encrypted services env bằng `stack-secret.mjs` |
| 4 | Chạy provisioner đúng local metadata; helper cập nhật secret cipher, fail nếu encryption không thành công; không log value |
| 5 | Chạy `npm run sync -- --quiet`; verify generated ID và SHA-256 equality, không cat secret |
| 6 | Rebuild; restart API bình thường, không `KEYCLOAK_CLIENT_ID`/`KEYCLOAK_CLIENT_SECRET_FILE` process override; live verifier hai lần |
| 7 | Lint, full unit, build, both E2E lanes, terminal/network scan, diff/secret scan và workflow validator |

### FROZEN CLOSURE POLICY

| Proof | Pass condition |
|---|---|
| E2E aliases | Exact npm commands exit `0`; no temporary config, skip hoặc mapper override |
| Sync repeatability | Hai lần `npm run sync -- --quiet` giữ generated client ID và secret hash ổn định |
| Secret safety | `git diff`, terminal và workflow không chứa secret/password value; only `.enc`, path và hash evidence |
| Normal restart | Process `3071` starts without Keycloak environment override |
| Auth/runtime | `npm run verify:practice` hai lần đạt `10/10`; không Axios/session/GraphQL/network error |
| Static/unit | Lint `0 errors`; build `0`; full unit `531/531` hoặc cao hơn nếu legitimate tests added |
| Diff | Chỉ 5 approved tracked paths sau new baseline; no suppression, severity change, dependency/lockfile hoặc coverage exclusion |

### OUTPUTS

| Concept | Result |
|---|---|
| Review candidate r1 | Một canonical E2E owner và một encrypted Keycloak owner; restart thường phải tự đủ cấu hình |
| Baseline decision | Prior topic-practice implementation được commit nguyên trạng trước config Apply, không lẫn stack repair |
| Security decision | Provisioner được phép cập nhật encrypted authority nhưng không được tạo dual owner hoặc in credential |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\lint\miamia\local-runtime-and-e2e-drift.md` | modified — append Review r1 candidate, exact five-file boundary và closure policy |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chốt Review revision | Khuyến nghị: duyệt `local-runtime-and-e2e-drift-review-r1` với baseline commit + stack-only secret owner + encrypted mutation; hoặc feedback một trong ba boundary decisions |

### WARNINGS

| Warning | Impact |
|---|---|
| Apply sẽ commit prior topic-practice diff trước config edit | Đây là baseline bắt buộc và làm implementation cũ thành commit; cần explicit approval |
| Local Keycloak provision là external mutation | Có thể rotate/update client secret; app chỉ restart sau khi encrypted authority và generated plaintext cùng khớp |
| Provisioner phụ thuộc SOPS master identity | Máy hiện tại đã có `sops` và master; máy thiếu identity phải fail trước khi thay canonical state |
| `.enc` diff không review được bằng plaintext | Closure dựa vào decrypt/sync/hash/live proof và scan không-rò-secret |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Giữ dual-write stack + gitmount | Stack-only canonical owner | Hai owner là nguyên nhân stale secret hiện tại |
| Chỉ đổi `academy-web` trong plaintext ignored file | Đổi encrypted env authority | Fresh clone/sync phải đúng |
| Cho provisioner tiếp tục hardcode 400x | Resolve root metadata ports | Port offset 71 là project contract hiện hành |
| Hạ/skip E2E gate | Sửa canonical mapper rồi chạy exact command | Test defect không được biến thành false green |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval revision r1 | Feedback `Duyệt local-runtime-and-e2e-drift-review-r1` |
| Baseline + exact five-file repair | `starci-be-audit-apply` sau approval |
| Linked closure cho topic practice | Append proof vào feature workflow sau normal-restart live pass |

## apply

Applied revision: `local-runtime-and-e2e-drift-review-r1`

Baseline commit: `a486a58856206d1dc8e9d36a562cc371670763d2`

Tracked diff: `a486a58..worktree`

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
| Repo / branch | D:\Repositories\mia-mia-backend @ `main` (`a486a58`) |
| Purpose | Apply canonical E2E aliases và Keycloak stack authority, rồi chứng minh restart thường không cần override |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\lint\miamia\local-runtime-and-e2e-drift.md |
| Language | vi |
| Phase | apply |
| Touching | Đúng 5 tracked target paths đã duyệt; append workflow này và linked closure workflow feature |

### BASELINE VÀ ITERATIONS

| Iteration | Result |
|---|---|
| Baseline | Commit nguyên 17-path topic-practice thành `a486a58856206d1dc8e9d36a562cc371670763d2` trước config write |
| E2E mapper | Đổi `@modules` và `@features` từ legacy `src/...` sang `apps/api/src/...`; exact commands không còn cần config tạm |
| Stack identity | Encrypted service authority sinh `KEYCLOAK_CLIENT_ID=miamia-web` |
| Secret lifecycle | Provisioner ghi qua `stack-secret.mjs`, cập nhật encrypted twin, phục hồi ignored runtime copy và không ghi owner legacy |
| Sync repeatability | `npm run sync -- --quiet` hai lần đều exit `0`; generated client ID và SHA-256 của runtime secret ổn định |
| Runtime restart | Dừng đúng PID cũ và khởi động PID `56436` bằng `node --enable-source-maps dist/apps/api/main`, không truyền Keycloak override |
| Verifier concurrency check | Hai verifier chạy song song cùng test account đạt `9/10` do tranh deterministic mastery baseline; chạy lại tuần tự hai lần đều `10/10` |

### PROOF

| Gate | Result |
|---|---|
| Exact topic E2E | PASS — `1/1` suite, `3/3` tests |
| Related progress E2E | PASS — `1/1` suite, `5/5` tests |
| Build | PASS — webpack production compile xanh |
| Lint | PASS theo policy — `0 errors`, `367 warnings` lịch sử ngoài boundary |
| Full unit | PASS — `110/110` suites, `531/531` tests |
| Live practice | PASS hai lần liên tiếp — mỗi lần `10/10`, qua sign-in, local OTP, session, write, mastery và resume |
| Runtime | PASS — port `3071` do normal-start process giữ; không có auth/session/GraphQL/network failure |
| Terminal | PASS — stderr chỉ còn `pg` deprecation warning lịch sử |
| Diff | PASS — `git diff --check a486a58`; đúng 5 tracked paths, không lockfile/suppression/severity change |
| Secret safety | PASS — client secret chỉ nằm ở encrypted authority và ignored runtime file; proof chỉ dùng path/hash, không xuất plaintext |

### OUTPUTS

| Concept | Result |
|---|---|
| E2E authority | Jest E2E dùng đúng monorepo source owner như TypeScript |
| Keycloak authority | Client `miamia-web` và secret runtime được sinh từ encrypted `.stacks`, không phụ thuộc `.gitmounts` |
| Restart contract | Sync → provision → restart thường vẫn đăng nhập và chạy practice được, không cần process override |
| Closure | Hai blocker mapper/runtime của topic-linked practice đã được xóa bằng exact E2E và live proof |

### CHANGES

| Tree | Details |
|---|---|
| `test/e2e/jest-e2e.json` | modified — map `@modules` và `@features` về `apps/api/src/...` |
| `.stacks/dev/runtime/env/services.env.enc` | modified — encrypted authority dùng `miamia-web` |
| `.stacks/dev/runtime/files/keycloak-client-secret.key.enc` | modified — canonical encrypted client secret được provision lại |
| `scripts/provision-keycloak.ts` | modified — resolve metadata ports/origins, stack credentials, encrypted secret lifecycle và sanitized logs |
| `.stacks/dev/runtime/env/KEYS.md` | modified — ghi confidential client, canonical owner và sync/provision contract thực |
| `D:\Repositories\starci-academy-backend\.workflows\lint\miamia\local-runtime-and-e2e-drift.md` | modified — append Apply evidence và closure |
| `D:\Repositories\starci-academy-backend\.workflows\feature\miamia\topic-linked-practice-session.md` | modified — append linked closure cho hai blocker ngoài boundary r2 |

### NEED APPROVALS

| Question | Options |
|---|---|
| Sau Apply | Không cần approval kỹ thuật thêm; giữ 5-file diff ở worktree để thầy review trước commit tiếp theo |

### WARNINGS

| Warning | Impact |
|---|---|
| Lint còn 367 warning lịch sử | Gate hiện hành vẫn xanh với 0 error; cleanup cần audit boundary riêng |
| `pg` phát deprecation warning khi boot | Không gây request/network failure; cần dependency/data-access audit riêng |
| `sync` báo một số required-key drift lịch sử | Không ảnh hưởng canonical Keycloak ID/secret proof; sửa manifest/sync owner phải qua Review riêng |
| `.env.override` có timestamp generated | Hash toàn file thay đổi mỗi sync; client line và secret hash mới là repeatability identity đã khóa |
| Live verifier dùng chung một deterministic test account | Không chạy nhiều verifier đồng thời; concurrency của production write đã được exact PostgreSQL E2E chứng minh riêng |
| Test password fixture đã tồn tại trong provisioner tại baseline | Apply đã bỏ log value nhưng không đổi cơ chế fixture ngoài boundary; client secret thật không xuất source, diff, terminal hoặc workflow |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mở rộng sang `sync.mjs` để sinh secret pointer | Dùng canonical default path đã có trong `config.ts` | Runtime không cần pointer; mở rộng sẽ vượt 5-file boundary |
| Sửa generated `.env.override` bằng tay | Sửa encrypted source và regenerate | Generated file không phải authority |
| Giữ dual secret owner dưới `.gitmounts` | Một encrypted owner dưới `.stacks` | Loại nguyên nhân stale sau restart |

### OWED

| Owed | Cleared by |
|---|---|
| Canonical E2E mapper | Exact topic E2E `3/3` và progress E2E `5/5` không config tạm |
| Generated Keycloak identity/secret | Sync lặp hai lần, normal restart PID `56436`, live verifier `10/10` hai lần |
| Linked topic-practice Apply closure | Apply closure event trong workflow feature cùng proof matrix |
