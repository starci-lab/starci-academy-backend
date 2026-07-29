# BOUNDARY — `.storybook` là BẢN VẼ, `src` là CÔNG TRÌNH

> **Luật này đứng TRƯỚC mọi luật khác.** Nó quyết định được phép GHI VÀO ĐÂU, nên vi phạm nó thì
> mọi thứ bên dưới làm đúng cũng vô nghĩa. Đọc file này trước `principles/`.
>
> Thầy chốt 2026-07-26: *"ý là kẻ code, trò hiểu không? thầy design xong sẽ restructure source code"*.
>
> ⚠️ Luật này suýt mất. Nó ở `rules/0-boundary.md`, và khi canon rã thành 15 trục thì không trục
> nào nhận — vì nó **không phải một lựa chọn giá trị**, nó là một ràng buộc quyền ghi. Nó chỉ còn
> sống trong hai file `example.html` (tầng cho mắt người), tức là **không nằm trên đường LLM đi
> qua**. Nhặt về làm file riêng 2026-07-29. Cùng bài học với ca `§4a văn xuôi`: **luật không vừa
> khuôn trục là luật sắp rơi.**

---

## 1. Hai cây, hai vai

| Cây | Vai | Ai được sửa |
|---|---|---|
| `starci-academy/.storybook` | **BẢN VẼ** — atom · behavior · frame · composite · block · layout · overlay · page, cùng story của chúng | **AGENT kẻ ở đây** |
| `starci-academy/src` | **CÔNG TRÌNH** — app thật đang chạy | **THẦY** restructure, sau khi duyệt bản vẽ |

Tên tầng đầy đủ: [`principles/INDEX.md`](principles/INDEX.md). Đường dẫn thật, cổng, bẫy máy:
[`environment.md`](environment.md).

---

## 2. Bốn điều CẤM

1. **CẤM codemod `src/`** trong lane design/audit. Cấm cả "sync cho khớp", cấm cả "đổi import cho
   đỡ vỡ". Muốn đụng `src` phải có câu thầy nói thẳng **ở đúng lượt đó**.
2. **CẤM đòi sync.** Bản vẽ lệch app là **TRẠNG THÁI BÌNH THƯỜNG** — file port ghi sẵn
   *"synced to `src` later"*. Báo "spec và app là hai cây khác nhau" như một sự cố là đọc sai vai.
3. **CẤM tự quyết việc gom họ, dời tầng, đặt lại category.** Đó là DESIGN, thầy chốt. Agent
   **kẻ bản vẽ và chỉ ra chỗ đá nhau**, rồi bày phương án. Neo 2026-07-26: 5 atom cùng làm
   "chọn 1 trong N" (`Tabs` · `ExtendedTabs` · `SegmentedToggle` · `FlexWrapButtonRadio` ·
   `SelectableCardGroup`) — trò bày ba phương án, thầy chọn.
4. **CẤM để agent nền tự suy ra ranh giới này.** Khi cắm Workflow phải **chặn cứng trong spec**
   của agent (*"TUYỆT ĐỐI KHÔNG đụng `.../src/`"*). Sonnet chạy nền không tự suy ra §0.
   Neo: run `wf_8baf829a-5a1`.

---

## 3. `src` dùng để làm gì thì đúng

**Số liệu `src` là CHỨNG CỨ, không phải việc phải làm.**

- ✅ Đếm trong `src` để **chọn mặc định cho bản vẽ**. Neo: `max-w-3xl` xuất hiện 72 lần ⇒ đó là
  default hợp lý cho container.
- ✅ Đo `src` để **neo một quyết định thiết kế** (xem "NEO THẬT" trong mọi trục `principles/`).
- ❌ Đếm rồi kết luận "phải sửa 111 file trong `src`" là sai vai.
- ✅ Xoá hoặc gộp component thì chỉ dọn call-site **trong `.storybook`** (kể cả `_legacy/`), để
  bản vẽ tự đứng vững.

---

## 4. Hai bẫy khi đi tìm bản gốc trong `src`

Cả hai đều đã cắn thật, và cả hai đều dẫn tới **kết luận sai mà nghe rất chắc chắn**.

**Bẫy 1 — "không tìm thấy real `src`" là kết luận YẾU nếu chỉ grep một cái tên.**
Neo 2026-07-29, thầy nói *"có trang này mà"*: trò báo "chưa có bản gốc" cho `ChallengeResultPage`
chỉ vì grep đúng tên component đó. Grep lại theo tên KHÁI NIỆM (`SubmissionResult` · `attempt` ·
`finding`) ra ngay `src/components/features/learn/Challenge/SubmissionResult/index.tsx`.
⇒ Trước khi báo "không có bản gốc", thử **ít nhất 2-3 cách gọi tên khác nhau**: tên component,
tên khái niệm miền, tên route hoặc tên file.

**Bẫy 2 — tên gần giống KHÔNG có nghĩa là bản port.**
Neo: `SubmissionAttemptsDrawer` nhìn rất giống `SubmissionResultHistoryDrawer` thật (cùng miền,
tên hao hao) nhưng **sai hẳn tương tác** khi đọc kỹ: bản trong bản vẽ có hai nút "xem chi tiết" và
"xem bài nộp", còn bản thật thì bấm một dòng là chọn xong và đóng luôn; phân trang bên này do
caller điều khiển, bên thật thì tự phân trang nội bộ.
⇒ Đối chiếu **HÀNH VI** (ai bấm gì, xảy ra gì), không chỉ đối chiếu tên biến và tên prop, trước
khi coi một component có sẵn là "đã port xong".

---

## 5. Cổng đo

- [ ] Mọi file ghi trong lượt đều nằm dưới `.storybook/`, trừ khi thầy chỉ đích danh `src`?
- [ ] Mọi prompt của agent nền đều có câu chặn `src/` viết tường minh?
- [ ] Trước khi báo "không có bản gốc", đã thử ≥2 cách gọi tên khác nhau?
- [ ] Trước khi coi một component là bản port, đã đối chiếu hành vi chứ không chỉ tên?

> Mục "kill và restart server không đủ để xem đúng bản mới" đã chuyển sang
> [`environment.md`](environment.md) §4 — đó là bẫy của MÁY, không phải luật về quyền ghi.
