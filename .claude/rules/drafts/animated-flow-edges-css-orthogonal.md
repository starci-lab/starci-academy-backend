# Draft — "Chảy theo dây" (animated flow edges) cho diagram tĩnh: CSS keyframe + orthogonal, KHÔNG cần React Flow/SVG path (2026-06-26)

- File/§ đích khi `/merge`: `concepts/` (animation/marketing) hoặc `elements/` (diagram). Bối cảnh: hero `MicroservicesDiagram` (landing) — thầy muốn data "chảy theo dây" nhưng **giữ diagram gốc** + connector **hình vuông** (orthogonal), KHÔNG nối diagonal.

## Tech để render flow edges (thầy hỏi "cần tech gì")
- **Diagram TĨNH/decorative (hero, fixed layout) → CSS thuần (ĐỀ XUẤT):** node = `<div>` flexbox; connector = `<span>` dọc (`w-px`) + 1 "packet" (`size-1.5 rounded-full bg-accent`) chạy dọc bằng `@keyframes` (translateY) + `animation-delay` theo index (stagger → flow cascade xuống). Nhẹ, KHÔNG runtime, full control. KHÔNG cần SVG path (vì connector orthogonal = đường thẳng dọc/ngang, không cần tính toạ độ cong).
  - 2 kiểu glow: (a) **packet/dot chạy** (translateY) — rõ "gói tin di chuyển"; (b) **marching-ants** (`stroke-dasharray` + animate `stroke-dashoffset`, hoặc gradient `background-position`) — dạch chạy dọc dây.
- **React Flow (`@xyflow/react`, ĐÃ có trong repo — mind-map + import ở globals.css):** edge `{ animated: true }` = flowing dashed sẵn; + auto-layout/drag/zoom. Dùng khi cần **tương tác** (mind-map). NẶNG hơn (mount engine) cho 1 illustration tĩnh → KHÔNG dùng cho hero.
- **SVG `<animateMotion>` / `offset-path`:** dot chạy dọc path cong tuỳ ý — chỉ cần khi connector KHÔNG orthogonal (đường cong/diagonal). Hero orthogonal → khỏi.

## Luật (STRICT)
- **Diagram trang trí (hero, fixed) → CSS keyframe thuần, KHÔNG kéo React Flow vào** (vanity dependency cho 1 hình tĩnh). React Flow chỉ cho diagram TƯƠNG TÁC (mind-map).
- **Connector orthogonal (vuông): chỉ đường thẳng dọc/ngang + góc vuông, KHÔNG diagonal/cong** (thầy chốt: *"hình vuông thôi, không nối kiểu này"* — bác diagonal). Orthogonal đọc "mạch/sơ đồ kỹ thuật" sạch hơn; flow = translateY dọc dây.
- **Stagger theo index** (`animation-delay: index*Xs`) → flow cascade qua các tầng, đọc như "data truyền xuống" thay vì mọi dây nhấp nháy đồng loạt.
- `@keyframes` đặt ở `globals.css` (global), reference qua `style={{ animation: 'name dur easing delay infinite' }}` inline (delay động theo index).

## ĐÃ ÁP DỤNG 2026-06-26
- `MicroservicesDiagram` (giữ topology gốc order-service.v2): connector `<span h-6 w-px>` + dot `bg-accent` chạy `@keyframes wireFlow` (translate(-50%,Y) + opacity), delay `index*0.18s`. globals.css thêm `@keyframes wireFlow`. tsc/eslint sạch.
- **Defer:** redesign diagram grounded StarCi-thật (doc `MicroservicesDiagram/ARCHITECTURE-BRAINSTORM.md`) — thầy chọn GIỮ hình gốc, chỉ thêm flow. Để dành nếu sau muốn phức tạp hơn.

## Cập nhật 2026-06-26 — component ĐÃ DÙNG Framer thì GIỮ Framer cho loop mới (đừng nhảy @keyframes)
- Thầy: *"sao không dùng framer motion mà dùng @keyframe"*. Đúng — **nguyên tắc: 1 component đã chạy Framer Motion thì motion MỚI cũng giữ Framer** (1 hệ animation, nhất quán, cùng `useReducedMotion`). CSS `@keyframes` chỉ cho thứ thuần trang trí tách biệt (vd `wireFlow` — packet chạy dây).
- **Bẫy khiến hay nhảy CSS:** node là `motion.div` đã bị **`variants` chi phối** (entrance stagger qua parent `whileInView="show"`) → KHÔNG gắn thêm `animate` loop vô hạn lên CÙNG element (cùng prop, đè entrance). **Cách đúng (vẫn Framer):** tách loop ra **overlay con** `motion.span` (`pointer-events-none absolute inset-0`, node cha thêm `relative`) có `animate` + `transition.repeat:Infinity` riêng → entrance ở cha, loop ở con, không đụng nhau.
- **Áp:** danger nodes (Payment/Postgres) "sắp sôi sục" = `DangerPulse` overlay (box-shadow đỏ swell 36%→88%→36%, `1.35s easeInOut repeat`), gate `!reduce` (reduced-motion → glow tĩnh mạnh ở `nodeGlow`). Gỡ `@keyframes dangerPulse` thêm nhầm. tsc/eslint sạch.
