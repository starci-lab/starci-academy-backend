# GAME HOÁ (XP · COIN · CHUỖI · GIẢI ĐẤU)

> Miền này biến việc học thành một vòng lặp có phần thưởng: mỗi hành động học sinh ra XP và Coin, chuỗi ngày và nhiệm vụ giữ người học quay lại mỗi ngày, giải đấu tuần và bảng xếp hạng tạo áp lực đồng trang lứa, còn cửa hàng Coin là chỗ tiêu số điểm kiếm được.

## 1. THỰC THỂ

| Thực thể | Là gì | Trạng thái thật (enum) |
| --- | --- | --- |
| Achievement (huy hiệu) | Định nghĩa một huy hiệu có thể kiếm được: tên, mô tả, ảnh, mốc đạt. Có loại một mốc, có loại nhiều bậc. | `criteriaType`: `lessonsRead` · `streakDays` · `challengesPassed` · `milestonesPassed` · `coursesEnrolled` · `codingSolved` · `aiLabPassed` · `discussionComments` · `followers` · `leagueTier` |
| UserAchievement | Sổ ghi người học đã đạt huy hiệu nào, ở bậc mấy, vào lúc nào. Ghi thêm chứ không sửa. | không có trạng thái (chỉ `tier` số, null nếu huy hiệu một bậc) |
| XpHistory | Sổ XP thật: mỗi lần học có kết quả là một dòng, kèm số Coin cấp cùng lúc. | `source`: `challenge` · `lessonRead` · `milestone` · `coding` · `flashcardQuiz` · `flashcardFirstReview` |
| CoinHistory | Sổ Coin thưởng thuần, không đi kèm XP. Tách riêng để "lịch sử XP" không lẫn tiền thưởng. | `source`: `dailyQuest` · `streakMilestone` · `streakDailyBonus` · `kpiReward` · `weeklyChallenge` |
| UserLeague | Vị trí của một người trong giải đấu: đang ở bậc nào, tuần này đua trong nhóm nào, tuần trước về hạng mấy. | `tier`: `bronze` · `silver` · `gold` · `platinum` · `diamond` · `champion` · `legend` |
| LeagueCohort | Một nhóm đua tối đa 30 người, cùng bậc, cùng khung tuần Chủ nhật → Chủ nhật. | dùng lại `LeagueTier` ở trên |
| DailyQuestCompletion | Bằng chứng người học đã nhận thưởng nhiệm vụ ngày hôm đó. Có dòng nghĩa là đã nhận. | không có trạng thái |
| DailyQuestKey | Danh mục việc trong nhiệm vụ ngày. | `readContent` · `passChallenge` · `reviewFlashcards` · `mockInterview` · `quizSession` |
| KpiWeeklyRewardFloor | Mức sàn chống gian lận của một KPI trong tuần, cộng dấu đã nhận thưởng hay chưa. | `kpiKey`: `lessons` · `studyDays` · `challenges` · `coding` · `flashcards` · `milestones`; đã nhận hay chưa đọc qua `claimedAt` null hay không |
| WeeklyChallengeClaim | Bằng chứng đã nhận thưởng thử thách tuần, mỗi tuần ISO một lần. | không có trạng thái |
| StreakProtectedDay | Một ngày lịch được "đóng băng chuỗi" cứu, để chuỗi không đứt dù hôm đó không học. | không có trạng thái |
| RewardRedemption | Một lần đổi quà trong cửa hàng Coin, chốt giá tại thời điểm đổi. | `status`: `granted` · `pending` · `fulfilled` · `cancelled` |
| Voucher (đúc ra từ quà `voucher10`) | Mã giảm giá khoá học nằm trong ví của người học. | `status`: `unused` · `reserved` · `used` · `expired` |
| UserXpProjection | Bản tổng hợp sẵn: XP theo từng nguồn, tổng điểm, số dư Coin. | không có trạng thái |
| UserContributionProjection | Lịch đóng góp kiểu GitHub, mỗi năm một dòng. | không có trạng thái |
| UserStatsProjection | Bộ đếm xã hội: người theo dõi, đang theo dõi, thông báo chưa đọc. | không có trạng thái |

## 2. MÀN HÌNH PHỤC VỤ

| Màn | Phục vụ việc gì | Thực thể chính |
| --- | --- | --- |
| `/[locale]/dashboard` tab Tổng quan | Nhiệm vụ hôm nay, dải chuỗi 7 ngày, mục tiêu tuần, thử thách tuần, lịch đóng góp | DailyQuestCompletion, StreakProtectedDay, KpiWeeklyRewardFloor, WeeklyChallengeClaim, UserContributionProjection |
| `/[locale]/dashboard` tab Cộng đồng | Thẻ giải đấu tuần rút gọn và bảng người học dẫn đầu | UserLeague, LeagueCohort |
| `/[locale]/league` | Bảng xếp hạng đầy đủ, hai tab: nhóm đua tuần và bảng toàn hệ thống | UserLeague, LeagueCohort, XpHistory |
| `/[locale]/kpi` | Đặt mục tiêu tuần cho từng KPI và nhận Coin khi đạt | KpiWeeklyRewardFloor, CoinHistory |
| `/[locale]/rewards` | Cửa hàng Coin: tab Cửa hàng để đổi quà, tab Ví của tôi để xem voucher và lịch sử đổi | RewardRedemption, Voucher |
| `/[locale]/profile/[username]/activity` | Tường huy hiệu của một người, chia nhóm, hiện cả huy hiệu chưa mở | Achievement, UserAchievement |

## 3. STATE PHẢI VẼ

| Vùng/màn | State | Điều kiện nghiệp vụ | Hình đổi gì |
| --- | --- | --- | --- |
| Nhiệm vụ hôm nay | đang tải | chưa có dữ liệu | 5 dòng skeleton trong một khối danh sách liền, chưa có nút nhận |
| Nhiệm vụ hôm nay | lỗi | truy vấn hỏng và không có cache | thay danh sách bằng khối lỗi có nút "Thử lại" |
| Nhiệm vụ hôm nay | chưa đủ việc | số việc xong < 3 | mỗi dòng chưa xong dùng icon vòng tròn rỗng màu chữ thường, dưới thẻ là câu nhắc chữ mờ, KHÔNG có nút |
| Nhiệm vụ hôm nay | đủ điều kiện nhận | đã xong ≥ 3 trong 5 việc, chưa nhận | dòng đã xong đổi icon sang tick và chữ sang màu thành công; dưới thẻ hiện nút chính "Nhận N điểm" |
| Nhiệm vụ hôm nay | đã nhận hôm nay | đã có dòng hoàn thành cho ngày VN hôm nay | nút biến mất, thay bằng chip thành công "Đã nhận thưởng" |
| Nhiệm vụ hôm nay | đang gửi yêu cầu nhận | bấm nút, mutation đang chạy | nút vào trạng thái chờ, danh sách giữ nguyên |
| Dải chuỗi | đang tải | chưa có thống kê tuần | 7 chấm tròn skeleton kèm nhãn thứ, cụm phải là skeleton ngọn lửa + chip |
| Dải chuỗi | lỗi | truy vấn hỏng | khối lỗi có nút "Thử lại" thay cả dải |
| Dải chuỗi | lần đầu chưa có dữ liệu | chuỗi bằng 0 và cả 7 ngày đều không hoạt động | cụm phải bỏ hẳn ngọn lửa và chip, thay bằng một câu mời học và nút chính dẫn sang danh sách khoá |
| Dải chuỗi | hôm nay chưa học | có chuỗi nhưng ngày cuối chưa hoạt động | thêm một hàng nhắc bên dưới với nút chính "học tiếp"; hàng này biến mất khi hôm nay đã học |
| Dải chuỗi | ngày được bảo vệ | ngày đó được đóng băng chuỗi cứu | chấm ngày vẫn tô như ngày hoạt động (BE gộp ngày bảo vệ vào tập ngày hoạt động) |
| Mục tiêu tuần | chưa đặt mục tiêu riêng | người học chưa gọi đặt target | thanh tiến độ vẫn chạy theo mục tiêu mặc định, KHÔNG hiện trạng thái rỗng chờ cấu hình |
| Trang KPI | đang tải | chưa có dữ liệu | khối tiêu đề skeleton + 6 hộp bo tròn cao 20 |
| Trang KPI | chưa có thưởng | KPI chưa được đặt target thật ở server | ẩn hoàn toàn hàng thưởng Coin của KPI đó |
| Trang KPI | đủ điều kiện nhận | đạt mức sàn tuần, chưa nhận | dòng thưởng đổi sang màu nhấn và hiện nút chính "Nhận thưởng" |
| Trang KPI | chưa đạt sàn | có thưởng nhưng chưa đạt | dòng thưởng để màu mờ, KHÔNG có nút |
| Trang KPI | đã nhận | `claimedAt` khác null | thay nút bằng chữ mờ "Đã nhận" |
| Trang KPI | đang lưu target | bấm một preset | các preset khác của cùng KPI bị vô hiệu cho tới khi xong |
| Thử thách tuần | đang tải | chưa có dữ liệu | skeleton dựng đúng khung thẻ có nhãn |
| Thử thách tuần | không có sự kiện | không có thử thách nào đang chạy | khung thẻ VẪN đứng, bên trong là khối rỗng có tiêu đề và mô tả, không tự ẩn |
| Thử thách tuần | chưa pass | `viewerPassed` false | bên phải là liên kết "Thử ngay" dẫn vào challenge |
| Thử thách tuần | đã pass, chưa nhận | pass rồi, chưa có claim tuần này | bên phải là nút chính "Nhận N Coin" |
| Thử thách tuần | đã nhận | đã có claim cho tuần ISO này | bên phải là chip thành công "Đã pass" |
| Bảng giải đấu tuần | đang tải | chưa có dữ liệu | skeleton riêng dựng đúng bố cục bảng |
| Bảng giải đấu tuần | chưa vào nhóm nào | không có dữ liệu hoặc nhóm rỗng | thay cả bảng bằng khối rỗng, nút hành động dẫn sang danh sách khoá học |
| Bảng giải đấu tuần | người xem trong vùng lên hạng | hạng ≤ số suất thăng | thẻ đứng đầu bỏ thanh tiến độ tới mốc thăng hạng |
| Bảng giải đấu tuần | người xem chưa vào vùng thăng | hạng lớn hơn số suất thăng | thẻ đứng đầu hiện thanh tiến độ kèm nhãn "còn N điểm để lên hạng" |
| Bảng giải đấu tuần | người xem vào top 3 | hạng ≤ 3 | bắn confetti một lần mỗi lượt vào tab, cột của chính mình trên bục được viền |
| Bảng giải đấu tuần | nhóm ít hơn 4 người | danh sách chỉ có bục | bỏ hẳn khối danh sách hạng 4 trở đi |
| Dòng xếp hạng | thứ hạng đổi so với tuần trước | `rankDelta` khác 0 | dòng có dải màu ở mép: xanh khi lên, đỏ khi xuống; kèm mũi tên nhỏ bên phải |
| Dòng xếp hạng | chưa có mốc tuần trước | `lastWeekRank` null | không dải màu, không mũi tên |
| Cửa hàng Coin | đang tải | chưa có danh mục | lưới 4 thẻ skeleton hai cột |
| Cửa hàng Coin | rỗng | danh mục trả về rỗng | khối rỗng có icon quà, tiêu đề và mô tả |
| Cửa hàng Coin | lỗi | truy vấn hỏng | khối lỗi có nút thử lại |
| Cửa hàng Coin | không đủ Coin | số dư < giá món | nút bị vô hiệu và ĐỔI CHỮ sang "chưa đủ điểm", không phải chỉ làm mờ |
| Cửa hàng Coin | đang đổi một món | có món đang gửi | nút món đó vào trạng thái chờ, nút của MỌI món khác bị vô hiệu |
| Cửa hàng Coin | xác nhận trước khi tiêu | món không phải hàng vật lý | mở hộp thoại nhỏ hỏi lại trước khi trừ Coin |
| Cửa hàng Coin | quà vật lý | `kind` là `physical` | thẻ bung form địa chỉ ngay trong thẻ, ẩn nút đổi gốc; nút xác nhận chỉ bật khi đủ tên, điện thoại, địa chỉ |
| Cửa hàng Coin | vừa đổi xong voucher | đổi món kiểu voucher | hiện khối thông báo trên lưới, có mã dạng chữ đơn cách và nút sao chép, đóng được |
| Cửa hàng Coin | vừa đổi xong credit AI | đổi món kiểu aiCredit | cùng khối thông báo nhưng nội dung là số credit vừa được cộng |
| Ví của tôi | rỗng | chưa có voucher | khối rỗng có icon vé kèm gợi ý |
| Ví của tôi | theo trạng thái voucher | `unused` · `reserved` · `used` · `expired` | chip cuối dòng đổi màu: nhấn · cảnh báo · trung tính · nguy hiểm |
| Ví của tôi | chưa đổi gì | lịch sử đổi rỗng | khối rỗng riêng có icon hoá đơn |
| Lịch sử đổi quà | theo trạng thái đổi | `granted` · `pending` · `fulfilled` · `cancelled` | phần meta của dòng đổi chữ theo trạng thái; dòng `cancelled` vẫn hiện nhưng chi phí của nó KHÔNG còn tính vào số đã tiêu |
| Tường huy hiệu | đã đạt | `earned` true | ảnh huy hiệu đủ màu, kèm nhãn bậc tô theo màu bậc và tỉ lệ hiếm |
| Tường huy hiệu | chưa đạt | `earned` false | ảnh làm mờ, thay nhãn bậc bằng tiến độ hiện tại trên mốc |
| Tường huy hiệu | huy hiệu lạ | slug không nằm trong nhóm nào | rơi vào nhóm "khác" ở cuối, không được biến mất |
| Mọi vùng có fetch | chưa đăng nhập | không có phiên | các truy vấn "của tôi" không có dữ liệu, vùng rơi về nhánh rỗng của chính nó chứ không văng lỗi |

## 4. LUẬT NGHIỆP VỤ ĐÁNG NHỚ

- Coin dùng để tiêu KHÔNG bị trừ khỏi `coin_balance`. Số dư tiêu được là `coin_balance` trừ tổng chi phí các lần đổi chưa bị huỷ, nên bảng xếp hạng toàn hệ thống không bao giờ tụt vì người ta mua sắm. Huỷ một lần đổi là hoàn tiền tự động. `src/modules/bussiness/rewards/rewards.service.ts:141`, `:260`.
- XP và Coin là hai sổ khác nhau. Sổ XP chỉ chứa việc học thật, sổ Coin chỉ chứa tiền thưởng thuần. Đừng gộp hai thứ vào một dòng lịch sử. `src/modules/databases/postgresql/primary/enums/coin-source.ts:10`.
- Nhiệm vụ ngày chỉ cần xong 3 trong 5 việc là mở được thưởng, không phải xong hết. `src/modules/bussiness/daily-quest/daily-quest.catalog.ts:44`.
- Mỗi ngày lịch Việt Nam chỉ nhận thưởng nhiệm vụ được một lần. Sau nửa đêm giờ Việt Nam mọi thứ đặt lại, không theo múi giờ máy người dùng. `src/modules/databases/postgresql/primary/entities/daily-quest-completion.entity.ts:23`.
- Thưởng KPI tính theo mức SÀN của tuần, tức mục tiêu thấp nhất từng đặt trong tuần đó. Nâng mục tiêu giữa tuần không làm tăng tiền thưởng cho phần việc đã làm. `src/modules/bussiness/kpi-reward/kpi-reward.service.ts:84`.
- Tuần của KPI bắt đầu thứ Hai 8 giờ sáng giờ Việt Nam, còn tuần của giải đấu bắt đầu Chủ nhật 0 giờ. Hai đồng hồ đếm ngược này khác nhau, đừng dùng chung một con số. `src/modules/databases/postgresql/primary/entities/kpi-weekly-reward-floor.entity.ts:30` và `src/modules/databases/postgresql/primary/entities/league-cohort.entity.ts:18`.
- Người chưa từng vào giải đấu sẽ được xếp NGAY vào bậc đồng và nhóm đang mở ngay lúc mở bảng, nên bảng gần như không bao giờ thật sự rỗng. `src/modules/bussiness/league/league.service.ts:77`.
- Nhóm đua tối đa 30 người, mỗi tuần 10 người đầu lên bậc và 5 người cuối xuống bậc; hai đầu thang là đồng và huyền thoại thì bị chặn lại. Con số lấy từ cấu hình, phải đọc từ dữ liệu trả về chứ không hard-code. `src/modules/env/config.ts:2402`, `src/modules/bussiness/league/league.service.ts:384`.
- Bảng toàn hệ thống xếp theo Coin, còn bảng tuần xếp theo điểm kiếm được trong khung tuần. Hai bảng cùng một khung nhìn nhưng KHÁC thước đo. `src/modules/bussiness/league/league.service.ts:128`.
- Đóng băng chuỗi giữ tối đa 3 cái, giá 100 Coin. Việc tiêu để cứu chuỗi do một cron chạy nền làm giúp, không phải người dùng bấm, nên số lượng có thể tự giảm giữa hai lần mở màn. `src/modules/bussiness/streak/streak.service.ts:20`, `src/modules/bussiness/streak/streak-freeze-cron.service.ts:79`.
- Mốc chuỗi 7 · 30 · 100 ngày mỗi mốc thưởng đúng một lần trong đời, còn giữ chuỗi mỗi ngày thưởng 5 Coin. Đừng vẽ mốc như thứ lặp lại hằng tuần. `src/modules/bussiness/streak/streak-milestone.service.ts:46`.
- Quà số được cấp ngay ở trạng thái `granted`, quà vật lý rơi vào `pending` chờ vận hành xử lý rồi mới sang `fulfilled`. Màn không được coi mọi lần đổi là xong ngay. `src/modules/bussiness/rewards/rewards.service.ts:229`.
- Huy hiệu được TÍNH LẠI ngay lúc đọc, và có thể được trao thêm ngay trong lần đọc đó. Vì vậy tường huy hiệu phải chịu được việc danh sách đổi giữa hai lần mở mà người dùng không làm gì thêm. `src/modules/bussiness/achievements/achievements.service.ts:114`.
- Huy hiệu nhiều bậc lưu mỗi bậc một dòng, nên "đã đạt" và "đang ở bậc mấy" là hai câu hỏi khác nhau. `src/modules/databases/postgresql/primary/entities/user-achievement.entity.ts:128`.
