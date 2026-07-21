# Concept — AsyncContent KHÔNG có `debug` 3s-hold (dev-affordance mặc-định-bật = footgun gây "giật")

> Heuristic engineering (họ `concepts/*`, FE data-state). Rút từ dashboard/profile "skeleton giật giật": prop `debug` giữ skeleton 3000ms (`DEBUG_HOLD_MS`, gated `publicEnv().debug` BẬT ở dev) bị để sót `debug={true}` ở ~18 chỗ → mọi vùng giữ skeleton 3s.

## Luật (STRICT)
- **`AsyncContent` KHÔNG có prop `debug` / KHÔNG 3s-hold.** Bỏ hẳn `debug`/`held`/timer/`DEBUG_HOLD_MS`/`holdEnabled`. Priority gọn: **`error → loading → empty → content`**. Lý do: 1 dev-affordance **mặc định bật + dễ để sót** = footgun (giữ skeleton 3s cho user thật = giật). Bỏ nguồn cơ = hết bệnh tận gốc.
- **Soi loading KHÔNG dùng `debug`** → Network throttle (DevTools) hoặc tạm `await sleep` ở fetcher. (Đính chính skill `starci-fe-skeleton-apply`: bỏ bước "set `debug={true}` → hold 3s → gỡ".)
- **Skeleton CHỈ cho vùng sẽ-có-nội-dung hoặc có empty-state HIỂN THỊ.** Card TỰ ẨN (`isEmpty` + không `emptyContent` → `null`) thì skeleton vẫn OK khi không còn 3s-hold (nháy đúng thời gian load thật, rất ngắn); nếu acc thường rỗng mà vẫn nháy → cân nhắc bỏ skeleton (chỉ hiện khi có data). ĐỪNG ép giữ skeleton bằng timer.
- **`isLoading` truyền vào = điều kiện ĐÃ RESOLVE** (`isLoading && !data` / `isLoading && items.length === 0`): SWR `isLoading` chỉ true lần load đầu (chưa cache); revalidation (focus/mutate) KHÔNG bật lại skeleton.

## Liên quan
- [[labeled-section-render-empty-not-self-hide]] (rỗng → empty-state, không tự ẩn) · [[frameless-section-empty-state-needs-card]].
