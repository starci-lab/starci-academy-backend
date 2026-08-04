# Chiến dịch chuyển toàn bộ FE sang lối viết mới — xác định phạm vi và kế hoạch cuối

Ngày 2026-08-05. Tài liệu này chốt phạm vi thật của việc chuyển đổi, sau khi đã quét toàn bộ cây
`src/components` bằng máy chứ không ước lượng bằng mắt, và đề xuất cách chạy.

## 1. Vì sao bản kế hoạch trước đó sai

Ban đầu tôi hiểu việc này là "tách `_X`/`X`", nên đã đếm được 842 thư mục một-file rồi coi đó là nợ
phải trả. Cách hiểu đó sai ở hai chỗ. Thứ nhất, canon nói rõ chỉ component **sở hữu dữ liệu** mới tách
đôi; component thuần trình bày giữ một file, ép tách sẽ đẻ ra lớp vỏ rỗng mà chính cổng
`check-passthrough-block` chặn — chín agent chạy thử trên `blocks/feed` đều từ chối tách và trích đúng
canon để giải thích. Thứ hai, và quan trọng hơn, tách đôi chỉ là **một trục** trong khi thứ thầy muốn
là chuyển **lối viết**: `IOExampleCard` mà thầy đưa ra không sai vì thiếu tách, nó sai vì nhận
`className`, vì tự vẽ `<div>`/`<pre>` với Tailwind thô, và vì thực chất là composite nằm nhầm thư mục
block. Ba lỗi đó nằm ngoài tầm với của việc tách file.

Bản mẫu `_ChallengePage` thầy gửi sau đó cho thấy đích đến thật: compose block trong frame, bố cục đi
qua slot `body`/`items`/`main`/`aside` nhận `({ isSkeleton })`, cờ `isSkeleton` chảy xuống từng block
thay vì dựng cây skeleton song song, không `className`, không `cn`, không hình thô. Đọc thêm
`ChallengeHeader` bên book thì rõ nốt phần còn lại: block tự giữ bảng trình bày của mình
(`DIFFICULTY_MAP`, `STATUS_MAP`), tự thêm đơn vị vào số, và compose từ vựng có sẵn chứ không gọi thẳng
HeroUI.

## 2. Phạm vi thật, đo bằng máy

Cây `src/components` có **899 component** thuộc các nhánh cũ. Phân bố và mức vi phạm như sau, mỗi con
số là số component dính dấu hiệu đó.

| nhánh | số lượng | gọi thẳng HeroUI | dùng `cn` | nhận `className` | hình thô | `AsyncContent` 4 nhánh | sở hữu data chưa tách | sạch hết |
|---|---|---|---|---|---|---|---|---|
| `features/` | 478 | 412 | 289 | 378 | 411 | 131 | 367 | 5 |
| `blocks/` | 224 | 215 | 206 | 215 | 180 | 2 | 0 | 4 |
| `starci/` | 122 | 32 | 17 | 13 | 50 | 19 | 0 | 54 |
| `modals/` | 50 | 42 | 22 | 40 | 36 | 4 | 45 | 1 |
| `page/` | 18 | 0 | 0 | 0 | 2 | 6 | 0 | 11 |
| `drawers/` | 7 | 7 | 2 | 0 | 7 | 3 | 2 | 0 |

Tổng cộng chỉ **75 trên 899** sạch mọi dấu hiệu. Dấu vết v1 phổ biến nhất không phải chuyện tách file
mà là **gọi thẳng `@heroui/react` (708 component)** và **tự vẽ hình bằng Tailwind (686)** — nghĩa là
tầng từ vựng bị bỏ qua, mỗi component tự quyết định nó trông thế nào.

Hai nhánh `starci/` và `page/` đã ở lối viết mới: `starci` có twin bên book cho cả 122 component và 54
cái sạch hoàn toàn, `page` không còn `className`/`cn`/HeroUI nào. Đây là phần đã chuyển xong, dùng làm
mẫu. Khối phải chuyển thật là **759 component** trong `features` + `blocks` + `modals` + `drawers`.

## 3. Điều kiện thuận lợi và điểm nghẽn

Thuận lợi lớn nhất: **tầng từ vựng đã có sẵn trong `src`**. `atoms/`, `frames/`, `composites/` đã được
sync từ book, nên chuyển đổi không phải sáng tác mà là viết lại component cũ để compose thứ đã tồn tại.
Kiểm chứng cụ thể: `composites/chips/EnumChip`, `composites/async/AsyncContent`, `atoms/forms/Dropzone`,
`atoms/chips/Chip`, `atoms/display/IconTile`, `composites/cards/HighlightCard` đều đã nằm trong `src` ở
đúng tầng.

Từ đó có ba nhóm việc với độ khó rất khác nhau. Nhóm thứ nhất, **53 component có sẵn bản đúng trong
`src`** — đây thực chất là bản trùng lặp còn sót, việc cần làm là trỏ consumer sang bản chuẩn rồi xoá
bản cũ. Nhóm thứ hai, **200 component có twin bên book** — có bản mẫu để soi, viết lại theo đó. Nhóm
thứ ba, **646 component không có tham chiếu nào** — phải tự viết theo idiom, đây là phần nặng nhất.

Điểm nghẽn thật nằm ở lưới an toàn. Trong 899 component chỉ **253 có story**; **646 cái còn lại không có
gì để kiểm chứng sau khi viết lại**. `tsc` bắt được lỗi kiểu nhưng không bắt được giao diện vỡ. Đây là
rủi ro chính của cả chiến dịch và mọi quyết định về cách chạy đều phải xoay quanh nó.

Điểm nghẽn thứ hai là thứ tự. Một số component là trung tâm: `Skeleton` có 138 nơi dùng, `AsyncContent`
136, `SurfaceListCard` 89, `LabeledCard` 76, `PageHeader` 58, `MarkdownContent` 45. Chuyển một component
trung tâm là đổi API của nó, kéo theo mọi nơi dùng. Nếu làm lá trước, lá sẽ phải viết lại lần hai khi
trung tâm đổi. Vậy phải đi **từ trung tâm ra ngoài**, không phải theo thư mục cho tiện.

Một lưu ý về số liệu: con số "466 component không ai dùng" mà script đầu tiên đưa ra là **sai**, vì
component lồng nhau import bằng đường dẫn tương đối (`./ProviderSection`) nên không khớp mẫu tìm kiếm.
Đã kiểm chứng và loại bỏ con số này, không dùng nó để ra quyết định.

## 4. Kế hoạch đề xuất

Chia làm bốn đợt, mỗi đợt đi hết mới sang đợt sau, mỗi mẻ trong đợt đều chạy `tsc` cộng ba cổng
(`check-presentational-purity`, `check-passthrough-block`, `check-story-anatomy`) rồi commit.

**Đợt một — dọn `AsyncContent` bốn nhánh.** Ảnh hưởng 165 component, 169 file. Đây là đòn bẩy lớn nhất
vì luật đã rõ ràng và thầy đã chốt: mỗi nơi dùng viết lại thành `isSkeleton` chảy xuống leaf cộng hai
nhánh `AsyncContentError`/`AsyncContentEmpty`, rồi xoá hẳn `blocks/async/AsyncContent`. Không cần phán
đoán thẩm mỹ, chỉ cần đúng luật, nên đây là đợt an toàn nhất để chạy tự động.

**Đợt hai — hội tụ các component trung tâm.** Lấy 53 bản trùng lặp cộng danh sách hub theo thứ tự số
consumer giảm dần, trỏ mọi nơi dùng sang bản chuẩn trong `composites`/`atoms`, chỉnh chỗ nào API lệch,
xoá bản cũ. Rủi ro trung bình vì API có khác nhau — `EnumChip` là ví dụ: bản chuẩn bỏ `className` và
đóng tập icon, nên consumer phải sửa theo chứ không chỉ đổi đường import.

**Đợt ba — chuyển 200 component có twin bên book.** Viết lại theo bản mẫu tương ứng, tách đôi khi sở hữu
dữ liệu. Có bản mẫu nên chất lượng kiểm soát được, và phần lớn nhóm này nằm trong số có story.

**Đợt bốn — chuyển 646 component không tham chiếu.** Đây là phần nặng và rủi ro nhất. Đề xuất chia đôi
theo mức can thiệp. Với component có story, viết lại trọn vẹn theo idiom rồi soi story để nghiệm thu.
Với component không story, chỉ làm phần **cơ học chắc chắn đúng** — bỏ `className`, thay HeroUI gọi
thẳng bằng atom tương ứng, tách đôi khi sở hữu dữ liệu — và **không** tái cấu trúc bố cục, vì tái cấu
trúc mà không có gì nghiệm thu thì khả năng làm vỡ giao diện cao hơn khả năng làm đúng.

Sau cùng, siết cổng vào pre-commit để lối viết cũ không tái sinh: chặn `className` ở tầng câu, chặn
import thẳng `@heroui/react` ngoài tầng atom, chặn `AsyncContent` không hậu tố.

## 4b. Chia mẻ phải theo tầng phụ thuộc, không theo thư mục

Đo trên cây thật: trong 759 component phải chuyển, **437 cái (58%) có import chéo sang component khác
cùng diện chuyển đổi**. Nghĩa là cách chia mẻ "lấy mười lăm cái kế tiếp trong danh sách" sẽ va gần như
chắc chắn — agent A viết lại một component trong khi agent B đang compose chính nó, B đọc phải bản viết
dở hoặc compose theo API sắp đổi. `tsc` bắt được lỗi kiểu nhưng không bắt được trường hợp B viết theo
bản cũ mà cả hai vẫn xanh.

Luật chia mẻ, áp cho mọi đợt: dựng đồ thị import giữa các component trong diện chuyển, **làm lá trước**
— những cái không import ai khác trong danh sách — rồi mới lên lớp consumer kế tiếp. Bất biến phải giữ
là **hai component trong cùng một mẻ không bao giờ import nhau**. Luật này trùng khớp với thứ tự
hub-trước đã nêu ở đợt hai, vì hub chính là lá của đồ thị dùng lại.

Ở tầng `page` mật độ chỉ 17% (ba cặp trên mười tám component) nên chạy song song gần như vô hại, và đó
là lý do đợt page trôi được. Đừng suy ra từ đó rằng các đợt sau cũng vậy.

## 5. Ước lượng và điều cần thầy quyết

Đo từ hai mẻ đã chạy thật, mỗi component tốn khoảng 60–85 nghìn token cho một agent đọc canon, đọc mẫu
và viết lại. Nhân với 759 component phải chuyển, chiến dịch rơi vào khoảng **50–65 triệu token**, trải
nhiều phiên chứ không xong trong một đêm. Đợt một và hai gọn hơn nhiều, ước chừng 15 nghìn token mỗi
component vì phần lớn là sửa cơ học.

Có hai điều tôi cần thầy quyết trước khi chạy đợt ba và bốn. Thứ nhất, với 646 component không story,
thầy muốn tôi **viết lại trọn vẹn** và chấp nhận rủi ro lệch giao diện, hay **chỉ sửa cơ học** rồi để
phần bố cục lại cho lượt sau khi đã có story. Thứ hai, thầy có muốn tôi **viết story trước rồi mới
chuyển** cho nhóm không có story hay không — cách này an toàn nhất nhưng nhân đôi khối lượng.

Riêng đợt một và đợt hai thì không có gì phải cân nhắc: luật đã rõ, có bản chuẩn để trỏ tới, và `tsc`
cộng ba cổng đủ làm lưới. Nếu thầy đồng ý, tôi chạy hai đợt đó ngay và báo lại từng mẻ.
