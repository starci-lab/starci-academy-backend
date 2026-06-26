# Draft — HeroUI `Tabs.Tab` PHẢI chứa `<Tabs.Indicator/>` (không có = tab không có gạch chân active) + modal header chuẩn (2026-06-25)

- File/§ đích khi `/merge`: `elements/` (tabs — chưa có doc riêng) + đã ghi `elements/header.md` §5 (modal header). Liên quan [[tabscard-two-secondary-groups]] (TabsCard block) + [[modal-body-no-padding-override-heroui-idiom]].
- Bối cảnh: `ManagePinnedProjectsModal` — tabs "Đã ghim / Thêm bên ngoài / Thêm capstone" KHÔNG có indicator (gạch chân dưới tab active) → trông trơ, không rõ tab nào đang chọn. Thầy: *"tabs thì phải có indicators"*.

## Luật (STRICT)
- **HeroUI `Tabs` KHÔNG tự render gạch chân active — mỗi `<Tabs.Tab>` PHẢI chứa `<Tabs.Indicator/>`** làm con (sau label): `<Tabs.Tab id="x">{label}<Tabs.Indicator/></Tabs.Tab>`. Thiếu → tab active chỉ đổi màu chữ, KHÔNG có underline → đọc không ra "đang ở tab nào". Canonical: `AiQuotaModal/TabBar`.
- **Đừng nhầm với `TabsCard` block** ([[tabscard-two-secondary-groups]]) — đó là block bọc sẵn cho toolbar 2 nhóm tab (tự lo indicator). Khi dùng raw HeroUI `Tabs` (vd trong modal), tự thêm `Tabs.Indicator` từng tab.

## Modal header (đã ghi canonical `elements/header.md` §5)
- Title modal = `<Typography type="body" weight="semibold" className="pr-8">` (KHÔNG `Typography.Heading level={3}` của page header; `pr-8` chừa chỗ nút X). Theo PaymentModal/PremiumGateModal.

## ĐÃ ÁP DỤNG 2026-06-25 (FE)
- `ManagePinnedProjectsModal`: thêm `<Tabs.Indicator/>` vào 3 `Tabs.Tab`; header `Typography.Heading level={3}` → `Typography body semibold pr-8`; `Tabs.Panel` `pt-4` → `pt-3` (thang [[gap]]).
- 2 form (External/Course): `<textarea bg-default/40>` → `TextField secondary + TextArea` ([[elements/input]] §5); form gap `gap-4` → `gap-3`; icon gravity-ui `CircleCheckFill` → phosphor `CheckCircleIcon` ([[elements/icon]]). tsc/eslint sạch.
- **CHƯA làm (thầy chưa duyệt):** runtime-check BE `pinExternalProject` (nút "Ghim dự án" spinner — FE logic đúng, nghi BE treo). + nợ: modal import manager/card từ `PublicProfileLegacy` (nên chuyển sang `PublicProfile` mới).
