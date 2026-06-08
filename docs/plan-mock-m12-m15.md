# Plan — Mock server cho M12 (file upload) + M15 (responsive)

Date: 2026-06-08. Branch: claude/devops-mastery.

## Bối cảnh
Mock server = NestJS standalone (`apps/mock` + `src/features/mock`), in-memory, port 3002.
Convention cũ (M5/M6/M9): controller ở `mocks/<slot>/<lesson>/sessions/:sessionId/...`,
FE gọi path tương đối, platform inject `VITE_API_BASE = …/sessions/<id>`.

## Kết luận khảo sát FE (đã đọc hết source)
- **M14** (slot 13) & **M16** (slot 15): cả 8 lesson pure-client, ZERO network → **không làm gì**.
- **M15** (slot 14): chỉ `GET /api/products`, 3 lesson 3 shape; L3 none.
  - L0/L1 dùng **full base** → controller scoped `mocks/14-…/<lesson>/sessions/:sessionId` + `GET api/products`.
  - L2 dùng `new URL(base).origin` → **root** `GET /api/products`.
- **M12** (slot 11): 4 lesson, FE dùng `new URL(base).origin` → **TẤT CẢ endpoint ở ROOT**, isolation bằng id server tự sinh.

## Quyết định (thầy chốt)
1. M14/M16: bỏ qua.
2. M15: serve products (tái dùng FALLBACK_PRODUCTS shape, URL ảnh picsum thật).
3. M12: `FileStoreService` riêng (Buffer per-resource, TTL + size-cap).
4. Bỏ delay ở endpoint truyền byte (chunk/blob/tus PATCH/PUT/GET); giữ delay ở init/presign/finalize/upload/products.

## Endpoint contract

### M12-L0 `0-multer-single-file-upload` (ROOT)
- `POST /upload` multipart field `file` → 201 `{originalName, filename, size, mimetype, path}`
- Dùng `FileInterceptor("file")` (multer memory). Cap 10MB → 400 nếu vượt.

### M12-L1 `1-s3-minio-presigned-urls` (ROOT, round-trip bytes)
- `POST /presign/put` `{filename, contentType}` → `{key, url, method:"PUT", expiresInSeconds, filename}`
  - `url = <origin>/presign/object/<key>` (origin từ x-forwarded-* / host)
- `PUT /presign/object/:key` (raw bytes, bất kỳ content-type) → 200, lưu buffer+contentType, trả ETag header
- `GET /presign/get/:key` → `{url:<origin>/presign/object/<key>, key, expiresInSeconds}`
- `GET /presign/object/:key` → trả bytes + đúng Content-Type (img src preview)

### M12-L2 `2-chunked-upload-with-progress` (ROOT)
- `POST /uploads/init` `{filename, size}` → `{sessionId(uuid), totalChunks, chunkSize=1MB}`
- `GET /uploads/:id/status` → `{sessionId, totalChunks, chunkSize, received[], missing[], finalized}`
- `PATCH /uploads/:id/chunks?index=N` raw bytes → 200 (lưu chunk N)
- `POST /uploads/:id/finalize` → `{filename, size, sha256, path}` (ghép + sha256, cần đủ chunk)

### M12-L3 `3-resumable-upload-tus-protocol` (ROOT, tus 1.0.0 core+creation)
- `OPTIONS /files` → Tus-Resumable/Version/Extension/Max-Size
- `POST /files` (Upload-Length, Upload-Metadata) → 201 + `Location: <origin>/files/<id>`
- `PATCH /files/:id` (Upload-Offset, application/offset+octet-stream) → 204 + Upload-Offset mới
- `HEAD /files/:id` → 200 + Upload-Offset + Upload-Length
- CORS: thêm HEAD + exposedHeaders [Location, Upload-Offset, Upload-Length, Tus-Resumable, Tus-Version, Tus-Extension, Upload-Metadata]

### M15-L0/L1/L2 `GET api/products` (L0/L1 scoped, L2 root)
- L0 shape `{id,name,description,price,image}`
- L1 shape `{id,name,price,img400,img800,img1200,wideAvif,wideWebp,wideJpg,squareAvif,squareWebp,squareJpg}`
- L2 shape `{id,name,src,width,height,lqip}` (12 items, có lqip base64)

## Cấu trúc file mới
```
src/features/mock/
  file-store/                      # FileStoreService (presign objects, chunk sessions, tus uploads)
  11-file-upload-and-storage/
    0-multer-single-file-upload/   multer.controller.ts + module
    1-s3-minio-presigned-urls/     presign.controller.ts + module
    2-chunked-upload-with-progress/ chunked.controller.ts + module
    3-resumable-upload-tus-protocol/ tus.controller.ts + module
    file-upload.module.ts
  14-responsive-and-adaptive-rendering/
    0-…/products.controller.ts (scoped) ; 1-… ; 2-… (root)
    responsive.module.ts
  utils/read-raw-body.ts           # đọc raw stream cho binary endpoint
```
+ wire vào `mock.module.ts`, `index.ts`.
+ main.ts: thêm HEAD + exposedHeaders cho tus.

## Verify
- `tsc -p apps/mock/tsconfig.app.json` (hoặc nx build mock) sạch + eslint sạch.
- Smoke: `nest start mock` → curl từng endpoint (upload, presign round-trip, chunk, tus HEAD/POST/PATCH, products).
