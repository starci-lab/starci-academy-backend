# Element — Drawer (HeroUI `Drawer`)

> Element doc cho panel trượt xem/chọn PHỤ (không chặn luồng — mở rồi quay lại). "Khi nào Drawer" (vs Modal/
> inline) đã chốt đầy đủ ở [[when-drawer]] — file này tả kiến trúc mở/đóng thật + anatomy compound.

## Khi nào dùng
- Giấu thông tin/lựa chọn PHỤ (ít dùng, không cướp tâm điểm) sau 1 label-row + caret, mở ra rồi ĐÓNG LẠI VỀ
  ĐÚNG luồng đang xem (settings phụ, lịch sử lần thử, cổng thanh toán quốc tế). Đầy đủ tiêu chí + bảng so
  Modal/inline → xem [[when-drawer]].
- **Overlay mở TỪ TRONG 1 popover khác (vd FAB chat đang mở) → KHÔNG Drawer** (z-fight backdrop `z-50` cùng
  layer) — render IN-PANEL (view trượt cùng lớp popover cha). Xem [[overlay-from-popover-render-in-panel]].

## Kiến trúc mở/đóng (STRICT — cùng pattern với `modal.md`)
- **Mỗi drawer đọc open-state từ 1 zustand OVERLAY STORE riêng** (`hooks/zustand/overlay`, vd
  `useE2eResultOverlayState`) — không `useState` cục bộ, không props xuyên nhiều tầng.
- **Mọi drawer MOUNT SẴN 1 LẦN ở app root qua `DrawerContainer`** (`components/drawers/DrawerContainer.tsx`).
  Drawer mới → thêm dòng vào container đó, không mount cục bộ trong feature.
- Trigger (nút/label-row mở drawer) SỐNG Ở FEATURE khác nơi (vd nút "Xem E2E" trong lesson footer) — trigger
  chỉ gọi `setOpen(true)` trên store, KHÔNG cầm ref tới component Drawer.

## Anatomy (compound API — soi `E2eResultDrawer`)
```
<Drawer>
  <Drawer.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
    <Drawer.Content placement={isMobile ? "bottom" : "right"}>
      <Drawer.Dialog className="p-0 sm:max-w-2xl">
        <div className="p-3">
          <Drawer.CloseTrigger />
          <Drawer.Header><Drawer.Heading>…</Drawer.Heading></Drawer.Header>
        </div>
        <Drawer.Body>
          <ScrollShadow className="h-full p-3" hideScrollBar>…</ScrollShadow>
        </Drawer.Body>
      </Drawer.Dialog>
    </Drawer.Content>
  </Drawer.Backdrop>
</Drawer>
```
- **`placement` responsive: `right` desktop / `bottom` mobile** (`useSmViewpoint`) — chuẩn cho MỌI drawer,
  không cố định 1 phía.
- **Nội dung dài → bọc `ScrollShadow`** (fade mép, `hideScrollBar`), KHÔNG overflow trần trong `Drawer.Body`.
- Drawer có thể tự trả `null` khi nội dung nguồn rỗng (vd 0 E2E flow ghi nhận) — trigger phía feature cũng nên
  ẩn tương ứng (đừng để trigger mở ra 1 drawer trống).
- **Có `Drawer.Footer` (CTA dính đáy, vd giỏ hàng) → PHẢI tự bù padding y hệt Header/Body** (`className="...
  p-4"` khớp `ScrollShadow`) — `Drawer.Dialog p-0` xoá SẠCH padding baked-in (24px) của cả 3 vùng, Header/Body
  đã tự bù (`div p-3` / `ScrollShadow p-4`) nhưng Footer KHÔNG tự động thừa hưởng gì — quên bù = nội dung
  (tổng tiền, nút CTA, link phụ) dính sát mép drawer. **Đính chính (2026-07-10):** bắt được ở `MiniCartDrawer`
  — `Drawer.Footer className="flex flex-col gap-3 border-t"` thiếu `p-4`, thầy soi thấy lệch ngay khi share
  màn hình. Anatomy mẫu ở trên chưa có ví dụ Footer vì hầu hết drawer không cần — drawer NÀO có Footer thì
  đây là rule bắt buộc.

> Block: `Drawer` (HeroUI) qua `components/drawers/*` (8 drawer, mounted bởi `DrawerContainer`)

## Liên quan
- [[when-drawer]] (nguồn đầy đủ: khi nào Drawer vs Modal vs inline, placement, label-row trigger) ·
  `modal.md` (cùng kiến trúc store+container, khác vai chặn/không-chặn) ·
  [[overlay-from-popover-render-in-panel]] (ngoại lệ: overlay mở từ trong popover → không Drawer).
