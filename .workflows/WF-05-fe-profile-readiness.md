# WF-05 · FE — section Job-Readiness ở profile công khai

- **Status:** ✅ done (2026-07-04 — nhánh `mtp`; hook/query/types + ProfileJobReadiness section (headline strongest track + foundation + per-track cards) + LabeledCard top overview + i18n 9 key vi/en; thay sạch bản composite CŨ 1 session trước lỡ commit lên main; tsc/eslint sạch)
- **Repo:** frontend (`starci-academy` — nhánh `mtp`)
- **Effort:** M
- **Phụ thuộc:** WF-02 (cần GraphQL shape mới: foundation + tracks[])
- **Owner:** (chưa gán)

## Mục tiêu
Section "Độ sẵn sàng đi làm" ở đầu tab Overview của profile công khai: **foundation strip + N track card**, headline = track mạnh nhất. Recruiter đọc được ngay "giỏi domain gì, sâu tới đâu".

## Vì sao
Đây là bề mặt recruiter nhìn. Phải hiện **per-track** (khớp cách recruiter lọc theo domain) + **breakdown từng track** (để công sức người-nhiều-khóa hiện ra, không bị 1 số nuốt).

## Phạm vi
1. **Clone trio** (mirror `userChallengeStrength`):
   - Hook `src/hooks/swr/api/graphql/queries/useQueryUserJobReadinessSwr.ts` (arg `userId`).
   - Query `src/modules/api/graphql/queries/query-user-job-readiness.ts` + đăng ký ở `queries/index.ts`.
   - Types `src/modules/api/graphql/queries/types/user-job-readiness.ts`.
2. **Section** `src/components/features/profile/PublicProfile/ProfileOverviewTab/ProfileJobReadiness/index.tsx` (copy mẫu `OverviewChallengeSkills`):
   - **Headline** = track mạnh nhất: `StatPair` "Fullstack 88" + band chip (`HighlightChip` tone theo band).
   - **Foundation strip** = coding percentile ("top 15% giải thuật").
   - **Track cards** = mỗi khóa 1 card: capstone/interview/CV bar (`SegmentBar`/`TopicMasteryGrid`) + band + badge nếu `isQualified`.
   - Link card → course.
3. **Ghép** vào `ProfileOverviewTab/index.tsx` qua `LabeledCard`, đặt ĐẦU Overview.
4. **AsyncContent:** skeleton mirror; empty (0 khóa) = con đường "1 khóa đưa bạn tới jobReady" — KHÔNG "chưa có gì"; error retry.
5. **i18n** `messages/vi.json` + `en.json` namespace `jobReadiness.*` (khớp key 2 file).

## Acceptance criteria
- [ ] Profile hiện foundation + track cards; headline = track mạnh nhất có tên domain.
- [ ] Người 1 khóa: card đầy đủ, không thua kém. Người 3 khóa: 3 card + badge — thấy diện rộng.
- [ ] Empty/loading/error đúng convention; `tsc` + eslint sạch; vi/en khớp key.

## Rủi ro / lưu ý
- Dùng `PublicProfile/` (KHÔNG `PublicProfileLegacy/`).
- Đợi WF-02 chốt shape GraphQL rồi mới khóa types.
