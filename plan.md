# Plan rewrite challenge theo rule

## Muc tieu

- Viet lai 5 challenge theo dung framework trong `.rules/contents/base.md`.
- Giu dung ngu canh khoa hoc **Fullstack Mastery**.
- Bam sat level trong ten challenge: `easy` chi co pham vi co ban, `medium` bo sung trade-off, failure scenario va Mermaid.

## Pham vi challenge can rewrite

1. `0-order-inventory-cross-module-di-easy`
2. `0-book-pipeline-lifecycle-easy`
3. `1-article-auth-role-crud-medium`
4. `0-payment-gateway-config-namespaces-easy`
5. `1-correlation-id-mask-logger-medium`

## Ban viet lai de duyet truoc

### Challenge 1 - Order Inventory Cross-Module DI

- **Challenge title:** Order Inventory Cross-Module DI
- **Key takeaway(s):** **Dependency Injection**, **Module boundary**, **Provider export/import**
- **Boi canh:** Team dang xay dung API tao don hang. Luong tao don hang can goi logic tru ton kho tu module inventory, nhung code hien tai bi tach roi va khong inject duoc service giua cac module.
- **Input (dau vao):**
  - Co san module order va module inventory.
  - Don hang gom `productId` va `quantity`.
  - Khi inventory khong du so luong, phai tra loi loi nghiep vu ro rang.
- **Requirements:**
  - Dung cau hinh module chuan de inject duoc inventory service vao order service.
  - Khong hard-code tao instance thu cong (`new InventoryService()`).
  - Co kiem tra ton kho truoc khi xac nhan tao don.
- **Steps:**
  1. Xac dinh provider nao thuoc module inventory va can export.
  2. Import module inventory vao module order theo dung boundary.
  3. Inject inventory service trong order service thong qua constructor.
  4. Viet luong `createOrder`: check ton kho -> tru ton -> tao don.
  5. Thu nghiem voi case ton kho du va khong du.
- **Output can dat:**
  - So do phu thuoc module don gian (order -> inventory).
  - Pseudo-code hoac code snippet cho constructor injection va `createOrder`.
  - Checklist "khi nao dung/khong dung cross-module injection".
- **Tieu chi dat/khong dat:**
  - Dat: order service inject inventory service thong qua DI container.
  - Dat: ton kho duoc kiem tra truoc khi tao don.
  - Dat: khong con khoi tao service bang tay.
  - Khong dat: module import/export sai lam app khong boot hoac runtime fail.

### Challenge 2 - Book Pipeline Lifecycle

- **Challenge title:** Book Pipeline Lifecycle
- **Key takeaway(s):** **Request lifecycle**, **Middleware**, **Guard**, **Pipe**, **Interceptor**
- **Boi canh:** Team can dung API tao sach de day thanh vien moi cach request di qua tung lop trong NestJS. Muc tieu la nhin ro thu tu xu ly va vai tro cua moi thanh phan pipeline.
- **Input (dau vao):**
  - Endpoint tao sach: `POST /books`.
  - Body gom `title`, `author`, `price`.
  - Co token gia lap cho xac thuc request.
- **Requirements:**
  - Co day du cac lop lifecycle co ban: middleware, guard, pipe, interceptor, controller, service.
  - Moi lop phai co dau hieu de theo doi thu tu thuc thi (log marker).
  - Validation body bat buoc cho field chinh.
- **Steps:**
  1. Them middleware gan request id va log diem vao.
  2. Them guard de chan request khong co token hop le.
  3. Them validation pipe cho DTO tao sach.
  4. Them interceptor de do thoi gian xu ly va wrap response.
  5. Goi API voi case hop le va khong hop le de doi chieu thu tu log.
- **Output can dat:**
  - Timeline request lifecycle dang bullet theo thu tu thuc thi.
  - Mau request/response cho case pass va case fail validation.
  - Ket luan ngan "vai tro tung lop trong pipeline".
  - Output field cho `ChallengeEntity`: mot doan markdown tong hop 3 y tren de luu vao cot `output`.
- **Tieu chi dat/khong dat:**
  - Dat: request di dung thu tu middleware -> guard -> pipe -> controller/service -> interceptor.
  - Dat: body sai schema bi chan truoc khi vao business logic.
  - Dat: response co thong tin wrap co cau truc ro rang.
  - Khong dat: thieu marker log nen khong doi chieu duoc lifecycle.

### Challenge 3 - Article Auth Role CRUD

- **Challenge title:** Article Auth Role CRUD
- **Key takeaway(s):** **Authentication**, **Authorization (RBAC)**, **Guard chaining**, **CRUD design**
- **Boi canh:** Team xay dung module bai viet co 3 vai tro: guest, editor, admin. He thong can dam bao dung quyen theo tung thao tac CRUD va co kha nang mo rong policy ve sau.
- **Input (dau vao):**
  - Tai nguyen: article gom `id`, `title`, `content`, `status`, `authorId`.
  - Role:
    - guest: chi doc bai da publish.
    - editor: tao/sua bai cua minh.
    - admin: toan quyen CRUD.
  - Header token da chua user id va role (gia lap JWT payload).
- **Requirements:**
  - Co it nhat 2 workload: read public va write private.
  - Co failure scenario: token thieu/sai, role khong du quyen, update khong dung owner.
  - Co Mermaid diagram mo ta authn + authz + article flow.
  - Co bang trade-off Option A/B cho cach to chuc phan quyen.
- **Steps:**
  1. Dinh nghia route CRUD article va policy role cho tung route.
  2. Tach auth guard (xac thuc) va roles/ownership guard (phan quyen).
  3. Thiet ke luat ownership cho editor khi update/delete.
  4. Viet test matrix cho role x operation (read/create/update/delete).
  5. Chay thu cac case denied va allowed, ghi nhan response contract.
- **Output can dat:**
  - Mermaid diagram pipeline request voi guard chaining.
  - Bang trade-off:
    - Option A: role check trong guard.
    - Option B: role check trong service/policy layer.
  - Risk checklist: bypass guard, trust payload sai, owner check thieu.
  - API contract cho loi `401` va `403`.
- **Tieu chi dat/khong dat:**
  - Dat: phan biet ro `401` (chua auth) va `403` (khong du quyen).
  - Dat: editor khong sua/xoa bai cua user khac.
  - Dat: guest khong truy cap route write.
  - Dat: co du diagram + trade-off + risk checklist theo level medium.
  - Khong dat: logic phan quyen nam rac o controller, kho mo rong.

### Challenge 4 - Payment Gateway Config Namespaces

- **Challenge title:** Payment Gateway Config Namespaces
- **Key takeaway(s):** **ConfigModule**, **Configuration namespace**, **Typed config**
- **Boi canh:** Team can tich hop cong thanh toan cho moi truong dev/staging/prod. Muc tieu la to chuc cau hinh theo namespace de de bao tri, tranh doc env truc tiep khap noi.
- **Input (dau vao):**
  - Bien moi truong co cac nhom: endpoint, api key, timeout, retry.
  - Ung dung co payment service su dung config khi goi gateway.
  - Yeu cau tach rieng config payment khoi config he thong chung.
- **Requirements:**
  - Dinh nghia namespace config rieng cho payment.
  - Validate bien quan trong khi app startup.
  - Service doc config thong qua `ConfigService`/typed accessor, khong `process.env` truc tiep.
- **Steps:**
  1. Tao file config namespace `payment`.
  2. Mapping env vao object config co cau truc ro rang.
  3. Cau hinh validate schema cho cac field bat buoc.
  4. Inject config vao payment service de dung timeout/retry/endpoint.
  5. Test startup fail-fast khi thieu env quan trong.
- **Output can dat:**
  - Cau truc config object cho `payment`.
  - Danh sach env bat buoc va gia tri mac dinh hop ly.
  - Checklist "safe config practices" cho env nhay cam.
- **Tieu chi dat/khong dat:**
  - Dat: payment service khong dung `process.env` truc tiep.
  - Dat: app fail-fast khi thieu config critical.
  - Dat: config theo namespace de tim va sua de dang.
  - Khong dat: env key nam phan tan, kho audit va kho test.

### Challenge 5 - Correlation ID Mask Logger

- **Challenge title:** Correlation ID Mask Logger
- **Key takeaway(s):** **Structured logging**, **Correlation ID**, **Sensitive data masking**, **Interceptor**
- **Boi canh:** He thong can tang kha nang debug request lien service ma van dam bao khong lo du lieu nhay cam tren log. Team can thiet ke logging strategy cho API xu ly thong tin nguoi dung.
- **Input (dau vao):**
  - Co endpoint nhan payload co the chua `email`, `phone`, `cardNumber`.
  - Moi request can co correlation id de truy vet.
  - Log output hien tai dang plain text, thieu cau truc.
- **Requirements:**
  - Co it nhat 2 workload: success path va error path.
  - Co failure scenario: thieu correlation id, mask sai regex, log lo PII.
  - Co Mermaid diagram mo ta log flow tu request vao den response/exception.
  - Co bang trade-off Option A/B cho vi tri mask (middleware vs interceptor/logger layer).
- **Steps:**
  1. Chon quy uoc tao/nhan correlation id tu header.
  2. Them middleware/interceptor gan correlation id vao context log.
  3. Xay dung mask rule cho field nhay cam truoc khi ghi log.
  4. Chuan hoa log format JSON gom `timestamp`, `level`, `message`, `correlationId`.
  5. Chay thu request thanh cong va request loi de doi chieu log output.
- **Output can dat:**
  - Mermaid diagram request -> logger -> sink.
  - Bang trade-off:
    - Option A: mask tai middleware.
    - Option B: mask tai logger transport/interceptor.
  - Risk checklist: bo sot field nhay cam, id khong dong nhat, log volume tang.
  - Test plan ngan cho masking va traceability.
- **Tieu chi dat/khong dat:**
  - Dat: moi dong log cua cung request co cung correlation id.
  - Dat: du lieu nhay cam duoc mask on dinh o ca success va error path.
  - Dat: log co cau truc JSON de query tren cong cu quan sat.
  - Dat: co du diagram + trade-off + rui ro theo level medium.
  - Khong dat: van xuat hien raw PII trong log.

## Ghi chu de implement sau khi duyet

- Sau khi thay duyet `plan.md`, se tao/ghi file challenge thuc te theo dung ten challenge va format markdown thong nhat.
- Neu can, se bo sung ban EN/VI tuong ung theo content language.
