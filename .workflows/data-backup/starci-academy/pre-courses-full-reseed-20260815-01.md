<!-- starci-workflow: v2 -->

## plan

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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Lập biên snapshot mã hóa đầy đủ trước khi full seed PostgreSQL và đồng bộ lại Elasticsearch. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\data-backup\starci-academy\pre-courses-full-reseed-20260815-01.md |
| Language | vi |
| Phase | plan |
| Touching | D:\Repositories\starci-academy-backend\.workflows\data-backup\starci-academy\pre-courses-full-reseed-20260815-01.md |

### INVENTORY

| Runtime evidence | Result |
|---|---|
| Compose project | starci-academy-backend |
| Compose config | D:\Repositories\starci-academy-backend\.stacks\dev\infra\compose\compose.yaml |
| Target | Local Docker Desktop stack |
| Active writers | Backend watch process, built backend process, PostgreSQL, Redis, Elasticsearch, Qdrant, Kafka, MinIO, NATS, Keycloak và Prometheus đang chạy. |
| Free space | D: còn khoảng 570 GB. |
| Encryption | `.sops.yaml` khai báo age recipient `age1myd...gm3z4j`; private identity ngoài repository tại `%USERPROFILE%\.starci\master.identity` hiện diện. Không ghi private key vào workflow. |
| Plaintext policy | Chỉ staging trong thư mục mới tạo bởi `New-TemporaryFile`/`New-Item` dưới OS temp, ngoài repository; xóa trong `finally`. |
| Destination | D:\Repositories\starci-academy-backend\.dat\starci-academy-dev-pre-courses-reseed-20260815.tar.age.enc |
| Git safety | `.dat` được `.sops.yaml` định tuyến binary; artifact dùng hậu tố `.enc` nên `.gitattributes` ép `-text`. Không stage hoặc commit snapshot. |

### VOLUME SET

| Volume | Mount owner | Approx bytes | Consistency |
|---|---|---:|---|
| starci-academy-backend_pg-data | PostgreSQL | 208,517,745 | Cold snapshot |
| starci-academy-backend_redis-data | Redis | 870,248 | Cold snapshot |
| starci-academy-backend_es-data | Elasticsearch | 157,470,224 | Cold snapshot |
| starci-academy-backend_qdrant-data | Qdrant | 1,402,295,147 | Cold snapshot |
| starci-academy-backend_kafka-data | Kafka | 4,096 | Cold snapshot |
| starci-academy-backend_minio-data | MinIO | 471,846,701 | Cold snapshot |
| starci-academy-backend_nats-data | NATS | 4,096 | Cold snapshot |
| starci-academy-backend_keycloak-data | Keycloak | 849,476 | Cold snapshot |
| starci-academy-backend_prometheus-data | Prometheus | 804,104,200 | Cold snapshot |
| bec72d29aa394990b23c4be2e12f419d6900758eca72be8277e4a845ecac8f6c | Kafka `/etc/kafka/secrets` anonymous volume | 4,096 | Cold snapshot |
| 42dc10f9420b071cbe9579644e070adc4d2e4d779d2e48b1f3c357c4501ae7fa | Kafka `/mnt/shared/config` anonymous volume | 4,096 | Cold snapshot |

### BACKUP BRIEF

| Decision | Plan |
|---|---|
| Coverage | Chụp đủ 11 persistent volumes được runtime hiện tại mount; không dùng danh sách handwritten khi Apply mà re-enumerate và so khớp. |
| Downtime | Dừng backend writers, sau đó `npm run compose -- down` không `-v`; dự kiến 5–10 phút cho snapshot khoảng 3,05 GB và verify; FE có thể giữ chạy nhưng mọi API sẽ tạm mất. |
| Archive | Mỗi volume được tar read-only vào staging ngoài repository; tạo manifest gồm volume, size và SHA-256; gói manifest cùng volume tar thành một archive. |
| Encryption | Mã hóa archive bằng age public recipient từ `.sops.yaml` trước khi ghi destination `.dat`; không để plaintext dưới repository. |
| Restart | `finally` luôn chạy `npm run compose` và khởi động lại đúng backend writer đã dừng; kiểm tra health trước khi reseed. |
| Verification | Giải mã stream bằng private identity rồi enumerate archive, so manifest đủ 11 volume, kiểm tra kích thước và SHA-256; không in nội dung datastore. |
| Retention | Giữ local encrypted snapshot cho tới khi 5 course, asset URLs và sort `title.keyword` đều được chứng minh; sau đó chỉ xóa theo yêu cầu riêng của thầy. |
| Restore | Dùng `starci-data-restore-plan -> review -> apply`; không giải nén đè trực tiếp vào live volumes. |

### OUTPUTS

| Concept | Result |
|---|---|
| Pre-reseed snapshot brief | Đã inventory toàn bộ persistent volume của stack StarCi local và đề xuất cold encrypted snapshot trước full seed. |

### CHANGES

| Tree | Details |
|---|---|
| D:\Repositories\starci-academy-backend\.workflows\data-backup\starci-academy\pre-courses-full-reseed-20260815-01.md | added — workflow Plan và runtime inventory. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Phê duyệt snapshot revision nào trước reseed? | `pre-courses-reseed-cold-r1` (khuyến nghị): đủ 11 volume, dừng writers 5–10 phút, lưu encrypted local `.dat`; hoặc yêu cầu đổi downtime/destination/coverage trước Review. |

### WARNINGS

| Warning | Impact |
|---|---|
| PostgreSQL hiện có 0 course nhưng các datastore khác vẫn có dữ liệu | Không được bỏ snapshot chỉ vì bảng courses trống. |
| Hai anonymous Kafka volume có tên hash phụ thuộc container hiện tại | Apply phải re-enumerate; nếu tên đổi thì quay lại Review. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| Snapshot mã hóa và restore-enumeration proof | `$starci-data-backup-review` phê duyệt rồi `$starci-data-backup-apply`. |
| Full seed và Elasticsearch mapping/sync | Chỉ chạy sau khi snapshot Apply verified. |

## review

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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Khóa coverage, downtime, destination, encryption và verification của snapshot trước reseed. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\data-backup\starci-academy\pre-courses-full-reseed-20260815-01.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\data-backup\starci-academy\pre-courses-full-reseed-20260815-01.md |

### REVIEW REVISION

Revision: pre-courses-reseed-cold-r1

| Review axis | Frozen decision |
|---|---|
| Datastores | Toàn bộ 11 volume trong `VOLUME SET`; Apply phải abort nếu runtime set khác. |
| Interruption | Cold snapshot: dừng backend writers trước, compose down không xóa volume; dự kiến 5–10 phút. |
| Plaintext staging | OS temp ngoài repository, directory riêng cho run, xóa trong `finally` kể cả lỗi. |
| Encryption identity | Public recipient trong `.sops.yaml`; decrypt identity `%USERPROFILE%\.starci\master.identity`; không log secret. |
| Destination | D:\Repositories\starci-academy-backend\.dat\starci-academy-dev-pre-courses-reseed-20260815.tar.age.enc |
| Verification | Decrypt-to-stream archive listing, manifest exact coverage, per-volume tar SHA-256, encrypted artifact SHA-256 và non-zero size. |
| Restart | Restart compose và backend writer trong `finally`, rồi prove container health/API before reseed. |
| Retention | Giữ tới khi full seed + ES sync + 5 course + image + sort proof đạt. |
| Restore proof | Archive enumeration trong Apply; scratch restore đầy đủ được ghi OWED và chỉ chạy qua data-restore lifecycle nếu cần. |

### OUTPUTS

| Concept | Result |
|---|---|
| Snapshot policy revision | `pre-courses-reseed-cold-r1` khóa đủ 11 volume, cold consistency, age encryption, local retention và stream verification. |

### CHANGES

| Tree | Details |
|---|---|
| D:\Repositories\starci-academy-backend\.workflows\data-backup\starci-academy\pre-courses-full-reseed-20260815-01.md | modified — appended Review revision awaiting explicit approval. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Thầy có phê duyệt revision `pre-courses-reseed-cold-r1` để tạo snapshot rồi full seed/sync không? | Phê duyệt revision này (khuyến nghị); hoặc nêu phần cần sửa. |

### WARNINGS

| Warning | Impact |
|---|---|
| API sẽ gián đoạn trong snapshot và stack restart | Trình duyệt có thể hiện lỗi tạm thời khoảng 5–10 phút. |
| Scratch restore chưa nằm trong Apply này | Apply chứng minh decrypt/enumerate; restore thật phải qua destructive restore lifecycle. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Hot snapshot | Cold snapshot | Tránh ảnh chụp lệch transaction giữa PostgreSQL, Elasticsearch, MinIO và event stores. |
| Chỉ backup PostgreSQL và Elasticsearch | Backup đủ mọi persistent volume đang mount | Full seed/sync có thể tác động dữ liệu liên đới và skill cấm bỏ sót volume. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval | Thầy xác nhận `pre-courses-reseed-cold-r1`. |
| Snapshot Apply | `$starci-data-backup-apply` sau approval. |
| Full seed + ES mapping/sync | Tiếp tục sau verified snapshot. |

## review r2

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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Ghi explicit approval cho cold snapshot revision trước full reseed. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\data-backup\starci-academy\pre-courses-full-reseed-20260815-01.md |
| Language | vi |
| Phase | review |
| Touching | D:\Repositories\starci-academy-backend\.workflows\data-backup\starci-academy\pre-courses-full-reseed-20260815-01.md |

Approved revision: pre-courses-reseed-cold-r1

Approval evidence: thầy xác nhận nguyên văn `Phê duyệt pre-courses-reseed-cold-r1.`

### OUTPUTS

| Concept | Result |
|---|---|
| Approved cold snapshot | Được phép tạo snapshot mã hóa đủ 11 volume với downtime và verification đã khóa ở revision r1. |

### CHANGES

| Tree | Details |
|---|---|
| D:\Repositories\starci-academy-backend\.workflows\data-backup\starci-academy\pre-courses-full-reseed-20260815-01.md | modified — appended explicit approval. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| API downtime bắt đầu trong Apply | Request đang chạy có thể thất bại trong khoảng snapshot/restart. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| Snapshot Apply | `$starci-data-backup-apply`. |

## apply

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
| Repo / branch | D:\Repositories\starci-academy-backend / mtp |
| Purpose | Ghi verified cold snapshot đã áp dụng trước full reseed. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\data-backup\starci-academy\pre-courses-full-reseed-20260815-01.md |
| Language | vi |
| Phase | apply |
| Touching | Workflow này; encrypted artifact đã phê duyệt dưới `.dat`. |

Applied revision: pre-courses-reseed-cold-r1

### VERIFICATION

| Proof | Result |
|---|---|
| Archive | `D:\Repositories\starci-academy-backend\.dat\starci-academy-dev-pre-courses-reseed-20260815.tar.age.enc` |
| Encrypted bytes | `2995153016` |
| SHA-256 | `7703a90bb08b2e7e55dd3763fa0f3835e1b3447e1cffad6cfcba04b577866b08` |
| Coverage | Manifest và decrypt-enumeration xác nhận đủ chính xác `11` volume đã phê duyệt. |
| Plaintext | Staging ngoài repository đã được xóa sau mã hóa/verification. |
| Restart | Compose stack khởi động lại; PostgreSQL, Elasticsearch, MinIO và các service health-gated đều healthy; backend API lên lại tại `http://localhost:3001`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Verified pre-reseed snapshot | Cold snapshot mã hóa revision `pre-courses-reseed-cold-r1` đã bao phủ đủ 11 volume và có decrypt-enumeration proof. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.dat\starci-academy-dev-pre-courses-reseed-20260815.tar.age.enc` | added — encrypted cold snapshot, 2,995,153,016 bytes. |
| `D:\Repositories\starci-academy-backend\.workflows\data-backup\starci-academy\pre-courses-full-reseed-20260815-01.md` | modified — appended Apply evidence. |

### NEED APPROVALS

| Question | Options |
|---|---|
| None | None |

### WARNINGS

| Warning | Impact |
|---|---|
| Snapshot artifact về sau bị một baseline commit khác đưa vào Git (`50a6121f`) | Archive vẫn hợp lệ nhưng không còn là local-untracked như policy dự kiến; cần một cleanup Git riêng nếu muốn loại blob lớn khỏi lịch sử. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | None |

### OWED

| Owed | Cleared by |
|---|---|
| Scratch restore đầy đủ | Chạy `starci-data-restore-plan -> review -> apply` trên scratch stack nếu cần chứng minh restore end-to-end. |
