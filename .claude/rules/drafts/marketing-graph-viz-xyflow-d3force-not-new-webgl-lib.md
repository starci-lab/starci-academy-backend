# Draft — Graph/network viz (knowledge graph, force-directed) = `@xyflow/react` (đã có) + `d3-force`, KHÔNG kéo lib WebGL mới; node = React component (brand-themed); grounded từ data thật (2026-06-26)

- File/§ đích khi `/merge`: `concepts/` (viz/engineering) hoặc `elements/` (graph) + liên quan [[animated-flow-edges-css-orthogonal]] (diagram tĩnh) · [[landing-grounded-real-courses-and-systems]] (grounded) · [[reimplement-dead-lib-natively-fb-reactions]] (đừng cài lib nặng bừa).
- Bối cảnh: section "Kho tàng" landing → thầy muốn "graph như Qdrant dashboard, kiến thức lồng ghép". Hỏi "có lib nào đẹp như Qdrant".

## Tech research (để trả lời "lib gì")
- **Qdrant web-ui** (graph viz) dùng **`force-graph`** (vasturiano; React wrapper `react-force-graph-2d`, canvas/WebGL force-directed).
- **Repo đã có `@xyflow/react`** (mind-map) + css import ở `globals.css`. → ưu tiên reuse.
- Khác: sigma.js / ReaGraph (WebGL knowledge-graph, NẶNG, overkill cho ~26 node) · Visx (custom, tự lo nhiều) · SVG+framer thuần (nhẹ nhất nhưng tự lo layout+interaction).

## Luật (STRICT)
- **Graph/network viz (knowledge graph, force-directed, node-link) trong app/landing → ưu tiên `@xyflow/react` (nếu repo đã có) + `d3-force` cho layout, KHÔNG cài lib graph WebGL mới (react-force-graph/sigma/cosmograph) trừ khi cần scale lớn (>vài trăm node) hoặc GPU.** Lý do: (a) reuse dep team đã biết; (b) **node = React component** → glow/màu/brand theo **design token** chuẩn (canvas của force-graph phải vẽ tay, khó theme + khó a11y); (c) `d3-force` là dep **layout-only nhỏ** (~), không phải lib render nặng. Cùng tinh thần [[reimplement-dead-lib-natively-fb-reactions]] (đừng bê lib nặng/độc quyền khi tự dựng bằng primitive sẵn có là đủ).
- **Live force layout = d3-force drive vị trí, viết ngược vào React Flow mỗi tick:** `forceSimulation(simNodes).force(charge/link/collide).force("x", forceX(anchor theo nhóm))` → `.on("tick", () => setNodes(... position từ simNode))`. **Kéo** = `onNodeDrag` set `fx/fy` + `alphaTarget(0.3).restart()`; thả = `fx=fy=null` + `alphaTarget(0)`. **Reduced-motion** → `sim.stop(); sim.tick(300)` settle TĨNH (không jiggle). Pattern chuẩn của React Flow ("force layout" example).
- **Edge nối TÂM node (force-graph style):** custom node đặt **handle ở center** (`left/top:50%` + invisible) → edge `type="straight"` nối tâm-tâm, không phải anchor cạnh. `isConnectable={false}` (không cho user wiring).
- **Node grounded từ DATA THẬT:** label = concept/topic THẬT rút từ curriculum (module/lesson/challenge title), KHÔNG bịa. Nhóm theo trục có nghĩa (track/cluster) qua `forceX` anchor → đọc ra cấu trúc. Edge = builds-on (trong nhóm) + cross-nhóm ("lồng ghép"). Marketing = curated (số node vừa phải ~20-30 cho dễ đọc), nhưng label phải thật. Ref [[landing-grounded-real-courses-and-systems]].
- **`proOptions={{ hideAttribution: true }}`** (repo convention, mind-map đã dùng) + `colorMode` theo `resolvedTheme` (light/dark) + container height cố định (ReactFlow cần size).

## ĐÃ ÁP DỤNG 2026-06-26 (FE)
- `Landing/KnowledgeGraph` (data.ts 26 node/31 edge grounded + ConceptNode glow + index.tsx ReactFlow+d3-force live drag/zoom). Thay `TreasureBubbles`. dep `d3-force`+`@types/d3-force`. tsc/eslint sạch. Doc `KnowledgeGraph/UX-BRAINSTORM.md`.
- Nợ: TreasureBubbles/TopicBubbles/LANDING_TREASURE_TOPICS mồ côi (xoá khi dọn). Optional: hover-highlight, legend, tooltip per-node.
