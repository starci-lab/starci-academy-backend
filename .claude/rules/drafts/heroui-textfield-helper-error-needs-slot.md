# Draft — HeroUI v3 `TextField`: text con (hint/error) PHẢI có `slot` ("description"/"errorMessage") hoặc `<FieldError>`, KHÔNG `<Typography>` trần (2026-06-25)

- File/§ đích khi `/merge`: `starci-ui.rules` (form/TextField) hoặc `elements/input.md`.
- Bối cảnh: `ManagePinnedProjectsModal/ExternalProjectForm` — mở form "Thêm dự án bên ngoài" → **Runtime Error**:
  *"A slot prop is required. Valid slot names are 'description' and 'errorMessage'."* Gốc: `<Typography>` hint của field
  techStack đặt làm con TRẦN của `<TextField>` (HeroUI v3 = React Aria, con phải khai báo slot).

## Luật (STRICT)
- **Mọi text con BÊN TRONG `<TextField>` (HeroUI v3) PHẢI khai báo `slot`** — React Aria chỉ nhận con có slot hợp lệ:
  - **Helper/hint** (mô tả dưới field, luôn hiện) → `<Typography slot="description" type="body-xs" color="muted">…`.
  - **Validation/error** (gated theo `errors.x`, field có `isInvalid`) → `<Typography slot="errorMessage" type="body-xs" className="text-danger">…` HOẶC dùng block **`<FieldError>{errors.x}</FieldError>`** (HeroUI) cho gọn.
- **CẤM `<Typography>` / text trần làm con trực tiếp của `TextField`** — thiếu slot = crash runtime (không phải lỗi tsc, chỉ nổ lúc render). `<Label>` + `<Input>` là subcomponent nhận diện sẵn, không cần slot; chỉ text phụ mới cần.
- **Bẫy:** error message gated `errors.x ? <Typography…/> : null` → KHÔNG crash khi field hợp lệ, chỉ nổ khi field invalid → dễ lọt. Hint luôn-hiện thì nổ ngay. → khi thêm field có hint/error, gắn slot NGAY.
- **Precedent đúng trong repo:** `ContactForm` + `EditProfile` (`<Typography slot="description">`); `SubmissionRow`/`GithubGradingSettings`/`ByokForm`/`AdminLogin` (`<FieldError>`). Soi mấy file này khi dựng form mới.

## ĐÃ ÁP DỤNG 2026-06-25
- `ExternalProjectForm`: techStack hint → `slot="description"`; title/url error → `slot="errorMessage"`. tsc/eslint sạch.
- Quét toàn repo: KHÔNG còn `<Typography>` trần trong `<TextField>` nào khác (chỉ chỗ này lọt).
