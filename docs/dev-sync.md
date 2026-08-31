# Đồng bộ máy dev + chạy BE

Mục tiêu: một máy mới `git clone` xong là chạy được backend local, không phải xin từng cái
secret bằng tay.

Ba thứ giữ cho việc đó chạy được:

- **một khoá master duy nhất** ở `~/.starci/master.identity` (dùng chung cho **mọi** dự án),
- **`.stacks/`** — config tách theo *stack triển khai* (`dev` / `vps` / `k8s`), mã hoá bằng
  **sops + age**,
- **`.workspace/ports/config.json` + `.workspace/ports/starci-academy.json`** ở Source — nguồn phân bổ slot step/offset/slot; `metadata.json` ở repo chỉ
  khai service identity và giữ projection đã resolve cho runtime.

Một lệnh duy nhất để kéo mọi thứ về: **`npm run sync`**.

Vì sao lại có hình dạng này thì đọc [`secrets-architecture.md`](./secrets-architecture.md);
file này chỉ nói **làm thế nào**.

## Cái gì sống ở đâu

| Thành phần | Sync bằng | Ghi chú |
|---|---|---|
| Code BE | git — repo này | |
| `.gitmounts/data/` — nội dung seed (course, coding problem, achievement, changelog, …) | `npm run sync` clone repo private | thay cho `.mount/data`; **chỉ dữ liệu**, không một khoá nào |
| `.stacks/` — secrets theo stack | git (bản `.enc`) + `npm run sync` giải mã | **chỉ `dev` có file giá trị trên đĩa**; `vps` và `k8s` mới có `KEYS.md` |
| Infra local (postgres / redis / elasticsearch / qdrant / kafka / minio / nats / keycloak / cadvisor / prometheus) | `npm run compose` | projection theo `metadata.json`, allocation theo Source `.workspace/ports/starci-academy.json` |
| `.stacks/dev/runtime/config/seed.yaml` | **không sync** — theo máy | tạo từ `config/seed.example.yaml` khi thiếu |

`KEYS.md` là **danh sách tên biến** stack đó cần, không phải giá trị. Nó luôn đọc được, kể
cả khi không có khoá — nhờ vậy người mới biết cần khai những gì.

## Khoá master — `~/.starci/master.identity`

Chỉ còn **MỘT** khoá, dùng chung cho **tất cả** dự án của owner:

```
Windows:  %USERPROFILE%\.starci\master.identity
POSIX:    ~/.starci/master.identity
```

Đây là khoá **age**. `npm run sync` dùng nó (qua sops) để giải `*.enc` trong `.stacks/dev/`.

⚠️ **Khoá này là "chìa" duy nhất:**

- **KHÔNG BAO GIỜ** nằm trong git — không repo nào.
- **KHÔNG BAO GIỜ** lên CI. CI dùng GitHub Actions secrets, không dùng khoá này.
- Sang máy mới thì **copy out-of-band** (USB / password manager / scp), không gửi qua chat,
  không dán vào issue.
- **Back up nó.** Mất khoá = mất khả năng giải mã của mọi dự án. Không có đường khôi phục.

## Port — Source workspace là nguồn phân bổ

Owner chạy nhiều dự án trên **cùng một máy**. Dự án nào cũng bind Postgres vào `5432`, Redis
vào `6379` thì stack thứ hai bật lên là đụng port. Source cấp offset theo family và slot theo
application trong `.workspace/ports/starci-academy.json`; slot step chung nằm ở `.workspace/ports/config.json`;
product không tự giữ các giá trị đó.

```
shared      = base port + family offset
application = base port + family offset + application slot * slotStep
```

Dự án này dùng family `starci-academy` offset `+0`, application `main` slot `0`. Projection hiện tại:

| Service | Base | Host | Ghi chú |
|---|---|---|---|
| web (Next app) | 3000 | **3000** | application `main`, slot `0` |
| core (Nest app) | 3001 | **3001** | application `main`, slot `0` |
| postgres | 5432 | 5432 | shared |
| redis | 6379 | 6379 | shared |
| elasticsearch | 9200 | 9200 | shared |
| qdrant | 6333 | 6333 | shared REST |
| qdrant gRPC | 6334 | 6334 | shared |
| kafka | 9092 | 9092 | shared |
| minio | 9000 | 9000 | shared S3 API |
| minio console | 9001 | 9001 | shared UI |
| nats | 4222 | 4222 | shared |
| nats monitor | 8222 | 8222 | shared |
| keycloak | 8080 | 8080 | shared |
| cadvisor | 8081 | 8081 | shared |
| prometheus | 9090 | 9090 | shared |

⚠️ **Bảng trên là projection cho dễ đọc.** Đổi allocation thì sửa Source `.workspace/ports/starci-academy.json`,
refresh `metadata.json`, rồi chạy checker; không đưa `portOffset` hoặc application slot trở lại product.

Cũng vì vậy mà mặc định trong `src/modules/platform/env/config.ts` (`CORE_PORT` 3001,
postgres 5432, redis 6379, …) **không** khớp với port compose công bố — chênh lệch đó do
`.env.override` mà `npm run sync` sinh ra bắc cầu. Không có bước sync thì app quay số port
chuẩn và ăn `ECONNREFUSED` trong khi `docker ps` trông hoàn toàn khoẻ mạnh.

## Onboard máy mới — từng bước

1. **Đặt khoá master** vào `%USERPROFILE%\.starci\master.identity` (copy out-of-band).

2. **Cài `sops` và `age`** — `npm run sync` kiểm tra và báo tên công cụ còn thiếu.

3. ```bash
   git clone <repo> && cd starci-academy-backend
   npm run sync        # clone .gitmounts/data + giải mã .stacks/dev + sinh .env.override
   npm run compose     # dựng 10 service hạ tầng
   npm ci
   npm run start:dev
   ```

   API lên ở `http://localhost:3001` (`ports.core` trong `metadata.json`).

`npm run sync` là **entry point duy nhất**. Nó lo cả `.gitmounts/data` lẫn `.stacks/`, và
chạy lại được nhiều lần (idempotent) — cứ `git pull` xong là chạy lại.

### URL local chuẩn cho browser và OAuth

Mọi luồng browser/OAuth local dùng duy nhất hostname `localhost`. Không mở frontend bằng
`127.0.0.1`, vì OAuth, cookie, CORS và browser storage coi đó là một origin khác.
Literal loopback IP chỉ còn hợp lệ trong field mang nghĩa IP (ví dụ request IP hoặc IPv4
bind để giữ port cho Docker), không dùng làm endpoint, origin hay hostname kết nối.

| Vai trò | URL chuẩn |
|---|---|
| Frontend | `http://localhost:3000` |
| Core API | `http://localhost:3001` |
| Keycloak | `http://localhost:8080` |
| Google broker callback | `http://localhost:8080/realms/master/broker/google/endpoint` |

Trong Keycloak, client `academy-web` dùng `http://localhost:3000/*` cho Valid redirect URIs
và `http://localhost:3000` cho Web origins. Callback `KEYCLOAK_GOOGLE_REDIRECT_URI` ở
`http://localhost:3001/api/v1/keycloak/google/callback` là callback của ứng dụng với
Keycloak; nó không thay thế Google broker callback ở bảng trên.

Google Cloud Console phải có Google broker callback khớp tuyệt đối trong **Authorized
redirect URIs**. `npm run sync`, sửa JSON credential đã tải về, hoặc sửa Keycloak không thể
thay đổi allowlist bên Google; lỗi `redirect_uri_mismatch` chỉ hết sau khi URI `:8080` ở trên
được thêm vào OAuth client tương ứng.

Muốn xem `sync` sẽ viết gì mà chưa muốn đụng vào `.env.override` đang chạy:

```bash
npm run sync -- --out .tmp/env.preview
```

## `npm run compose` — và vì sao đừng gọi `docker compose` tay

```bash
npm run compose                     # up -d rồi đợi healthcheck
npm run compose -- down             # dừng, GIỮ dữ liệu
npm run compose -- down -v          # dừng và XOÁ sạch volume
npm run compose -- ps               # đang chạy gì
npm run compose -- logs -f postgres # theo dõi log
npm run compose -- --render-only    # chỉ ghi .env.generated rồi dừng
npm run compose -- --stack vps      # dùng .stacks/vps/infra/compose
```

Mọi port trong file compose là **interpolation** (`${STARCI_PORT_POSTGRES}`), không phải
literal. `scripts/compose.mjs` đọc `metadata.json` + các file credential đã giải mã, ghi ra
`.stacks/<stack>/infra/compose/.env.generated`, rồi mới gọi `docker compose --env-file`.
Gọi `docker compose` thẳng thì biến rỗng và compose publish ra một port không ai gọi tới
được.

Ba chi tiết đáng biết:

- **Nó đợi bằng cách poll, không dùng `up --wait`.** `--wait` coi container `minio-init`
  (chạy một việc rồi thoát) là *thất bại*, biến một stack khoẻ mạnh thành exit code 1.
  Script phân biệt: thoát với mã 0 là xong việc; đang chạy mà có healthcheck thì phải
  `healthy`.
- **Nó từ chối `up` khi thiếu file credential.** Fragment nào cũng có default kiểu
  `${POSTGRES_PASSWORD:-REPLACE_ME}` để `docker compose config` còn render được, nhưng một
  volume postgres khởi tạo bằng `REPLACE_ME` sẽ **giữ** giá trị đó cho tới khi xoá volume.
  Hỏng nhanh thì tốt hơn hỏng chậm — chạy `npm run secret:gen -- dev` trước.
- **`.env.generated` là file sinh ra, gitignore.** Nó chứa port và password datastore; đừng
  sửa tay, lần chạy sau ghi đè.

### Bật stack mới song song với stack cũ

Chỉ cần trong lúc migration, để đối chiếu trước khi bỏ `.containers/compose.yaml`:

```bash
STARCI_CONTAINER_PREFIX=starci-verify- npm run compose -- -p starci-verify up -d
```

`-p` cho project khác (nên volume khác), biến prefix cho tên container khác. Port vốn đã
lệch sẵn nhờ offset nên không đụng.

⚠️ Xong việc thì **bỏ cả hai**. Ở trạng thái ổn định tên container phải là `starci-<service>`,
vì `PrometheusMetricsService` cắt đúng tiền tố đó để ra key thành phần cho trang kiến trúc
public.

## Đổi một secret

### Stack `dev`

```bash
npm run secret:list                          # xem có những gì (chỉ TÊN)
npm run secret:set -- dev/runtime/files/<tên> # nhập giá trị, không qua shell history
git add -A && git commit -m "chore(stacks): update dev runtime"
```

Husky hook lo phần mã hoá: lúc commit nó chạy sops, sinh bản `.enc` và **stage luôn**. Bản
thô không bao giờ vào git. Máy khác nhận thay đổi bằng `git pull` rồi `npm run sync`.

Sinh **mới** một password hạ tầng:

```bash
npm run secret:gen -- dev            # chỉ sinh cái còn thiếu
npm run secret:gen -- dev --force    # sinh lại TẤT CẢ
```

⚠️ `--force` chỉ an toàn khi xoá volume cùng lúc (`npm run compose -- down -v`). Ba credential
là **bootstrap-only** — datastore chỉ đọc chúng ở lần khởi tạo đầu tiên, sau đó giá trị nằm
trong volume:

| Credential | Đọc lúc nào | Đổi kiểu gì |
|---|---|---|
| `postgres-password.txt` | lần đầu tạo cluster | `down -v` rồi lên lại |
| `elasticsearch-password.txt` | lần đầu bootstrap user `elastic` | `down -v` rồi lên lại |
| `keycloak-admin-password.txt` | lần đầu tạo DB nhúng | `down -v`, hoặc đổi trong admin console |

Đổi file mà không xoá volume = file nói một đằng, datastore hiểu một nẻo, và triệu chứng là
`401`/`authentication failed` chứ không phải một lỗi nói rõ nguyên nhân.

### Khoá bên thứ ba

Stripe, PayPal, PayOS, SePay, Brevo, GitHub token, GCP service account, `encryption-key`,
các pool AI — **không bao giờ** sinh bằng `secret:gen`. Chúng do bên khác cấp và mất là mất
thật. Đổi thì lấy giá trị mới từ nhà cung cấp rồi `npm run secret:set`.

### Stack `vps`

Giá trị nằm trong GitHub Actions secrets, không có file trên đĩa:

```bash
gh secret set <TÊN_BIẾN> --repo <owner>/<repo>
```

Tên biến lấy trong `.stacks/vps/runtime/env/KEYS.md`. Thêm biến mới thì **nhớ ghi tên nó vào
`KEYS.md`** — đó là chỗ duy nhất người sau biết stack cần gì.

### Stack `k8s`

Giá trị sẽ nằm trong secret manager của cloud. Chưa nối; hiện mới có `KEYS.md` làm khung.

## Deploy

Không cần khoá master trên máy — deploy chạy qua GitHub Actions với secrets của repo. `.stacks/`
đi theo git dưới dạng ciphertext và CI **không** giải mã được, đúng như thiết kế: giá trị cho
server được đẩy riêng từ máy có khoá.

## Sự cố hay gặp

| Triệu chứng | Nguyên nhân thường gặp |
|---|---|
| `ECONNREFUSED` tới postgres/redis dù `docker ps` xanh | chưa chạy `npm run sync`; app đang quay số port mặc định chứ không phải port offset |
| `compose` báo thiếu file credential | chưa `npm run secret:gen -- dev`, hoặc chưa `npm run sync` để giải mã |
| Giải mã hỏng trên máy mới clone | thiếu `*.enc -text` trong `.gitattributes` → git đã đổi ciphertext sang CRLF |
| NATS "Authorization Violation" | token trong file lệch với token server đang chạy — `down` rồi lên lại |
| Kafka nối được rồi treo | `KAFKA_ADVERTISED_LISTENERS` phải advertise **port host**, không phải port container |
| Trang kiến trúc public rỗng số liệu | tên container không còn bắt đầu bằng `starci-` (xem `STARCI_CONTAINER_PREFIX`) |
| Keycloak "Client not found" sau `down -v` | realm nằm trong volume `keycloak-data`; `-v` xoá nó, phải provision lại |
| Google báo `Error 400: redirect_uri_mismatch` | thêm chính xác `http://localhost:8080/realms/master/broker/google/endpoint` vào Authorized redirect URIs của OAuth client trên Google Cloud Console |

## Script trong `package.json`

| Lệnh | Làm gì |
|---|---|
| `npm run sync` | entry point: giải mã `.stacks/dev`, clone gitmount, sinh `.env.override` |
| `npm run compose` | render `.env.generated` rồi gọi `docker compose` |
| `npm run secret:gen` | sinh password hạ tầng còn thiếu cho một stack |
| `npm run secret:set` | đặt một secret, không qua shell history |
| `npm run secret:list` | liệt kê **tên** secret của một stack |
| `npm run secret:show` | in một secret ra màn hình (dùng dè) |
