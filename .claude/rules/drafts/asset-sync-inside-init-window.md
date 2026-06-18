# Asset→MinIO sync phải chạy TRONG init window (không standalone onModuleInit) (2026-06-18)

- File/§ đích khi `/merge`: `main.md` (init/seed pipeline) hoặc doc init-v2.
- Bài học (sự cố course cover): cover URL vào DB OK (reseed đọc `# coverImageUrl` từ snapshot) nhưng FE ảnh vỡ
  (`NoSuchKey`) vì **file PNG chưa lên MinIO**. Lý do: `AssetsService` (cái DUY NHẤT upload `assets/*` → MinIO)
  chạy `onModuleInit` **NGOÀI** init pipeline → lúc đó `getRuntimeContextRoot()` **undefined** → fallback
  `.mount/assets` (KHÔNG có asset của data-repo) → skip. Badges hiện được chỉ vì upload qua **achievement-seeder**
  (chạy TRONG init, `runtimeContextRoot` = snapshot fresh).

## Luật (STRICT)
- **Mọi thứ đọc data từ snapshot (`assets/`, content, …) PHẢI chạy trong cửa sổ `setRuntimeContextRoot(snapshotRoot)`
  … `clearRuntimeContextRoot()`** của `InitService.onModuleInit` (giữa phase-1 seed và `finally`). Ngoài cửa sổ này,
  `getRuntimeContextRoot()` = undefined và `.contexts/<sha>/assets` KHÔNG materialize ra top-level `.contexts/assets`
  → reader chỉ thấy fallback local (thiếu data-repo asset).
- **Hệ quả: KHÔNG dựa `@Injectable onModuleInit` riêng** cho việc cần snapshot root (nó chạy theo thứ tự module Nest,
  không đảm bảo nằm trong init window). Thay vào đó **InitService driver** gọi service đó sau phase-2 (đã làm:
  `assetsService.sync()` sau `synchronizersService.init()`, guard `if (snapshotRoot)` + try/catch non-fatal — fail
  asset KHÔNG được rollback seed).
- **Cột vs field gotcha:** course cover lưu ở cột DB **`thumbnail_url`** (entity `coverImageUrl` map
  `@Column({ name: "thumbnail_url" })`). Query DB phải dùng `thumbnail_url`, không `cover_image_url`.
- Tool gỡ nhanh nếu cần (trước khi fix lan): `scratch/upload-course-covers.cjs` (đẩy 3 PNG thẳng lên MinIO).
