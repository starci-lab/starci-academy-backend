# BƯỚC 2 — CẤU TRÚC ⛔ BARRIER

> **Trục nạp:** [`frame`](../../fe/principles/frame/context.md) ·
> [`naming`](../../fe/principles/naming/context.md)
> **Luật kèm:** [`rules/1-decompose.md`](../../fe/rules/1-decompose.md) bảng import ·
> [`rules/2-leaf-states.md`](../../fe/rules/2-leaf-states.md) leaf và state
> **Phạm vi:** cả màn, chạy MỘT lần. Read-only — **chưa gõ một dòng `.tsx` nào**.

Đây là barrier cứng của lane. Cây sai thì mọi bước dưới hỏng hết, và hỏng theo kiểu không phát
hiện được bằng cổng.

---

## VÀO

Bảng bốn cột của bước 1: chức năng · hạng · thứ tự đọc · đường async.

## LÀM

**1. Cây tầng.** Mỗi chức năng ở bước 1 thành một `block`. Khung dựng bằng tầng `frame`,
**không bằng `div`**. Bảng import cứng ở `rules/1` §2 — vi phạm là **sai tầng**, không phải
"tuỳ trường hợp".

Tầng có thật, lấy từ đĩa (`principles/INDEX.md` là danh sách chính thức):

```
heroui · atom · behavior · frame · composite · block · layout · overlay · page
```

⚠️ `design`/`designs` và `screen`/`screens` **đã chết**. Thư mục thật tên là `pages`. Tài liệu
nào còn dạy tầng `design` là tài liệu chưa cập nhật, đừng theo.

**2. Đặt TÊN ngay tại đây** — component · story title · type. Không để tới cuối.

> Tên quyết `storyId`, `storyId` gãy thì gãy **CÂM** (không lỗi build). Đặt tên muộn là lý do
> luồng cũ buộc bước đặt tên phải chạy tuần tự, cấm song song — chốt tên ở đây thì ràng buộc đó
> biến mất.

**3. Bảng state, bốn cột** (`rules/2` §5): **state · điều kiện nghiệp vụ · hình đổi gì · leaf
hay state**. Với block, bảng này CHÍNH LÀ tài liệu nghiệp vụ của nó.

**4. Phân leaf với state.** 🧭 Phép thử: **caller bật ⇒ LEAF · dữ liệu về ⇒ STATE** trong cùng
leaf. `isSkeleton` là cờ chảy xuống, có ở mọi tầng — **cấm dựng `XxxLoading` bằng tay**.

Nhánh **C (soi)**: dựng closure theo import từ file page (và mọi file `_shared` nếu có), rồi đối
chiếu **cây thật** với **cây nên có**. Mọi scanner của bước sau chạy trên closure này, không quét
cả repo.

## CỔNG ĐO

- Bảng import cứng: không tầng nào import ngược lên.
- Mọi tên đi qua cây quyết định trục `naming` — không có tên mô tả cơ chế.
- Mỗi dòng trong bảng state trả lời được cột "hình đổi gì"; dòng nào không đổi hình thì nó
  không phải state, xoá.
- Nhánh C: closure ra danh sách file + tầng, và **không file nào trong closure trỏ `_legacy`**.

## RA

Một file `.md` gồm: danh sách chức năng (kèm hạng và thứ tự đọc từ bước 1) · cây tầng · bảng tên
· bảng state · chỗ nào **REUSE** component đã có, chỗ nào phải dựng **MỚI**.

Ra `.md` để thầy sửa được từng dòng — **không render trang HTML**, lối đó thầy đã bỏ.

## DỪNG KHI

⛔ **LUÔN LUÔN.** Đây là barrier: trình tài liệu trên rồi **chờ thầy duyệt cây**. Không được tự đi
tiếp kể cả khi thấy "rõ quá rồi".

Ngoài ra dừng sớm nếu:
- Định dựng mới một component mà grep `.storybook/components/**` thấy đã có bản tương đương ⇒
  hỏi thầy reuse hay tách, đừng đẻ bản thứ hai.
- Cây cần một khung mà tầng `frame` chưa có ⇒ đó là đề xuất **thêm năng lực cho khung**, phải
  hỏi; đừng hạ chuẩn bằng cách gõ `div` bố cục tay.
