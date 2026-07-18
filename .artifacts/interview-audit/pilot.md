# Pilot audit checklist interview (3 câu framework-foundation)

Workflow: Sonnet gen→review checkpoint · Sonnet sinh 5 mức trả lời · Sonnet+Haiku chấm coverage · enhance ≤5 vòng nếu không coherent. 0đ OpenRouter (subagent Claude).

## 4-question · reasoning · (id `79d40de2`) — 8 checkpoint · enhance 2 vòng · coherent=True

**Câu hỏi:** A teammate puts all input-validity checking inside the service — that is, after the request has already entered the business logic. Analyze this: why is it better to place the validation layer BEFORE the handler (fail-fast right at the boundary), what happens to server resources when input that is certainly invalid is still pushed deep inside, and how does the handler's own code quality change once it is guaranteed to receive only clean, correctly-typed data?

**Checklist (Sonnet gen→review→enhance):**

| # | Checkpoint |
|---|---|
| 1 | Gọi đúng tên nguyên tắc fail-fast: input sai phải bị từ chối càng sớm càng tốt, ngay tại boundary, trước khi hệ thống tốn công xử lý nó. |
| 2 | Chỉ ra đúng vị trí trong request lifecycle: validation layer (pipe) chạy TRƯỚC handler, tức trước khi request chạm tới business logic. |
| 3 | Giải thích đúng cơ chế short-circuit: khi input sai, pipe throw lỗi (HTTP 400) ngay lập tức và request dừng lại tại đó, không bao giờ vào tới handler. |
| 4 | Nêu cụ thể cái giá phải trả nếu validate trễ trong service: request đó có thể đã mở transaction, query DB, hoặc gọi sang service khác trước khi lỗi được phát hiện — tốn CPU/IO cho một việc chắc chắn bị hủy. |
| 5 | Nêu được validation layer không chỉ kiểm tra (check) mà còn transform/chuyển đổi kiểu dữ liệu input (ví dụ string sang number) trước khi đưa vào handler. |
| 6 | Nêu được hệ quả lên chất lượng code handler: vì input đã đảm bảo sạch, thân handler không cần rải các check phòng thủ kiểu `if (!id)`, giảm số nhánh rẽ. |
| 7 | Liên hệ đúng với nguyên lý separation of concerns/single responsibility: đẩy validate vào service khiến service mất single responsibility và phải lặp lại logic validate ở nhiều entry point khác nhau. |
| 8 | Nêu được lợi ích error contract khi validate tại boundary: mọi endpoint trả lỗi 400 theo cùng một format nhất quán, thay vì mỗi service tự định nghĩa kiểu lỗi riêng. |

**5 mức trả lời + điểm Sonnet vs Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Dạ, theo em nguyên tắc ở đây là fail-fast — mình nên chặn input sai ngay tại biên, trước khi tốn công vào bên trong. Trong request lifecycle thì pipe chạy trước handler, nên nếu input chắc chắn sai nó throw luôn ra 400 và short-circuit, request không bao giờ chạm tới business logic. Nếu để validate ở service thì cái request sai đó đã bị đẩy sâu vào trong rồi, có khi đã mở transaction, đã query DB, đã gọi service khác mới phát hiện ra sai, tức là đốt CPU với IO cho một thứ chắc chắn bị vứt đi, mà bề mặt lỗi cũng rộng ra. Còn về code, pipe không chỉ check mà còn transform input nên handler nhận đúng type, dữ liệu sạch, thân hàm coi như mặc định input đã hợp lệ nên không cần rải if kiểm tra khắp nơi, code gọn và ít chỗ sai hơn hẳn — đây cũng là separation of concerns, validate là một mối quan tâm riêng nằm đúng lớp có ngữ cảnh, tránh phải lặp lại validate ở từng service và giữ được error contract thống nhất. | 88% | 88% |
| L2 | Em thấy nên đặt validate trước handler theo kiểu fail-fast, vì pipe chạy trước nên input sai bị chặn ngay bằng 400, không cho lọt vào business logic. Nếu để trong service thì request sai đã đi sâu vào rồi, có thể đã đụng tới DB hay transaction trước khi mình biết nó sai, nên tốn tài nguyên vô ích. Với lại khi validate ở boundary rồi thì handler nhận input đã đúng type, sạch sẽ, nên bên trong không cần viết mấy cái if kiểm tra thủ công nữa, code handler đỡ rối hơn nhiều. | 63% | 63% |
| L3 | Dạ em nghĩ validate sớm ở ngoài thì tốt hơn là để trong service, vì nếu để trong service thì lúc phát hiện sai là nó đã chạy vào trong rồi, tốn thời gian xử lý không cần thiết. Còn nếu validate trước thì handler nhận input đúng, không phải check lại nhiều trong code nữa. | 13% | 0% |
| L4 | Dạ thì validate sớm chắc là tốt hơn, đỡ tốn tài nguyên hơn ạ. Với lại code trong handler chắc cũng gọn hơn một chút. | 0% | 0% |
| L5 | Em nghĩ vấn đề chính ở đây là nên dùng cache để giảm tải cho service, với lại có thể tách service ra thành nhiều microservice nhỏ để dễ scale. Validate thì cứ để trong service cũng được, miễn là có unit test đầy đủ là ổn ạ. | 0% | 0% |

---

## 6-question · reasoning · (id `8a992945`) — 8 checkpoint · enhance 3 vòng · coherent=True

**Câu hỏi:** The request lifecycle has a fixed order in which the allow/deny layer (guard) runs BEFORE the input validate/parse layer (pipe). A colleague proposes reversing it — parse and validate the whole body first, then check authorization — arguing it "reports data errors to the client sooner". Rebut this: why is the guard-before-pipe order not an arbitrary framework hard-coding but tied to the principle "reject at the cheapest layer before spending effort at a more expensive one", and what is the worst-case attack surface (DoS) if you let an unauthenticated request force the server to parse a large payload?

**Checklist (Sonnet gen→review→enhance):**

| # | Checkpoint |
|---|---|
| 1 | Nêu đúng nguyên tắc tổng quát: hệ thống nên từ chối (reject) ở tầng xử lý rẻ nhất trước khi tốn công sức ở tầng đắt hơn. |
| 2 | Khẳng định thứ tự guard chạy trước pipe là hệ quả trực tiếp của nguyên tắc "rẻ trước - đắt sau" đó, chứ không phải framework hard-code tùy tiện. |
| 3 | Giải thích guard là bước rẻ: chỉ cần token/role cộng metadata của handler (qua reflection) để trả lời câu hỏi nhị phân "request có được đi tiếp không", không cần đụng tới body. |
| 4 | Giải thích pipe là bước đắt hơn guard: phải đọc, deserialize và kiểm tra từng field của toàn bộ payload mới biết request có hợp lệ hay không. |
| 5 | Chỉ ra hệ quả cụ thể nếu đảo thứ tự: một request chưa được xác thực/cho phép (unauthenticated/unauthorized) vẫn bị buộc parse + validate toàn bộ body trước khi bị từ chối. |
| 6 | Mô tả đúng cơ chế tấn công DoS: kẻ tấn công không cần đăng nhập có thể spam request ẩn danh mang payload JSON khổng lồ hoặc lồng sâu để đốt CPU/memory ở tầng parsing, trước khi nhận được lỗi 401. |
| 7 | Phản biện đúng luận điểm "báo lỗi dữ liệu sớm hơn" của đồng nghiệp: lập luận đó chỉ đúng với client hợp lệ; với request không được phép thì phản hồi đúng đắn là 401/403, còn việc parse body của nó vừa vô nghĩa vừa rủi ro. |
| 8 | Chỉ ra sự khác biệt ngữ cảnh giữa hai layer: guard nhìn thấy handler + metadata để quyết định authorization, còn pipe nhìn thấy type + value của từng param để validate — mỗi layer có ngữ cảnh riêng không nên trộn lẫn. |

**5 mức trả lời + điểm Sonnet vs Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Thứ tự guard trước pipe không phải NestJS hard-code chơi cho vui đâu, nó bám nguyên tắc 'chặn ở lớp rẻ trước khi tốn công ở lớp đắt hơn'. Guard rất rẻ: chỉ cần token với role, cộng metadata của handler qua reflection, là trả lời được nhị phân request này có được đi tiếp không, mà chưa đụng gì đến body cả. Pipe thì đắt hơn hẳn — phải đọc, deserialize, validate từng field. Nếu đảo ngược, để pipe chạy trước, thì một request chưa đăng nhập vẫn ép server parse hết cái payload khổng lồ đó, tức là kẻ tấn công cứ spam request ẩn danh kèm JSON siêu nặng hoặc lồng sâu để đốt CPU/RAM ngay ở tầng parse, trước khi có cái 401 nào trả về — còn nếu đúng thứ tự thì guard chặn ngay, server không tốn gì cho request không hợp lệ, với lại mỗi lớp có context riêng của nó, guard nhìn handler với metadata để quyết authorization, pipe nhìn type/value từng param để validate, gộp lại là ép lớp kia phải mô phỏng lại context mà lớp đúng đã có sẵn rồi. | 88% | 88% |
| L2 | Guard chạy trước pipe là vì nguyên tắc reject ở chỗ rẻ trước khi tốn effort ở chỗ đắt hơn — guard chỉ cần token, role là biết cho qua hay không, không cần đụng vào body, còn pipe phải parse với validate từng field nên tốn hơn nhiều. Nếu đảo ngược, cho pipe chạy trước, thì một request chưa xác thực vẫn khiến server phải parse hết payload, đây chính là chỗ hở DoS: attacker gửi request ẩn danh với body cực lớn để đốt tài nguyên server trước khi bị 401. Đúng thứ tự thì guard chặn liền, server không phí công cho request không có quyền, lý do 'báo lỗi data sớm hơn' của đồng nghiệp chỉ đúng khi client hợp lệ thôi, còn với request chưa auth thì phản hồi đúng là 401/403 chứ parse body làm gì. | 63% | 88% |
| L3 | Guard trước pipe vì guard kiểm tra quyền, việc đó nhẹ hơn, còn pipe validate dữ liệu thì nặng hơn nên để sau. Nếu đảo thứ tự, để pipe chạy trước, thì request nào chưa đăng nhập cũng bị bắt parse dữ liệu trước, tức là tốn tài nguyên server cho những request có thể bị từ chối sau đó — đây là vấn đề bảo mật/hiệu năng, có thể bị lợi dụng để làm server chậm đi nếu gửi nhiều request như vậy. | 13% | 25% |
| L4 | Ừm thì guard nó check quyền, pipe nó check dữ liệu, guard chạy trước chắc là để an toàn hơn. Nếu đổi thứ tự chắc sẽ có vấn đề về bảo mật gì đó, có thể ảnh hưởng hiệu năng nhưng em không chắc lắm. | 0% | 0% |
| L5 | Em nghĩ guard với pipe cái nào chạy trước cũng được, miễn là cuối cùng handler nhận đúng dữ liệu là được rồi, quan trọng là code chạy đúng logic nghiệp vụ. DoS thì thường là do quá nhiều người dùng truy cập cùng lúc, mình dùng load balancer với cache là xử lý được thôi. | 0% | 0% |

---

## 13-question · scenario · (id `25076ebe`) — 6 checkpoint · enhance 1 vòng · coherent=True

**Câu hỏi:** It's 2 a.m., production is failing, and you need to trace one specific request among millions of log lines by filtering on `level` and `requestId`. The current system just scatters free-form `console.log` everywhere. Describe how you would redesign the logging pipeline so it is both machine-queryable and human-readable on the terminal, and explain clearly why ONE log event should fan out to multiple destinations with different formats instead of forcing the whole system onto a single format.

**Checklist (Sonnet gen→review→enhance):**

| # | Checkpoint |
|---|---|
| 1 | Vấn đề gốc: console.log tự do không có field/cấu trúc, khiến aggregator (Loki/ELK) phải đoán bằng regex và vỡ ngay khi câu chữ log thay đổi — không thể lọc kiểu "mọi log level=error của requestId=X trong 5 phút gần nhất". |
| 2 | Structured logging: mỗi dòng log là một record có field cố định (level, message, context, timestamp, kèm requestId/userId), serialize thành JSON một dòng để máy index và filter theo field. |
| 3 | Transport fan-out: logger giữ một mảng transport, một sự kiện log được bắn ra cho MỌI transport, mỗi transport có chain định dạng riêng — console dùng định dạng màu kiểu nestLike để dev đọc trên terminal, file dùng JSON thuần để aggregator đọc. |
| 4 | Lý do không ép cả hệ thống về một định dạng duy nhất: nếu chỉ có một format thì hoặc dev khổ (phải đọc JSON thô bằng mắt) hoặc máy khổ (phải parse chuỗi dính mã màu ANSI); fan-out cho phép cùng một dữ liệu có hai cách trình bày mà không cần gọi log hai lần. |
| 5 | Unified logger: gộp log nội bộ của framework (route mapping, lifecycle, exception) và log của ứng dụng vào chung một pipeline, để một requestId chạy xuyên suốt từ lúc khớp route đến sự kiện nghiệp vụ, không bị đứt trace ở ranh giới framework/app. |
| 6 | Lưu ý vận hành: không bật pretty format cho sink file/production vì aggregator sẽ nuốt mã ANSI và parse lỗi, đồng thời tốn CPU vô ích — mỗi transport phải dùng đúng định dạng phù hợp với đích của nó. |

**5 mức trả lời + điểm Sonnet vs Haiku:**

| Mức | Câu trả lời | Sonnet | Haiku |
|---|---|---|---|
| L1 | Vấn đề gốc là console.log tự do không có field, nên hệ thống aggregate như Loki hay ELK phải đoán mò bằng regex và vỡ ngay khi mình đổi câu chữ log, không thể query kiểu level=error và requestId=X trong 5 phút gần nhất. Em sẽ chuyển sang structured logging: mỗi entry là JSON một dòng có field cố định level, message, context, timestamp, requestId, userId, để máy index và filter được. Sau đó dùng transport fan-out, logger giữ một mảng transport và bắn cùng một event tới tất cả, console thì dùng format màu kiểu nestLike cho dev đọc nhanh, còn file thì JSON thuần cho aggregator, chứ tuyệt đối không bật pretty ở sink production vì mã màu ANSI sẽ làm parser gãy và tốn CPU vô ích. Cuối cùng em sẽ gộp log framework như route mapping, lifecycle, exception với log nghiệp vụ vào chung một pipeline, để một requestId đi xuyên suốt từ lúc match route tới business event, không bị đứt gãy ở ranh giới framework với app. | 83% | 83% |
| L2 | Gốc rễ là console.log không có cấu trúc nên không filter theo field được, lúc production down mình cần lọc theo requestId với level=error mà log dạng string thì gần như bất khả thi. Em sẽ đổi sang structured logging, log ra JSON có level, message, timestamp, requestId để máy đọc và query được. Về việc nhiều đích, em sẽ cho logger bắn cùng lúc ra nhiều transport, console thì format đẹp có màu để dev nhìn cho dễ, còn file hoặc gửi lên aggregator thì để JSON thuần vì nếu chỉ dùng một format chung thì hoặc dev khổ đọc JSON thô, hoặc máy khổ parse chuỗi có màu. Em nghĩ vậy là đủ, phần gộp log framework với log app thì em chưa nghĩ tới. | 50% | 50% |
| L3 | Em nghĩ vấn đề là console.log không có cấu trúc nên khó tìm kiếm, nên cần đổi sang log dạng JSON có field như level, message, requestId để sau này lọc theo requestId cho nhanh. Về việc nhiều format thì em nghĩ là vì mỗi nơi cần một kiểu khác nhau, ví dụ terminal thì cần dễ đọc còn hệ thống lưu trữ thì cần dễ xử lý. Em cũng nghĩ nên có thêm timestamp để biết log xảy ra lúc nào khi debug ban đêm. Nhưng em chưa rõ lắm cơ chế kỹ thuật để một log bắn ra nhiều nơi cùng lúc như thế nào. | 17% | 0% |
| L4 | Dạ em nghĩ nên log ra dạng JSON thay vì text thường để dễ tìm hơn. Với lại có thể để nhiều nơi lưu log khác nhau, chỗ này chỗ kia, chắc để phòng khi một chỗ bị mất log thì còn chỗ khác. Em nghĩ vậy thôi ạ, chưa nghĩ ra thêm. | 0% | 0% |
| L5 | Em nghĩ 2 giờ sáng mà lỗi thì cứ vào server restart lại là được, xong rồi từ từ đọc log sau cũng không sao. Với lại console.log thì cũng thấy được lỗi ở đâu rồi mà, chỉ cần thêm try-catch bọc quanh chỗ hay lỗi là ổn. Em không rõ câu hỏi đang hỏi về việc query log gì đó ạ. | 0% | 0% |

---

