# B2 — CẤU TRÚC ⛔ DỪNG CHỜ DUYỆT

> **Trục nạp:** [`frame`](../../fe/principles/frame/context.md) ·
> [`naming`](../../fe/principles/naming/context.md)
> **Phạm vi:** cả màn, một lần. Read-only — **chưa gõ một dòng `.tsx` nào**.

Đây là barrier cứng của lane. Cây sai thì mọi bước dưới hỏng hết, và hỏng theo kiểu **không cổng
nào bắt được** — nên nó phải qua mắt thầy, không qua script.

---

## VÀO

Bảng bốn cột của B1: chức năng · hạng · thứ tự đọc · đường async.

## LÀM

**1. Cây tầng.** Mỗi chức năng ở B1 thành một `block`. Khung dựng bằng tầng `frame`, **không
bằng `div`**.

Tầng có thật, lấy từ đĩa — đĩa là thứ duy nhất không nói dối được:

```
heroui · atom · behavior · frame · composite · block · layout · overlay · page
```

⚠️ `design`/`designs` và `screen`/`screens` **đã chết**. Thư mục thật tên là `pages`. Tài liệu
nào còn dạy tầng `design` là tài liệu chưa cập nhật — đừng theo, và nếu gặp thì báo.

**Bảng import cứng** — vi phạm là **sai tầng**, không phải "tuỳ trường hợp":

| Tầng | Được import | CẤM |
|---|---|---|
| `page` / `layout` / `overlay` | block · frame | atom · composite · `div` bố cục tay |
| `block` | composite · frame · atom · **block khác** | page |
| `composite` | frame · atom | block · page · **dữ liệu miền** |
| `frame` | atom · frame khác | composite · block |
| `atom` | HeroUI | mọi tầng trên |

Block **được** bọc block, nhưng block bọc đúng một con **phải kiếm được tầng của nó**: một điều
kiện nghiệp vụ, một quyết định, một luật, **hoặc chính CÂU CHỮ** (biến dữ liệu có kiểu thành câu
người đọc). Cổng `check-passthrough-block` canh chuyện này.

**2. Đặt TÊN ngay tại đây** — component · story title · type. Không để tới cuối.

> Tên quyết `storyId`, mà `storyId` gãy thì gãy **CÂM** — không lỗi build nào báo. Đặt tên muộn
> chính là lý do luồng cũ buộc bước đặt tên phải chạy tuần tự, cấm song song. Chốt tên ở đây thì
> ràng buộc đó biến mất.

Tên đi qua cây quyết định trục `naming`. **Không có namespace** — `PhaseScarcityNote`, không
phải `PhaseScarcityNote.Base`; cổng `check-no-namespace` chặn cứng, đo hiện tại là 0.

**3. Bảng state, bốn cột:** **state · điều kiện nghiệp vụ · hình đổi gì · leaf hay state**. Với
block, bảng này **chính là tài liệu nghiệp vụ** của nó.

**4. Phân leaf với state.** 🧭 Phép thử: **caller bật ⇒ LEAF · dữ liệu về ⇒ STATE** trong cùng
leaf.

`isSkeleton` là cờ chảy xuống, có ở mọi tầng — **cấm dựng `XxxLoading` bằng tay**.

**5. Đi xuống là DỮ LIỆU, không phải HÌNH.** Prop là `string` / `number` / `enum` / mảng **có
kiểu**. `ReactNode` chỉ mở ở tầng `frame` (slot). Mọi hình dữ liệu phải **có tên** — cấm
`{ index: number; name: string }` ẩn danh tại chỗ khai prop; cổng `check-inline-types` canh.

Chế độ **SOI**: đối chiếu **cây thật** (từ closure dựng ở B0) với **cây nên có**, và báo lệch
theo từng mục trên.

## CỔNG ĐO

- Bảng import cứng: không tầng nào import ngược lên.
- Mọi tên đi qua cây quyết định `naming`, không tên nào mô tả cơ chế.
- Mỗi dòng bảng state trả lời được cột "hình đổi gì" — dòng nào không đổi hình thì **không phải
  state**, xoá.
- Chế độ SOI: `_legacy` trong closure = 0.

## RA

Một file `.md` trong thư mục phiên: danh sách chức năng (kèm hạng và thứ tự đọc từ B1) · cây
tầng · bảng tên · bảng state · chỗ nào **REUSE** component đã có, chỗ nào phải dựng **MỚI**.

Ra `.md` để thầy sửa được từng dòng — **không render trang HTML**, lối đó đã bỏ.

## DỪNG KHI

⛔ **LUÔN LUÔN.** Trình tài liệu trên rồi **chờ thầy duyệt cây**. Không được tự đi tiếp kể cả
khi thấy "rõ quá rồi".

Dừng sớm hơn nếu:

- Định dựng mới một component mà grep thấy đã có bản tương đương ⇒ hỏi thầy reuse hay tách.
- Cây cần một khung mà tầng `frame` chưa có ⇒ đó là đề xuất **thêm năng lực cho khung**, phải
  hỏi. Đừng hạ chuẩn bằng cách gõ `div` bố cục tay, và cũng đừng đổi giá trị đã ghim của một
  atom để chữa một chỗ — dấu hiệu nhận ra sớm là **sửa xong phải chỉnh thêm một hằng số thứ
  hai** mới khỏi vỡ.
