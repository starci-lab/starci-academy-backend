# S1 — Ground (đọc thước)

Nạp canon + template THẬT trước khi audit:

- **`.claude/fe/principles/INDEX.md` §1–6** — đọc checklist "Đo được" mỗi §:
  - §1 Surface-in-surface · §2 (+§2d) Color-prominence · §3 Reading-flow · **§4** Element-ownership · **§5** Icon (size theo text + interaction) · **§6** Granularity (prop-vs-component mới).
- **Template `ButtonGroup`** (`$FE_SOURCE/.storybook/stories/blocks/buttons/{Button,ButtonGroup}/`) — chuẩn tham chiếu để so mọi primitive: base `Button` (bọc HeroUI + `isSkeleton` if-else + icon-size §5 + `iconOnly`) · `ButtonGroup` (compose base Button, slot có tên, pass isSkeleton, responsive). Đây là "hình mẫu đạt canon".
- **Bộ test** (không chấm nСn): coverage = `test-runner` smoke + Chromatic + axe (xem `.claude/patterns/fe/storybook-stories.md §12`).
- `$FE_SOURCE` = repo FE (`.artifacts/config.json`; nay `C:\Repositories\starci-academy`, branch mtp).
