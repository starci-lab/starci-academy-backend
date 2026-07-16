# Element — Modal (HeroUI `Modal`)

> Element doc cho overlay CHẶN 1 bước (xác nhận/form bắt buộc trước khi tiếp tục). Da/padding/header đã chốt
> ở [[modal-body-no-padding-override-heroui-idiom]] (bản đầy đủ) — file này gom lại làm entry point "Modal"
> + kiến trúc mở/đóng thật của app.

## Khi nào dùng Modal (vs Drawer)
- Modal = 1 BƯỚC CHẶN cần quyết định/nhập TRƯỚC KHI tiếp tục (xác nhận xoá, checkout, form bắt buộc) — chiếm
  tâm điểm, nền mờ. KHÔNG dùng cho "xem thêm thông tin phụ rồi quay lại luồng" — đó là `drawer.md`
  ([[when-drawer]] có bảng phân biệt đầy đủ).

## CẤM `window.confirm`/`window.alert`/`window.prompt` — xác nhận LUÔN qua Modal (STRICT, CHỐT 2026-07-08)
- **Mọi hộp xác nhận/cảnh báo hành động (rời phỏng vấn, kết thúc sớm, xoá, huỷ...) PHẢI render bằng HeroUI
  `Modal` (qua block `ModalShell`), KHÔNG `window.confirm`/`alert`/`prompt`.** Native dialog phá da (browser
  chrome xám lạc điệu), không theo theme dark/light, không token, chặn cứng cả tab — thầy chốt: *"không xài
  alert"*.
- **Dùng block `blocks/layout/ModalShell`** (`Modal > Backdrop > Container > Dialog > CloseTrigger + Header? +
  Body`) — chỉ truyền `isOpen`/`onOpenChange`/`title`/`size="sm"` + body. KHÔNG tự hand-roll cây `<Modal>` cho 1
  confirm đơn.
- **Anatomy confirm chuẩn:** body = `Typography body-sm muted` (câu hỏi) + 1 hàng action `flex justify-end
  gap-2`: nút HUỶ = `variant="tertiary"` (đóng modal) · nút XÁC NHẬN = `danger` nếu phá huỷ (abandon/xoá) hoặc
  `primary` nếu là hành động tiến tới (chấm/lưu). Đóng modal TRƯỚC rồi mới chạy action (tránh flash).
- **Nhiều confirm cùng surface có thể gom 1 state + 1 `ModalShell`** (vd `confirmAction: "leave" | "endEarly" |
  null` → 1 modal đổi title/body/CTA theo action) thay vì N modal rời. Áp đầu: `MockInterviewSession` (rời
  phỏng vấn + kết thúc sớm dùng chung 1 confirm modal).
- Confirm 1-lần/ephemeral (state cục bộ trong 1 flow như phỏng vấn) được dùng `useState` + `ModalShell` tại
  chỗ — KHÔNG bắt buộc qua zustand overlay store như modal dùng-nhiều-nơi (§Kiến trúc dưới). Store+Container chỉ
  bắt buộc cho modal được TRIGGER TỪ NHIỀU NƠI trong app.

## Kiến trúc mở/đóng (STRICT — 1 nguồn cho MỌI modal trong app)
- **Mỗi modal đọc open-state từ 1 zustand OVERLAY STORE riêng** (`hooks/zustand/overlay`, vd
  `usePaymentOverlayState`) — KHÔNG local `useState` ở component cha, KHÔNG props `isOpen` truyền tay qua
  nhiều tầng. Bất cứ đâu trong app gọi `setOpen(true)` từ store là mở được modal đó.
- **Mọi modal MOUNT SẴN 1 LẦN ở app root qua `ModalContainer`** (`components/modals/ModalContainer.tsx` —
  1 danh sách `<XModal />` phẳng, mỗi modal tự inert khi store đóng). Modal MỚI → thêm 1 dòng vào
  `ModalContainer`, KHÔNG mount modal cục bộ trong 1 feature (2 modal cùng key ở 2 nơi = trạng thái phân kỳ).
  Cùng kiến trúc với `drawer.md`/`DrawerContainer`.

## Anatomy (compound API — soi `PaymentModal`)
```
<Modal>
  <Modal.Backdrop>
    <Modal.Container size="sm">
      <Modal.Dialog>
        <Modal.CloseTrigger />
        <Modal.Header>…</Modal.Header>
        <Modal.Body>…</Modal.Body>
        <Modal.Footer>…</Modal.Footer>       {/* khi có action row */}
      </Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
</Modal>
```
- **Gutter/padding KHÔNG tự chỉnh trên `Modal.Body`** — dialog `p-4` (global override) lo gutter, body
  `-m-[3px]/p-[3px]` lo breathing cho focus-ring. Set `p-*` lên `Modal.Body` = double-padding/lệch mép.
  Ngoại lệ full-bleed (search palette, media preview) phải ĐẶT TÊN, không rải `p-0`/`p-2` tuỳ hứng.
- **Header = `Typography body semibold pr-8`** (KHÔNG H3 của `PageHeader`, KHÔNG icon leading — chỉ text 1
  dòng; `pr-8` chừa chỗ `CloseTrigger` góc phải). Icon nhận diện (cover/logo) → đặt trong BODY, không header.
- Tabs bên trong Modal header → PHẢI kèm `<Tabs.Indicator/>` (HeroUI không tự render underline active).

> Block: `Modal` (HeroUI) qua `components/modals/*` (20+ modal, mounted bởi `ModalContainer`)

## Liên quan
- [[modal-body-no-padding-override-heroui-idiom]] (nguồn đầy đủ: gutter/breathing/full-bleed) ·
  [[header]] §5 (modal header) · `drawer.md` (overlay không-chặn, cùng kiến trúc store+container) ·
  [[when-drawer]] (bảng chọn Modal vs Drawer vs inline).
