# Concept — Mọi thứ đọc data từ SNAPSHOT phải chạy TRONG init window, KHÔNG standalone `onModuleInit`

> Heuristic engineering (họ `concepts/*`, BE init/seed pipeline). Rút từ sự cố course-cover không lên MinIO.

## Luật (STRICT)
- **Mọi thứ đọc data từ snapshot (`assets/`, content…) PHẢI chạy trong cửa sổ `setRuntimeContextRoot(snapshotRoot)` … `clearRuntimeContextRoot()`** của `InitService.onModuleInit` (giữa phase-1 seed và `finally`). Ngoài cửa sổ này, `getRuntimeContextRoot()` = undefined + `.contexts/<sha>/assets` KHÔNG materialize ra top-level → reader chỉ thấy fallback local (thiếu data-repo asset) → skip im lặng.
- **KHÔNG dựa `@Injectable onModuleInit` RIÊNG** cho việc cần snapshot root — nó chạy theo thứ tự module Nest, KHÔNG đảm bảo nằm trong init window. Thay vào đó **InitService driver** gọi service đó sau phase-2 (`assetsService.sync()` sau `synchronizersService.init()`), guard `if (snapshotRoot)` + try/catch non-fatal (fail asset KHÔNG rollback seed).
- **Cột vs field gotcha:** course cover lưu ở cột DB **`thumbnail_url`** (entity `coverImageUrl` map `@Column({ name: "thumbnail_url" })`). Query raw DB phải dùng `thumbnail_url`, không `cover_image_url`.

## Dấu hiệu
- Data vào DB OK (reseed đọc snapshot) nhưng FE asset vỡ (`NoSuchKey`) → nghi file chưa lên MinIO vì sync chạy NGOÀI init window (`getRuntimeContextRoot()` undefined → fallback thiếu asset). Thứ chạy TRONG init (achievement-seeder…) thì OK — đối chiếu để khoanh vùng.

## Liên quan
- [[shared-modules-global-once-at-app-root]] (BE module wiring — infra service đăng ký/gọi đúng chỗ, không rải).
