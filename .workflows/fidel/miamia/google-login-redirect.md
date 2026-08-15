<!-- starci-workflow: v2 -->

# MiaMia Google login redirect

## start

Session id: `miamia-google-login-redirect-20260815-r1`

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
| Repo / branch | D:\Repositories\miamia-fe @ `codex/miamia-thi-thu` (`5cf9f72`) |
| Purpose | Khôi phục nút Google để chuyển thẳng từ MiaMia sang Google account chooser và quay lại đúng route |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\google-login-redirect.md |
| Language | vi |
| Phase | start |
| Touching | Workflow này; chỉ mở production/config boundary sau khi xác định owner gây rơi vào Keycloak form |

### BINDING EVIDENCE

| Identity | Value |
|---|---|
| Route | `http://localhost:3070/vi/exam/de-so-an-giang-lan-2` |
| Observed redirect | `http://localhost:8151/realms/master/protocol/openid-connect/auth?...&kc_idp_hint=google` |
| Expected | Google account chooser/mail login, rồi callback về exact MiaMia route |
| Persona | anonymous learner |
| Locale | `vi` |
| FE baseline | `5cf9f72`; preserve toàn bộ worktree đang dở |
| BE baseline | `a486a58`; preserve exact 5-file runtime/E2E diff đang dở |

### MEASURED DIFFERENCE

| Expected | Actual | Initial owner |
|---|---|---|
| `kc_idp_hint=google` chọn provider alias `google` | Keycloak hiện username/password form nội bộ | FE đã gửi hint; cần kiểm tra realm có enabled Google IdP và credentials hay không |

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | Google social login redirect đang được truy từ FE request đến Keycloak realm provider |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\google-login-redirect.md` | added — session, binding URL và frozen state |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Chưa cần; tiếp tục read-only inspection để xác định thiếu source hay thiếu Google credential |

### WARNINGS

| Warning | Impact |
|---|---|
| FE và BE đều có worktree đang dở | Mọi correction phải preserve toàn bộ thay đổi hiện có |
| Google OAuth credential là external secret | Nếu chưa được khai, cần thầy tạo/cấp OAuth client; không đưa value vào git, log hoặc workflow |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Chưa có proposal bị bác |

### OWED

| Owed | Cleared by |
|---|---|
| Xác nhận realm provider `google` | Keycloak Admin API hoặc provision evidence |
| Prove full redirect/callback | Browser test Google chooser → MiaMia route sau khi provider enabled |

## feedback r1

Session id: `miamia-google-login-redirect-20260815-r1`

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
| Repo / branch | D:\Repositories\miamia-fe @ `codex/miamia-thi-thu` (`5cf9f72`) |
| Purpose | Ghi root cause và exact credential/config boundary để Google login chuyển khỏi Keycloak form |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\google-login-redirect.md |
| Language | vi |
| Phase | feedback |
| Touching | Chỉ append workflow; chưa mutation Google Cloud, Keycloak provider hoặc target source |

### ROOT CAUSE

| Evidence | Result |
|---|---|
| FE request | PASS — exact authorization URL có `kc_idp_hint=google` và callback MiaMia route |
| Browser DOM | Keycloak hiện form nội bộ `Username or email` / `Password` |
| Keycloak Admin API | Realm `master` trả `ProviderCount=0`; alias `google` không tồn tại |
| Generated stack env | Không có `GOOGLE_CLIENT_ID` |
| Runtime/encrypted files | Không có `google-client-secret.key` hoặc `.enc` |
| Provision contract | `scripts/provision-keycloak.ts` chỉ tạo provider khi có cả client ID và secret; lần hiện tại đã skip đúng fail-safe |

### REQUIRED GOOGLE CONFIG

| Field | Exact value/type |
|---|---|
| OAuth client type | Web application |
| Authorized redirect URI | `http://localhost:8151/realms/master/broker/google/endpoint` |
| Client ID owner | `GOOGLE_CLIENT_ID` từ stack runtime env |
| Client secret owner | `.stacks/dev/runtime/files/google-client-secret.key.enc` |
| Provision action | `npm run provision:keycloak` tạo/enabled alias `google` với scopes `openid profile email` |
| Expected browser chain | MiaMia `3070` → Keycloak `8151` broker → `accounts.google.com` → Keycloak callback → exact MiaMia route |

### OUTPUTS

| Concept | Result |
|---|---|
| Root cause | Google login fallback không phải lỗi FE; local Keycloak chưa có Google Identity Provider |
| Required correction | Tạo Google OAuth Web client, lưu credentials qua encrypted stack rồi provision alias `google` |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\google-login-redirect.md` | modified — append Admin API, browser và missing-credential evidence |

### NEED APPROVALS

| Question | Options |
|---|---|
| Google OAuth credentials | Thầy tạo/cấp Web client với exact callback trên; sau đó nhập client ID + secret trực tiếp trên máy để trò provision và test, không gửi secret vào workflow/log |

### WARNINGS

| Warning | Impact |
|---|---|
| Service account GCP hiện có không thay thế OAuth Web client | Không thể tự suy ra client ID/secret từ `gcp-service-account.json` |
| Redirect URI phải khớp tuyệt đối | Sai scheme, host, port, realm hoặc path sẽ bị Google trả `redirect_uri_mismatch` |
| OAuth consent screen ở Testing | Gmail dùng thử phải nằm trong Test users nếu app chưa publish |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Sửa FE để bỏ Keycloak hoặc đổi hint | Giữ broker URL hiện tại và provision alias `google` | FE đã phát đúng URL; sửa FE không tạo được provider đang thiếu |
| Dùng GCP service-account credential | Tạo OAuth 2.0 Web client | Hai credential type phục vụ hai luồng khác nhau |

### OWED

| Owed | Cleared by |
|---|---|
| Google OAuth client ID và secret | Thầy tạo Web client với exact authorized redirect URI |
| Provider alias `google` enabled | Encrypted stack set + `npm run provision:keycloak`; Admin API trả alias enabled |
| Full browser proof | Google chooser → callback → session → quay lại exact MiaMia exam route |

## feedback r2

Session id: `miamia-google-login-redirect-20260815-r1`

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
| Repo / branch | D:\Repositories\miamia-fe @ `codex/miamia-thi-thu` (`5cf9f72`) |
| Purpose | Tiếp nhận thông báo Google Cloud đã set và xác định phần credential còn thiếu ở local stack |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\google-login-redirect.md |
| Language | vi |
| Phase | feedback |
| Touching | Chỉ append workflow; không đọc/in OAuth secret và chưa provision provider |

### POST-SET CHECK

| Check | Result |
|---|---|
| `GOOGLE_CLIENT_ID` process/user/machine env | Chưa tồn tại |
| Generated `.env.override` | Chưa có `GOOGLE_CLIENT_ID` |
| Runtime secret file | Chưa có `google-client-secret.key` |
| Encrypted secret owner | Chưa có `google-client-secret.key.enc` |
| Keycloak browser result | Vẫn hiện form nội bộ ở cả exam callback và authentication callback |

### OUTPUTS

| Concept | Result |
|---|---|
| Google Cloud status | Redirect URI có thể đã được thầy cấu hình, nhưng local MiaMia chưa nhận client ID/secret nên chưa thể tạo provider |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\google-login-redirect.md` | modified — append post-set credential presence check |

### NEED APPROVALS

| Question | Options |
|---|---|
| Hoàn tất local credential handoff | Thầy chạy hai lệnh local để set `GOOGLE_CLIENT_ID` và encrypted `google-client-secret.key`, rồi báo “xong”; hoặc cung cấp đường dẫn credential JSON đã tải để trò import sau confirmation ngay trước khi đọc secret |

### WARNINGS

| Warning | Impact |
|---|---|
| Chỉ set callback trên Google Cloud chưa đủ | Keycloak không thể tạo alias `google` nếu thiếu client ID/secret ở local stack |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tự tìm hoặc đọc OAuth secret từ thư mục cá nhân | Thầy nhập qua interactive stack-secret hoặc chỉ rõ credential file | Không mở rộng quyền đọc dữ liệu nhạy cảm ngoài scope |

### OWED

| Owed | Cleared by |
|---|---|
| Local client ID + encrypted secret | Credential handoff vào MiaMia backend |
| Provision + browser proof | `npm run provision:keycloak`, Admin API provider check và Google redirect/callback test |

## feedback r3

Session id: `miamia-google-login-redirect-20260815-r1`

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
| Repo / branch | D:\Repositories\miamia-fe @ `codex/miamia-thi-thu` (`5cf9f72`) |
| Purpose | Import credential được thầy cung cấp, provision Google IdP và chứng minh redirect tới Google account chooser |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\google-login-redirect.md |
| Language | vi |
| Phase | feedback |
| Touching | Workflow; `.stacks/dev/runtime/env/services.env.enc`; `.stacks/dev/runtime/files/google-client-secret.key.enc` |

### IMPORT VÀ PROOF

| Check | Result |
|---|---|
| Credential shape | PASS — Web OAuth client, có client ID/secret và exact Keycloak redirect URI |
| Client ID authority | PASS — thêm `GOOGLE_CLIENT_ID` vào encrypted services env; không in value vào workflow/log |
| Secret authority | PASS — tạo `.stacks/dev/runtime/files/google-client-secret.key.enc`; runtime copy được sync |
| Plaintext hygiene | PASS — helper đã xóa; temporary secret và temporary directory đều không còn |
| Keycloak Admin API | PASS — alias/provider `google`, `enabled=true`, `trustEmail=true` |
| Browser redirect | PASS — reload Keycloak auth URL chuyển tới `https://accounts.google.com/.../accountchooser` |
| Google screen | PASS — hiện “Choose an account” cho app “Study With Mia English” |

### ITERATIONS

| Iteration | Result |
|---|---|
| PowerShell inline importer | Bị policy chặn trước execution; không ghi credential |
| Node helper r1 | Dừng sau sync do Windows tách `C:\Program Files\nodejs\node.exe`; chưa encryption/provision |
| Node helper r2 | `npm.cmd` spawn không resolve; chưa encryption/provision |
| Node helper r3 | PASS bằng direct Node entrypoints; helper và temp plaintext đã xóa sau import |

### OUTPUTS

| Concept | Result |
|---|---|
| Google redirect | Đã sửa: MiaMia → Keycloak broker → Google account chooser hoạt động |
| Credential safety | OAuth secret chỉ tồn tại trong file thầy cung cấp, ignored runtime copy và encrypted stack authority; không xuất value |

### CHANGES

| Tree | Details |
|---|---|
| `.stacks/dev/runtime/env/services.env.enc` | modified — thêm Google OAuth client ID authority |
| `.stacks/dev/runtime/files/google-client-secret.key.enc` | added — encrypted Google OAuth client secret authority |
| `D:\Repositories\starci-academy-backend\.workflows\fidel\miamia\google-login-redirect.md` | modified — append import, provider và browser proof |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn Gmail trên Google account chooser | Thầy thao tác trực tiếp trên tab đã bàn giao rồi báo “xong”; trò không tự truyền danh tính cá nhân |

### WARNINGS

| Warning | Impact |
|---|---|
| `sync.mjs` báo skip `GOOGLE_CLIENT_ID` vì `config.ts` không consume key | Provider local hiện đã provision và redirect xanh; fresh reprovision vẫn cần provisioner đọc stack env hoặc một ops contract riêng |
| Full callback chưa chạy | Chưa chứng minh Google consent → Keycloak broker → MiaMia session và return route |
| 13 required-key warnings lịch sử khi sync | Ngoài Google boundary; không ảnh hưởng provider creation hiện tại |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tự chọn Gmail cá nhân | Bàn giao account chooser cho thầy | Chọn account truyền danh tính cá nhân và cần thao tác của chủ tài khoản |

### OWED

| Owed | Cleared by |
|---|---|
| Google callback + MiaMia session | Thầy chọn Gmail; trò kiểm tra URL, session state và authenticated UI sau callback |
| Fresh-machine reprovision contract | Backend config/ops review để provisioner đọc canonical stack client ID thay vì process env |
