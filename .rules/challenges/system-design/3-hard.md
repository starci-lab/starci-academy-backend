# System Design Challenge - Level `hard`

**Production-grade design**. Thiết kế phải đưa lên production thật được: có observability, reliability, security, operability. On-call engineer đọc thấy "deploy được".

---

## 1. Mục đích

- Kiểm tra khả năng **đưa thiết kế lên production thật**, không chỉ "vẽ cho đẹp".
- Học viên tư duy như **backend engineer + SRE**: chuyện gì xảy ra khi app sập, DB chậm, deploy lỗi, region down?
- Đầu ra: design doc đầy đủ + runbook + sơ đồ multi-view + (tuỳ chọn) POC hạ tầng.

---

## 2. Nguyên tắc vàng - "Would on-call accept this design?"

Đề bài phải buộc học viên trả lời **CÓ** cho 5 câu:

1. **Observability**: log/metric/trace đủ để debug production?
2. **Reliability**: dependency down thì service fail gracefully?
3. **Security**: input sanitize, secret không leak, rate limit, authN/Z?
4. **Deployability**: CI/CD, Docker, healthcheck, graceful shutdown, migration?
5. **Operability**: có runbook, có SLO, có rollback plan?

Thiếu 1 nhóm -> chưa đạt `hard`, viết lại.

---

## 3. Yêu cầu bắt buộc

### 3.1. `requirements` - tối thiểu 4/5 nhóm

- **Observability**: structured JSON log với correlation-id, metrics (Prometheus-compatible), tracing, dashboard đề xuất.
- **Reliability**: timeout + retry + circuit breaker (nêu số cụ thể), graceful shutdown, idempotent cho endpoint ghi, dead-letter queue cho async.
- **Security**: authN (OAuth/JWT/session), authZ (RBAC/ABAC), rate limit (số cụ thể), secret management, input validation.
- **Data**: migration strategy (up/down + rollback), backup/restore RPO, transaction boundary cho flow ghi quan trọng, consistency model.
- **CI/CD**: Dockerfile multi-stage, compose dev, GitHub Actions workflow (lint/test/build/image), deploy strategy (blue-green / canary / rolling).

Đề bài phải **liệt kê cụ thể**:

- Tên metric, tên log field, tên header correlation-id.
- Ngưỡng timeout / retry count / circuit breaker threshold.
- SLO (availability %, p99 latency ms).

### 3.2. `steps`

- Số step: **5 - 7**.
- Step riêng cho: Observability / Reliability / Security / Data / CI-CD.
- Step cuối: **Failure scenarios** - liệt kê ≥ 3 kịch bản sập (DB down, broker down, region down, hot shard), đề xuất phản ứng.

### 3.3. `submissions` - docs + sơ đồ + runbook

- **Bắt buộc 2 submission**:
  - 1 `googleDocsUrl` - design doc + **runbook**. Format big-tech-lite: Context / Goals & Non-goals / Design / Observability / Reliability / Security / Rollout / Risks / Runbook.
  - 1 `drawioUrl` - **≥ 3 sơ đồ** trong cùng file: HLD, request flow (happy + failure path), deployment topology.
- **Tuỳ chọn** 1 `githubUrl` - IaC (Terraform/Helm) hoặc POC một component khó.
- `score` tổng: **60**.
- `prompts` binary, strict:
  - "Design doc có đủ 9 section theo format big-tech-lite; mọi ngưỡng (timeout/retry/SLO) có số cụ thể" -> ___ điểm.
  - "Runbook có ≥ 3 scenario (detect -> diagnose -> mitigate -> postmortem), mỗi scenario nêu alert/metric cụ thể cần xem" -> ___ điểm.
  - "Có ≥ 3 sơ đồ trong drawio (HLD + happy/failure flow + deployment); failure flow đánh dấu rõ điểm fail + cơ chế fallback" -> ___ điểm.
  - "Có ≥ 3 failure scenario chi tiết trong docs (DB/broker/region/hot shard), mỗi cái có phản ứng cụ thể + RPO/RTO nếu liên quan" -> ___ điểm.

---

## 4. CẤM - chấm **cực strict**

- CẤM `console.log` là observability - **0 prompt observability**.
- CẤM hardcode secret, kể cả trong ví dụ docs.
- CẤM ngưỡng mơ hồ kiểu "timeout hợp lý" - phải là số ms cụ thể.
- CẤM thiếu runbook - **0 prompt docs**.
- CẤM failure scenarios kiểu "nếu DB sập thì... xử lý" - phải nêu alert/metric + bước mitigate.
- CẤM sơ đồ thiếu failure path - **0 prompt sơ đồ**.

---

## 5. Checklist publish

- [ ] Đáp ứng ≥ 4/5 nhóm Observability/Reliability/Security/Data/CI-CD.
- [ ] Mọi ngưỡng có số cụ thể (timeout/retry/SLO).
- [ ] Runbook ≥ 3 scenario có detect/diagnose/mitigate.
- [ ] Drawio ≥ 3 sơ đồ (HLD + request flow + deployment).
- [ ] Failure scenarios chi tiết ≥ 3 kịch bản.
- [ ] `difficulty: hard`, `score = 60`, tổng `prompts.score = 60`.
- [ ] Đưa cho SRE đọc: "deploy được, không cần sửa thêm".
