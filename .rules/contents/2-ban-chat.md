# Quy định soạn thảo Phần II (Core Concepts & Demo)

Tài liệu này quy định cấu trúc và văn phong bắt buộc đối với Phần II trong mỗi bài học.

### Tiêu đề bắt buộc
Phần 2 của bài học bắt buộc phải bắt đầu bằng tiêu đề (Heading 2):
`## II. Bản chất`

---

### Cấu trúc Nội dung: (Trường hợp 1 - Có Source Code Demo)

Nếu chủ đề bài học đi kèm với mã nguồn (source code) để demo chạy thực tế, phần này cần phải làm rõ toàn bộ bức tranh kiến trúc hệ thống trước khi đi sâu vào lý thuyết, giúp học viên "nhìn thấy" vấn đề trực quan nhất.

**Cách thức triển khai:**

1. **Thông báo hệ thống Demo và Bảng Thành Phần:** 
   Viết một đoạn văn ngắn khái quát sơ đồ kiến trúc các dịch vụ đang chạy. Chỉ rõ công nghệ sử dụng, cấu trúc (như ***monorepo***), và cách chúng giao tiếp. Tách từng ý chính ra kiểu list (danh sách trải dài bằng gạch đầu dòng) cho mạch lạc và dễ đọc hơn.
   
   Ngay sau đoạn mô tả dạng list, **bắt buộc phải vẽ một bảng (table) gồm 5 cột cơ bản** để chi tiết hóa các thành phần *(ghi chú: có thể linh hoạt thêm/xóa cột tùy theo đặc tính kỹ thuật của từng bài)*:
   - **Thành phần:** Tên dịch vụ hoặc đối tượng kiến trúc (VD: `postgres-app`, `Postgres Pod`).
   - **Cổng nội bộ (ClusterIP):** Cổng giao tiếp bên trong mạng nội bộ. Bỏ trống hoặc gạch ngang `-` nếu không có.
   - **Cổng local (port-forward):** Cổng gọi từ bên ngoài vào mạng local.
   - **Công nghệ:** Core stack đang dùng (VD: `NestJS`, `PostgreSQL 16`).
   - **Trách nhiệm:** Giải thích ngắn gọn vai trò xử lý của component đó.

   *Xem 3 ví dụ tham khảo dưới đây để nắm rõ cấu trúc đoạn văn list kèm theo bảng:*
   
   **Ví dụ 1 (Bài NATS Pub/Sub):**
   > Ví dụ dưới đây là bốn ***service NestJS*** kết nối vòng qua ***NATS***:
   > - Một ***publisher-service*** (cổng 3001) nhận ***POST*** từ client và ***publish***.
   > - Ba ***subscriber*** (Analytics, Notification, Audit) nghe ***NATS***.
   > - Chế độ ***core Pub/Sub*** không lưu ***message*** lên disk.
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
   > | Thành phần | Cổng nội bộ | Cổng local | Công nghệ | Trách nhiệm |
   > |---|---|---|---|---|
   > | **MongoDB Sharded** | 27017 | — | MongoDB | 2 Shard x 3 Replica, cùng Mongos Router phân luồng |
   > | **PostgreSQL HA** | 5432 | — | PostgreSQL | 3 Node Repmgr và 2 Pgpool tự động failover |
   > | **Redis Cluster** | 6379 | — | Redis 7+ | 3 Master và 3 Slave phân cực tự động bằng Slots |
2. **Cung cấp Source Code Demo:**
   Tác giả phải thông báo rằng đã chuẩn bị sẵn mã nguồn (source code) cho bài học và cung cấp kèm đường dẫn clone theo đúng định dạng bắt buộc sau nằm riêng trên một dòng:
   `Clone tại [đây](url)` 
   *(VD: Clone tại [đây](https://github.com/StarCi-Academy/xyz))*

3. **Vẽ sơ đồ giao tiếp bằng [Mermaid](https://mermaid.js.org/) (Khuyến khích đọc docs của nó để vẽ):** 
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

4. **Viết luồng kiểm thử ứng dụng (Kiểm tra Flow và đưa ra Kết luận):**
   Tác giả cần viết hướng dẫn cụ thể từng bước (Flow) để học viên chạy thử ứng dụng và quan sát hành vi. Chú ý vì phần lớn học viên dùng hệ điều hành Windows nên nội dung cần thân thiện và dễ cấu hình:
   - Nếu gọi API: Khuyến khích gửi yêu cầu API (như POST/GET) với payload body rõ ràng, cung cấp sẵn một block code chứa lệnh `curl` minh họa để họ copy paste thẳng vào terminal.
   - Nếu thao tác với Database: Khuyến nghị người học dùng các phần mềm giao diện đồ họa trực quan như **pgAdmin4**, **MySQL Workbench**, hoặc **DBeaver** để kết nối xem dữ liệu, kết hợp kèm theo các lệnh CLI nếu cần.
   - **Quy tắc BẮT BUỘC:** Sau khi kết thúc một flow thao tác, luôn luôn phải viết ra cụm từ **Kết luận:** (để chốt lại bài học hệ thống vừa xảy ra điều gì, giới hạn/ưu điểm của luồng đó ra sao).
   
   *Dưới đây là 3 ví dụ cho 3 kịch bản viết luồng kiểm thử chuẩn mực:*

   **Ví dụ 1 (Test gọi API - Bắn Event NATS):**
   > **Bước 1:** Gửi một event đăng ký qua ***Publisher API***. Bạn có thể dùng **Postman** gửi `POST` vào `http://localhost:3001/events` với body:
   > ```json
   > {
   >   "userId": 5,
   >   "event": "REGISTER"
   > }
   > ```
   > Hoặc copy lệnh `curl` sau dán trực tiếp vào Terminal (Windows PowerShell / Bash):
   > ```bash
   > curl -X POST http://localhost:3001/events -H "Content-Type: application/json" -d '{ "userId": 5, "event": "REGISTER" }'
   > ```
   > **Bước 2:** Quan sát log trên 3 màn hình terminal của các worker.
   > **Kết luận:** Ngay khi bắn API, bạn sẽ thấy 3 terminal đồng loạt chớp nháy đón nhận data. Flow này chứng minh tốc độ phân phát chớp nhoáng của ***NATS***, nhưng vì nó là hệ thống ***fire-and-forget***, nếu bạn lỡ tay tắt một worker thì luồng event đó sẽ bị thất thoát vĩnh viễn.

   **Ví dụ 2 (Test thao tác Database tĩnh - PostgreSQL):**
   > **Bước 1:** Khởi chạy ứng dụng và gọi API tạo User vào hệ thống.
   > **Bước 2:** Để chứng minh dữ liệu đã thực sự được ***persist*** (lưu cứng), bạn hãy mở **pgAdmin4** hoặc **DBeaver**, kết nối vào `localhost:5432` (với tài khoản là `postgres` / `postgres123`) và query: `SELECT * FROM users;`. Hoặc dùng CLI nếu quen tay:
   > ```bash
   > psql -h localhost -U postgres -d demo_db -c "SELECT * FROM users;"
   > ```
   > **Kết luận:** Dữ liệu đã ghi đè xuống ổ cứng thành công. Dưới sức mạnh của ***Persistent Volume***, kể cả khi bạn có tắt toàn bộ cụm ***Docker Container*** này đi dựng lại, dữ liệu trên ổ cứng từ database vẫn hoàn toàn sống sót bảo toàn.

   **Ví dụ 3 (Test thao tác trên RAM chặn lỗi - Redis Failover):**
   > **Bước 1:** Kết nối vào ***Master Node*** qua Redis CLI và test thiết lập một khối key dữ liệu:
   > ```bash
   > redis-cli -h localhost -p 6379 -a redis123 SET "user:100" "alice"
   > ```
   > **Bước 2:** Giả lập sự cố hệ thống bằng cách mở phần mềm **Docker Desktop** trên Windows và ấn Force Stop cái cụm ***Master Node*** đó đi. Đợi 10 giây và dùng terminal gọi lại API lấy User 100.
   > **Kết luận:** Dù ***Master Node*** đã sụp, API của bạn vẫn trả về bình thường! Hệ thống đã âm thầm tự kích hoạt luồng ***failover*** và xoay vòng đôn một con ***Slave*** kề cạnh lên thay thế. Đây là minh chứng sắc nét nhất cho sức sống thực tế của mô hình ***High Availability***.

*(Trường hợp 2: Đối với bài lý thuyết thuần túy không có Demo Code sẽ được định nghĩa cấu trúc sau).*
