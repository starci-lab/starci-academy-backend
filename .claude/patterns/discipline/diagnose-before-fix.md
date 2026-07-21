# Diagnose before fix — tìm ĐÚNG tầng trước khi sửa

**Trigger:** bug xuất hiện. Trước khi Edit dòng nào.

## Luật

- Xác định bug Ở TẦNG NÀO trước khi sửa: UI component? state? data? hay **hạ tầng** (agent / env / network / config)?
- Nếu code đúng **và** cấu trúc đúng → bug KHÔNG ở component đang nhìn → soi xuống hạ tầng. ĐỪNG thrash cái đang test-đúng.
- 1 lần đo (repro) tiết kiệm 5 lần sửa mò. Chẩn "có mấy render-site?" TRƯỚC → grep 1 lần ra hết, sửa 1 lượt.

## Bằng chứng

- Terminal: code đúng, DOM đúng → bug ở HẠ TẦNG (agent nối prod thay vì local — memory `playground-agent-local-server-flag`). Sửa component = vô ích, mất giờ.
- Chuỗi CourseCard (danger→secondary→danger-soft; sửa `"line"` quên `"grid"` — memory `feedback-self-critique`): mỗi lần sửa 1 lớp mà không chẩn toàn cục → thầy phải chỉ nhiều lần. Chẩn "component này render ở mấy layout branch?" TRƯỚC thì grep bắt hết cả `grid` + `line` một lượt.

## Quy trình rẻ

1. Repro / đo để KHOANH tầng (xem [`verify-empirically.md`](verify-empirically.md)).
2. Grep TẤT CẢ site cùng triệu chứng (nhiều layout branch, nhiều call-site) — biết blast trước khi sửa.
3. Sửa ở tầng gốc, không ở tầng biểu hiện.

Nối: `feedback-self-critique-before-presenting` (grep lại mọi site giống nhau trước khi báo xong).
