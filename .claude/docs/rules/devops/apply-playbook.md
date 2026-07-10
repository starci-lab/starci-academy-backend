# DevOps — Playbook chạy workflow thật (module + milestone + push + cleanup)

> Ghi lại các lệnh/pattern đã dùng thật trong đợt audit+apply 17 module Foundation+4Cloud (2026-07-10), để chạy lại lần sau chỉ cần gọi đúng pattern, không phải nghĩ lại từ đầu.

## 1. Module content — review → apply (đã có trong domain.md §5, nhắc lại ngắn)

```js
Workflow({ scriptPath: ".claude/docs/workflows/audit-devops-module.js",
  args: { module: "<slug>", stage: "review" } })   // giai đoạn 1 — an toàn, không chạm cloud
Workflow({ scriptPath: ".claude/docs/workflows/audit-devops-module.js",
  args: { module: "<slug>", stage: "apply", opus: true|false } })  // sau khi thầy duyệt review.md
```
- Batch nhiều module: viết 1 orchestrator script gọi `workflow({scriptPath:...}, {module, stage})` lồng trong `parallel()`, per-cloud cluster (AWS/GCP/Azure/DO) chạy song song, mỗi cluster batch 2 module/lần.
- Model theo cloud (thầy chốt 2026-07-10): AWS/GCP = Sonnet 5 (mặc định, không cần `opus`), DO/Azure = `opus: true`.

## 2. Fix-pass "e2e gap" — khi lesson đã DUYỆT LUÔN cũ nhưng còn `.e2e/*require-creds.md` dù key đã READY

**Bài học quan trọng:** nếu `review.md`/`decision.md` cũ nói "DUYỆT LUÔN"/"không cần sửa gì" TỪ TRƯỚC KHI có credential, agent Apply đọc thấy "không cần sửa" sẽ **bỏ qua luôn phần e2e** — không tự chạy lại dù key đã sẵn sàng. Phải launch riêng 1 fix-pass với `args.only` trỏ đúng lesson + `guidance` ra lệnh rõ:

```js
workflow({ scriptPath: ".claude/docs/workflows/audit-devops-module.js" },
  { module: "<slug>", stage: "apply", only: "<lesson1,lesson2>", opus: true|false,
    guidance: "BAT BUOC chay e2e THAT cho luong con require-creds, BO QUA verdict cu 'da xong' vi do la ruling TU KHI CHUA CO credential. KHONG tu them/bot challenge tier. BAT BUOC terraform destroy ngay sau verify." })
```
- Trước khi launch: `grep -rl "require-creds" .mount/data/courses/2-devops-mastery/modules/*/contents/*/.e2e/` để tìm hết lesson còn sót, lọc theo ngày sửa (tool `find -printf '%TY-%Tm-%Td'`) để phân biệt "chưa đụng tối nay" (chắc chắn cần fix) vs "có đụng nhưng vẫn require-creds" (cần đọc `.e2e` để biết có lý do chính đáng không, vd cần quyền org-admin/root).

## 3. Credential gate — HALT thật vs HALT giả (session-limit)

Nếu response `halted:true, reason:"missing-credentials"` xuất hiện **hàng loạt cùng lúc** kèm `<failures>` log "You've hit your session limit" — đó là **báo động giả**: agent `creds-check` bị lỗi vì hết quota Claude, KHÔNG phải thật sự thiếu key. Verify lại bằng cách tự chạy `verify-devops-creds.ps1` trực tiếp (không qua agent) trước khi kết luận.

**Gotcha env-cache:** nếu thầy vừa set credential mới (vd đổi sang root AWS) ở 1 terminal khác, process PowerShell mà tool gọi có thể vẫn thấy giá trị CŨ (cache từ lúc khởi động session, không tự đọc lại registry). Fix — refresh trực tiếp từ registry vào process hiện tại TRƯỚC khi gọi CLI (không in giá trị ra):
```powershell
$env:AWS_ACCESS_KEY_ID = [Environment]::GetEnvironmentVariable('AWS_ACCESS_KEY_ID','User')
$env:AWS_SECRET_ACCESS_KEY = [Environment]::GetEnvironmentVariable('AWS_SECRET_ACCESS_KEY','User')
# tương tự GOOGLE_APPLICATION_CREDENTIALS/ARM_*/DIGITALOCEAN_TOKEN khi đổi cloud khác
```
Bake đoạn refresh này vào `guidance` nếu nghi ngờ agent con cũng bị cache tương tự.

## 4. Milestone (capstone task) — 2 pass khác nhau, KHÔNG lẫn

Runner: `.claude/docs/workflows/fix-personal-project.js`. **Bắt buộc tự enumerate `taskDirs` bằng Bash trước** (runner từ chối tự ls bằng LLM — dễ sót):
```bash
find .mount/data/courses/<course>/milestones -mindepth 3 -maxdepth 3 -type d -path "*/tasks/*" | sort
```

**Pass A — chuẩn hoá cơ học** (split per-lang / accordion / terminology-bold), report-only:
```js
workflow({ scriptPath: ".claude/docs/workflows/fix-personal-project.js" },
  { course: "2-devops-mastery", stage: "review", taskDirs: [...] })
```
Lưu ý: DevOps milestone hầu hết KHÔNG cần split (nội dung là bash/HCL/YAML, không có "code theo ngôn ngữ" để tách 4-lang như Fullstack) — nếu review trả về toàn "KHÔNG SPLIT", đó là đúng, không phải bug.

**Pass B — chất lượng sư phạm** (runner KHÔNG có sẵn, phải tự viết inline Workflow script riêng — 1 agent/task, schema ép `{task, verdict, criteriaQuality, briefClarity, levelFit, findings}`, 4 câu hỏi: (1) criteria có neo bằng chứng quan sát được thật không hay chung chung, (2) brief có đủ thông tin để học viên làm được không, (3) độ khó có hợp vị trí trong lộ trình không, (4) có lỗi kỹ thuật/lạc hậu nào không (kiểu resource bị deprecate). Report-only, KHÔNG sửa file — findings substantive phải hỏi thầy trước khi áp dụng.

## 5. Push — 2+N repo riêng biệt, KHÔNG phải push 1 chỗ

`.mount/data` = repo Git RIÊNG (`github.com/starci-lab/data`), KHÔNG phải file thường trong backend repo. `.repo/devops-mastery-module-*` = MỖI module 1 repo riêng (`github.com/StarCi-Academy/devops-mastery-module-*`), có thể **thiếu remote `origin`** nếu repo chưa từng được wire (gặp thật 14/16 lần này) — check bằng `git remote -v`, nếu rỗng thì `git remote add origin https://github.com/StarCi-Academy/<dirname>.git` rồi push.

Trước khi push data repo: LUÔN `git fetch` + kiểm tra `git log --oneline HEAD..origin/main` — nếu có session khác đang chạy song song (rất có thể, do task list dùng chung), remote có thể đã đổi. Thử `git merge --no-commit --no-ff origin/main` trước — nếu 0 conflict marker thì an toàn commit+push; nếu có conflict thật, KHÔNG tự ý resolve mù, đọc kỹ từng file.

An toàn trước khi commit: `git status --short | grep -iE ".tfstate|.pem$|.key$|credentials|.env$"` phải RỖNG.

## 6. Cleanup 4 cloud cuối phiên — luôn quét lại, đừng tin log cũ

Dù mỗi lesson đã "destroy" theo log riêng, vẫn nên quét trực tiếp cuối phiên (đã bắt được 2 vụ rác thật lần này — Azure LB module cũ tháng 6, Azure SQL lesson chưa kịp destroy):
```powershell
# AWS
aws eks list-clusters; aws ec2 describe-instances --filters Name=instance-state-name,Values=running
# GCP
gcloud compute instances list; gcloud container clusters list; gcloud sql instances list
# Azure
az vm list; az aks list; az network lb list; az group list   # so với NetworkWatcherRG mặc định
# DigitalOcean
doctl compute droplet list; doctl compute load-balancer list; doctl kubernetes cluster list; doctl databases list
```
**Luôn kiểm tra tag/ngày tạo trước khi xoá** — không phải resource sống nào cũng là rác lab (gặp thật 1 cluster DO tạo từ 2 tháng trước, không tag `devops-mastery`, `ha:true` — dừng lại hỏi thầy thay vì xoá).

Xem thêm [[devops-lab-creds-provisioning]] (setup credential) + [[course-domain-docs]] §devops (runner + rule tổng).
