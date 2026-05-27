# 09 — Media & Video

| Tech | Path | Ghi chú |
|------|------|---------|
| **FFmpeg** | `src/modules/ffmpeg/` | Wraps `fluent-ffmpeg` + `ffmpeg-static`. |
| **Bento4** | `src/modules/bento4/` | mp4 segmenter (HLS/DASH packaging). |
| **Video encoder feature** | `src/features/video-encoder/` | Module orchestrator + BullMQ processor. |
| **Video encoder app (standalone)** | `apps/ffmpeg-proccessor/` | Run riêng làm worker. |
| **Execa** | `src/modules/execa/` | Run native binaries (ffmpeg, bento4, …). |

## Pipeline encode video

1. Upload raw video → S3.
2. Push job vào BullMQ `video-encoder` queue.
3. Worker (`apps/ffmpeg-proccessor` hoặc processors trong feature) pull job.
4. FFmpeg transcode → multi-bitrate.
5. Bento4 segment thành HLS/DASH.
6. Upload segments + manifest → S3.
7. Sync sang CDN qua `features/synchronizer/core/cdn-synchronizer/`.

## Entity liên quan

- `lesson-video.entity.ts` — metadata video lesson.
- `lesson-video-translation.entity.ts` — i18n caption/title.
- `livestream-session.entity.ts` — livestream sessions.
