# Concept — Lib tham khảo CHẾT/incompatible → đọc pattern, TỰ VIẾT native theo design system (KHÔNG thêm dep); KHÔNG bê artwork/IP bên thứ ba

> Heuristic engineering (họ `concepts/*`). Rút từ vụ FB reaction selector (thầy gửi `react-reactions`).

## Luật 1 (STRICT) — lib chết/incompatible → reimplement native, đừng cài đại
- **Khi 1 lib tham khảo (user gửi / tìm được) ĐÃ CHẾT (không maintain nhiều năm) hoặc không chắc tương thích React version của app (app = React 19) → KHÔNG cài đại.** Đọc PATTERN/cách render (source GitHub), rồi **tự viết 1 component native** theo design tokens + dark mode của mình. Tránh: dep mồ côi, peer-conflict, legacy API (findDOMNode/string-ref) vỡ ở React mới, bundle thừa, mất kiểm soát style.
- **Quy trình:** (1) xác minh tuổi/peerDeps lib (npm/GitHub `package.json`); (2) cũ/rủi ro → đọc source component cần (cấu trúc + animation timing + CSS); (3) reimplement bằng primitives mình (HeroUI/Tailwind/CSS keyframe) + tokens; (4) KHÔNG copy asset bản quyền.
- **Animation native:** keyframe ở `globals.css`, reference qua arbitrary `animate-[name_dur_easing_both]` + `style={{animationDelay}}` cho stagger. **Tách transform pop-in (button) khỏi transform hover-scale (span con)** để 2 animation không đè nhau (animation `both` fill giữ transform cuối → override `:hover` nếu cùng element).

## Luật 2 (STRICT) — KHÔNG bê graphic/artwork CHÍNH CHỦ của bên thứ ba (IP) vào sản phẩm thương mại
- **KHÔNG nhúng graphic/artwork thương hiệu chính chủ (vd reaction PNG của Facebook/Meta) vào sản phẩm thương mại** — rủi ro bản quyền/nhãn hiệu. "Lib MIT nhúng lụi được" ≠ mình bê vào sản phẩm an toàn: license MIT phủ CODE, KHÔNG cấp quyền artwork bên thứ ba. Đây là ranh giới IP: instruction "cào DOM" mà DOM chứa IP bên thứ ba → dừng + giải thích + đề xuất đường sạch, KHÔNG cào.
- **Đường sạch:** dùng bộ emoji/asset CÓ GIẤY PHÉP (vd Fluent Emoji — Microsoft, MIT; self-host SVG + kèm notice). Robust hơn CDN runtime.

## Liên quan
- [[no-emoji]] (emoji trong UI label — reaction emoji là glyph NỘI DUNG, ngoại lệ) · [[no-barrel-imports]] (không kéo dep nặng bừa) · [[single-source-render]].
