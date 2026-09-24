# Tâm sự để chuẩn bị .claude 2.0

Ghi ngày 04/09/2026, sau đợt sửa Grammar Tabs, đăng nhập UAT và các khoảng hở trong quy trình.

Đây là bản ghi mới về các vấn đề hiện tại để thầy tâm sự và trò phân tích trước khi làm 2.0.
Nội dung là đầu vào trao đổi, không tự trở thành rule hay quyền thực thi.
Các mục ghi “đề xuất” chưa phải quyết định đã chốt. Tình hình bên dưới là bằng chứng đã nhận tại
thời điểm viết; các task khác vẫn có thể đang chạy tiếp.

## 1. Điều thầy đang yêu cầu

Thầy đã giao việc và đã có `.claude`, nhưng vẫn phải nhắc agent những việc đáng lẽ quy trình phải tự
đưa tới nơi: sửa đúng owner, nâng Grammar, tạo tài khoản, chuẩn bị seed, đăng nhập UAT và kiểm tra
bản đang chạy. Điều gây mệt là phải vừa giao việc, vừa nhớ quy trình, vừa giục từng bước, vừa hỏi
lại “done” có thực sự là done chưa.

Những chỉ đạo đã rõ trong cuộc trao đổi này:

- Công việc thường lệ trong phạm vi đã giao thì tự làm, không liên tục hỏi thầy có tiếp tục không.
- Khi có 2–3 hướng/tier khác nhau về UX/UI cần thầy chọn thì trình bày rõ để thầy quyết định. Lựa chọn
  đã có thì dùng tiếp, không hỏi lại cùng một việc.
- Lỗi nằm ở Grammar thì sửa Grammar và đưa bản sửa tới consumer/runtime. Trong lần này, thầy đã
  yêu cầu nâng bản và kết quả là `0.4.8 → 0.4.9`.
- Tạo account UAT và chuẩn bị dữ liệu cần thiết là công việc của agent. Không báo thiếu rồi dừng nếu
  quy trình và môi trường đã cho phép thực hiện.
- Audit UX/UI tập trung vào các màn hình quan trọng trước. Ví dụ một luồng quiz: giao diện làm bài,
  giao diện kết quả và home phải đẹp, rõ và dùng được; các trạng thái phụ để vòng sau.
- Thầy từng yêu cầu mỗi page/layout/modal/drawer có `audit.md`, sau đó đã nói khoan viết. Yêu cầu này
  đang được hoãn; việc viết `tamsu.md` không khôi phục nó.
- Báo cáo phải nói rõ việc đã xong, việc chưa xong và bằng chứng đang thiếu.

“Không hỏi việc thường lệ” được hiểu là tự thực hiện việc đã được giao và được phép. Nó không có nghĩa
là đổi request sau khi đã duyệt, bỏ validation, vượt quyền của operator hoặc ghi nhận một thao tác
chưa qua gate thành thao tác hợp lệ.

## 2. Vì sao có .claude rồi mà lỗi vẫn xảy ra?

Không có một nguyên nhân duy nhất. Các sự cố cho thấy ít nhất bốn lớp vấn đề khác nhau:

1. **Hướng dẫn đã có nhưng agent diễn giải sai hoặc không làm hết.** Ví dụ missing account/seed phải
   được tạo, nhưng agent vẫn từng coi thiếu seed là lý do dừng; lựa chọn thường lệ lại được chuyển
   thành câu hỏi cho thầy.
2. **Đường thực thi còn thiếu hoặc kiểm tra chưa đủ.** Việc sửa thư viện owner, tiêu thụ bản phát hành,
   chứng minh provider thực tế và dùng lại bằng chứng giữa các task cần helper/operator cụ thể.
3. **Bản thân công cụ kiểm tra có lỗi.** Đã gặp lỗi khởi tạo CLI khi import bằng chứng; vẫn còn lỗi
   schema validator có thể bỏ qua kiểm tra giá trị trong map.
4. **Bằng chứng bị chia nhỏ giữa source, package, runtime và browser.** Test xanh không tự chứng minh
   runtime đã nhận bản mới. Token hợp lệ không tự chứng minh người dùng đã đăng nhập qua UI. Đổi
   credential trên đĩa không tự cập nhật object đã được backend giữ trong bộ nhớ.

Thêm một đoạn “agent phải nhớ” chưa đủ giải quyết các lớp này. Bài học đề xuất cho 2.0 là đưa những
điều có thể kiểm tra vào runner/gate, kiểm thử cả đường chạy thật và buộc báo cáo giữ đúng phạm vi
bằng chứng. Không dùng số lượng rule hay số test xanh làm đại diện cho mức hoàn thành sản phẩm.

## 3. Bảng tình hình hiện tại

| Mảng | Đã có bằng chứng hoàn tất | Chưa hoàn tất hoặc chưa được chứng minh |
| --- | --- | --- |
| Grammar Tabs | Sửa tại owner; phát hành `@starci/grammar 0.4.9`; regression phân biệt được bản cũ và mới | Chưa chứng minh click Tabs trên workspace thật bằng account mới còn trống dữ liệu |
| Nivo consumer/runtime | Cập nhật dependency chính xác; bản ghép đang phục vụ trên cổng 3067; 737/737 Vitest và 12/12 Node tests đạt, cùng các gate của bản ghép | Không suy ra toàn bộ UI/Setup UAT đã xong từ kết quả này |
| Đăng nhập UAT | Account riêng đã đăng nhập qua form, tới Overview, reload và hydration vẫn giữ đăng nhập | Hành trình Setup đầy đủ vẫn thuộc task UX/UI đang tiếp tục |
| Account/seed cho Setup | Task Nivo đã tạo account riêng, chuẩn bị fixture/rollback 12 row và có kiểm tra schema DB chỉ đọc ở bước 26; contract source migration đã bổ sung tại `140e8dc8` | Source owner đang chuẩn bị migration/runner; chưa áp migration, chưa seed vào DB và chưa hoàn tất Setup UAT |
| Credential quản trị bị lộ trước đó | Đã rotate và đồng bộ các bản lưu; backend StarCi đã restart, có tiến trình mới và 11/11 kiểm tra API sản phẩm đạt | Chưa thử riêng thao tác lấy admin token qua tiến trình backend mới |
| `.claude` | Nền local 1.9.0, contract migration, nhánh release, sửa phân loại hiệu ứng rỗng và chọn worktree session tại `0735873f` đã qua các gate; 125 script tests và 12 site tests đạt | Chưa phát hành package `@starci/skills` chứa thay đổi này; chưa phải release 2.0 |
| Audit UX/UI | Đã cập nhật phạm vi ưu tiên màn hình chính | Chưa có kết luận audit/UAT Setup cuối cùng; states phụ được hoãn, không được tính PASS |
| Trao đổi bằng chứng giữa task | Có import xác minh nguồn và giữ nguyên dữ liệu; CLI đã sửa và có test subprocess | Việc attestation/rebind tiếp theo vẫn phải dựa vào runtime thực tế ở thời điểm thực hiện |
| Schema validator | Đã xác định lỗi map và lỗi bỏ qua ràng buộc cạnh `oneOf`; nhánh migration mới đã tránh đúng điểm lỗi | Engine chung chưa sửa hai lỗi này; không coi schema xanh là bằng chứng đủ nếu chưa thử trường hợp sai |

## 4. Những vấn đề cần nói kỹ

### 4.1. Tự chủ và quyền chọn tier

Thầy không muốn agent hỏi lại những việc đã được giao hoặc đã được `.claude` trả lời. Việc tạo
session, mở worktree, sửa lỗi đã xác định, chạy test, tạo account/seed trong môi trường cho phép và
đi tiếp theo workflow không nên trở thành chuỗi câu hỏi “thầy có muốn không?”.

Phần tương tác đã được sửa từ 1.8.0: bỏ xác nhận thường lệ, ghi lại lựa chọn và giữ quyền chọn hướng
có khác biệt thực chất cho thầy. Điều 2.0 cần chứng minh thêm là hành vi này xuyên suốt nhiều operator,
không chỉ đúng trong một file hướng dẫn hoặc một test đơn lẻ.

Khi cần chọn hướng, agent phải làm đủ để thầy xem và quyết định: phương án cụ thể, khác biệt cụ thể,
ảnh/preview phù hợp. Không đẩy việc lựa chọn implementation vụn vặt sang thầy dưới tên gọi “tier”.

### 4.2. Grammar phải được sửa đến nơi đang dùng nó

Lỗi Tabs là liên kết trợ năng giữa tab và panel: `aria-controls` có thể trỏ tới panel không tồn tại
do cách thư viện bên dưới cập nhật DOM. Có trường hợp đổi tab mới hết, có trường hợp vẫn sai.

Đã sửa hành vi ở owner Grammar, bổ sung regression cho cập nhật/remap/removal và các trường hợp
liên quan, rồi phát hành `0.4.9`. Ở consumer, assertion kiểm tra đúng panel được giữ nguyên về nội dung;
test chờ DOM observer ổn định. Cùng assertion đó thất bại với `0.4.8` và đạt với `0.4.9`.

Đã bổ sung hai operator có phạm vi rõ: `library.source.apply` và `dependency.update`. Đường đi cần
giữ là: xác định owner → sửa và chứng minh regression → phát hành → cập nhật manifest/lockfile → xác
minh package được cài → kiểm tra bản tích hợp đang chạy. Chỉ sửa source thư viện hoặc ghi “đã đề xuất
fix” chưa hoàn thành việc người dùng giao.

### 4.3. Đăng nhập UAT phải bắt đầu từ đúng provider

Trong lần chẩn đoán trước, credential của Source bị ghép với endpoint identity của Nivo. Hai runtime
dùng provider/custody khác nhau nên việc thấy cùng tên Keycloak không đủ để suy ra cùng credential.

Đã bổ sung ràng buộc provider, realm, API, container và nơi runtime lấy credential trước khi đọc
secret. Helper chỉ đưa ra kết quả kiểm tra cần thiết, không đưa giá trị secret vào đầu ra công cụ.
Đã xử lý thêm trường hợp token không chứa role claim nhưng provider vẫn có bằng chứng quyền quản trị
hợp lệ; không cấp thêm quyền chỉ để làm cho bước kiểm tra qua.

Bằng chứng sản phẩm đã có là thao tác đăng nhập thật qua form, vào Overview và reload thành công.
Không bơm token vào trình duyệt để gọi đó là login UAT. Tuy vậy, thành công này chỉ chứng minh phạm vi
đăng nhập; nó chưa chứng minh toàn bộ Workspace/Setup journey.

### 4.4. Account có rồi nhưng thiếu flow/seed vẫn là việc chưa làm xong

Task Nivo đã từng dừng với `INVENTORY_DRIFT`, không ghi dữ liệu, rồi kết luận quá sớm rằng thiếu cột
SQL `is_uat`/namespace khiến seed không thể tiếp tục. Bằng chứng schema ở lượt đó cũng chưa giữ đủ
raw artifact. Thầy nhắc lại rằng `.claude` đã yêu cầu tự seed.

Sau khi rà lại, contract yêu cầu từng seed record mang dấu UAT và namespace, nhưng không mặc nhiên
bắt buộc chúng phải là hai cột SQL riêng. Vì vậy task đã mở bước mới để kiểm tra đầy đủ các cách biểu
diễn được hỗ trợ và bổ sung flow/seed folder còn thiếu.

Điểm cần giữ rõ: có trường JSON không tự có nghĩa là được nhét marker vào đó. Các trường đang chứa
profile, snapshot, manifest hay settings vẫn có schema và reader nghiệp vụ. Cũng chưa có căn cứ để
tự coi một file manifest bên ngoài hoặc quan hệ khóa ngoại là cách thay thế hợp lệ cho dấu trên từng
record. Nếu cần thay đổi sản phẩm để hỗ trợ seed đúng contract, phải đưa tới đúng owner bằng bằng
chứng cụ thể.

Seed tạo điều kiện đầu vào cho bài kiểm tra. Không tạo giả kết quả assistant/job thành công rồi dùng
nó làm bằng chứng chức năng đó đã chạy. Backend nền của Setup còn có giới hạn adapter nghiệp vụ;
audit một màn hình với dữ liệu tiền điều kiện hợp lệ và chứng minh hành vi backend là hai kết luận
khác nhau.

### 4.5. Rotate xong chưa chắc tiến trình đã dùng credential mới

Credential quản trị từng bị lộ ở đầu ra công cụ trước đợt sửa này. Đã rotate đúng provider, chứng minh
credential mới đăng nhập được, credential cũ bị từ chối và đồng bộ những bản lưu thuộc phạm vi xử lý.

Backend StarCi đọc credential vào object tại lúc khởi động và tiếp tục dùng object đó. Vì vậy vẫn cần
restart theo owner của runtime để hoàn thành việc áp dụng credential mới. Task đang sở hữu backend
đã có bản tích hợp riêng và giữ lease trong lúc chạy gate; task sửa credential không được tự restart
chéo rồi báo runtime vẫn là head cũ.

Ban đầu việc restart còn chờ. Cập nhật sau đó: backend đã khởi động lại lúc 19:42 ngày 04/09/2026
(UTC+7), head `ebf5ff6`, listener PID 51900 trên cổng 3001. Đã đối chiếu registry, tiến trình thật,
launcher đọc cấu hình hiện tại và bằng chứng 11/11 kiểm tra API sản phẩm đạt sau restart. Phần chờ
restart được giải quyết. Chưa có lời gọi kiểm tra admin token riêng qua backend mới, nên không ghi
thành hành vi đã thử. Tiêu chí đề xuất cho 2.0 vẫn là xét cả provider, các bản lưu và tiến trình
tiêu thụ credential; chỉ kiểm tra file đã đổi là chưa đủ.

### 4.6. “Đã ghép” cần nói rõ ghép ở đâu, đang chạy cái gì

Tình huống ban đầu là bản ghép UX/UI + i18n tại `691ea17`, build/lint/typecheck đạt, nhưng còn 1 test
Grammar thất bại và chưa đưa bản ghép lên runtime. Sau sửa, runtime Nivo phục vụ bản tích hợp
`f2021b0` với Grammar `0.4.9`; gate đã chạy trên bản ghép thực tế.

Đã bổ sung bằng chứng gắn với head, baseline, diff, log gate, package cài đặt và FE/BE tương ứng.
Phải phân biệt commit nằm trong lịch sử Git với commit đã được registry ghi nhận bằng attestation;
thiếu dòng registry cần xử lý bằng bằng chứng ancestry thực tế, không tự điền theo suy đoán.

Một báo cáo tốt phải trả lời được: sửa tại đâu, test trên head nào, runtime phục vụ head nào, đã xem
màn hình nào và đã đi qua hành trình nào. Sáu trạng thái “đã sửa / đã test / đã merge / đang serve /
đã audit / đã UAT” không được gộp thành một chữ done.

### 4.7. Nhiều task cần dùng lại bằng chứng và chia quyền runtime rõ ràng

Đã có `producer-import` để task nhận dùng bằng chứng hoàn tất của task khác: giữ nguyên request,
response, artifact và thông tin nguồn; kiểm tra hash, nguồn gốc, output đã khai báo và đường dẫn.
Slot import chỉ là bằng chứng, không mang sang quyền ghi source hay lease của task gốc.

Đã sửa lỗi CLI validator bị kẹt khi khởi tạo module trong đường import, có test chạy CLI bằng tiến
trình con thật. Không sửa ID/request lịch sử để giả thành output do task nhận tạo ra.

Về runtime, lease phải xét đúng tài nguyên. Lease backend StarCi không tự động chặn việc soạn
flow/seed riêng của Nivo. Task thao tác dữ liệu Nivo vẫn phải kiểm tra ràng buộc và drift áp dụng cho
tài nguyên nó chạm tới; không tự thêm luật “chờ mọi lease của toàn hệ thống”.

### 4.8. Audit màn hình chính trước, giữ phạm vi kết luận trung thực

Thầy muốn kết quả nhìn thấy được ở nơi người dùng dùng nhiều nhất. Một vòng refactor quiz nên tập
trung home, màn hình thi và kết quả; một vòng Setup nên tập trung các màn hình chính đã chọn. Không
để việc phủ mọi trạng thái phụ chiếm hết vòng làm đẹp đầu tiên.

Phạm vi primary surfaces đã được đưa vào quy trình. Những trạng thái hoãn phải ghi là chưa kiểm tra,
không tính vào PASS hay full coverage. Thu hẹp vòng audit hình ảnh cũng không bỏ qua lỗi chức năng
đã biết hoặc các regression gate đang áp dụng, như lỗi liên kết Tabs vừa sửa.

Chưa viết `audit.md` riêng cho mỗi page/layout/modal/drawer. Cách lưu báo cáo lâu dài có thể trao đổi
tiếp sau, không tự khôi phục yêu cầu thầy vừa hoãn.

### 4.9. Gate phải đứng trước tác động, lịch sử phải giữ đúng sự thật

Đợt sửa này có những sai sót thực thi cần giữ lại để thiết kế 2.0:

- Có agent đổi request sau khi parent đã ghi hash; việc cleanup account thừa diễn ra chưa qua gate
  đúng cách. Request gốc đã được phục hồi, sự cố được lưu riêng. Không ghi lại lịch sử thành “đã gate”.
- Có lệnh cài dependency chạy nhầm cwd Source rồi bị dừng. Dependency Source đã được khôi phục;
  không coi việc phục hồi là lý do xóa dấu vết sai sót ban đầu.
- Các lần thử rotation bị chặn trước tác động được giữ thành bước riêng. Bước thành công có bằng
  chứng riêng, không dùng thành công cuối để hợp thức hóa các request trước đó.

Đề xuất cho 2.0: runner cần gắn việc validate với việc thực thi, kiểm tra request còn nguyên và suy
ra cwd/đối số từ binding đã xác minh. Khi validation lỗi, không được chạy helper tiếp chỉ vì câu lệnh
shell đã được nối sẵn. Đây là đề xuất cần triển khai và kiểm thử thêm, chưa phải khẳng định mọi đường
thực thi hiện tại đã được khóa như vậy.

### 4.10. Lỗi validator còn lại phải sửa trước khi tin vào schema

Trong `scripts/json-schema.mjs`, nhánh `additionalProperties` dạng object có lỗi gắn `else`, khiến
việc kiểm tra một số giá trị trong map bị bỏ qua. Đã tái hiện trường hợp giá trị vi phạm pattern nhưng
validator trả về không có lỗi. Một phạm vi bị ảnh hưởng là kiểm tra pattern của đường dẫn trong
`request.inputs`.

Lỗi này chưa sửa trong đợt repair. Gate import mới có kiểm tra riêng nghiêm ngặt và không dựa vào lỗi
này để cho phép đường dẫn. Đề xuất ưu tiên 2.0 là sửa engine, thêm regression cho map lồng nhau và
đánh giá các request hiện có sẽ bị ảnh hưởng thế nào. Không sửa ngược request đã đóng băng để làm
cho lịch sử trông như luôn hợp lệ.

Review nhánh migration tiếp tục phát hiện `oneOf`/`anyOf` trả về quá sớm, bỏ qua những ràng buộc
khác đặt cùng cấp như `required`, kiểu dữ liệu và cấm field lạ. Đã tái hiện connection chỉ có một
field username vẫn được chấp nhận dù thiếu toàn bộ địa chỉ DB. Schema mới đặt lựa chọn bên trong
`allOf` để các ràng buộc bên ngoài vẫn chạy; đã kiểm tra cả dạng username thường và username qua
custody. Đây là cách khóa đúng nhánh mới, chưa phải sửa engine chung. Hai lỗi cùng cho thấy cần
kiểm thử chính validator bằng các trường hợp trái luật, không chỉ kiểm tra bộ fixture hợp lệ.

### 4.11. Migration độc lập: runtime đã có đường source/release, sản phẩm còn phải chứng minh

Sau lượt ghi ban đầu, task Setup báo một khoảng hở cụ thể khi xem xét bổ sung khả năng đánh dấu dữ
liệu UAT ở schema. Ở runtime trước khi sửa, `stack-model.operations` bắt buộc có ít nhất một
operation, và `transport` chỉ nhận `graphql-mutation`, `graphql-query`, `rest`, `worker`, `cron` hoặc
`event-consumer`. Contract `mutations` dùng cùng tập giá trị.

Schema có `migrationRefs`, ownership của migrator và proof `migration-replay`, nhưng migration phải
gắn với operation đã khai. Khi đó chưa có cách biểu diễn đúng cho một thay đổi chỉ gồm migration TypeORM
độc lập, không có API/worker/event operation thực tế tương ứng. Không nên gọi CLI migration là
worker hoặc tạo thêm API chỉ để vừa schema.

Cần phân biệt hai công việc: chạy seed dữ liệu trên schema đã hỗ trợ vốn có đường
`platform.operate → seed-flow-fixtures`; còn sửa entity/DDL để tạo khả năng hỗ trợ seed là thay đổi
schema sản phẩm. Quyền seed hiện chỉ cho insert/delete row mang dấu UAT, không tự cấp quyền đổi
schema. `release.deploy` có thể áp migration đã được khai trong release hợp lệ, nhưng không thay
thế contract còn thiếu ở bước viết source.

Khoảng hở này đã được đưa vào sửa ngay khi thầy yêu cầu tiếp tục. Commit `.claude` `140e8dc8` bổ sung
`transport: migration`, giữ giới hạn writer/store/migration và yêu cầu conformance/replay. Backend
request khóa SHA-256 của đúng byte stack-model đầu vào; gate kiểm producer kiến trúc và phản biện,
rồi đối chiếu toàn bộ operation với output. Đã qua toàn bộ gate runtime, 100 script tests và 12 site
tests, gồm CLI thật và import producer. Phạm vi đóng băng mới áp dụng cho contract migration/pinned;
không khẳng định mọi receipt backend cũ đã có đối chiếu producer đầy đủ.

Task Setup đã nhận commit để tiếp tục kiến trúc/source. Task đã bàn giao model và báo chuẩn bị xong
fixture/rollback 12 row, có truy vấn schema DB chỉ đọc ở bước 26.
Đợt probe đầu dùng biến username rỗng đã được sửa sang cấu hình `POSTGRES_USER_FILE`; không cần
credential mới. Theo báo cáo của task, sáu bảng được chọn tồn tại nhưng chưa có các cột marker cần
kiểm tra. Tại bước chuẩn bị đó chưa có source/DB mutation và chưa seed thành công. Nếu phương án cuối không cần đổi
schema thì không phải ép luồng seed đi qua khoảng hở này.

Kiểm tra tiếp cho thấy còn bước áp dụng: platform không sở hữu DDL sản phẩm, trong khi release.deploy
chỉ biểu diễn đầy đủ việc deploy image. Commit `33023deb` đã bổ sung nhánh migration dưới release.deploy,
giữ nguyên grants và quyền phê duyệt theo môi trường. Nivo ban đầu chưa có migration CLI/DataSource
riêng, nên source owner phải tạo và chứng minh runner, không gọi một command chưa tồn tại. Nhánh mới
ràng buộc đúng source/runner/config/migration, kiểm pending/journal trước tác động và chứng minh
replay không áp trùng. Đã qua 18 test riêng, gồm chạy subprocess từ source commit trong môi trường
giả lập và kiểm toàn bộ biên nhận; toàn runtime đạt 118 script tests, toàn bộ operator self-tests và
12 site tests. Đây là bằng chứng cho cơ chế runtime. Runner sản phẩm vẫn đang được sửa và kiểm thử;
chưa có DDL hay seed chạy vào DB thật từ việc sửa contract.

Review độc lập còn phát hiện rằng chỉ ghi tên môi trường `dev` và hash kết nối do plan tự chọn là
chưa đủ: phải đối chiếu kết nối với khai báo do môi trường sở hữu. Nếu không, hai giá trị tự khai
có thể khớp nhau nhưng vẫn trỏ nhầm database. Gate mới ràng buộc project, target, custody và
danh tính kết nối vào đúng khai báo đã khóa hash; runner kiểm tra lại database/schema/role trước
tác động. Protocol đã chốt và bàn giao để source owner làm song song. Bản thân việc bổ sung schema
khai báo không sửa cấu hình môi trường thật, không đổi quyền release và không chứng minh DDL đã chạy.
Username cũng có thể nằm trong custody; khi đó khai báo chỉ mang tham chiếu và commitment của kết
nối, không chép giá trị đã giải mã ra file.

Preflight seed tiếp theo đã đọc được database/journal và giữ bằng chứng chỉ đọc. Gate lại báo cần
approval cho đổi credential vì `effects: []` bị thay bằng toàn bộ hiệu ứng của nhánh identity.
Đây là lỗi phân loại ở owner, không phải thầy chưa cấp quyền đọc. Đã sửa để tập rỗng giữ nguyên
nghĩa không có mutation tại `b76628e5`; đồng thời chặn response tự thêm hiệu ứng ngoài request/approved set.
Biên nhận bước 33 nguyên byte đã được validator chấp nhận với trạng thái `blocked / PROOF_FAILED`:
phần chuẩn bị đọc được dùng làm bằng chứng, không biến thành tuyên bố seed đã hoàn tất.

### 4.12. Sửa từng gate chưa đủ nếu đường đi vẫn đứt ở bước sau

Một điểm đứt tiếp theo đã xuất hiện ngay giữa source và release: operator source yêu cầu viết trên
worktree của session, nhưng route mới vẫn chỉ nhận checkout `main`. Hai bước riêng lẻ có thể hợp lệ
mà không nối được với nhau. Commit `0735873f` đã bổ sung lựa chọn worktree đúng session ở
`workspace.bind`, dựa trên khai báo canonical và đăng ký Git thật. Gate đối chiếu session đang chứa
request, tọa độ bước và hash đã đóng băng; từ chối chọn worktree của session khác. Đã qua review,
125 script tests và 12 site tests; probe chỉ đọc nhận đúng worktree Nivo với 13 đường dẫn được phép.
Đây là cơ chế đã sửa, chưa phải biên nhận source hoàn tất hay bằng chứng migration đã chạy.

Trong lúc sửa, review còn bắt được helper giả định sai trường `skills` do hydrator tạo ra. Test tự
dựng một object trông hợp lệ đã không lộ ra lỗi này; chạy với khai báo thật mới thấy. Fixture đã đổi
sang gọi chính hydrator. Bài học cho 2.0 là kiểm thử chỗ nối giữa producer và consumer bằng artifact
producer thực sự tạo ra, không chỉ bằng các mẫu do mỗi bên tự nghĩ ra.

Việc chuẩn bị seed vừa bộc lộ chuỗi phụ thuộc liên tiếp: thiếu dữ liệu → thiếu cách lưu dấu UAT →
thiếu cách khai báo migration độc lập → thiếu runner → thiếu nhánh áp migration local. Nếu owner
chỉ ghi nhận từng gap vào backlog hoặc chỉ sửa gate gần nhất, task UI vẫn không tới được màn hình
cần audit. Thầy tiếp tục phải hỏi vì sao dừng.

Bài học đề xuất cho 2.0 là parent phải rà đường đi tới kết quả trước khi nói đã gỡ blocker: ai viết
migration, ai chứng minh source, ai được áp vào môi trường, dùng runner nào, dữ liệu được tạo ra sao,
và khi nào quay lại UI. Những nhánh độc lập phải tiếp tục song song; phần cần phê duyệt chỉ được đưa
ra khi đã có thay đổi cụ thể để xem. Không mở rộng tính năng chỉ để làm vừa contract, và không lấy
số bước/biên nhận tăng lên làm bằng chứng công việc đã tiến gần kết quả người dùng cần.

Điểm cần cùng thầy phân tích là chi phí quy trình: ranh giới nào thật sự ngăn lỗi và có bằng chứng,
ranh giới nào đang buộc agent lặp lại cùng thông tin hoặc tạo giấy tờ mà chưa giúp sản phẩm chạy.
Một bài thử tốt cho 2.0 phải kết thúc ở màn hình chính được audit và hành trình dùng được, đồng thời
giữ đúng các quyền và bằng chứng cần thiết trong suốt đường đi.

## 5. Những gì đã thực sự xong ở nền 1.9.0

- Bổ sung operator sửa thư viện và cập nhật dependency có phạm vi, regression và bằng chứng package.
- Sửa đường identity/provisioning: gắn đúng provider và custody, kiểm tra quyền bằng bằng chứng phù
  hợp, đọc secret tại nơi tiêu thụ và chứng minh login sản phẩm.
- Ghi nhận phạm vi audit màn hình chính và giới hạn của các trạng thái hoãn.
- Bổ sung provenance FE/BE, gate trên bản tích hợp thực tế và import bằng chứng giữa task.
- Sửa lỗi khởi tạo CLI liên quan tới import.
- Kiểm thử `.claude` đạt toàn bộ operator self-tests, 98 script tests và 12 site tests; tài liệu sinh
  tự động đã được cập nhật.

Hai commit local chính là `45e218b1` và `34ebb461`. Đây là thay đổi local đã kiểm thử, chưa phải bằng
chứng package `@starci/skills` mới đã phát hành. Ngược lại, `@starci/grammar 0.4.9` đã thực sự được
phát hành. Hai trạng thái phát hành này không được nói lẫn với nhau.

## 6. Quy trình mong muốn để trao đổi cho 2.0

Đây là đề xuất diễn đạt kết quả cần đạt, chưa thay thế routing/operator chính thức:

1. Nhận việc, ghi phạm vi và tận dụng các quyết định thầy đã chốt. Tự mở session và bind đúng owner.
2. Nếu có các hướng/tier khác biệt thực chất thì chuẩn bị phương án để thầy chọn; việc thường lệ tự
   tiếp tục trong phạm vi được phép.
3. Sửa đúng tầng chịu trách nhiệm. Lỗi Grammar đi qua owner Grammar, lỗi app ở consumer, dữ liệu và
   identity tới operator tương ứng.
4. Tự chuẩn bị flow, account và seed cần thiết. Thiếu thứ gì thì thực hiện phần còn thiếu hoặc chỉ ra
   chính xác năng lực nào chưa có sau khi đã kiểm tra đủ; không dừng ở một câu “thiếu dữ liệu”.
5. Tích hợp bản sửa, chạy gate trên bản tích hợp và đưa tới runtime theo đúng lease.
6. Audit các màn hình chính đã chọn với dữ liệu phù hợp, rồi đi qua hành trình thật trong browser.
   Những gì chưa thử giữ nguyên trạng thái chưa thử.
7. Báo cáo ngắn nhưng đủ: kết quả người dùng nhận được, bằng chứng, việc còn lại và owner đang xử lý.
8. Chỉ phát hành khi điều kiện phát hành áp dụng đã được chứng minh trên đúng artifact.

## 7. Danh sách chuẩn bị release 2.0 — đề xuất

| Ưu tiên | Việc cần làm | Bằng chứng để đóng việc |
| --- | --- | --- |
| P0 — ý đầu tiên của thầy | Mỗi operator có goal, tự kiểm đạt/chưa đạt và in kết quả; parent giữ mục tiêu toàn chuỗi | Xem phân tích ở mục 8; một blocker có thể xử lý phải dẫn tới hành động tiếp theo và quay lại mục tiêu còn thiếu |
| P0 | Sửa engine schema: map và các ràng buộc cùng cấp với `oneOf`/`anyOf` | Regression từng thất bại nay đạt; xác định ảnh hưởng lên request cũ |
| P0 | Khép kín validation trước tác động ở các runner liên quan | Request lỗi/đổi sau validate và cwd sai đều bị chặn trước thao tác |
| P0 | Hoàn thiện provisioning theo flow: account + seed + dữ liệu cần thiết | Account đăng nhập được, seed đúng schema/phạm vi, browser tiếp cận màn hình cần kiểm tra |
| P0 — cơ chế runtime đã xong, sản phẩm còn phải chứng minh | Hoàn thiện runner sản phẩm và dùng đường migration độc lập đã bổ sung | Source/quality trên đúng worktree, plan theo môi trường, apply và replay thực tế trước khi seed |
| P0 — phần restart đã giải quyết | Chốt phạm vi bằng chứng credential trong tiến trình mới | Đã có restart/config và API sản phẩm; nếu yêu cầu chứng minh đường admin token thì cần probe riêng, không suy từ login người dùng |
| P0 | Thử một chuỗi đầu cuối đại diện qua nhiều operator | Source → package nếu có → integration → runtime → primary audit → UAT, cùng bằng chứng truy được |
| P1 | Kiểm thử hành vi tự chủ và chọn tier | Không hỏi lại việc thường lệ; lựa chọn có ý nghĩa được trình bày và dùng lại đúng |
| P1 | Kiểm thử bàn giao giữa task | Import hợp lệ dùng được; dữ liệu sửa/nguồn sai bị từ chối; lease không chặn sai tài nguyên |
| P1 | Chốt cách báo cáo tiến độ | Phân biệt rõ đã sửa/test/merge/serve/audit/UAT, trạng thái hoãn và dependency ngoài task |
| Release | Kiểm tra artifact đóng gói, cài mới và nâng cấp | Gate chạy trên đúng bản sẽ phát hành; tài liệu/phiên bản nhất quán; công bố release có bằng chứng |

Danh sách này là đề xuất chuẩn bị. Việc ghi vào đây chưa bump version, chưa phát hành package và
chưa mở rộng quyền của bất kỳ operator nào.

## 8. Chỗ để thầy nói tiếp

Thầy có thể viết tự nhiên ở đây. Các gợi ý dưới đây để giữ mạch trao đổi, không phải những câu hỏi
bắt buộc phải trả lời trước khi công việc thường lệ được tiếp tục.

### Điều khiến thầy mất công nhất


### Điều trong 1.9 nên giữ nguyên


### Điều đang quá rườm rà, cần bỏ hoặc thu gọn


### Ranh giới thầy muốn giữa tự làm và hỏi tier


### Phạm vi audit màn hình chính và thời điểm quay lại các states phụ


### Kết quả cụ thể khiến thầy coi 2.0 là đáng nâng


### Quyết định mới sau cuộc tâm sự

#### Ý 1 — Mỗi operator phải có goal, kiểm tra lại và in kết quả

Thầy nêu vấn đề: chuỗi operator block quá nhiều, rồi agent không biết phải làm gì tiếp. Thầy muốn
mỗi operator đặt goal, khi kết thúc kiểm tra xem đã đạt chưa và in ra màn hình. Đây là yêu cầu thiết
kế đầu tiên được ghi cho 2.0; phần dưới là phân tích cách thực hiện, chưa triển khai vào runtime.

Goal nên diễn đạt kết quả cần có sau lượt làm việc, dựa trên nhiệm vụ được giao và mục tiêu chung.
Operator nêu goal ngay khi bắt đầu, cùng điều kiện để nhận biết đã đạt và bằng chứng cần kiểm tra.
“Chạy operator”, “viết đủ receipt” hoặc “đã thử sửa” không phải kết quả người dùng cần. Goal được giữ
suốt lượt chạy; không thu hẹp sau khi gặp lỗi để đổi kết luận thành đạt.

Trước khi kết thúc, operator đối chiếu từng điều kiện với đầu ra thực tế. Điều kiện chưa kiểm tra
hoặc thiếu bằng chứng vẫn là chưa đạt. Kết luận đạt cần qua gate kiểm bằng chứng phù hợp; một dòng
tự khai “goal achieved” không đủ. Khi điều kiện đều đạt, in kết quả và bằng chứng ngắn gọn. Khi chưa
đạt, in chính xác điều còn thiếu và việc tiếp theo có thể làm để tiến tới goal.

Một blocker phải được phân tích thành hành động:

- Việc thuộc phạm vi và quyền hiện có của operator thì operator tiếp tục xử lý, không kết thúc sớm
  chỉ để báo mã lỗi rồi chờ thầy nhắc.
- Việc cần owner khác thì trả phần thiếu có cấu trúc để parent chuyển đúng operator, giữ bằng chứng
  đã có và quay lại goal chưa đạt sau khi phụ thuộc được giải quyết. Operator con không tự mở rộng
  quyền hay tự điều khiển cả chuỗi.
- Khi chưa có đường xử lý hợp lệ, parent nêu rõ thiếu năng lực, đầu vào hoặc quyết định nào và ai
  có thể giải quyết. Không lặp lại cùng một chuỗi với cùng bằng chứng chỉ để tạo thêm lượt chạy.

Phần in ra màn hình nên ngắn và nhất quán:

```text
Operator: <operator đang chạy>
Goal: <kết quả cụ thể cần đạt>
Kết quả: ĐẠT / CHƯA ĐẠT
Bằng chứng: <kết quả đã kiểm tra và tham chiếu cần thiết>
Còn thiếu / bước tiếp theo: <việc cần làm và owner chịu trách nhiệm, nếu chưa đạt>
```

Parent phải kiểm tra thêm goal toàn chuỗi theo yêu cầu của thầy. Ví dụ, việc tạo account đạt chưa
chứng minh audit đã xong; sau khi tạo account, parent phải đưa luồng quay lại các màn hình cần audit.
Tổng số operator đạt không thay thế kết quả cuối cùng mà thầy giao.

Đề xuất triển khai gọn: gắn goal và phần đối chiếu vào request/response hiện có, tận dụng bằng chứng
và routing hiện có. Không thêm một tầng operator hay một bộ báo cáo riêng chỉ để quản lý goal.
Các việc thường lệ đã được giao tiếp tục tự làm; chỉ đưa lựa chọn hướng/tier thực chất tới thầy theo
chỉ đạo đã có. Chi tiết contract và gate sẽ chốt khi tổng hợp các ý cho 2.0.

Bài thử để xem thay đổi có ích: cho một lượt audit gặp thiếu account/fixture. Chuỗi phải xác định
đúng phần thiếu, chuyển owner chuẩn bị, quay lại audit và in kết luận theo goal ban đầu. Cũng cần
thử trường hợp bằng chứng chưa đủ để bảo đảm operator không tự báo đạt. Việc thêm chữ “goal” vào
file mà agent vẫn dừng, hỏi lại hoặc quên quay về mục tiêu cũ thì chưa giải quyết vấn đề thầy nêu.

## 9. Dấu vết để đối chiếu

- [Tổng kết đợt repair](D:/Repositories/starci-academy-backend/.worktrees/sessions/20260904-171024-grammar-uat-repair/completion.md).
- [Kết quả kiểm thử runtime .claude](D:/Repositories/starci-academy-backend/.worktrees/sessions/20260904-171024-grammar-uat-repair/artifacts/final-runtime-verification.json).
- [Bàn giao cuối phần migration và preflight chỉ đọc](D:/Repositories/starci-academy-backend/.worktrees/sessions/20260904-171024-grammar-uat-repair/artifacts/migration-runtime-handoff.json).
- [Gate runtime mới nhất: 125 script tests và 12 site tests](D:/Repositories/starci-academy-backend/.worktrees/sessions/20260904-171024-grammar-uat-repair/artifacts/session-checkout-verification.json).
- [Bàn giao lựa chọn worktree đúng session](D:/Repositories/starci-academy-backend/.worktrees/sessions/20260904-171024-grammar-uat-repair/artifacts/session-checkout-handoff.json).
- [Ghi nhận lỗi schema validator còn lại](D:/Repositories/starci-academy-backend/.worktrees/sessions/20260904-171024-grammar-uat-repair/artifacts/schema-map-validation-finding.md).
- [Bằng chứng đăng nhập qua browser](D:/Repositories/starci-academy-backend/.worktrees/sessions/20260904-171024-grammar-uat-repair/step-2/parallel-2/response/artifacts/browser-login-proof.json).
- [Xác nhận backend Source đã restart và giới hạn bằng chứng](D:/Repositories/starci-academy-backend/.worktrees/sessions/20260904-171024-grammar-uat-repair/artifacts/source-backend-reload-confirmed.md).
- [Bàn giao phần chuẩn bị seed Setup](D:/Repositories/starci-academy-backend/.worktrees/sessions/20260904-042915-nivo-workspace.bind/continuation-1.9.0/seed-owner-handoff.md).

Các liên kết này phục vụ việc đối chiếu nội bộ; nội dung trao đổi không cần chứa credential, token
hay đầu ra secret để giải thích sự cố.
