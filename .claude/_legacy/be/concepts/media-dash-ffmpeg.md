# Concept — Media pipeline (FFmpeg + Bento4 DASH/HLS)

> `src/modules/ffmpeg/` (wraps `fluent-ffmpeg`) + `src/modules/bento4/` (mp4 segmenter, đóng gói HLS/DASH) + `src/modules/execa/` (chạy binary native) hợp thành pipeline encode video bài giảng.

- Pipeline: upload raw video → S3 ([[typeorm-entities-and-relations]] §stores phụ, `@modules/s3`) → push job vào BullMQ queue `video-encoder` ([[background-jobs-bullmq]]) → worker transcode multi-bitrate bằng FFmpeg → Bento4 segment thành HLS/DASH → upload segment + manifest lên S3 → sync CDN qua `src/modules/init/synchronizers/cdn-synchronizer/`.
- Orchestrator + processor: `src/features/video-encoder/processors/video-encoder/` — chạy **trong app `core`** (không phải app riêng dù tên gợi ý service tách biệt).
- Entity liên quan: `lesson-video.entity.ts` (metadata video) + `lesson-video-translation.entity.ts` (i18n caption/title) + `livestream-session.entity.ts` (session livestream).
- `execa/` là lớp gọi binary chung (ffmpeg, bento4 đều là external process, không phải Node lib thuần) — wrap để chuẩn hoá error/stdout parsing.

> Nguồn: `src/modules/ffmpeg/`, `src/modules/bento4/`, `src/modules/execa/`, `src/features/video-encoder/`
