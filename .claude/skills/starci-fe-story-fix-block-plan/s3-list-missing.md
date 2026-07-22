# S3 — Liệt kê primitives/blocks còn THIẾU

Block phải compose từ primitives/blocks CÓ THẬT — không hand-roll. Nên:

- **Grep kho TRƯỚC khi phán thiếu:** `$FE_SOURCE/src/components/blocks/**` + story tree `.storybook/stories/blocks/**` (vd family `chips`/`stats`/`lists`/`buttons`). Có sẵn cái gần → **reuse** (ghi tên), đừng đẻ trùng.
- **Mỗi element THIẾU = 1 dòng:** `[primitive|block] tên đề xuất — vai trong block — reuse/ghép từ gì`.
  - **tầng:** `primitive` (gốc rễ generic) hay `block` (chức năng).
- **Nguồn phát hiện thiếu (từ S2):** part hand-roll inline (span/div dựng tay) · cụm đồng-vai chưa có group (vd 2 nút → thiếu `ButtonGroup`) · part `blockShell` không trỏ được về primitive nào.
