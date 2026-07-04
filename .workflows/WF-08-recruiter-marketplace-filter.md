# WF-08 · Recruiter marketplace — filter + rank theo track

- **Status:** undone
- **Repo:** backend (`mtp`) + frontend (`starci-academy`)
- **Effort:** L
- **Phụ thuộc:** WF-02 (shape `userJobReadiness` — done)
- **Owner:** (chưa gán)

## Mục tiêu
Cho recruiter/nhà tuyển dụng LỌC + XẾP HẠNG ứng viên theo TRACK (khóa/domain), dùng `tracks[].depthScore` / `isQualified` / `band` từ `userJobReadiness` — đây là "trả công" cho lớp 2 (per-track card) của mô hình công bằng: học càng nhiều track, diện phủ (số filter khớp) càng rộng, nhưng KHÔNG có điểm gộp nào phồng lên.

## Vì sao
Mô hình 3 lớp (xem `00-INDEX.md` §"Mô hình chốt") mới dừng ở chỗ TÍNH điểm đúng; chưa có nơi nào THẬT SỰ dùng nó để tạo giá trị cho recruiter. Nếu không có surface này, per-track depth chỉ là số hiển thị profile — không đóng vòng lặp "học thêm khóa → xuất hiện trong nhiều tìm kiếm hơn". Đây cũng là điểm kiểm tra sống cho luật vàng: xếp hạng PHẢI nằm TRONG 1 track, không được trộn nhiều track thành 1 điểm chung.

## Phạm vi
1. **BE — query lọc/rank ứng viên:**
   - Ground: `openToWorkUsers` (talent query hiện có — theo `TalentMarketplace`/landing sample xem `[[landing-illustrative-card-as-mini-web-showcasemockup]]`) + `JobReadinessService`/`userJobReadiness` (`src/features/api/core/graphql/queries/users/job-readiness/job-readiness.service.ts`).
   - Thêm arg lọc theo `courseId`/`track` (domain) cho query recruiter (tên đề xuất `talentCandidates` hoặc mở rộng `openToWorkUsers` — quyết định khi implement, ưu tiên KHÔNG phá query cũ).
   - Rank = `ORDER BY depthScore DESC` **CHỈ TRONG track đã lọc** — cấm cộng/trộn `depthScore` của nhiều track thành 1 số duy nhất để sort toàn cục.
   - Trả kèm `band`/`isQualified` để FE hiện badge (không chỉ số thô).
2. **FE — UI marketplace:**
   - Filter control (track/domain picker — theo `[[single-select-among-options-use-tabs]]` nếu single-select, hoặc multi-select chip nếu chọn nhiều track).
   - List/card ứng viên hiện: track đã lọc + depth/band CỦA TRACK ĐÓ (không hiện 1 điểm tổng).
   - Khi đổi track filter → re-rank (client nếu payload đủ field, hoặc query lại nếu cần server-side pagination).
3. **Docs:** cập nhật `00-INDEX.md` khi xong (đổi status).

## Acceptance criteria
- [ ] Recruiter lọc theo ≥1 track/domain, danh sách trả về đúng những user có track đó (`isQualified` hoặc có `depthScore`).
- [ ] Rank trong danh sách = `depthScore` CỦA ĐÚNG TRACK đang lọc — KHÔNG có phép cộng/trung bình nhiều track.
- [ ] Đổi track filter → thứ tự đổi theo track mới (không giữ nguyên thứ tự cũ).
- [ ] FE hiện `band`/`isQualified` (không chỉ số thô) — theo tinh thần "không phô số vô nghĩa" ([[progress-block-growing-quantity-headline-not-vanity-strip]]).
- [ ] `tsc` + eslint sạch cả 2 repo; invariant test WF-01 (nếu chạm `JobReadinessService`) vẫn xanh.

## Rủi ro / lưu ý
- **Bẫy fairness lớn nhất:** dễ bị yêu cầu thêm "sort theo tổng điểm mọi track" cho tiện UI recruiter — đây chính là composite gộp đã bị cấm ở WF-01/WF-02. Phải từ chối/redirect sang "chọn 1 track để sort" hoặc "hiện nhiều cột riêng, không gộp".
- Cần xác nhận `openToWorkUsers` hiện có đang trả field gì (agent trước từng thêm `points`/`roleTitle`/`githubUsername` cho landing rồi revert — xem `[[landing-sample-card-static-not-api]]`) trước khi mở rộng, tránh phá contract cũ.
- Phạm vi UI marketplace thật (nếu khác `TalentMarketplace` landing hiện tại) cần xác nhận route/feature đích trước khi code — chưa có trang "recruiter search" thật trong FE tại thời điểm viết brief này (cần research khi bắt đầu).
