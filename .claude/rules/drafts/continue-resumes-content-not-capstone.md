# Draft — "Tiếp tục học" trên content-home = resume NỘI DUNG, không nhảy capstone/dự án cá nhân (2026-06-21)

- File/§ đích khi `/merge`: `main.md` §14 (heuristics) + [[course-home-no-duplicate-surfaces]].
- Bối cảnh: trang **Học phần** (`/learn`) khối "Tiếp tục học" trỏ vào **task dự án cá nhân** ("Dựng Khung Backend
  StarCi Shop") dù người học mới đọc 2/95 bài. Thầy: *"học phần sao lại mở ra cái phần học tiếp thế này… đây đâu
  phải là dự án cá nhân"*.
- Gốc (BE): `myCourseOutline.currentTask` (`my-course-outline.handler.ts` `resolveCurrentTask` L459–494) **ưu tiên
  milestone task TRƯỚC lesson** vô điều kiện → còn task capstone chưa xong là trả `kind:"milestoneTask"`, bỏ qua 93
  bài chưa đọc.

## Luật (STRICT)
- **"Tiếp tục học" trên trang NỘI DUNG học (Học phần/content-home) = đưa người học tới NỘI DUNG kế (bài/challenge),
  KHÔNG nhảy sang dự án cá nhân/capstone.** Capstone là cột mốc CUỐI lộ trình; ép người mới (mới đọc 2/95 bài) vào
  capstone là sai sư phạm + sai ngữ cảnh trang.
- **Mỗi surface có resume RIÊNG đúng phạm vi của nó.** Trang **Dự án cá nhân** đã có `milestoneTaskProgress.currentTask`
  → capstone tự lo phần "tiếp tục" của nó. Content-home chỉ lo resume **nội dung**. KHÔNG gộp 2 con trỏ. Ref
  [[course-home-no-duplicate-surfaces]].
- **Thứ tự "việc kế" phải content-first:** còn bài/challenge chưa xong → đó là currentTask; CHỈ khi nội dung xong hết
  mới tính tới capstone. Hoặc sửa BE (`resolveCurrentTask` đảo thứ tự: lesson/challenge trước, milestoneTask sau) cho
  đúng toàn hệ (profile/dashboard cùng hưởng), hoặc FE content-home tự suy "bài chưa đọc đầu tiên" từ outline và bỏ
  qua `currentTask` khi `kind==="milestoneTask"`. Ưu tiên sửa BE vì là gốc.
- **Nhãn trang vs nội dung trang phải khớp:** nếu mục sidebar tên **"Học phần"** thì khối "Tiếp tục" + tiến độ tổng
  phải đọc như "tiếp tục NỘI DUNG học phần", không phải dashboard tổng hợp mọi surface. (Nếu muốn là trang tổng quan
  khóa thật sự thì đổi nhãn → "Tổng quan", đừng để "Học phần" mà nội dung lại là home.)

## CHỐT 2026-06-21 (thầy duyệt)
- Hành vi: **content-first** (resume bài/challenge kế; capstone chỉ gợi ý khi hết nội dung).
- Sửa ở đâu: **tạo API riêng** — KHÔNG sửa `currentTask` cũ (giữ nguyên cho profile/dashboard/personal-project).
  Thêm **field mới `nextContentTask`** vào `myCourseOutline` (content-first: bài chưa đọc đầu tiên theo thứ tự
  outline → nếu hết bài thì challenge chưa hoàn thành đầu tiên → null). FE "Tiếp tục học" đọc `nextContentTask`;
  null = hết nội dung → đổi sang CTA capstone/“đã học hết”. Capstone vẫn tự resume ở trang Dự án cá nhân.
