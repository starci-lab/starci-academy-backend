# STEP 2 — SỬA TỪ ROOT XUỐNG, TỪNG TẦNG MỘT

> Phase 2 của workflow. Gồm **S5**. `pipeline` 5 chặng theo TẦNG —
> **BARRIER giữa các tầng**, fan-out theo component TRONG cùng một tầng.
> Luật cần đọc: [`rules/1-decompose.md`](../rules/1-decompose.md) (ai import gì) ·
> [`rules/4-organization.md`](../rules/4-organization.md) (khuôn file 7 phần, props, comment).

---

## S5 · Sửa theo thứ tự `screen → block → design → layout → atom`

| | |
|---|---|
| **VÀO** | cây + bảng state đã được thầy duyệt (Phase 1) |
| **LÀM** | đúng thứ tự trên. Trong một tầng thì song song theo component. **Sau mỗi tầng** chạy `tsc` + `eslint` cho tầng đó |
| **CỔNG ĐO** | `npx tsc --noEmit` sạch · `npx eslint <thư mục tầng>` sạch **sau mỗi tầng**, không dồn tới cuối |
| **RA** | tầng đó hết vi phạm luật `rules/1` + `rules/4` |
| **DỪNG KHI** | phải **đổi API của tầng dưới** (thêm prop, đổi tên prop) ⇒ **ghi lại**, làm khi xuống tầng đó, đừng nhảy cóc |

### Vì sao ĐI TỪ TRÊN XUỐNG

Tầng trên là chỗ **phát hiện** tầng dưới thiếu gì. Neo thật: sửa state rỗng của **screen** mới lộ ra `AsyncContent.Empty` (**layout**) không nhận `anatPart` — nó chỉ chuyền `showAnatomy` xuống rồi hard-code tên, đúng cặp vi phạm §11a.1. Nếu đi từ dưới lên thì không có lý do nào phát hiện ra.

### Bảng việc mỗi tầng

| Tầng | Kiểm gì |
|---|---|
| **screen** | chỉ compose block + khung · không atom/design · không `div` bố cục · header liệt kê đúng tên **BLOCK** (không phải tên frame) |
| **block** | isolated (render một mình được) · nhận **dữ liệu miền** không nhận node · sở hữu câu chữ + luật hiện/ẩn của chính nó · không biết block khác |
| **design** | không biết miền, **trừ** ngoại lệ `enum → nhãn + tone` (bảng tra, không có `if`) · không mở `variant?`/`label?` |
| **layout** | slot trơ · tự sở hữu spacing nội bộ · `gap`/`padding` khai kiểu `SpaceScale` |
| **atom** | bọc HeroUI · **cấm `children`** · tự lo size/weight/skeleton · viết `flex` tay là ĐÚNG (§13z) |

### Đồng thời áp 4 luật viết code (`rules/4` §3-§5)

| Luật | Cách kiểm |
|---|---|
| `const X = ({ ... }: XProps) => {}`, type **đặt tên** `<Component>Props` | đọc chữ ký; `Omit<>`/`Pick<>` thẳng ở chữ ký là vi phạm |
| **cấm type object inline** — bóc ra interface có tên (`XLike`) | `module: { index; name }` → `ModuleLike` |
| comment **TIẾNG ANH**, **KHÔNG marker** | bỏ dấu = **VIẾT LẠI CÂU**, không xoá ký tự |
| namespace **một đường**: `Object.assign(XBase, { Base: XBase })` | `export const X = { Base }` thì gọi trần vỡ tsc |

Bẫy đã ship thật: một lượt dọn emoji trước đây xoá dấu **kèm luôn danh từ**, để lại `"): rather than a bare triangle — the two siblings /"`. Vì vậy bỏ marker luôn là **sửa câu**, không phải sửa ký tự.

---

## Ra khỏi Phase 2 khi

- [ ] cả 5 tầng đã đi qua, mỗi tầng `tsc` + `eslint` sạch **tại thời điểm đó**
- [ ] mọi API tầng dưới cần đổi đã được đổi khi xuống tầng đó (không còn ghi chú "làm sau")
- [ ] không còn marker, không còn comment tiếng Việt trong closure
- [ ] không còn type object inline trong closure
