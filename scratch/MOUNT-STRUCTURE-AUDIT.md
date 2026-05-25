# Mount structure audit (content + challenges)

Generated: 2026-05-25T06:31:32.773Z

## Đã xử lý

| Vấn đề | Hành động | Trạng thái | Chi tiết |
|--------|-----------|------------|----------|
| Lesson `# databases` (System Design) | Removed `# databases` block from mount (not seeded by content parser) | **Đã fix** (2026-05-25) | 44 files — scratch/databases-section-removed.json |
| Lesson `# isPremium`, delimiters, EN/VI; challenge delimiters/meta | BOM strip, mount `-----` wrap, isPremium sync, challenge tail repair | **Đã fix** (2026-05-25) | scratch/mount-audit-fix-manifest.json (isPremium: 209, challenge delimiters: 946) |

## Chuẩn tham chiếu

### Lesson (contents/<slug>/en|vi.md)
- Required `# `: `title`, `description`, `body`, `references`, `minutesRead`, `isPremium`
- Optional `# `: `codeExplaining`, `codeImplementations`

### Lesson video (contents/.../lesson-videos/<slug>/en|vi.md)
- Required `# `: `title`, `description`, `caption`, `url`, `thumbnailUrl`, `durationMs`, `kind`, `hostPlatform`

### Challenge (contents/.../challenges/<slug>/en|vi.md)
- Required `# `: `title`, `description`, `requirements`, `outputs`, `prerequisites`, `steps`, `references`, `submissions`, `difficulty`, `score`

- Delimiter mount: `<!-- @starci/seperator -->` bọc giá trị field (legacy `-----` / `C-----C` chỉ migrator).
- Template thuần: `.mount/data/templates/content.md`, `challenge.md`.
- Extract: `title` / `description` / `body` unwrap → string; không reconstruct làm chuẩn mount.

## Tổng quan

| Loại | Tổng file | Không chuẩn | Có delimiter | Không delimiter |
|------|-----------|-------------|--------------|-----------------|
| Lesson (contents/<slug>/en|vi.md) | 302 | 0 | 302 | 0 |
| Lesson video (contents/.../lesson-videos/<slug>/en|vi.md) | 4 | 0 | 4 | 0 |
| Challenge (contents/.../challenges/<slug>/en|vi.md) | 946 | 0 | 946 | 0 |
| EN/VI lệch section | 0 cặp | | | |

## Lesson — thiếu section bắt buộc (0)

_Không có._

## Lesson — section thừa (chưa hỗ trợ parser) (0)

_Không có._

## Lesson — không có delimiter (0)

_Không có._

## Lesson video — không chuẩn (0)

_Không có._

## Challenge — thiếu section bắt buộc (0)

_Không có._

## Challenge — section thừa (0)

_Không có._

## Challenge — không có delimiter (0)

_Không có._

## EN/VI khác danh sách `#` section (0)

_Không có._
