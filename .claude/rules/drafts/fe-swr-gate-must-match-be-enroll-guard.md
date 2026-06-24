# Draft — FE SWR gate phải khớp BE guard: bỏ `enrolled` khỏi key khi BE đã mở cho trial (2026-06-24)

- File/§ đích khi `/merge`: `starci-async`/`main.md` (SWR gating) + [[trial-preview-enrollment-optional]].
- Bối cảnh: bài FREE/đọc-thử, header hiện "2 thử thách" (từ `numChallenges` outline) nhưng tab Thử thách rỗng "Chưa có thử thách". Gốc: `useQueryChallengesSwr` gate SWR key `authenticated && enrolled && …` → user chưa enroll thì **query không chạy** → tab rỗng. Trái với chốt 2026-06-23 ([[trial-preview-enrollment-optional]]: BE đã gỡ `GraphQLMustEnrolledGuard` cho challenge/challenges/submissions → trial xem+nộp được).

## Luật (STRICT)
- **Khi BE gỡ enroll-guard cho 1 surface (mở cho trial), FE SWR hook của surface đó PHẢI bỏ `enrolled` khỏi điều kiện gate key** — nếu không, query không bao giờ fire cho non-enrolled → UI rỗng "ngầm" (không lỗi, không empty thật, chỉ là chưa fetch). FE gate phải **đồng bộ** với BE guard; lệch = data có mà không hiện.
- **Dấu hiệu:** 1 đại lượng đếm (header `numChallenges`, badge) hiện ra N nhưng list/tab tương ứng rỗng → nghi FE gate chặn fetch (enrolled/permission) trong khi nguồn đếm đi đường khác (outline/projection không gate).
- **Giữ login gate (`authenticated`)**, bỏ `enrolled`. Premium content vẫn được bảo vệ bằng **lock tab + content gate** (locked lesson → tab khoá, không mở tới query) nên bỏ `enrolled` KHÔNG lộ premium.
- Giữ `enrolled` trong **key array** (cache var) để refetch khi enroll đổi — chỉ bỏ khỏi **điều kiện gate** (tránh unused var + vẫn revalidate đúng).

## ĐÃ ÁP DỤNG 2026-06-24 (FE)
- Bỏ `&& enrolled` khỏi gate: `useQueryChallengesSwr` (list tab), `useQueryChallengeSwr` (solve 1 challenge), `useQueryChallengeSubmissionsSwr`, `useQueryChallengeSubmissionProgressSwr`. Giữ `authenticated` + `enrolled` trong key. tsc/eslint sạch.
- Caveat: nếu service BE submit/grade còn giả định enrollment (scope/attempt) thì trial nộp có thể lỗi runtime — cần làm service enrollment-optional (như `my-course-outline.handler` đã làm). Chưa runtime-test guest nộp.