# Kiến trúc secrets — bản chốt

Tài liệu này chốt **câu chuyện**. Thao tác nằm ở [`dev-sync.md`](./dev-sync.md); đây là
**vì sao** mọi thứ có hình dạng như vậy.

## Câu chuyện một dòng

> Không ai phải biết password hạ tầng. Máy sinh ra chúng, `.stacks/` giữ chúng dưới dạng
> mã hoá, và chỉ người có `master.identity` mới đọc được.

Hệ quả: một máy mới `git clone` rồi `npm run sync` là chạy được, mà không ai phải nhắn cho
nhau một mật khẩu nào.

## Ba luật

### 1. Password hạ tầng là **sinh ra**, không phải do người nghĩ ra

Postgres, Redis, Elasticsearch, Qdrant, MinIO, NATS, Keycloak admin — mỗi stack sinh một
lần bằng `npm run secret:gen`, ghi vào `.stacks/<stack>/runtime/files/`, mã hoá bằng master
key, rồi **xoá bản thô ngay trong cùng một lần chạy**. Lần chạy sau đọc lại chứ không sinh
mới. Người không bao giờ gõ, không bao giờ nhớ, không bao giờ nhắn cho nhau.

Đây là lý do lần migration này an toàn: mọi docker volume của starci vừa bị xoá, nên không
còn datastore nào đang giữ password cũ. Password cũ **không được mang sang** — mang sang là
tự nguyện kéo dài vòng đời của một giá trị đã nằm trong lịch sử git.

Hai thứ **không** nằm trong luật này, và phải phân biệt cho rõ:

| Loại | Ví dụ | Sinh lại được? |
|---|---|---|
| Password hạ tầng | postgres, redis, minio, keycloak admin | **Có** — sinh lại + `compose down -v` |
| Khoá bên thứ ba | Stripe, PayPal, PayOS, SePay, Brevo, GitHub token, GCP SA, các pool AI | **Không** — do bên khác cấp |
| Khoá phái sinh | `encryption-key.key` | **Không** — sinh lại = mất khả năng đọc mọi field đã mã hoá |

20 khoá bên thứ ba dưới `.mount/terraform/` được **mã hoá tại chỗ** rồi chuyển bản `.enc`
vào `.stacks/`. Script làm việc đó chỉ đẩy byte qua `sops`; nó không mở, không in, không
chép nội dung đi đâu khác.

### 2. `env` giữ **đường đi**, `files` giữ **giá trị**

```
POSTGRESQL_PRIMARY_HOST=localhost                                   ← lộ cũng không mất gì
POSTGRESQL_PRIMARY_PORT=5515                                        ← lộ cũng không mất gì
TERRAFORM_STRIPE_SECRET_KEY_MOUNT_PATH=.stacks/dev/runtime/files/…  ← chỉ là đường dẫn
```

Lý do **không** phải "package npm đọc được `process.env`" — một package độc hại cũng
`readFileSync` được. Lý do thật là ba đường rò mà **chỉ env mới bị**:

1. trình báo lỗi đính kèm toàn bộ env vào crash report,
2. tiến trình con kế thừa nguyên bộ env,
3. `docker inspect` in env ra cho bất kỳ ai đọc được docker socket.

File không đi theo ba đường đó.

**Chỗ starci khác miamia, và phải nói thẳng:** starci đã theo luật này sẵn cho khoá bên thứ
ba — `config.ts` khai một key `*_MOUNT_PATH` cho từng file và `mount-secrets.ts` đọc bằng
`readFileSync`. Nhưng starci **không có** `parseEnvSecret`, nên password hạ tầng
(`POSTGRESQL_PRIMARY_PASSWORD`, `REDIS_*_PASSWORD`, …) vẫn tới app dưới dạng **giá trị**
trong env. Đó là nợ, được ghi nhận chứ không giấu: đổi được nó nghĩa là thêm một tầng đọc
`*_FILE` vào `parse-env.ts`, và đó là một thay đổi khác, không phải thay đổi này.

Với **container hạ tầng** thì giá trị trong env là đúng, không phải nhân nhượng: mỗi
container chạy đúng một binary của nhà phát hành, và phần lớn image (postgres, redis, minio,
qdrant, nats) không nhận password từ file. Vì vậy `credentials.mjs` có hai cột —
`env` cho app, `composeVar` cho container.

### 3. Chỗ nằm do **ai tiêu thụ** quyết định

| Thứ | Ai cần | Nằm ở |
|---|---|---|
| Cloudflare token, SSH key, `TF_VAR_*` | terraform, **lúc apply** | GitHub Actions secrets |
| Khoá bên thứ ba, service account, password hạ tầng | app, **lúc chạy** | `.stacks/` → giải mã tại chỗ |
| Seed switchboard, cấu hình theo máy | chỉ máy đó | `.stacks/dev/runtime/config/` (gitignore) |

CI giữ khoá SSH nhưng **không bao giờ** giữ khoá sops. Nên `.stacks/` không giải mã được
trên CI — đó là chủ ý, không phải thiếu sót.

## Cây

```
metadata.json                 ← nguồn sự thật DUY NHẤT cho port (base + offset)
.sops.yaml                    ← creation_rules: đường nào mã hoá bằng khoá nào
.gitattributes                ← *.enc -text, để checkout không đổi CRLF làm hỏng ciphertext

.stacks/                      ← nguồn sự thật cho secrets, trong git, đã mã hoá
├── dev/
│   ├── runtime/
│   │   ├── env/     KEYS.md + *.env (thô, GITIGNORE) + *.env.enc (sops, COMMIT)
│   │   ├── files/   từng credential một file + bản .enc
│   │   └── config/  seed.yaml theo máy (GITIGNORE)
│   └── infra/compose/   mỗi service một file + một file tổng chỉ có `include:`
├── vps/             CHỈ KEYS.md — giá trị nằm trong GitHub Actions secrets
└── k8s/             CHỈ KEYS.md — giá trị sẽ nằm trong secret manager

.gitmounts/data/              ← clone repo content, CHỈ dữ liệu, không một khoá nào
```

### Vì sao `.mount/` phải tách ra

`.mount/` là **bốn loại thứ khác nhau mặc chung một cái áo**, và cái áo đó gitignore nên
không ai review được nó:

| Trong `.mount/` | Thật ra là gì | Về đâu |
|---|---|---|
| `config/app.yaml` | có `sentryDsn` + một cặp credential PayOS | `.stacks/dev/runtime/files/app.yaml.enc` |
| `config/seed.yaml` | công tắc seed theo máy, không phải secret | `.stacks/dev/runtime/config/seed.yaml` |
| `config/metadata.json` | nội dung i18n, không phải secret | ở lại, là dữ liệu app |
| `terraform/*.key` (20 khoá) | credential bên thứ ba, **không sinh lại được** | mã hoá tại chỗ → `.stacks/dev/runtime/files/*.enc` |
| `data/` | vốn đã là một clone git | `gitmounts` khai trong `metadata.json` |
| `assets/` | file tĩnh | mount thường |

Lưu ý một cái bẫy tên: `metadata.json` **ở gốc repo** là sổ đăng ký port, còn
`.mount/config/metadata.json` là nội dung i18n. Trùng tên, không liên quan gì nhau.

## Ai giữ gì

| Nơi | Giữ | Mở được |
|---|---|---|
| Máy owner | `~/.starci/master.identity` | mọi stack, **mọi dự án** |
| GitHub Actions | SSH key + `TF_VAR_*` | vào được VPS, **không** giải mã được `.stacks/` |
| Server | file plaintext, `chmod 600` | chính nó |
| Git | **chỉ** ciphertext | không gì |

Một khoá master duy nhất cho mọi dự án là có chủ đích: mỗi dự án một khoá nghĩa là mỗi máy
mới phải chép nhiều khoá, và cái nào cũng phải nhớ back up. Mất khoá master = mất khả năng
giải mã của **mọi** dự án, không có đường khôi phục — nên hãy back up nó ra ngoài máy.

## Luồng

**Máy mới**

```
git clone → npm run sync → npm run compose → npm run start:dev
```

`sync` giải mã `.stacks/dev`, clone `.gitmounts/data`, rồi dựng `.env.override` bắc cầu từ
port mặc định trong `config.ts` sang port thật mà compose công bố.

**Đổi một secret**

```
npm run secret:set -- dev/runtime/files/<tên>
git commit          # husky mã hoá và stage bản .enc
```

Máy khác: `git pull && npm run sync`.

## Những gì đã bị bỏ đi, và vì sao

| Bỏ | Lý do |
|---|---|
| `.mount/terraform/*.key` | 20 credential nằm plaintext cạnh một repo git; ai đọc được thư mục là thấy hết |
| `.containers/compose.yaml` | port viết cứng thành literal, password viết cứng trong file; thay bằng `.stacks/<stack>/infra/compose/` với port suy ra từ `metadata.json` |
| `.env.override` bị commit | file này **đang** nằm trong git kèm giá trị thật |
| Một password cho mọi thứ | postgres, redis và qdrant từng dùng chung đúng một chuỗi |

> ⚠️ Xoá file khỏi working tree **không** xoá khỏi lịch sử git. Mọi credential từng nằm
> trong `.env.override` hoặc `.containers/compose.yaml` phải coi như **đã lộ** và phải xoay
> khoá — kể cả sau khi migration này xong.

## Bốn cái bẫy Windows đã gỡ sẵn

Cả bốn đều không lộ khi đọc code, chỉ lộ khi chạy thật, và đều nổ vào tay người clone tiếp
theo chứ không phải người gây ra:

1. `sops` phải dùng `--output`, không được `>` — PowerShell ghi CRLF làm vỡ timestamp của sops.
2. `path_regex` phải có `[\\/]` và `(\.enc)?` — Windows đưa path dấu `\`, và sops đọc rule
   cả lúc **giải** mã, khi tên file đã mang đuôi `.enc`.
3. Phải khai `--input-type` — đuôi `.enc` vô nghĩa với sops nên nó đoán sai định dạng.
4. `.gitattributes` cần `*.enc -text` — thiếu dòng này, git đổi `.enc` sang CRLF lúc
   checkout và máy mới không giải mã được gì.

Và một luật cho chính hook: **không truyền `--age`** cho sops. Nó ghi đè `creation_rules`
trong `.sops.yaml` và chỉ nêu được một recipient, nên một đường dẫn cần hai recipient sẽ âm
thầm thiếu mất một — chỉ lộ ra khi giải mã ở nơi khác.

## Một cái bẫy riêng của starci: tên container

`PrometheusMetricsService` hỏi cAdvisor bằng `name=~"starci-.+"` rồi **cắt đúng tiền tố
`starci-`** (`CONTAINER_NAME_PREFIX` trong `src/modules/platform/health/constants/probe.ts`)
để ra key thành phần (`postgres`, `redis`, …). Vì vậy tên container ở trạng thái ổn định
bắt buộc phải là `starci-<service>`, không được đổi thành `starci-academy-<service>` cho
"đẹp" — trang kiến trúc public sẽ im lặng rỗng chứ không báo lỗi.

Cửa thoát duy nhất là `STARCI_CONTAINER_PREFIX`, dùng **chỉ** khi cần bật stack mới song
song với stack cũ để đối chiếu.
