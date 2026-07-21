# Concept — AI trả dữ liệu CÓ CẤU TRÚC phải emit ĐÚNG shape consumer đọc (per-type fields), KHÔNG shape generic lossy

> Heuristic engineering (họ `concepts/*`). Rút từ bug `splitCvFromText` (2026-07-06): handler AI trả `items: string[]`
> trong khi FE editor cần `items: {id, fields}[]` per-type → dán/upload CV xong blocks **crash/rỗng** (`item.fields`
> undefined). `tailorCvBlocks` làm đúng từ đầu (prompt + parse ra đúng `{id, fields}`), chỉ `split` lệch.

## Nguyên tắc (STRICT)
- **Mutation/handler dùng AI để SINH dữ liệu có cấu trúc (blocks, rows, tree, form-fields…) PHẢI prompt + parse ra
  ĐÚNG shape mà CONSUMER (FE component / renderer / editor) đọc — kể cả field-key per-type.** KHÔNG trả 1 shape
  "generic/gọn" rồi kỳ vọng consumer tự map. Shape generic (vd `items: string[]`) thường **lossy** (1 string không
  map được về `{company, role, startDate, endDate, bullets}`) → consumer render sai/crash.
- **Prompt phải MÔ TẢ shape đích cụ thể** (liệt kê field key của TỪNG loại), + **kèm example JSON** đúng shape. Model
  chỉ trả đúng khi được bảo đúng. (Vd: mỗi block type → 1 dòng schema `experience: {company,role,startDate,endDate,bullets}`.)
- **Parser defensive + salvage, KHÔNG trust mù:** ép về shape đích (coerce value→string, array→join, sinh `id` unique),
  và **cứu** khi model drift (item lỡ trả string thô → nhét vào PRIMARY field của loại đó; fields ở top-level thay vì
  bọc `.fields` → coi cả object là fields). Parse fail / non-array → **throw rõ**, đừng trả rác.
- **Đối chiếu shape ở RANH GIỚI FE↔BE:** trước khi ship 1 AI-structured mutation, mở đúng file consumer (renderer/
  editor) xem nó đọc field nào → prompt+parse khớp 1-1. GraphQL JSON scalar là **opaque** → tsc KHÔNG bắt lệch shape;
  lệch chỉ nổ **runtime** (`x.fields` undefined). Đây là họ với [[fe-swr-gate-must-match-be-enroll-guard]] (contract
  FE↔BE phải khớp) + [[envelope-response-data-must-be-nullable]] (shape BE che lỗi runtime).
- **Dấu hiệu cần soi:** handler AI trả 1 mảng "phẳng" (string[] / {label,value}[]) trong khi consumer là editor/
  renderer giàu field → nghi lossy. Hỏi: consumer đọc `item.fields.X` hay `item` trực tiếp? Đọc `.fields` → BE phải
  emit `{id, fields}`.

## Ví dụ ĐÚNG (tham chiếu)
- `tailorCvBlocks`: prompt example `items:[{id, fields:{}}]` + merge-by-`id` giữ identity (id/type) từ original →
  shape đúng + chống drift.
- `splitCvFromText` (đã sửa 2026-07-06): `BLOCK_FIELD_SCHEMA` mô tả per-type fields trong prompt; parser
  `normalizeItemFields` ép `{id, fields:Record<string,string>}` + salvage bare-string vào `PRIMARY_FIELD_KEY`.

## Liên quan
- [[single-source-render]] (1 shape = 1 nguồn; consumer + producer cùng 1 hợp đồng) · [[fe-swr-gate-must-match-be-enroll-guard]]
  (contract FE↔BE khớp) · [[envelope-response-data-must-be-nullable]] (shape BE che lỗi runtime) ·
  [[fe-change-touching-backend-must-verify-backend-runtime]] (verify runtime, tsc-sạch ≠ chạy đúng).
