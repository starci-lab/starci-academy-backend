# Kế hoạch merge `mtp` → `main` + deploy prod

> Trạng thái 2026-07-04: đã push mtp (BE 2 commit + FE 1 commit). `main` **0 commit ahead** cả 2 repo → merge = **fast-forward, KHÔNG conflict**.

## ⚠️ QUAN TRỌNG — merge này mang NHIỀU workstream, không chỉ job-readiness
`mtp` gộp nhiều việc chưa có ở `main`. Merge = **tất cả lên prod cùng lúc**:
- **BE (5 commit ahead):** job-readiness/CV thống nhất · cart/checkout · payment/webhook · health · mock-interview grading · remove Byok lane · remove legacy flashcard-interview.
- **FE (6 commit ahead):** job-readiness/CV UI · cart UI · architecture atlas viz · …
→ **Quyết định release:** xác nhận MỌI workstream trên đã sẵn sàng prod (không chỉ của mình). Nếu 1 cái chưa sẵn → phải tách branch, KHÔNG merge cả cục.

## 4 migration sẽ chạy trên prod (THEO THỨ TỰ timestamp)
```
1721500000000-CreateMockInterviewAttempts      (mock-interview)
1721600000000-CreateCartAndTransactionItems    (cart)
1721700000000-UnifyCvGenerations               (job-readiness/CV — additive: cột source/score/courseId/…)
1721800000000-BackfillLegacyCvIntoUnified       (job-readiness/CV — copy legacy CV → unified; IDEMPOTENT)
```

## Trình tự (lockstep BE + FE)
```
1. Tạo PR mtp→main mỗi repo (CI chạy: build + tsc + test). KHÔNG merge tay bỏ qua CI.
2. Review PR (đặc biệt các workstream không phải mình: cart/payment/architecture).
3. Merge cả 2 PR (fast-forward hoặc merge-commit — thống nhất 1 kiểu).
4. Backup DB prod (snapshot trước migration).
5. Chạy 4 migration prod theo thứ tự trên.
6. Deploy BE (schema mới: uploadCv, job-readiness shape, cart, mock-interview…).
7. Deploy FE NGAY SAU (lockstep — FE select mode/source/score cần BE mới; FE cũ + BE mới hoặc ngược lại = vỡ).
8. Smoke test (mục dưới).
9. (Sau, verify OK) → WF-10 retire legacy CV.
```

## Smoke test sau deploy
- [ ] Profile job-readiness render (per-track cards + foundation + CV pillar).
- [ ] Dashboard JobReadinessWidget.
- [ ] Generate CV → ra score.
- [ ] Upload CV (presign→PUT→uploadCv) → poll ra score.
- [ ] Job-board headhunter gate vẫn theo bestCvScore (union unified+legacy — không ai rớt điểm).
- [ ] Cart/checkout flow (workstream khác).
- [ ] Mock-interview grading (workstream khác).

## Rollback / an toàn
- **Migration additive** (UnifyCvGenerations chỉ +cột nullable) → an toàn, không phá data cũ.
- **Backfill ghi data** nhưng **idempotent** (skip row đã có) → chạy lại được; rollback = xoá row `source=uploaded` được backfill (nếu cần).
- **Legacy CV vẫn nguyên** (WF-10 chưa chạy) → gate đọc `GREATEST(unified, legacy)` → rollback BE về bản cũ vẫn đọc được legacy.
- **KHÔNG chạy WF-10 (retire legacy)** cho tới khi: count-check prod khớp (mọi legacy attempt có row unified) + smoke test pass vài ngày.

## Ai làm gì (đề xuất)
- **Migration + deploy prod:** thầy/DevOps (em không SSH prod; nếu cần em soạn script `gh workflow`/VPS Ops qua skill `starci-debug-vps`, thầy bấm chạy).
- **Review PR các workstream:** owner từng session (cart/payment/architecture).
- **Verify backfill count + WF-10:** sau khi ổn định.
