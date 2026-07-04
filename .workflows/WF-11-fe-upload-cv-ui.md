# WF-11 · FE upload CV UI (luồng end-to-end)

- **Status:** ✅ done (2026-07-04 — `UploadSection` ở `/profile/cv`; presign→PUT→uploadCv→poll qua shared store; tsc/eslint/JSON sạch. ⚠️ 2 flag runtime — xem dưới)
- **Repo:** frontend (`starci-academy`, nhánh `mtp`)
- **Effort:** M
- **Phụ thuộc:** WF-07 (BE uploadCv + presign cdnKey — done)
- **Owner:** (chưa gán)

## Mục tiêu
Cho user upload CV file qua UI → luồng chạy end-to-end tới điểm số. Đóng nốt "luồng CV" (generate + upload đều dùng được từ FE).

## Đã làm
- **Surface:** `/profile/cv` → `features/profile/CV/`. Thêm `CVUpload/UploadSection/` (Dropzone + label + model picker) làm sibling của `GenerateSection`, tái dùng `useCvGenerationStore` + `useQueryCvGenerationSwr` polling → upload dùng CHUNG preview/status với generate (không page riêng).
- **Hooks mới:** `useMutateUploadCvSwr` + `mutation-upload-cv` + types; `useCvUploadForm` (orchestrate presign→PUT→uploadCv→subscribe). Presign mutation thêm `cdnKey` vào selection.
- **Luồng:** `generateSubmitCvPresignUrl({fileName})` → `axios.put(url, file)` → `sleep(1000)` (MinIO propagation) → `uploadCv({cdnKey, label, mode, selectedModel})` → `setActiveCvGenerationId` + socket subscribe.
- i18n `cv.upload.*` (vi+en khớp). tsc 0 lỗi, eslint sạch.

## ⚠️ Flag cần team xử (runtime / follow-up)
1. **FE poll/list docs stale vs schema shipped:** `cvGeneration`/`myCvGenerations` GraphQL doc đang select `kind` + gửi `cvGenerationId`/`filters`, còn schema unified (WF-03a) dùng `mode`/`source`/`score` + `id`/`limit`/`offset`. Agent CỐ Ý không sửa (sợ vỡ generate flow đang chạy với backend deployed). → **Cần realign `query-my-cv-generations.ts` + `query-cv-generation` (+ types)** sau khi confirm backend deployed = bản WF-07. Tới lúc đó mới render được list "CV của tôi" kèm `source`/`score`.
2. **Runtime chưa verify** (no dev server ở session này): check live presign trả `cdnKey` + `uploadCv` nhận payload + poll ra score.

## Còn (thầy sửa sau)
- List "CV của tôi" (source + score) — `myCvGenerations` hook đã đăng ký nhưng chưa render (chờ realign doc ở flag 1).
- UX polish: upload/generate share 1 preview qua `activeCvGenerationId` — thầy có thể muốn tách section/label rõ hơn hoặc 1 history list thống nhất.
