# Element — Image (cover + upload dropzone)

> Element doc cho ảnh: `CoverImage` (hiển thị, khung 16:9) và 2 dropzone khác vai (`ImageDropzone` chuyên
> ảnh vs `Dropzone` generic file). Đừng lẫn 2 dropzone — chọn theo LOẠI file được nhận.

## `CoverImage` (`blocks/media/CoverImage`) — cover/thumbnail 16:9
- Khung cố định `aspect-video` + `rounded-2xl bg-surface-secondary` (nền khi ảnh null) + `object-cover` +
  `loading="lazy"`. Block lo TRỌN khung/radius/crop — feature chỉ truyền `src` + `alt`.
- **`src` null/undefined → khung TRỐNG có nền** (không icon placeholder) — hợp [[card]] gotcha "media radius
  1 nấc dưới radius card cha" khi đặt `CoverImage` trong 1 `Card rounded-3xl` (chỉnh `className` để override
  `rounded-2xl` xuống khớp).
- Dùng cho course/blog/changelog cover — KHÔNG dùng cho avatar người dùng (đó là `UserAvatar`, xem `avatar.md`).

## `ImageDropzone` (`blocks/identity/ImageDropzone`) — upload 1 ẢNH
- Chuyên **ảnh** (png/jpeg/webp/gif, ≤5MB, mirror giới hạn BE avatar). Dashed border + icon + label + hint,
  border chuyển ĐẶC + tint `bg-accent/10` khi kéo-thả vào (`isDragActive`). Props-only: `onFile(file)` nhận
  file đã lọc type/size — feature tự lo upload thật (presign/POST).
- Dùng cho: đổi avatar, đổi cover ảnh (course/blog). KHÔNG dùng cho file khác ảnh (CV, doc) — đó là `Dropzone`.

## `Dropzone` (`reuseable/Dropzone`) — upload FILE generic (không riêng ảnh)
- Nhận `acceptedMimeTypes`/`maxSizeInBytes` tuỳ ý (CV, tài liệu…) + `errorMessage` (validate hiển thị). Khác
  `ImageDropzone`: preview tên file (`file?.name`) thay vì preview ảnh, và **form-field shaped**
  (`onChange`/`onBlur` — hợp react-hook-form) thay vì callback `onFile` đơn.
  > Gotcha: icon hiện tại là `@gravity-ui/icons` (`CloudArrowUpIcon`) — LỆCH quy ước Phosphor-only
  > ([[icon]] §1). Khi đụng file này, đổi sang `@phosphor-icons/react` tương đương (`CloudArrowUpIcon`/
  > `UploadSimpleIcon`).
- **Chọn cái nào:** nhận đúng 1 ẢNH + callback đơn giản (`onFile`) → `ImageDropzone`. Nhận file bất kỳ loại +
  cần wire vào RHF (`onChange`/`onBlur`/error) → `Dropzone`. 2 cách nhập (dán text HOẶC upload) → xem `input.md`
  §6 (`TabsCard` + field ngay dưới, không bọc card ngoài).

> Block: `blocks/media/CoverImage` · `blocks/identity/ImageDropzone` · `reuseable/Dropzone`

## Liên quan
- [[card]] (media radius 1 nấc dưới card cha) · [[input]] §6 (2 cách nhập: paste/upload) · [[icon]] §1
  (Phosphor-only — `Dropzone` cần dọn).
