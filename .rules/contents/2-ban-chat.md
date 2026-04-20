# Quy định soạn thảo Phần II (Core Concepts & Demo)

Tài liệu này quy định cấu trúc và văn phong bắt buộc đối với Phần II trong mỗi bài học.

### Tiêu đề bắt buộc
Phần 2 của bài học bắt buộc phải bắt đầu bằng tiêu đề (Heading 2):
`## II. Bản chất`

---

### Cấu trúc Nội dung: (Trường hợp 1 - Có Source Code Demo)

Nếu chủ đề bài học đi kèm với mã nguồn (source code) để demo chạy thực tế, phần này cần phải làm rõ toàn bộ bức tranh kiến trúc hệ thống trước khi đi sâu vào lý thuyết, giúp học viên "nhìn thấy" vấn đề trực quan nhất.

**Cách thức triển khai:**

> **Quy tắc hình ảnh:** KHÔNG được nhúng hình ảnh external vào bài viết (`![...](https://...)`). Mọi sơ đồ kiến trúc phải vẽ bằng ***Mermaid*** code block.

1. **Thông báo hệ thống Demo và Bảng Thành Phần:** 
   Viết một đoạn văn ngắn khái quát sơ đồ kiến trúc các dịch vụ đang chạy. Chỉ rõ công nghệ sử dụng, cấu trúc (như ***monorepo***), và cách chúng giao tiếp. Tách từng ý chính ra kiểu list (danh sách trải dài bằng gạch đầu dòng) cho mạch lạc và dễ đọc hơn.
   
   Ngay sau đoạn mô tả dạng list, tác giả phải cung cấp đường dẫn clone mã nguồn theo đúng định dạng bắt buộc nằm riêng trên một dòng:
   `Clone tại [đây](url)` 
   *(VD: Clone tại [đây](https://github.com/StarCi-Academy/xyz))*
   
   Tiếp đến, **bắt buộc phải vẽ một bảng (table) gồm 5 cột cơ bản** để chi tiết hóa các thành phần *(ghi chú: có thể linh hoạt thêm/xóa cột tùy theo đặc tính kỹ thuật của từng bài)*:
   - **Thành phần:** Tên dịch vụ hoặc đối tượng kiến trúc (VD: `postgres-app`, `Postgres Pod`).
   - **Cổng nội bộ (ClusterIP):** Cổng giao tiếp bên trong mạng nội bộ. Bỏ trống hoặc gạch ngang `-` nếu không có.
   - **Cổng local (port-forward):** Cổng gọi từ bên ngoài vào mạng local.
   - **Công nghệ:** Core stack đang dùng (VD: `NestJS`, `PostgreSQL 16`).
   - **Trách nhiệm:** Giải thích ngắn gọn vai trò xử lý của component đó.

   *Xem 3 ví dụ tham khảo dưới đây để nắm rõ cấu trúc đoạn văn list + Clone link + bảng:*
   
   **Ví dụ 1 (Bài NATS Pub/Sub):**
   > Ví dụ dưới đây là bốn ***service NestJS*** kết nối vòng qua ***NATS***:
   > - Một ***publisher-service*** (cổng 3001) nhận ***POST*** từ client và ***publish***.
   > - Ba ***subscriber*** (Analytics, Notification, Audit) nghe ***NATS***.
   > - Chế độ ***core Pub/Sub*** không lưu ***message*** lên disk.
   >
   > Clone tại [đây](https://github.com/StarCi-Academy/resources/tree/main/system-design-mastery/publish-subscribe-pattern)
   >
   > | Thành phần | Cổng nội bộ | Cổng local | Công nghệ | Trách nhiệm |
   > |---|---|---|---|---|
   > | **Publisher Service** | 3001 | 3001 | NestJS | Nhận POST request để publish event |
   > | **NATS Server** | 4222 | 4222 | NATS | Mạng lưới định tuyến nội bộ phân phát message |
   > | **Analytics Sub** | — | — | NestJS | Lắng nghe event và đếm dữ liệu thống kê |
   > | **Notification Sub** | — | — | NestJS | Lắng nghe event và gửi thông báo giả lập |
   > | **Audit Sub** | — | — | NestJS | Lắng nghe event và ghi log audit |

   **Ví dụ 2 (Bài Giới thiệu Kubernetes):**
   > Chúng ta sẽ dựng một ***single-node cluster*** bằng ***Minikube***:
   > - ***MySQL*** (Port 3306): Database độc lập lưu trữ.
   > - ***Nginx*** (Port 80): Web server chứa content tĩnh.
   >
   > Clone tại [đây](https://github.com/StarCi-Academy/resources/tree/main/system-design-mastery/introduction-to-kubernetes)
   >
   > | Thành phần | Cổng nội bộ | Cổng local | Công nghệ | Trách nhiệm |
   > |---|---|---|---|---|
   > | **MySQL Pod** | 3306 | 3307 | MySQL 8.0 | Standalone database cho ứng dụng |
   > | **Nginx Pod** | 80 | 8080 | Nginx | Web server chứa dữ liệu HTML tĩnh |
   > | **Game 2048 Pod** | 80 | 8081 | HTML5 | Web game 2048 mini làm mẫu |

   **Ví dụ 3 (Bài Helm Charts & HA Database):**
   > Triển khai ba cụm ***database*** chuẩn ***production*** bằng ***Helm Chart***:
   > - ***MongoDB Sharded*** (11 Pod): Chia làm 2 Shard song song.
   > - ***PostgreSQL HA*** (5 Pod): Master-Slave Auto failover.
   >
   > Clone tại [đây](https://github.com/StarCi-Academy/resources/tree/main/system-design-mastery/complex-applications-and-helm-charts)
   >
   > | Thành phần | Cổng nội bộ | Cổng local | Công nghệ | Trách nhiệm |
   > |---|---|---|---|---|
   > | **MongoDB Sharded** | 27017 | — | MongoDB | 2 Shard x 3 Replica, cùng Mongos Router phân luồng |
   > | **PostgreSQL HA** | 5432 | — | PostgreSQL | 3 Node Repmgr và 2 Pgpool tự động failover |
   > | **Redis Cluster** | 6379 | — | Redis 7+ | 3 Master và 3 Slave phân cực tự động bằng Slots |

2. **Vẽ sơ đồ giao tiếp bằng [Mermaid](https://mermaid.js.org/) (Khuyến khích đọc docs của nó để vẽ):** 
   Thay vì chỉ nói suông, tác giả bắt buộc phải vẽ sơ đồ minh hoạ giao tiếp hoặc mô hình mạng lưới bằng Mermaid code block. Hình thái của sơ đồ cần linh hoạt theo đề bài. Dưới đây là 3 ví dụ cho 3 trường hợp tương ứng ở Bước 1:
   
   **Ví dụ 1 (Sơ đồ NATS Pub/Sub - Cấu trúc lan toả):**
   ```mermaid
   graph TD
       Client((Client)) -->|POST /events| Pub[Publisher Service:3001]
       Pub -->|Publish app.events| NATS{NATS Server:4222}
       NATS -->|Broadcast| Sub1(Analytics Sub)
       NATS -->|Broadcast| Sub2(Notification Sub)
       NATS -->|Broadcast| Sub3(Audit Sub)
   ```

   **Ví dụ 2 (Sơ đồ K8s Minikube - Cấu trúc Node song song):**
   ```mermaid
   graph LR
       subgraph Minikube Cluster
           MySQL[(MySQL Pod:3306)]
           Nginx[Nginx Pod:80]
           Game[Game 2048 Pod:80]
       end
       Local1((Local:3307)) -.->|port-forward| MySQL
       Local2((Local:8080)) -.->|port-forward| Nginx
       Local3((Local:8081)) -.->|port-forward| Game
   ```

   **Ví dụ 3 (Sơ đồ Helm HA Database - Cấu trúc Phân cụm Group):**
   ```mermaid
   graph TD
       subgraph K8s namespace: database
           Mongos(Mongos Router) --> Shard1[(MongoDB Shard 1)]
           Mongos --> Shard2[(MongoDB Shard 2)]
           
           Pgpool(Pgpool 1 & 2) -->|Write| PgPrimary[(PgSQL Primary)]
           Pgpool -->|Read| PgStandby[(PgSQL Standby)]
           
           Redis(Redis Nodes 1-6) <-->|Cluster Bus| Redis
       end
   ```

4. **Chuẩn bị Môi trường (Prerequisites) và Luồng Cài đặt:**
   Tác giả phải liệt kê rõ các công cụ hạ tầng học viên cần chuẩn bị trước và hướng dẫn khởi chạy dự án:
   - **Quy ước trình bày:** KHÔNG dùng block quote (`>`). Mỗi bước phải viết dạng **danh sách gạch đầu dòng** (`- **1. Prerequisites:**`, `- **2. Lệnh khởi chạy:**`...). Code block và nội dung bổ sung thụt lề bên trong gạch đầu dòng đó.
   - **Prerequisites:** Yêu cầu đã cài đặt sẵn công nghệ gì? (Ví dụ: Cài đặt **Minikube** cục bộ, chạy **Docker Desktop**, hay dùng file `docker-compose.yml` để nhấc cụm instance cơ sở dữ liệu lên).
   - **Cài đặt dependency:** Chỉ dẫn chính xác cách cài môi trường cho codebase. (Ví dụ: *"Di chuyển vào từng thư mục microservice tương ứng và chạy lệnh `npm install`"*).
   - **Lệnh khởi chạy:** Đưa ra lệnh Run code cụ thể (Ví dụ: *"Khởi động đồng loạt các worker bằng lệnh `nest start ten-dich-vu --watch`"*).
   - **Tín hiệu thành công:** Phải minh họa trạng thái cuối cùng đạt được sau khi cài đặt. (Ví dụ: *"Sau khi chạy, 3 ứng dụng server của chúng ta đã sẵn sàng lắng nghe ở các cổng 3001, 3002 và 3003"*).
   
   *Dưới đây là 3 ví dụ cho 3 kịch bản viết luồng chuẩn bị cài đặt thành công:*

   **Ví dụ 1 (Hướng dẫn cài đặt bài NATS Pub/Sub):**
   - **1. Prerequisites:** Cần có NodeJS 18+ và Docker Desktop. Chạy lệnh `docker-compose up -d` để khởi động cụm ***NATS Server*** nền tảng.
   - **2. Cài đặt dependency:** Tiến hành mở từng thư mục `publisher-service`, `analytics-sub`... thông qua terminal và gõ `npm install`.
   - **3. Lệnh khởi chạy:** Bật 4 terminal riêng biệt, vào từng thư mục gõ lệnh `npm run start:dev` (hoặc `nest start -w`).
   - **4. Tín hiệu thành công:** Khi nhìn thấy log báo `[NestApplication] Nest application successfully started` trên cả 4 terminal, đồng nghĩa Publisher đã chiếm dụng xong cổng 3001 và 3 module Subscriber đã kết nối chặt chẽ vào mạng máy chủ Pub/Sub.

   **Ví dụ 2 (Hướng dẫn cài đặt bài K8s Minikube):**
   - **1. Prerequisites:** Cần có Docker Desktop (làm driver cho Minikube). Cài Minikube theo hệ điều hành: `https://minikube.sigs.k8s.io/docs/start`. Cài `kubectl`: `https://kubernetes.io/docs/tasks/tools`.
   - **2. Lệnh khởi chạy:** Khởi tạo single-node cluster:
     ```bash
     minikube start --driver=docker
     ```
   - **3. Xác nhận cụm đã sẵn sàng:**
     ```bash
     kubectl cluster-info
     kubectl get nodes
     ```
   - **4. Apply ba Manifest Pod:**
     ```bash
     kubectl apply -f mysql-pod.yaml
     kubectl apply -f nginx-pod.yaml
     kubectl apply -f game-2048-pod.yaml
     ```
   - **5. Tín hiệu thành công:** `kubectl get nodes` trả về node `minikube` ở trạng thái `Ready`. `kubectl get pods -o wide` hiển thị ba Pod `mysql-pod`, `nginx-pod`, `game-2048-pod` đều `Running`, mỗi Pod có IP cluster-internal riêng.

   **Ví dụ 3 (Hướng dẫn cài đặt bài HA Database / Helm Chart):**
   - **1. Prerequisites:** Tương tự cần Minikube và Docker. Lần này bạn phải cài đặt thêm công cụ quản lý Helm (`choco install kubernetes-helm` nếu dùng Window).
   - **2. Cài đặt dependency:** Vào từng thư mục database và sử dụng lệnh build cấu hình cho Helm Chart: `helm upgrade --install mongodb-sharded oci://registry-1.docker.io/...`
   - **3. Lệnh khởi chạy:** *Không có lệnh khởi chạy cục bộ do Deploy Helm Chart xong thì hệ sinh thái Database đã tự run ngầm trong cụm phân mảnh Pod của Kubernetes.* 
   - **4. Tín hiệu thành công:** Gõ `kubectl get pods -n database`. Nếu terminal trả về list danh sách 22 con Pod (gồm HA Postgres, MongoDB Sharded, Redis Cluster) đồng loạt sáng đèn ở trạng thái **Running**, hệ thống Multi-Database của bạn đã 100% được bật và sẵn sàng cho những bài test siêu khắc nghiệt.

5. **Viết luồng kiểm thử ứng dụng (Kiểm tra Flow và đưa ra Kết luận):**
   Tác giả cần viết hướng dẫn cụ thể từng bước (Flow) để học viên chạy thử ứng dụng và quan sát hành vi. Chú ý vì phần lớn học viên dùng hệ điều hành Windows nên nội dung cần thân thiện và dễ cấu hình:
   - **Quy ước trình bày:** KHÔNG dùng block quote (`>`). Mỗi bước phải viết dạng **danh sách gạch đầu dòng** (`- **Bước X:**`). Code block và nội dung bổ sung thụt lề bên trong gạch đầu dòng đó.
   - Nếu gọi API: Khuyến khích gửi yêu cầu API (như POST/GET) với payload body rõ ràng, cung cấp sẵn một block code chứa lệnh `curl` minh họa để họ copy paste thẳng vào terminal.
   - Nếu thao tác với Database: Khuyến nghị người học dùng các phần mềm giao diện đồ họa trực quan như **pgAdmin4**, **MySQL Workbench**, hoặc **DBeaver** để kết nối xem dữ liệu, kết hợp kèm theo các lệnh CLI nếu cần.
   - **Quy tắc BẮT BUỘC:** Sau khi kết thúc một flow thao tác, luôn luôn phải viết ra cụm từ `*Kết luận:*` (in nghiêng, chữ `K` viết hoa, KHÔNG dùng bold `**`) để chốt lại bài học hệ thống vừa xảy ra điều gì, giới hạn/ưu điểm của luồng đó ra sao.
   
   *Dưới đây là 3 ví dụ cho 3 kịch bản viết luồng kiểm thử chuẩn mực:*

   **Ví dụ 1 (Test gọi API & Giới hạn kiến trúc NATS):**

   - **Bước 1:** Gửi một event đăng ký qua ***Publisher API***. Bạn có thể dùng **Postman** gửi `POST` vào `http://localhost:3001/events` với body:
     ```json
     {
       "userId": 5,
       "event": "REGISTER"
     }
     ```
     Hoặc copy lệnh `curl` sau dán trực tiếp vào Terminal (WSL2 / Bash):
     ```bash
     curl -X POST http://localhost:3001/events -H "Content-Type: application/json" -d '{ "userId": 5, "event": "REGISTER" }'
     ```
     Quan sát log trên 3 màn hình terminal của các worker.

     *Kết luận:* Ngay khi bắn API, bạn sẽ thấy 3 terminal đồng loạt chớp nháy đón nhận data. Flow này chứng minh tốc độ phân phát chớp nhoáng của ***NATS***.

   - **Bước 2:** Giả lập sự cố bằng cách đóng hẳn terminal đang chạy ***Audit Sub*** (đóng vai trò một worker bị lỗi tắt mạng).

     *Kết luận:* Worker Audit đã bị ngắt kết nối. Lúc này mạng lưới Pub/Sub chỉ còn 2 máy lắng nghe (**Analytics** và **Notification**).

   - **Bước 3:** Tiếp tục dùng công cụ ban nãy bắn thêm một API thứ hai (VD: User mua hàng):
     ```bash
     curl -X POST http://localhost:3001/events -H "Content-Type: application/json" -d '{ "userId": 5, "event": "PURCHASED" }'
     ```
     Quan sát phản ứng ở các terminal đang chạy.

     *Kết luận:* Hai terminal còn lại vẫn ghi nhận gói purchase bình thường. Toàn mạng lưới của bạn sống linh động, không quan tâm xem cái worker thứ ba sụp đổ khi nào.

   - **Bước 4:** Khởi động lại ***Audit Sub***, quan sát xem nó có in ra dòng log purchase đã bị bỏ lỡ ban nãy hay không.

     *Kết luận:* Luồng log lỡ nhịp hoàn toàn biến mất vĩnh viễn! Đây là ranh giới sống còn của ***fire-and-forget***: Lượng data đã bắn trong thời gian worker sập không ai thèm lưu hộ. Đánh đổi sự bền vững để có tốc độ.

   **Ví dụ 2 (Test thao tác Database tĩnh - PostgreSQL):**

   - **Bước 1:** Khởi chạy ứng dụng và gọi API tạo User vào hệ thống.

   - **Bước 2:** Để chứng minh dữ liệu đã thực sự được ***persist*** (lưu cứng), bạn hãy mở **pgAdmin4** hoặc **DBeaver**, kết nối vào `localhost:5432` (với tài khoản là `postgres` / `postgres123`) và query: `SELECT * FROM users;`. Hoặc dùng CLI nếu quen tay:
     ```bash
     psql -h localhost -U postgres -d demo_db -c "SELECT * FROM users;"
     ```

     *Kết luận:* Dữ liệu đã ghi đè xuống ổ cứng thành công. Dưới sức mạnh của ***Persistent Volume***, kể cả khi bạn có tắt toàn bộ cụm ***Docker Container*** này đi dựng lại, dữ liệu trên ổ cứng từ database vẫn hoàn toàn sống sót bảo toàn.

   **Ví dụ 3 (Test thao tác trên RAM chặn lỗi - Redis Failover):**

   - **Bước 1:** Kết nối vào ***Master Node*** qua Redis CLI và test thiết lập một khối key dữ liệu:
     ```bash
     redis-cli -h localhost -p 6379 -a redis123 SET "user:100" "alice"
     ```

   - **Bước 2:** Giả lập sự cố hệ thống bằng cách mở phần mềm **Docker Desktop** trên Windows và ấn Force Stop cái cụm ***Master Node*** đó đi. Đợi 10 giây và dùng terminal gọi lại API lấy User 100.

     *Kết luận:* Dù ***Master Node*** đã sụp, API của bạn vẫn trả về bình thường! Hệ thống đã âm thầm tự kích hoạt luồng ***failover*** và xoay vòng đôn một con ***Slave*** kề cạnh lên thay thế. Đây là minh chứng sắc nét nhất cho sức sống thực tế của mô hình ***High Availability***.

---

---

### Cấu trúc Nội dung: (Trường hợp 2 - Lý thuyết thuần túy, Không có Source Code)

Đối với các bài không có màn chạy code kết nối thực tế (ví dụ: So sánh *Monolith* vs *Microservices*, Định lý *CAP*, Thuật toán *Consistent Hashing*), tuyệt đối không biến bài viết thành một diễn đàn định nghĩa sáo rỗng. Phải dùng logic tiến hóa hệ thống để rèn người học tư duy.

**Cách thức triển khai Trường hợp 2:**

1. **The Bottleneck Scenario:**
   Mở đầu bằng một bài toán quá tải hoặc sự cố thực tế trên production (***production pain-point***).
   > *Ví dụ: Hệ thống tìm kiếm của sàn TMĐT đang chịu 100.000 RPS. Tuy nhiên, vì ôm chung một khối ***Monolith***, toàn bộ module Payment vô can cũng bị sụp đổ theo lây chuyền. Dựa trên cơ chế hiện tại, bạn giải cứu bằng cách nào?*

2. **Evolutionary Architecture (Bắt buộc dùng sơ đồ Mermaid):**
   Tác giả cần diễn giải "sự tiến hóa" của hệ thống, do đó bắt buộc vẽ **TỐI THIỂU 2 sơ đồ** bằng mã Mermaid để thực hiện phép so sánh.
   - **Sơ đồ 1 (Kiến trúc Naive):** Cách tiếp cận cơ bản ban đầu. Cần chỉ rõ bằng log text vị trí gây ra thắt cổ chai (***bottleneck***) của kiến trúc đó.
   - **Sơ đồ 2 (Kiến trúc Tối ưu):** Đưa tư duy/lý thuyết kiến trúc mới vào áp dụng để giải phóng luồng dữ liệu.

3. **Under-the-hood Mechanics:**
   Sử dụng hình ảnh ẩn dụ kết hợp với Bảng (Table) tổng hợp nếu có so sánh phức tạp tầng sâu. Tuyệt đối không copy paste công thức toán học khô khan.
   > *Ví dụ: Để mô tả `***Consistent Hashing***`, hãy lấy ví dụ về một vòng tròn đồng hồ. Request rót vào một góc giờ nhất định, đi trôi xuôi chiều kim đồng hồ gặp được Server nào thì neo vào Server đó.*

4. **Tech Debt & Trade-offs:**
   Hệ thống không có viên đạn bạc, tác giả chốt lại lý thuyết bằng việc phân tích ***Tech Debt*** (Nợ kỹ thuật): Nếu đưa kiến trúc này lên production, cái giá phải đánh đổi thực tế là gì? (***Cost*** hạ tầng, ***Complexity***, sự rườm rà trong ***CI/CD***).
   > *Ví dụ: Cái giá phải trả lớn nhất của ***Microservices*** là ***Distributed Tracing*** cực kỳ nan giải. Khi một lỗi nổ ra, điều tra rà soát chéo tầng là cơn ác mộng nếu công cụ ***Observability*** yếu kém.*

---

**3 Ví dụ tham khảo chuẩn cho bài Lý thuyết thuần túy:**

**Ví dụ 1 (Bài Định lý CAP):**
> - **The Bottleneck Scenario:** Mạng kết nối giữa data center Hà Nội và TP.HCM tự nhiên bị đứt cáp (***Network Partition***). Bạn sẽ chọn khóa truy cập ứng dụng (bảo vệ tính đồng nhất) hay vẫn cho khách đọc truy xuất dữ liệu lỗi thời?
> - **Evolutionary Architecture:** Vẽ 2 sơ đồ Mermaid. Sơ đồ 1 là luồng ***CP*** (Block request báo lỗi). Sơ đồ 2 là luồng ***AP*** (Trả data stale).
> - **Under-the-hood Mechanics:** Lập bảng so sánh nhanh các hệ quản trị database nổi tiếng đang chọn trade-off bề nào (VD: ***MongoDB*** thiên về ***CP***, ***Cassandra*** thiên về ***AP***).
> - **Tech Debt & Trade-offs:** Đánh đổi của ***AP*** là khách hàng A thấy còn hàng nhưng ngầm bấm mua thì báo hết. Đánh đổi của ***CP*** là trải nghiệm người dùng tệ, ***downtime*** đột biến.

**Ví dụ 2 (Bài Monolith vs Microservices):**
> - **The Bottleneck Scenario:** Giao diện Search của bạn bị dội tải khổng lồ, nhưng để chịu tải thì hệ thống lại scale bừa bãi toàn bộ module nền, gây lãng phí tài nguyên RAM vô ích cho module User và Payment.
> - **Evolutionary Architecture:** Sơ đồ 1 là cục ***Monolith*** với 3 module nhồi chung. Sơ đồ 2 là khối ***Microservices*** tách Search ra vọt lên chạy 10 Replica độc lập.
> - **Under-the-hood Mechanics:** Ẩn dụ ***Monolith*** như một chiếc xe buýt nguyên tấm (hỏng 1 kính, đem cả xe đi gara). ***Microservices*** như đồ lego (rụng mảng nào thay mảng nấy).
> - **Tech Debt & Trade-offs:** Chia nhỏ cấu trúc sẽ đòi hỏi hệ thống giám sát đồ sộ hơn. Bảo trì và setup infra đẩy độ trễ hệ thống (***Network Latency***) lên đáng kể.

**Ví dụ 3 (Bài Thuật toán Consistent Hashing):**
> - **The Bottleneck Scenario:** Thay vì chia module chẵn lẻ (%), nếu 1 trong 4 caching server cháy nguồn đột ngột, toàn bộ index lưu cache bị lệnh số nhảy hàng loạt. Bão request (***Cache Thundering Herd***) sẽ xuyên thủng Database Primary ngay lập tức.
> - **Evolutionary Architecture:** Sơ đồ 1 minh hoạ rủi ro chết Node theo thuật toán Modulo thông thường. Sơ đồ 2 vòng tròn (***Hash Ring***) phân phối dữ liệu dọc theo quỹ đạo đều.
> - **Under-the-hood Mechanics:** Khởi xướng cơ chế chia key theo góc toạ độ để giới hạn vòng vi phạm truy cập khi một Node ra đi.
> - **Tech Debt & Trade-offs:** Vòng tròn bị phân mảnh không đều sẽ gây nên hiệu ứng nghiêng tải (***Data Skew***), khiến một Node chịu luồng lớn hơn hẳn đám còn lại. Buộc phải xử lý vá bằng ***Virtual Nodes*** để dàn trận.
