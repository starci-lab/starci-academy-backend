# MCP.STARCI.ORG — BRD

**Tài liệu mô tả nghiệp vụ (BRD) · Lớp Sản phẩm**

Một cổng MCP công khai để bất kỳ trợ lý AI nào cũng đọc được một hệ thống production thật

Người học và người viết mã hôm nay hỏi trợ lý AI trước khi hỏi người. Nhưng trợ lý chỉ biết những gì có trong dữ liệu huấn luyện và những gì nằm trong thư mục đang mở — nó không biết một hệ thống thương mại thật được ráp ra sao. `mcp.starci.org` cắm khoảng trống đó: gắn một dòng cấu hình vào Claude, và trợ lý đọc được toàn bộ mã nguồn StarCi Academy kèm bộ luật viết mã đi cùng nó.

Phiên bản 1.0 · Ngôn ngữ: Tiếng Việt
Đơn vị phát triển: Đội phát triển StarCi
Soạn: 06/08/2026

---

## Thông tin tài liệu

| Thuộc tính | Giá trị |
|---|---|
| Tên hệ thống | `mcp.starci.org` — cổng MCP công khai phục vụ tra cứu mã nguồn StarCi |
| Lớp tài liệu này | Sản phẩm — chính dịch vụ mà khách gắn vào trợ lý của họ |
| Sản phẩm cốt lõi | Một endpoint MCP từ xa, trả về đoạn mã thật kèm đường dẫn và luật canon chi phối nó |
| Đối tượng đọc | Ban lãnh đạo và đội sản phẩm. Phần đầu nói giá trị kinh doanh và rủi ro; chi tiết kỹ thuật để ở phụ lục |
| Trạng thái | Đã dựng và **đo thật một bản chạy nội bộ**; bản đó bị gỡ vì chất lượng chưa đạt. Số liệu trong tài liệu này lấy từ chính lần chạy đó |

#### Quy ước nhãn

**[ĐÃ CÓ]** là thứ tồn tại và kiểm chứng được hôm nay. **[SPEC]** là đã đặc tả nhưng còn phải xây. **[ĐÃ ĐO]** là con số lấy từ một lần chạy thật, có ghi lại điều kiện đo.

> **Vì sao tài liệu này khác một bản đề xuất thông thường.** Phần lớn BRD dự đoán sản phẩm sẽ chạy thế nào. Tài liệu này không phải dự đoán: hệ thống đã được dựng đầy đủ trong một phiên làm việc, đo bằng câu hỏi thật, rồi **gỡ bỏ** vì kết quả chưa đủ tốt để bán. Những gì viết dưới đây là kết luận rút từ thất bại đó, không phải kỳ vọng.

---

## PHẦN I · BÀI TOÁN, GIẢI PHÁP VÀ GIÁ TRỊ KINH DOANH

### 1. Tóm tắt điều hành

Người học lập trình hôm nay không thiếu tài liệu. Họ thiếu **một hệ thống thật để soi**. Mọi khoá học đều dạy trên ví dụ đồ chơi — một `todo app`, một `blog` — trong khi thứ họ sẽ gặp khi đi làm là một codebase 385 nghìn dòng với 181 bảng dữ liệu, hàng trăm luồng nghiệp vụ chằng chịt và một bộ luật viết mã không ai giải thích.

StarCi Academy đang sở hữu đúng thứ đó, và nó đang nằm không: **4424 file, 385.355 dòng, 649 service, 286 resolver, 306 lớp lỗi có kiểu, 21 luật lint đều ở mức chặn build** [ĐÃ ĐO]. Đây là một hệ thống thương mại đang chạy, không phải bài mẫu.

`mcp.starci.org` biến tài sản đó thành dịch vụ. Khách dán một dòng cấu hình vào Claude, Cursor hay bất kỳ công cụ nào nói được giao thức MCP, rồi hỏi thẳng: *"hệ thống này xử lý webhook thanh toán ra sao"*, *"lớp chống gian lận đặt ở đâu"*, *"vì sao chỗ này không dùng repository"*. Trợ lý trả lời bằng **mã thật kèm đường dẫn thật**, không phải bằng mã nó tự bịa.

Điều làm dịch vụ này khác một công cụ tìm mã thông thường là **StarCi bán kèm lý do**. Mỗi câu trả lời không chỉ có đoạn mã mà còn có điều khoản canon chi phối đoạn mã ấy. Người đọc hiểu được *tại sao* nó được viết như vậy, chứ không chỉ *nó trông thế nào*.

### 2. Quyết định phải chốt trước mọi thứ khác

**Bán dịch vụ này nghĩa là công khai mã nguồn StarCi.**

Đây không phải một dòng cảnh báo cuối tài liệu, nó là điều kiện tiên quyết. Công cụ tra cứu mã trả về **thân hàm và thân lớp nguyên văn** — trong lần chạy thử, một câu hỏi về lớp lỗi trả về trọn vẹn `class AbstractException` kèm mọi thuộc tính [ĐÃ ĐO]. Ai gắn được vào endpoint là đọc được mã. Đủ câu hỏi thì dựng lại được phần lớn hệ thống.

Vậy nên ban lãnh đạo phải trả lời dứt khoát ba câu trước khi viết dòng mã đầu tiên:

Thứ nhất, **chấp nhận mã nguồn trở thành sản phẩm đọc được hay không**. Nếu câu trả lời là không thì dừng ở đây; mọi biện pháp kỹ thuật phía sau chỉ làm chậm chứ không ngăn được việc đọc.

Thứ hai, **phần nào tuyệt đối không được index**. Tối thiểu: `.secrets` và `.volume` — nơi chứa khoá và nội dung khoá học có bản quyền. Đây là ràng buộc cứng, không phải tuỳ chọn cấu hình.

Thứ ba, **mã nguồn có lẫn bí mật nào không**. Một khoá lọt vào một dòng comment ba năm trước sẽ được trả về nguyên văn cho khách trả tiền đầu tiên hỏi trúng.

### 3. Bài toán và cơ hội

#### 3.1 Người dùng đang vướng gì

Người mới vào nghề hỏi trợ lý AI "làm sao xây hệ thống thanh toán" và nhận về một đoạn mẫu ba mươi dòng chạy được nhưng không sống nổi trong sản xuất — không có đối soát, không có chống lặp, không có nhật ký cấu trúc. Họ không biết cái mình nhận còn thiếu gì, vì họ chưa từng thấy bản đầy đủ.

Người có kinh nghiệm thì vướng chuyện khác: họ muốn xem **một quyết định kiến trúc được thi hành nhất quán ra sao trên quy mô lớn**, chứ không phải xem nó được giải thích trong một bài blog. Không có nguồn nào cho họ thứ đó, vì các hệ thống thương mại đều đóng.

#### 3.2 Vì sao thời điểm này hợp lý

Giao thức MCP vừa trở thành cách chuẩn để trợ lý AI với tới dữ liệu ngoài, và mọi công cụ lớn đều đã nói được nó. Trước đây muốn bán tri thức dạng này phải dựng cả một sản phẩm có giao diện; bây giờ chỉ cần một endpoint đúng chuẩn, còn giao diện là chính công cụ khách đang dùng hằng ngày.

#### 3.3 Lợi thế riêng

Lợi thế thứ nhất là **kho mã bất thường nhất quán**. Khi quét mười bất biến trên source StarCi, sáu cái đạt 99–100% [ĐÃ ĐO]: `EntityManager` 296/296 có decorator chỉ rõ nguồn dữ liệu, `@Entity()` 181/181 đặt tên bảng tường minh, repository tiêm vào constructor **0 trên 1341 chỗ dùng**. Một kho mã đồng đều như vậy trả lời tốt hơn hẳn một kho mã pha tạp, vì cùng một câu hỏi luôn ra cùng một khuôn.

Lợi thế thứ hai là **mã đi kèm luật**. StarCi có 21 luật lint đều ở mức chặn build, và một tập canon giải thích từng luật. Không kho mã mở nào bán kèm thứ này.

Lợi thế thứ ba là **hạ tầng đã vận hành**. StarCi đã chạy Qdrant trong sản xuất cho tính năng RAG nội dung, và đã có máy chủ nhúng vector chạy trên GPU nội bộ [ĐÃ CÓ]. Đây không phải hạ tầng phải học cách vận hành từ đầu.

### 4. Điều đã đo, và điều đã thất bại

Đây là phần quan trọng nhất của tài liệu, vì nó quyết định sản phẩm được định vị thế nào.

Một bản chạy đầy đủ đã được dựng: index **9035 đoạn mã từ 4781 file**, dùng mô hình nhúng `bge-m3` chạy trên GPU nội bộ, lưu vào Qdrant riêng [ĐÃ ĐO]. Kết quả tra cứu chia làm hai nhóm rõ rệt:

Câu hỏi **có danh từ nghiệp vụ** — "lớp lỗi cơ sở có httpStatus và metadata", "chấm một buổi phỏng vấn thử và ra điểm" — đạt điểm tương đồng **0.69 đến 0.72** và trả về đúng file cần tìm ngay ở vị trí đầu.

Câu hỏi **văn xuôi kiến trúc thuần** — "hệ thống này biểu diễn lỗi thế nào" — chỉ đạt **0.50 đến 0.63** và trả về file spec cùng mảnh type vụn thay vì lớp cơ sở đang được hỏi.

Bật chế độ lai giữa vector và từ khoá làm **tệ hơn**, không phải tốt hơn: nó trả về điểm xếp hạng hợp nhất `1/2, 1/3` và nửa từ khoá bám vào đống `export *` trong các file barrel. Điểm đáng chú ý là **đống barrel đó nay đã bị xoá sạch** khỏi source, nên nguyên nhân này không còn — nhưng phải đo lại mới được kết luận, không được suy đoán.

Kết luận rút ra: **sản phẩm này mạnh ở việc định vị, yếu ở việc giải thích.** Nó biết "thứ đó nằm ở đâu" tốt hơn nhiều so với "thứ đó hoạt động thế nào". Định vị sản phẩm phải trung thực với điều đó, và phần "giải thích" phải đến từ canon đi kèm chứ không từ phép tìm vector.

### 5. Sản phẩm bán ra

**Gói miễn phí [SPEC]** — số lượt hỏi giới hạn theo ngày, chỉ tra cứu, không kèm canon. Mục đích là để người ta thử và thấy khác biệt.

**Gói trả trước theo lượt dùng [SPEC]** — khách nạp một khoản, hệ thống trừ dần theo số token thật của mỗi truy vấn. Hợp với người dùng thất thường: tháng bận thì tốn, tháng rảnh không mất gì.

**Gói tháng 200.000đ [SPEC]** — dùng thoải mái trong mức hợp lý, trả kèm điều khoản canon chi phối mỗi đoạn mã, và mở thêm công cụ tra theo luồng nghiệp vụ chứ không chỉ theo file. Hợp với người dùng đều.

**Gói học viện [SPEC]** — gắn với tài khoản học viên StarCi, mở thêm phần bài giảng liên kết tới đúng đoạn mã đang học.

### 6. Mô hình thu tiền

#### 6.1 Phần lớn hạ tầng đã có, đây là lắp ráp chứ không phải xây mới

Ba mảnh cốt lõi đều đang chạy trong sản xuất [ĐÃ CÓ]:

**Sổ đo từng lời gọi** — bảng `credit_usage_histories` đã ghi đúng những gì cần tính tiền: người dùng, bề mặt gọi, tác vụ, mô hình, nhà cung cấp, số `credits`, và **`prompt_tokens` cùng `completion_tokens`** cho từng lượt. Thêm một giá trị enum mới cho cột `surface` là dịch vụ MCP ghi được vào đây ngay; không phải đẻ bảng mới, và quan trọng hơn là **doanh thu với chi phí đọc chung một nguồn** thay vì đối soát hai hệ.

**Khuôn thuê bao** — bảng `ai_subscriptions` đã có `tier`, `status`, `current_period_end`, `auto_renew`, `window_week_reset_at`, `credit_week_used`, `bonus_credit_week` và `ceil_overrides`. Nghĩa là mô hình "gói tháng, có trần theo tuần, trần ghi đè được cho khách đặc biệt" đã được thiết kế và kiểm chứng ở một sản phẩm khác của StarCi.

**Cổng thanh toán** — PayOS đã có đủ tạo link, tra cứu yêu cầu, và nhận webhook, kèm cả kiểm thử cho handler.

#### 6.2 Ràng buộc của PayOS, và nó định hình cả hai gói

**PayOS là cổng trả một lần — link và mã QR — không giữ phương tiện thanh toán để tự trừ định kỳ.** Đây không phải thiếu sót cần vá, đó là bản chất của cổng nội địa này, và nó dẫn tới hai hệ quả không tránh được:

**Trả theo lượt dùng bắt buộc là trả trước.** Khách nạp trước, hệ thống trừ dần. Không làm được kiểu dùng cả tháng rồi tính tiền sau, vì cuối tháng không có phương tiện nào để trừ vào. Ràng buộc này thực ra có lợi: không có nợ xấu, và khách không bao giờ nhận một hoá đơn bất ngờ.

**Gói tháng không tự gia hạn.** Cột `auto_renew` đã có, nhưng thứ nó ghi là *ý định* của khách, không phải quyền trừ tiền. Luồng thật phải là: gần hết hạn thì nhắc, sinh link mới, khách trả, webhook về, cộng kỳ. Đây là việc phải xây [SPEC], và phải tính cả nhánh khách không trả: hạ về gói miễn phí chứ không cắt đột ngột.

#### 6.3 "Không giới hạn" phải có trần kỹ thuật ở sau

Dịch vụ này có **chi phí biên thật**: mỗi truy vấn là một lần nhúng vector, một lần đọc Qdrant, và băng thông trả về mã nguồn. Một khách gắn script hỏi liên tục sẽ vượt xa 200.000đ, và bên lỗ không phát hiện ra cho tới khi xem hoá đơn hạ tầng.

Thiết kế gốc của `ai_subscriptions` đã lường trước: `credit_week_used` đếm mức dùng theo tuần và `ceil_overrides` cho phép nới trần cho từng khách. Nên cách bán trung thực là **"dùng thoải mái trong mức hợp lý"** với một trần tuần công bố rõ, chứ không phải chữ "không giới hạn" trần trụi rồi âm thầm chặn khi khách vượt.

Trần đặt ở đâu thì phải đo mới biết, và **chưa đo được**: cần một tháng dữ liệu thật từ gói miễn phí để thấy phân bố mức dùng trước khi chốt con số.

#### 6.4 Việc phải xây

| Hạng mục | Trạng thái |
|---|---|
| Ghi mức dùng theo token vào `credit_usage_histories` | [SPEC] — thêm giá trị `surface`, gọi từ lớp MCP |
| Trừ credit trả trước, chặn khi hết số dư | [SPEC] |
| Nạp tiền qua link PayOS, cộng credit khi webhook về | [SPEC] — dùng lại luồng webhook đã có |
| Vòng đời gói tháng: nhắc hạn, sinh link, cộng kỳ, hạ gói khi không trả | [SPEC] |
| Trần tuần và cơ chế ghi đè trần | [ĐÃ CÓ ở tầng dữ liệu] — còn phải nối vào lớp MCP |

Giá gói trả trước và trần của gói tháng chưa chốt.

---

## PHẦN II · TỔNG QUAN KIẾN TRÚC

Luồng đi từ khách tới câu trả lời gồm bốn chặng:

```
   Claude / Cursor
   (công cụ của khách)
          |
          |  giao thức MCP qua HTTP, kèm khoá của khách
          v
   +--------------------------+
   |  mcp.starci.org          |   xác thực, đếm hạn mức, ghi nhật ký
   |  (app mới)               |
   +--------------------------+
          |
          |  câu hỏi -> vector
          v
   +--------------------------+        +--------------------------+
   |  máy nhúng bge-m3        |        |  Qdrant                  |
   |  (GPU nội bộ, ĐÃ CÓ)     |------->|  index mã nguồn          |
   +--------------------------+        +--------------------------+
          |
          |  đoạn mã + đường dẫn + điều khoản canon
          v
      câu trả lời
```

Bản chạy thử tối nay dùng **giao thức cục bộ**, tức chỉ máy đang chạy mới gọi được. Bản bán ra bắt buộc phải là **MCP từ xa qua HTTP** kèm xác thực và hạn mức — đây là phần lớn nhất phải xây mới [SPEC].

Ba ràng buộc kiến trúc không thương lượng:

**Index riêng, không dùng chung với sản phẩm.** StarCi đã chạy Qdrant cho RAG nội dung; index mã nguồn phải là một thực thể tách biệt. Trộn chung nghĩa là một lỗi trong dịch vụ bán ra có thể làm hỏng dữ liệu của sản phẩm chính.

**Danh sách loại trừ là thứ được kiểm, không phải thứ được tin.** `.secrets` và `.volume` phải nằm ngoài index, và phải có một phép kiểm tự động chứng minh điều đó sau mỗi lần index — không phải một dòng cấu hình mà người ta tin là đúng.

**Index cũ nguy hiểm hơn không có index.** Một câu trả lời tự tin dựa trên mã đã bị xoá ba tháng trước là thứ khách không có cách nào phát hiện. Phải có cơ chế cập nhật theo commit, và phải trả về thời điểm index cùng câu trả lời.

---

## PHỤ LỤC · CHI TIẾT KỸ THUẬT

### A. Điều đã kiểm chứng được ngay hôm nay

| Hạng mục | Số đo | Điều kiện |
|---|---|---|
| Quy mô kho mã | 4424 file `.ts`, 385.355 dòng, 20% là test | quét `src/**` |
| Đoạn mã index được | 9035 đoạn / 4781 file, phủ 97.4% | bge-m3, batch 10 |
| Chất lượng câu hỏi có danh từ | 0.69–0.72, trúng file đúng ở vị trí đầu | 4 câu hỏi thật |
| Chất lượng câu hỏi trừu tượng | 0.50–0.63, trả về spec và type vụn | 4 câu hỏi thật |
| Chế độ lai vector+từ khoá | tệ hơn thuần vector | RRF, trước khi bỏ barrel |
| Dung lượng index | 940 MB | Qdrant, 9035 điểm |
| Tính nhất quán kho mã | 6/10 bất biến đạt 99–100% | quét AST |

### B. Bẫy đã gặp, ghi lại để không lặp

**Gói MCP mã nguồn mở không dùng được như quảng cáo.** Gói đã thử khai dải phụ thuộc lỏng `^1.12.0` cho thư viện Qdrant; npm kéo về bản 1.19 đã **bỏ hẳn** phương thức `.search()` mà chính gói đó gọi. Thêm nữa nó khai `engines: node >=22 <25`, nên trên máy chạy node 25 npm âm thầm cài bản cũ hơn ba năm. Kết luận: **tự viết lớp máy chủ MCP**, không phụ thuộc gói ngoài cho phần lõi.

**Header hạn mức của nhà cung cấp mô hình có thể nói dối.** Khi hạn mức mô hình cao cấp cạn, header dùng chung vẫn báo `allowed` ở mức sử dụng 34% trong khi mọi lời gọi đều bị chặn. Phải thăm dò đúng mô hình định dùng, không đọc header rồi kết luận.

**Số 0 vi phạm có hai nghĩa ngược nhau.** Một phép kiểm trả về 0 có thể nghĩa là dữ liệu sạch, cũng có thể nghĩa là phép kiểm chưa từng chạy. Mọi cổng kiểm của dịch vụ này phải được chứng minh là **biết kêu** trước khi con số 0 của nó được tin.

### C. Áp khuôn kiến trúc nào

App mới nằm cùng repo, theo đúng khuôn StarCi đang dùng: một `app` mỏng ở `apps/`, nghiệp vụ nằm trong `src/features/`, năng lực dùng chung nằm trong `src/modules/`, lắp ráp module chỉ ở app root, lỗi ném qua `AbstractException`, nhật ký đi qua `WinstonService` với enum. 21 luật lint hiện hành áp thẳng cho mã mới, không có ngoại lệ nào.

### D. Việc phải làm, theo thứ tự

1. Chốt ba câu hỏi ở mục 2. Không có câu trả lời thì không bắt đầu.
2. Dựng lớp máy chủ MCP từ xa (HTTP), tự viết, kèm xác thực và hạn mức. [SPEC]
3. Dựng đường index có kiểm chứng danh sách loại trừ, chạy theo commit. [SPEC]
4. Đo lại chất lượng tra cứu **sau khi barrel đã bị xoá** — con số cũ không còn đại diện. [SPEC]
5. Nối lớp MCP vào `credit_usage_histories`, mở gói miễn phí trước. Một tháng dữ liệu
   thật ở gói này là thứ duy nhất cho biết trần tuần nên đặt ở đâu. [SPEC]
6. Ghép canon vào câu trả lời; đây là phần tạo khác biệt, không phải phần phụ. [SPEC]
7. Dựng nạp tiền và vòng đời gói tháng trên luồng PayOS đã có. [SPEC]
8. Chốt giá gói trả trước và trần gói tháng, dựa trên số đo ở bước 5 chứ không đoán.
