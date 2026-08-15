<!-- starci-workflow: v2 -->

## start

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Backend `D:\Repositories\starci-academy-backend` / `mtp`; Frontend `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Chuẩn hóa toàn bộ StarCi port mapping về base chuẩn cộng offset 1 và restart runtime. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\port-offset-runtime.md |
| Language | vi |
| Phase | start |
| Touching | metadata.json, env bridge sinh tự động, workflow fidelity; runtime StarCi FE/BE/Compose |

Session id: fidel-port-offset-runtime-20260815-01

Session status: open

Binding evidence: thầy xác nhận StarCi phải dùng base port chuẩn với `portOffset: 1`; vì vậy Keycloak phải là `8080 + 1 = 8081`.

Comparison identity: `metadata.json` là nguồn sự thật duy nhất; mọi `ports.<name>` phải bằng `basePorts.<name> + portOffset`.

Baseline commit: backend `0a590f2b58768a3b7e4183e998470c33fc05d726`; frontend `85f4e6663dfdea68bb56eec4956cc681641afe35` với worktree hiện hữu được giữ nguyên.

### OUTPUTS

| Concept | Result |
|---|---|
| Active correction | Đưa StarCi về offset `+1`, đồng bộ env và restart đúng stack. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/port-offset-runtime.md` | `added` — mở fidelity session và khóa bằng chứng port. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Không cần; thầy đã xác nhận offset `+1` và Keycloak `8081`. |

### WARNINGS

| Warning | Impact |
|---|---|
| `miamia-fe` đang chiếm `localhost:3000`. | Phải dừng đúng process MiaMia trước khi khởi động StarCi FE; không thay đổi source MiaMia. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Ngoại lệ StarCi Keycloak `8089` | Base Keycloak `8080` cộng offset `1` thành `8081` | Thầy yêu cầu mọi mapping theo rule offset chung. |

### OWED

| Owed | Cleared by |
|---|---|
| Port map, env bridge, stack/runtime và OAuth proof | Sửa metadata, sync, restart không xóa volume và kiểm tra live redirect. |

## feedback

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Backend `D:\Repositories\starci-academy-backend` / `mtp`; Frontend `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Áp dụng xác nhận Keycloak `8081`, đồng bộ port map và restart Compose StarCi. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\port-offset-runtime.md |
| Language | vi |
| Phase | feedback |
| Touching | metadata.json, env bridge sinh tự động, workflow fidelity; runtime StarCi Compose |

Session id: fidel-port-offset-runtime-20260815-01

Session status: open

Feedback class: `within-boundary`.

Correction: `metadata.json` dùng base chuẩn, `portOffset: 1`; `ports.keycloak = 8081`, `ports.core = 3001` và toàn bộ 14 port thỏa `basePorts.<name> + 1`.

Proof:

- `npm run sync` pass và sinh `.env.override` theo offset `+1`.
- `npm run compose -- down` chạy không có `-v`; volume được giữ nguyên.
- Compose dựng lại Postgres, Redis, Elasticsearch, Qdrant, Kafka, MinIO, NATS, cAdvisor và Prometheus ở port mới.
- `starci-keycloak` chưa bind được `8081`: Docker Desktop báo port allocated dù Windows không có listener trước, trong và sau lần start; poll 20 ms trong 12 giây ghi nhận `NO_HOST_PROCESS_OWNED_8081_DURING_START`.
- Việc xóa và tạo lại container/network không giải phóng reservation nội bộ của Docker Desktop.

### OUTPUTS

| Concept | Result |
|---|---|
| Canonical port mapping | StarCi đã chuyển sang offset `+1`; Keycloak canonical là `8081`. |
| Runtime restart | Hạ/dựng lại không xóa volume; chín service hoạt động, Keycloak bị Docker Desktop port allocator chặn. |

### CHANGES

| Tree | Details |
|---|---|
| `metadata.json` | `modified` — reset base map chuẩn, đặt offset `1`, tính lại toàn bộ resolved ports. |
| `.env.override` | `modified` (ignored/generated) — `npm run sync` sinh bridge theo mapping mới. |
| `.stacks/dev/infra/compose/.env.generated` | `modified` (ignored/generated) — Compose render port offset `+1`. |
| `.workflows/fidel/starci-academy/port-offset-runtime.md` | `modified` — ghi correction và runtime proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Có restart Docker Desktop để xóa stale port reservation `8081` không? | Mặc định: thầy cho phép restart, chấp nhận mọi container MiaMia/Nivo/StarCi bị ngắt tạm; hoặc để Keycloak StarCi dừng và xử lý sau. |

### WARNINGS

| Warning | Impact |
|---|---|
| Docker Desktop giữ reservation `8081` nhưng Windows không có process listener. | Keycloak StarCi ở trạng thái `Created`, chưa phục vụ discovery/auth. |
| Preview server đang giữ `8081` lúc restart đầu tiên đã được dừng. | Preview đó phải được chạy lại ở port khác nếu task liên quan cần dùng. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Keycloak StarCi `8089` | Keycloak StarCi `8081` | Base `8080` cộng offset `1`. |
| Xóa volume để chữa Keycloak | Giữ volume, chỉ recreate container/network | Thầy yêu cầu restart mapping; dữ liệu realm không được xóa. |

### OWED

| Owed | Cleared by |
|---|---|
| Keycloak live ở `8081` | Restart Docker Desktop rồi `npm run compose -- up -d keycloak`; discovery trả HTTP 200 với issuer `http://localhost:8081/realms/master`. |
| BE/FE và OAuth redirect proof | Sau khi Keycloak lên, chạy BE/FE và xác nhận redirect Location dùng `localhost:8081`. |

## feedback

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Backend `D:\Repositories\starci-academy-backend` / `mtp`; Frontend `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Khôi phục Keycloak StarCi tại `8081` và xác minh đủ FE, BE, realm và OAuth endpoint. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\port-offset-runtime.md |
| Language | vi |
| Phase | feedback |
| Touching | `.stacks/dev/infra/compose/keycloak.yaml`, runtime của `starci-keycloak`, trạng thái `nivo-mock`, workflow fidelity; không xóa volume. |

Session id: fidel-port-offset-runtime-20260815-01

Session status: open

Feedback class: `within-boundary`.

Binding evidence: ảnh thầy gửi cho thấy `localhost:8081` trả `ERR_CONNECTION_REFUSED`; FE đã tạo đúng URL canonical nhưng Keycloak không có listener.

Root cause correction: reservation `8081` không phải stale Docker Desktop như lần đo trước; `nivo-mock` đang bind `127.0.0.1:8081`. Sau khi dừng riêng container đó, Keycloak recreate được port nhưng H2 `AUTO_SERVER` không resolve được hostname container mới và restart loop.

### OUTPUTS

| Concept | Result |
|---|---|
| StarCi local stack | FE `3000`, BE `3001`, Keycloak `8081` đều đang listen. |
| OAuth availability | Realm `master` và authorization URL của client `academy-web` đều trả HTTP 200. |
| Persistent H2 runtime | Dev H2 chạy single-process với `AUTO_SERVER=FALSE`, giữ nguyên named volume và realm database qua container recreate. |

### CHANGES

| Tree | Details |
|---|---|
| `.stacks/dev/infra/compose/keycloak.yaml` | `modified` — đặt `KC_DB_URL_PROPERTIES=";AUTO_SERVER=FALSE"` cho H2 dev single-process sau container recreate. |
| Runtime `nivo-mock` | `stopped` — giải phóng đúng host port `8081`; không xóa container hay volume. |
| Runtime `starci-keycloak` | `recreated/started` — publish `0.0.0.0:8081->8080/tcp`, giữ named volume. |
| `.workflows/fidel/starci-academy/port-offset-runtime.md` | `modified` — thay kết luận stale reservation bằng owner thật và ghi live proof. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Thầy đã yêu cầu start đúng stack StarCi; mọi thao tác đều không xóa dữ liệu. |

### WARNINGS

| Warning | Impact |
|---|---|
| `nivo-mock` đang dừng vì trước đó chiếm port canonical của Keycloak StarCi. | Khi cần Nivo mock phải chạy lại ở port khác, không dùng `8081`. |
| Keycloak đang chạy `start-dev` với H2. | Phù hợp local-only; không phải cấu hình production. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Kết luận Docker Desktop giữ stale reservation | Xác định `nivo-mock` là owner thật của `8081` | Docker container inspection trả đúng binding đang chạy. |
| Xóa Keycloak volume | Giữ DB, tắt H2 `AUTO_SERVER` trong dev stack | Realm/client hiện hữu phải được bảo toàn. |

### OWED

| Owed | Cleared by |
|---|---|
| User acceptance | Thầy reload OAuth URL và xác nhận trang Keycloak xuất hiện. |
| Fidelity End/Finality | Chỉ chạy khi thầy yêu cầu chốt session. |

## feedback

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | Explicit targets |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | Backend `D:\Repositories\starci-academy-backend` / `mtp`; Frontend `D:\Repositories\starci-academy-fe` / `main` |
| Purpose | Thử lại Google broker OAuth sau khi callback `8081` được cập nhật. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\port-offset-runtime.md |
| Language | vi |
| Phase | feedback |
| Touching | Browser proof và workflow fidelity; không chọn tài khoản, không đổi source/runtime. |

Session id: fidel-port-offset-runtime-20260815-01

Session status: open

Feedback class: `within-boundary`.

Binding evidence: lần trước Google trả `Error 400: redirect_uri_mismatch`; thầy yêu cầu thử lại cùng luồng.

### OUTPUTS

| Concept | Result |
|---|---|
| Google callback acceptance | Google chấp nhận `http://localhost:8081/realms/master/broker/google/endpoint` và render account chooser. |
| Retry boundary | Đã chứng minh Keycloak → Google; chưa chọn tài khoản nên chưa tạo login session/callback về StarCi. |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/fidel/starci-academy/port-offset-runtime.md` | `modified` — ghi lại retry proof thành công. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | Callback mismatch đã được loại bỏ bằng browser proof. |

### WARNINGS

| Warning | Impact |
|---|---|
| Chưa chọn Google account trong phiên kiểm tra. | Chưa chứng minh token callback và local authenticated session; không cần cho lỗi redirect URI hiện tại. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Tiếp tục tự chọn tài khoản Google | Dừng tại account chooser | Callback acceptance đã đủ; không tự đăng nhập tài khoản của thầy. |

### OWED

| Owed | Cleared by |
|---|---|
| End-to-end authenticated callback nếu thầy cần | Thầy chọn tài khoản trên tab Google và hoàn tất consent/login. |
| Fidelity End/Finality | Chỉ chạy khi thầy yêu cầu chốt session. |

## end

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | D:\Repositories\starci-academy-fe / main @ 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree |
| Purpose | Đóng StarCi stack offset và OAuth redirect runtime fidelity. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\port-offset-runtime.md |
| Language | vi |
| Phase | end |
| Touching | Workflow record, recorded session source boundary và final evidence only. |

Session id: fidel-port-offset-runtime-20260815-01
Session status: open

### RELATED BUGS

| Finding | Evidence | Classification | Route |
|---|---|---|---|
| Google account consent là external OAuth completion, không phải port-mapping defect. | Source scan, focused tests và localhost closure proof | not-a-bug | None |
| Owed ngoài production boundary | Full Google consent callback chỉ là optional external continuation. | new-boundary | Linked OAuth e2e continuation nếu cần |

### OUTPUTS

| Concept | Result |
|---|---|
| End identity | fidel-port-offset-runtime-20260815-01 tại FE baseline 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree. |
| Current proof | FE 3000 trả 200; GraphQL 3001 phục vụ POST endpoint; Keycloak 8081 discovery trả 200; localhost callback mismatch đã hết. |
| Shared gates | TypeScript pass; 14 focused files / 50 tests pass; Next production build pass. |
| Whole-suite audit | 630/645 tests pass; 15 failures được phân loại là concurrent stale tests/environment ngoài session boundary. |

### CHANGES

| Tree | Details |
|---|---|
| Session production boundary | Giữ nguyên correction đã được feedback chấp nhận; End không mở rộng source. |
| Workflow | Append proof, related-bug classification và closure readiness. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã chốt closure run cho toàn bộ fidelity sessions. |

### WARNINGS

| Warning | Impact |
|---|---|
| Whole-repo ESLint quét cả artifacts và mirror đang có 104 lỗi ngoài boundary | Focused lint/proofs đã đạt; không sửa artifacts hoặc concurrent lint source trong Finality. |
| Workflow validator có legacy schema errors | Closure record mới vẫn giữ đủ canonical tables; trust-tree cleanup thuộc Upgrade boundary. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Mở rộng End sang lỗi concurrent | Route theo owning capability | End chỉ sửa same-boundary regression và không chiếm work của session khác. |

### OWED

| Owed | Cleared by |
|---|---|
| Full Google consent callback chỉ là optional external continuation. | Linked OAuth e2e continuation nếu cần |
| Session closure | Fidelity Finality ngay sau End theo yêu cầu đã chốt. |

## finality

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | starci-academy |
| Frontend | D:\Repositories\starci-academy-fe |
| Backend | D:\Repositories\starci-academy-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | starci-academy |
| Repo / branch | FE main @ 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE mtp @ 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree |
| Purpose | Finalize fidel-port-offset-runtime-20260815-01 sau End proof đã được user chốt. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\fidel\starci-academy\port-offset-runtime.md |
| Language | vi |
| Phase | finality |
| Touching | Workflow record và final evidence only; không production correction. |

Session id: fidel-port-offset-runtime-20260815-01
Session status: finalized
Session finalized: fidel-port-offset-runtime-20260815-01
Final diff identity: FE 85f4e6663dfdea68bb56eec4956cc681641afe35..worktree; BE 7acd312a858be7ed58dc847c25ec86d801be17f8..worktree.

### OUTPUTS

| Concept | Result |
|---|---|
| Closure | Session finalized sau current End evidence. |
| Accepted | Toàn bộ feedback cuối cùng và superseding corrections trong record. |
| Routed | Full Google consent callback chỉ là optional external continuation. |
| Continuation | Feedback mới phải mở Fidelity Start mới với Continuation of: fidel-port-offset-runtime-20260815-01. |

### CHANGES

| Tree | Details |
|---|---|
| Workflow | Added immutable Finality closure identity. |
| Production | None — Finality không sửa source. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | User đã nói “ok chốt đi”. |

### WARNINGS

| Warning | Impact |
|---|---|
| Linked owed không bị tuyên bố hoàn thành | Linked OAuth e2e continuation nếu cần |
| Concurrent whole-repo failures vẫn được giữ nguyên | Không làm sai lệch focused proof của session này. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Append feedback vào session đã finalized | Mở linked continuation session | Finality đóng vĩnh viễn session id này. |

### OWED

| Owed | Cleared by |
|---|---|
| Full Google consent callback chỉ là optional external continuation. | Linked OAuth e2e continuation nếu cần | 
