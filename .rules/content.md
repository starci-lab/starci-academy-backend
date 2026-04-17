# Quy tắc và Cấu trúc Nội dung Bài giảng (Content Creation Guidelines)

Mọi bài học trong hệ thống phải tuân thủ cấu trúc phân tầng nghiêm ngặt để đảm bảo tính sư phạm và sự rõ ràng. **Phần thân bài (`# body`) chỉ gồm đúng ba mục La Mã: I, II, III** — không thêm phần IV.

**Về ví dụ minh họa trong tài liệu này:** Mọi tình huống cụ thể (ví dụ **Saga**, **Kafka**, **Postman**, một **happy path** hoặc hai nhánh success/failure khi cần…) chỉ là **mẫu** để minh họa **độ chi tiết** và **phong cách** — từng bài thật có thể là chủ đề khác (cache, K8s, DB, bảo mật…) nhưng vẫn giữ **cùng bộ xương**: Hook → Story-first lab (nếu có) → Lý thuyết & insight & kết luận.

---

### 0. Cấu trúc Tệp tin (File Structure)

Mỗi tệp nội dung (`vi.md`, `en.md`) phải bắt đầu bằng các thẻ phân đoạn sau:

- **# title:** Tên bài học (Heading 1).
- **# description:** Một câu plain text ngắn gọn tóm tắt nội dung bài học. Không bold, không link, không bullet list — chỉ văn xuôi thuần túy.
- **# body:** Phần nội dung chi tiết, **chỉ** chia thành **ba phần** dưới đây (I, II, III).

---

## I. Lời mở đầu (The Hook)

**Mục đích:** Tạo vấn đề trước khi định nghĩa khái niệm — khiến người đọc cảm thấy **thiếu** một mảnh kiến thức sẽ bị lộ ngay trong **phỏng vấn** hoặc **review kiến trúc**, từ đó kích thích tò mò và nhu cầu đọc tiếp.

**Cách viết (StarCi style):**

- **Giọng gần gũi, không văn phông:** Dùng tiếng Việt nói thường ngày; tránh từ **cao si**, hình ảnh **tảng đá**, câu **vòng vo** nếu không phục vụ nội dung. Gắt **vừa đủ**: chạm **pain thật** (phỏng vấn, incident, chỗ hay vỡ trên production) thay vì dọa cho oai.
- **Từ vựng phổ thông:** Ưu tiên từ dễ hiểu (**thất bại**, **lỗi**, **giữa chừng**…) thay cho **slang** hoặc từ lóng (tránh kiểu "hẹo", "gãy" khi đã có cách nói thường). Khi cần làm đau câu hỏi, **kèm ví dụ ngắn có tên** (hai **service** A/B, một bước **fail**, **bug** ở một đầu) thay vì chỉ khẳng định chung chung.
- Khi mở bài (hoặc giải thích ngắn) về **xung đột tải đọc/ghi** hay **scale** một **DB**, có thể **neo** bằng tình huống quen: một **service** nghiệp vụ (**Order**, **Payment**…) **ghi** vào một **DB** cụ thể; nhiều hệ thống **API** lệch mạnh về **đọc** — có thể nêu trên **production** tỉ lệ **ghi**/**đọc** kiểu **1/10** hoặc **2/10** (tùy **ứng dụng**) để người đọc **thấy** vì sao tải **đọc** “kéo” **ghi** khi cùng chịu tải (**kết nối**, **lock**, **I/O**…). Con số chỉ **định hướng trực giác**, không nhầm với **benchmark** đo được.
- Bài **CQRS** (hoặc mở bài cùng góc): khi **chốt** ý pattern, có thể nói rõ **tách** **Command** (ghi) và **Query** (đọc) thành **hai** **service** (hoặc **hai** tiến trình triển khai độc lập trong **phần II** / **demo**) thay vì gom **ghi**–**đọc** một chỗ như **monolith** — để khớp demo và tránh hiểu nhầm **CQRS** chỉ là chia **class** trong một **codebase**. Phần III có thể bổ sung: **CQRS** còn áp dụng trong một **service** (hai **model** / hai **DB**) khi bài cần độ chính xác hơn. Khi nói **scale** đọc/ghi, ưu tiên cách nói **đời thường**: **scale** phía **Query** khi lượng **read request** đột biến; **scale** phía **Write** khi lượng **write** / **giao dịch** tăng đột biến — tránh ẩn dụ **văn chương** (nút thắt, mù quáng…) nếu làm loãng ý chính.
- **Demo CQRS (StarCi — repo [`system-design-mastery/cqrs`](https://github.com/StarCi-Academy/resources/tree/main/system-design-mastery/cqrs)):** **đối chiếu README và mã nguồn** trước khi viết phần II. **Monorepo** **NestJS** trong **repo**; app **`command`** (cổng **3000**, **Write Model** / **PostgreSQL**) và **`query`** (cổng **3001**, **Read Model** / **Elasticsearch**); **RabbitMQ** làm **EventBus** đồng bộ **Write** đến **Read** — **không** mô tả **EventBus** chỉ nội bộ **NestJS** nếu **README** ghi **RabbitMQ**; cổng **5672** / file **`.docker/rabbitmq.yaml`** nêu ở **bảng thành phần** hoặc mục chạy môi trường / **README**, **không** bắt buộc nhồi trong đoạn mở ví dụ. Phần mở phần II có thể **vào thẳng ví dụ** (ví dụ *Ví dụ dưới đây là hai **app** …*): hai **app**, luồng **POST** → **CommandBus** → **PostgreSQL** → **`CustomerProfileUpdatedEvent`** trên **RabbitMQ** → **Query** **projection** → **Elasticsearch**; **GET** chỉ **Query** → **Elasticsearch**, không qua **broker** / không đọc **PostgreSQL** của **Command** — **không** bắt buộc mở bằng nhãn **CQRS — demo (NestJS monorepo)** + **monorepo** nếu bài chọn nhịp gọn; dòng **Clone** + bảng + setup vẫn gắn **repo** và **đối chiếu README** (URL đầy đủ trong bài học). **Không** cần nhắc *không phải production* trong đoạn mở. Phải nêu đủ bước **`docker compose`** (**PostgreSQL**, **Elasticsearch**, **RabbitMQ**) theo **README**, rồi **`npm install`** và hai lệnh **`nest start`**. Repo đổi stack thì **cập nhật bài** cho khớp.
- **Demo Saga (StarCi — repo [`system-design-mastery/saga-pattern`](https://github.com/StarCi-Academy/resources/tree/main/system-design-mastery/saga-pattern)):** **đối chiếu README** (topic, **compensation**, **Kafka**). **Saga** qua **Kafka** (file **`.docker/kafka.yaml`**, broker **9092**), ba **service** **Order** / **Payment** / **Inventory** (**3001** / **3002** / **3003**), **mỗi service một DB SQLite** minh họa ranh giới DB, không **orchestrator** trung tâm. Phần II: **không** mở bằng đoạn *clone + Kafka + cổng* dài trước ví dụ luồng — chi tiết chạy nằm ở mục chuẩn bị môi trường / **README**; đoạn mở có thể **gộp** trong **một đoạn**: ví dụ **Saga** + **Kafka** + ba **service** + **mỗi service một DB SQLite** (ranh giới DB) rồi luồng **event**. **Bảng thành phần**, **ảnh** (*Hình 1.* / *Figure 1.*), **`*.drawio`** như quy tắc chung. Phần III có thể đối chiếu **event-driven** với **orchestration**.
- Mở bài bằng **tình huống có thật trong phỏng vấn** hoặc **câu hỏi gài** gắn trực tiếp **chủ đề bài** (không copy máy móc một mẫu cố định). Ví dụ minh họa: so sánh **ACID trong monolith** với **chuỗi thao tác xuyên nhiều service** — người chỉ quen một DB transaction sẽ trả lời lủng củng; đó là **điểm mù** cần lấp. Bài khác có thể gài bằng câu hỏi về **TTL**, **race condition**, **mô hình consistency**… miễn là **mở đúng vết thương** của đúng chủ đề.
- Giọng **thẳng, có độ nảy** (StarCi): nhắm vào **người đọc chưa nắm vững** (trong brand có thể gọi là **beta**) — không nhục mạ cá nhân, nhưng **không xoa dịu** vô nghĩa: để họ thấy chỗ yếu và **chủ động đọc tiếp**.
- **Không** dán khái niệm khô (định nghĩa sách giáo khoa) ở đầu. Chỉ **gài vấn đề**, nói rõ **cần biết gì** (pattern, cơ chế, trade-off) rồi **dẫn thẳng** sang phần II hoặc phần lý thuyết — không **thuyết giảng trước** rồi mới vào bài.
- Kết đoạn mở bài bằng câu **chuyển cảnh** sang phần II (ví dụ có lab: gợi kéo source / chạy thử; bài không lab thì chuyển sang ví dụ số, diagram, hoặc walkthrough phù hợp chủ đề). Có thể kết gọn kiểu *"muốn nắm thì đọc tiếp phần sau"* nếu hợp nhịp bài.

**Thuật ngữ trong `vi.md` (song ngữ có chủ đích):**

- Các từ **chuyên ngành** và tên **pattern** thường giữ **tiếng Anh** trong nội dung: ví dụ **compensation**, **orchestration**, **event-driven**, **idempotency**, **outbox**, **Saga**, **fail**, **concepts** khi ngữ cảnh là kỹ thuật — **không** thay bằng nghĩa tiếng Việt đứng **thay vai trò thuật ngữ** (tránh viết "bù đắp" thay cho **compensation** trong cùng vai trò; tránh ngoặc giải thích dài sau mỗi từ Anh trừ khi bài đích là **giải thuật ngữ**). Bài **Saga** StarCi có thể dùng **event-driven** / *tự phản ứng theo **event*** thay cho **choreography** khi muốn giọng gần **tiếng Việt** hơn.
- Vẫn viết câu quanh khái niệm bằng tiếng Việt tự nhiên; thuật ngữ Anh dùng `**bold**` theo quy tắc **Keyword Highlighting** bên dưới.
- Luồng điều phối qua **broker** / hàng đợi: dùng **message queue** (**message queues**) — **không** viết *"tin nhắn"* (dễ hiểu nhầm sang chat).
- **Source of truth** (đặc biệt **CQRS**, **Read Model** / **projection**): ưu tiên **source of truth** và cụm **multiple sources of truth** khi mô tả **Write** và **Read** lệch nhau — **không** dùng tiêu đề kiểu *hai nguồn sự thật* làm thuật ngữ chính nếu bài đã chốt **source of truth**; có thể thêm câu tiếng Việt quanh khái niệm (ví dụ *thiết kế lỏng*) **sau** hoặc **trong** ngoặc, không thay **source of truth** bằng nghĩa tiếng Việt đứng **thay vai trò thuật ngữ** trong cùng đoạn kỹ thuật.
- **Repo** trong phần II / **Kết quả mong đợi:** gọi là **repo** (hoặc *trong **repo***, *theo **repo***) — **không** viết *repo lab* / *lab repo*; ngữ cảnh đã là **demo** / **mức demo** thì không cần thêm *lab* để chỉ cùng một ý.

---

## II. Demo trực quan & Thực hành (Story-first Lab)

**Mục đích:** Thay vì **brief** kiểu công nghiệp, dẫn người học bằng **chuyện + tay làm** (khi bài có lab): clone repo, chạy stack, thao tác CLI/API/UI, quan sát **hành vi** pattern (thường là **happy path** đủ để “thấy” cơ chế). **Thêm** kịch bản thứ hai (thất bại, miss, v.v.) **chỉ khi** nó **thêm insight** rõ so với nhánh đầu — **không** nhồi nhánh lặp ý hoặc chỉ để đủ “số lượng”. Sau phần này họ phải **nhìn thấy** hành vi thật trước khi đọc lý thuyết sâu ở phần III. **Khi có lab**, ưu tiên **giới thiệu source và cách chạy ngay đầu phần II** — để người **chưa nắm khái niệm** vẫn **bám theo từng bước** và **hình dung** được hệ thống; định nghĩa pattern chi tiết có thể để phần III hoặc sau khi đã quan sát output. **Bài không có lab** thì phần II là **demo tư duy**: ví dụ tính toán, trace giả lập, hoặc walkthrough từng bước trên diagram — vẫn giữ **độ chi tiết** và **StarCi style**, không rút gọn thành slide khô.

**Thuật ngữ — “mức demo” / demo scope**

- **Nghĩa:** **Mức demo** là **phạm vi thực hành** trong **phần II** (có **repo** chạy được): **clone**, **Docker** / **localhost**, làm theo **README**, **quan sát** luồng pattern (thường một **happy path**; thêm nhánh đối lập **khi** bổ sung insight). Mục tiêu là **học đúng cơ chế** và **nhìn thấy hành vi**, không phải mô phỏng **đầy đủ** một hệ **production**.
- **Không gồm** (trừ khi bài **chủ đích** nói): **SLO**/SLA đầy đủ, **HA** đa vùng, hardening bảo mật biên, giám sát/vận hành như **on-call** thực, tối ưu chi phí cloud — các mặt đó (khi cần) thuộc **phần III** hoặc bài riêng. **Broker**/**DB** trong **Docker** vẫn có thể là **thật** (ví dụ **RabbitMQ**), nhưng đó là **để chạy tay** trong **demo**, không tự đồng nghĩa đã triển khai **production-grade**.
- **Cách viết:** Ưu tiên *“**CQRS** ở mức **demo**”*, *“đúng tinh thần pattern trong **demo** này”*, **EN** *“at **demo** scope”* thay vì *“mức **lab**”* — trừ khi ngữ cảnh là **phòng lab** / **bài tập** theo nghĩa giáo dục. Lần **đầu** dùng **mức demo** có thể gắn ngắn *(chạy local / theo **README**)* nếu cần; **không** bắt buộc lặp disclaimer *không phải production* trong đoạn mở phần II khi bài đã **brief** và phần III đã nói **edge case** triển khai thật.

**Cách viết:**

1. **Giới thiệu source trước (khuyến nghị khi có lab):** Mở phần II bằng vài câu về **repo** — stack (ví dụ **NestJS** **monorepo**), kiến trúc tối thiểu (bao nhiêu **service**, **broker** / **message queue** nếu có, DB mẫu như **SQLite**) — sao cho người đọc **chưa đọc lý thuyết** vẫn biết đang cầm file gì và **làm theo** được; **không** bắt buộc mở bằng đoạn định nghĩa pattern dài ở đây nếu làm lu mờ luồng **chạy thử**. **Bắt buộc khớp README / compose thật:** nếu lab dùng **RabbitMQ**/**Kafka** để đồng bộ, phải gọi đúng tên và bước **Docker** như trong repo — **không** suy đoán cơ chế (**EventBus** in-process vs **broker** ngoài) trái với source. Khi bài có **nhiều service** + **broker** (ví dụ **CQRS**, **Saga**), ngay sau đoạn **clone** có thể thêm **bảng thành phần** bốn cột và **ảnh sơ đồ** (embed URL) — không bắt buộc mọi bài, nhưng **khuyến nghị** khi không có bảng / sơ đồ thì khó **bám** kiến trúc. **Bảng — stack “đủ” thành phần:** Khi demo có **broker** và/hoặc **store** chạy **Docker** / có **cổng** riêng (ví dụ **PostgreSQL**, **Elasticsearch**, **RabbitMQ**, **Kafka**), ưu tiên **mỗi thành phần một hàng** trong **bảng** (khớp **README** / compose), để đủ lớp với **sơ đồ**. **Ngoại lệ — DB cục bộ / nhẹ:** **SQLite** (file trong **repo**, gắn với từng **service** để minh họa ranh giới DB) **không** cần tách thành hàng hạ tầng riêng; ghi **SQLite** ở cột **Công nghệ** của **service** (và có thể gom **Kafka** / **broker** thật thành một hàng nếu chưa lặp ở từng **service**). **Chú thích sơ đồ (VI / EN):** ngay **dưới** ảnh, **hai dòng** (hai đoạn Markdown): **dòng 1** — **in nghiêng** *Hình 1. …* / *Figure 1. …* (dấu chấm sau số, không dùng gạch em **—** làm tiêu đề hình), ví dụ *Hình 1. Sơ đồ kiến trúc hệ thống từ source code trên.* / *Figure 1. System architecture diagram from the source above.*; **dòng 2** — đoạn riêng mô tả luồng (có thể **bold** từ khoá), **không** dính cùng một dòng với tiêu đề hình — **không** gắn cụm *khớp README* trong chú thích hình; **không** chèn hướng dẫn **nội bộ** (chỉnh **drawio**, export **PNG**/**SVG**, upload **CDN**…) trong thân **# body** dành cho học viên. Ngay sau đó dùng template:
   - VI (thân thiện, khuyến nghị): một dòng thường (paragraph), **không** dùng blockquote Markdown (`>`): `**Clone** ở đây: [Tên bài ngắn gọn](URL)`
   - EN (tương đương): plain line, **no** blockquote: `**Clone** here: [Short lesson title](URL)`
   - Có thể dùng biến thể gần nghĩa (**Kéo repo** về đây:, **Repo:** …) nếu khớp giọng bài; tránh chỉ ghi khô **Source code:** nếu muốn nhịp gần gũi.
2. **Phủ đầu bằng lời dẫn ngắn (tùy bài):** Nếu chưa nói đủ ở trên, giải thích *tại sao* cần làm tay (ví dụ chủ đề **phụ thuộc thứ tự thời gian / side effect** thì không chạy và không xem output là vẫn lý thuyết suông).
3. **Thiết lập từng bước, không nhảy cóc:**
   - Giả định môi trường tối thiểu đã có (ví dụ **Docker**, **Node.js**); các bước tuần tự có thể dùng **list có thứ tự** (`1.` `2.` `3.`) kèm mô tả ngắn + **code block** — gọn và dễ bám. Có thể vẫn dùng **Bước 1** / **Step 1** dạng heading nhỏ nếu bài cần; **không** bắt buộc bọc ngoài trong `- **Các bước thực hiện:**` nếu làm rườm. Diễn đạt chỗ chạy lệnh: ưu tiên **Từ repo** / **trong repo** (đã **clone**), tránh vòng **thư mục root của repo** nếu không cần thiết.
   - Lệnh shell / Docker / CLI đặt trong **code block** Markdown, không nhúng lệnh vào giữa câu.
   - Tiêu đề tiểu mục kiểu chuẩn bị môi trường có thể **chỉ tiếng Việt** (ví dụ `### 1. Chuẩn bị và chạy môi trường`) — **không** bắt buộc thêm song ngữ `(Setup & Run)` nếu muốn gọn.
4. **Sau khi môi trường sẵn sàng:** Ghi **Kết quả mong đợi** và **Kết luận** dưới dạng **đoạn văn** hoặc tiêu đề nhỏ + đoạn (tránh bắt buộc dùng bullet `-` nếu muốn nhìn gọn). Với **service** + cổng, nên viết **trực quan** (từng **service** gắn một port). Trong ngữ cảnh **microservices**, ưu tiên gọi là **service** thay vì **process** khi nói các tiến trình nghiệp vụ. **Kết luận** ở bước chạy **môi trường demo** (setup) có thể **ngắn** (đủ ý: độc lập, DB riêng, giao tiếp qua broker…) — **không** nhồi thêm mở rộng (ví dụ **2PC**, học thuyết dài) nếu phần đó thuộc phần III.
5. **### Thử nghiệm (Try it out)** — khi có tương tác API/CLI/UI, **ưu tiên** một **happy path** rõ (đủ **method** / URL / body / kết quả). **Thêm** nhánh thứ hai (thất bại, miss, denied…) **khi** chủ đề **cần** đối chiếu hoặc nhánh đó **không** lặp ý đã nói ở phần III — **không** bắt buộc hai nhánh nếu nhánh thứ hai **vô nghĩa** hoặc chỉ lặp lại insight đã có trong lý thuyết. Chỉ dùng **Compensation** khi bài thật sự nói về **compensation** / rollback trong đúng ngữ cảnh kỹ thuật.

**Quy tắc cho phần Thử nghiệm (HTTP):**

- Người học có thể **làm theo** bằng **client có giao diện** (ví dụ **Postman**, **Insomnia**, **Bruno** …) **hoặc** bằng **`curl`** trong **terminal** trên **Linux**/**macOS**; trên **Windows** thì **cài WSL2** rồi chạy **`curl`** trong shell Linux — **không** viết nhánh **CMD**/**PowerShell** thuần. Vẫn nêu đủ **method**, URL đầy đủ (`http://localhost:PORT/...`), **body** **JSON** trong văn bản; **`curl`** trong code block là **câu lệnh tương đương** với request đã mô tả (tùy chọn bổ sung), không thay thế mô tả **method**/URL/body.
- **Không** giải thích sớm ở đoạn mở đầu mục thực hành các ràng buộc giữa bước (ví dụ **orderId** lấy từ bước trước, thay số mẫu **42**) nếu làm **loãng** hoặc **lệch thứ tự** so với lúc người đọc đang làm — **nhắc đúng lúc**: ngay tại **bước** / **dòng body** / câu ngay trước request cần giá trị đó.
- **Câu lệnh `curl` tương đương** trong code block (môi trường **Linux** / **macOS** / **WSL2**); không mặc định thêm **PowerShell** / **Invoke-RestMethod** trừ khi bài đích là Windows-native. Không thay thế việc mô tả **method** / URL / body trong văn bản. Với mỗi **bước** HTTP: **method** / URL / **headers** (nếu cần) / **body** → ngay sau đó là **`curl`** (nếu có) → rồi tới **response** / kết quả mong đợi tại bước đó (nếu có) — **không** để **`curl`** xuống sau khối **response** khi cả hai đều thuộc cùng một bước.
- Khi có **nhiều nhánh** (thành công / thất bại…), mỗi nhánh sau **không** viết tắt so với nhánh trước: vẫn đủ **method** / URL / body, **`curl`**, **response** (khi bài cần minh họa body trả về) — chỉ đổi **input** / tham số tạo nhánh.
- Ghi rõ **input / tham số nào** tạo nhánh nào (thay vì một bộ ví dụ cố định — mỗi bài tự chọn ví dụ sát chủ đề).
- **Kết quả mong đợi** theo từng thành phần có thể quan sát (HTTP status, body, log, metric, hàng đợi… tùy bài). Nếu bài gắn **repo**, mô tả **sự kiện** / **topic** / **field** đúng như **source** (có thể kèm **đường dẫn file** trong repo — ví dụ `apps/.../foo.service.ts`); **không** viết kiểu *"(hoặc tên tương đương trong code)"* thay cho việc ghi rõ hằng số / tên trong code.
- **Kết luận** từng nhánh phải **đúng ngôn ngữ chủ đề** (ví dụ bài về **Saga** thì nói **eventual consistency** và **compensation**; bài về **cache** thì nói hit rate và stampede; không áp dụng máy móc một mẫu cho mọi bài). Tránh từ quá học thuật khi có cách nói thường (ví dụ nói **ba service** / **cả ba service** thay cho **boundary** nếu người đọc chưa quen).

**Template tiểu mục gợi ý cho phần II** (đổi tên cho khớp bài; **không** bắt buộc đủ mọi mục — có thể **bỏ** phần “đọc repo / kiến trúc snapshot” nếu chuyển thẳng vào **thực hành**):

- `### 1. Chuẩn bị và chạy môi trường` (có thể thêm bản EN trong ngoặc nếu cần đồng bộ `en.md`)
- `### 2. …` — **luồng thành công** hoặc **happy path** (câu hỏi dạng *… diễn ra như thế nào?*): bước gọi HTTP rõ (GUI client hoặc **`curl`** trên **Linux**/**macOS**/**WSL2**; đủ **method**/URL/body), **Kết quả mong đợi**, **Kết luận** ngắn bằng tiếng phổ thông.
- `### 3. …` — **tùy chọn**: **luồng thất bại** / **compensation** / nhánh lỗi / nhánh đối lập **có giá trị** (tách **riêng** khỏi mục 2 khi có): **cùng độ chi tiết** với mục 2 — **không** viết tắt kiểu chỉ **POST** + URL; vẫn **method** / URL / **headers** (khi cần) / **body** → **câu lệnh `curl` tương đương** (nếu có) → **response** tại bước (nếu có) → **Kết quả mong đợi** / **Kết luận**. **Bỏ** mục 3 nếu một **happy path** đã đủ và lý thuyết phần III đã cover các edge case.

Có thể gom nhãn **Thử nghiệm** vào tiêu đề mục 2 (và mục 3 nếu có) thay vì tách `### 4. Thử nghiệm` rồi mới chia nhánh — miễn người đọc **chạy được**; khi có hai nhánh thì **đối chiếu** rõ ràng, khi một nhánh thì **chốt** đúng luồng đã chạy.

**Kết thúc phần II:** Một đoạn **chốt cảm nhận** đúng chủ đề, rồi **hook** sang phần III — ví dụ mẫu (chỉ là minh họa): *"Sau luồng vừa chạy, tiếp theo là các khái niệm và edge case trên production."* hoặc (khi bài có **hai** nhánh thực sự cần thiết) *"Sau hai kịch bản, …"* — **không** bắt buộc nhắc *"phần III"* hay *"đi sâu"* theo kiểu mục lục khô; ưu tiên câu **chuyển cảnh** tự nhiên. Có thể nối **bài tập** (nếu có).

---

## III. Giải thích nâng cao & Kết luận (Theory, Trade-offs, Insight)

**Mục đích:** Đặt tên, phân loại, và đưa **insight** mà phần II không kịp nói hết: trade-off, điểm yếu, edge case, mối liên hệ với các pattern / công cụ liên quan — **theo đúng chủ đề bài** (phân tán, hiệu năng, bảo mật, vận hành…). Ví dụ với bài **giao dịch xuyên service** có thể nhắc **Outbox**, **idempotency**, **delivery semantics**, crash giữa chừng; bài khác thì nhắc bộ khái niệm tương ứng. **Bài tập** / hướng đọc thêm là **tùy bài** — không bắt buộc nếu phần III đã đủ insight và kết luận.

**Cách viết:**

- Dùng các mục `### 1.`, `### 2.`, `### 3.` cho từng khối lý thuyết; tiêu đề **chỉ** số thứ tự + tên khái niệm — **không** thêm tiền tố "Bước X:" trong heading.
- **Tiêu đề phần III (VI):** ưu tiên góc **khái niệm + vì sao quan trọng** trong ngữ cảnh bài — ví dụ *… là gì và tại sao nó quan trọng trong microservices*; **tránh** cách nói sáo rỗng kiểu *"chỗ nó đứng trong …"* nếu không mang thêm ý cụ thể cho người đọc. **EN** tương đương: *What X is and why it matters in …* thay vì *where it sits* khi chỉ muốn mở bài bằng định nghĩa và stakes.
- Mỗi mục `###` bắt đầu bằng **một đoạn câu chủ đề** (topic sentence) ngay dưới tiêu đề.
- **Ví dụ:** Mỗi ví dụ là một **top-level bullet**. Một ví dụ: `- **Ví dụ:**`; nhiều ví dụ: `- **Ví dụ 1:**`, `- **Ví dụ 2:**`. Bên trong có thể lồng bullet cho chi tiết, ưu/nhược. Khi ví dụ **bám** phần thực hành phần II, dùng *demo ở phần trên* / *the demo above* — **không** dùng *"demo của bạn"* / *"your demo"* (ngôi thứ hai không cần thiết). Ví dụ **chỉ minh họa** (không có trong lab — ví dụ luồng **orchestration** khi phần II là **event-driven**): có thể ghi **thẳng** luồng (**Kafka**, topic, **compensation**…) **không** cần câu dẫn dài trong ngoặc *"(Chỉ minh họa — demo phần trên…)"* trước từng bullet; nếu cần phân biệt với phần II, nhắc **một lần** ở đoạn văn ngay trước danh sách ví dụ.

**Nội dung nên có (checklist linh hoạt — chọn mục sát chủ đề, không nhồi hết):**

- **Phân loại / đối chiếu:** ví dụ với kiến trúc phân tán có thể là **event-driven** (tự phản ứng) vs **Orchestration**; với storage có thể là **OLTP** vs **OLAP**; mỗi bài tự chọn cặp khái niệm **có ý nghĩa phân biệt**.
- **Trade-off và failure mode:** điều gì **đổi** khi scale, khi mất mạng, khi duplicate message, khi deploy sai — chỉ nêu **những gì liên quan trực tiếp** tới bài. Khi cần **production** vs demo: có thể mở bằng câu **tự nhiên** (ví dụ *Demo chạy local thì không sao; trên production…*) rồi **liệt kê** **edge case**; mỗi bullet có thể là một ý đọc giống người viết (tiêu đề ngắn + vài câu), **không** bắt buộc nhãn khô **Vấn đề:** / **Cách xử lý:** từng dòng — miễn rõ **vấn đề** và **hướng giải quyết** (lý thuyết: **idempotency**, **outbox**, **DLQ**, **reconciliation**…).
- **Pattern liên quan (khi đúng ngữ cảnh):** ví dụ **Transactional Outbox**, **idempotency**, semantics của message — không bắt buộc mọi bài đều có; chỉ dùng khi phần II hoặc chủ đề bài chạm tới.
- **Kết luận cuối bài:** Một hoặc vài **đoạn văn** nối insight và **điểm mấu chốt** — **không** bắt buộc tiêu đề riêng kiểu **Insight:** hay **Kết luận cuối cùng:** nếu luồng đọc đã trơn; ưu tiên giọng **kiến trúc sư** trung tính; **không** gắn nhãn **beta** / chọc người đọc; **không** kết bằng câu gắn **phỏng vấn** / **slide** / *"nếu không nắm … thì …"* trừ khi bài **chủ đích** tone đó. **Bài tập** (nếu có) **khớp chủ đề**, không copy mẫu; nhiều bài **không** cần bài tập nếu đã đủ nội dung.

---

### Quy tắc định dạng chung (Formatting Rules)

1. **Strictly Icon-free:** Không sử dụng emoji hoặc icon trong các đoạn văn bản kỹ thuật.
2. **Giọng StarCi trong bài:** Kỹ thuật chính xác, câu chữ rõ; **tránh văn phông** và **từ cao si** không cần thiết. Mục tiêu là **chạm pain thật** và dẫn người học đi tiếp, không công kích cá nhân. **Viết tắt:** không dùng **HA** và các từ tắt tương tự nếu chưa viết đủ (**high availability**) hoặc chưa gắn nghĩa rõ trong câu; **DB** được phép ngắn. Tránh thuật ngữ kiểu **God service** — mô tả bằng ý dễ hiểu (ví dụ orchestrator **nhồi quá nhiều logic nghiệp vụ** thay vì chỉ **điều phối** bước).
3. **Consistency:** Luôn có đủ cả bản tiếng Việt (`vi.md`) và tiếng Anh (`en.md`) với nội dung tương đồng.
4. **Keyword Highlighting (Tô đậm từ khoá):** Dùng `**từ**` để tô đậm từ khoá quan trọng **trong câu văn thường** (không phải heading). Áp dụng cho:
   - Tên khái niệm kỹ thuật: `**Scalability**`, `**ACID**`, `**CAP Theorem**`
   - Tên công nghệ cụ thể: `**Redis**`, `**Kafka**`, `**Kubernetes**`, `**NestJS**`
   - Con số hoặc ngưỡng quan trọng: `**50ms**`, `**99.99%**`, `**10.000 req/s**`
   - Thuật ngữ kiến trúc cốt lõi: `**Single Point of Failure**`, `**Eventual Consistency**`, `**Self-healing**`
   - Cụm từ nhấn mạnh trong câu dẫn: `**"một cục code gánh tất cả"**`, `**"hỏng một cách có kiểm soát"**`
   - **Không** tô đậm mọi thứ — chỉ những từ thực sự cần nổi bật khi lướt qua.
