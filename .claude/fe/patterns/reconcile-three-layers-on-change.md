# Pattern — Reconcile 3 LỚP khi chạm 1 (chân lý `.claude/fe` · story UI-ref · component)

> Recipe THAO TÁC (họ `patterns/*`) cho luật gốc [[../principles/three-layer-sync-truth-story-ui]]. Trả lời: *"khi 1 trong 3 lớp đổi, làm GÌ để 3 lớp lại khớp?"* — mọi skill FE (feedback/story/block/build/patch/audit/sync) chạy theo đây, không để lệch.

## Khi CHỈNH COMPONENT (thầy feedback · build · block)
1. **Đối chiếu luật** `.claude/fe/{principles,components,patterns,foundations}` — thay đổi có phá rule KỀ BÊN không? Đọc HẾT section liên quan, không chỉ 1 rule vừa nghĩ ra (bài học "audit adjacent rules").
2. **Luật CHƯA bàn** → đây là rule MỚI thầy vừa dạy → GHI vào đúng nhà (design → `.claude/fe`, code-style → `.claude/patterns/fe`) TRƯỚC/CÙNG lúc fix (`starci-fe-feedback` được phép ghi `.claude/`). Rule đã có mà siết thêm → mục "Đính chính (ngày)".
3. **Cập nhật story ref NGAY trong lượt vừa chạm component — KHÔNG hand-off, KHÔNG để sau.** Block đổi hình hài/variant/state/màu → lane đang sửa (feedback/build/block/patch) **tự bổ sung/sửa story đó same-session** (đây là việc NHỎ, tuân [[../methodology/storybook-story-conventions]]). Chỉ đẩy sang `starci-fe-story` khi story cần TÁI CẤU TRÚC lớn (đổi nhiều story, gom cây `meta.title`, rubric). Sau đó `starci-fe-sync` ghi `.artifacts/states` để lane sau khỏi rescan.
   - **Feature-component KHÔNG có story riêng** (vd `DailyQuest`) → demo rule ở story của BLOCK canonical mà nó dựng trên (vd `SurfaceListCardRow` → `SurfaceListCard.stories`). Rule mới phải hiện ở 1 story hữu hình, nếu không lớp UI-ref không neo được.
   - **Bài học 2026-07-16:** sửa `DailyQuest` state-marker + ghi `icon.md` §6/§7 nhưng QUÊN story → thầy phải nhắc *"sao skills này xong không update stories"*. Hand-off "giao `starci-fe-story` bổ sung" = story bị bỏ quên. Reconcile = TỰ làm lớp story, không đợi lane khác.

## Khi ĐỔI LUẬT (`.claude/fe`)
- `starci-fe-patch` quét component còn viết theo convention CŨ (tín hiệu "Đính chính"/nhiều mốc "CHỐT") → sửa lên chuẩn; story theo. (Đây là rule DRIFT theo thời gian.)

## Khi SỬA STORY (lane `starci-fe-story`)
- Story chỉ được phản ánh 1 luật THẬT — KHÔNG tự chế biến thể trái luật để "cho đẹp".
- Story lộ **component production lệch** → CHỐT thầy + ghi `.artifacts/proposals` route `starci-fe-build`, **KHÔNG sửa production ở lane story** (vùng cấm).

## Tự soát trước khi báo xong (mọi lane)
- 3 lớp đã KHỚP chưa? component ↔ luật (không phá rule) ↔ story (còn đúng hình hài)?
- Đừng chốt "xong" khi mới sửa 1 lớp.

## Ví dụ neo
- **(2026-07-15) `QuickActions`** — thầy chỉnh hover: (a) đối chiếu luật [[../principles/hover-style-matches-clickable-nature]] + [[../components/icon]] §leading (icon cùng màu title) → bắt được QuickActions hand-roll `<Link>` + icon `text-muted` lệch luật; (b) đổi component sang **HeroUI ListBox gốc** (fill là chrome native, không hand-roll) + icon `text-foreground`; (c) ghi **Đính chính** vào luật hover (nav-list dùng ListBox gốc ≠ hand-roll fill trên content-row). → 3 lớp khớp lại thay vì chỉ vá component.
