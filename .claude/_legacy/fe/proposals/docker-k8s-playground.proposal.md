# Proposal — Docker Playground + Kubernetes Playground (2 tuyến mới, mirror RAG Playground)

> Thầy: *"thêm tính năng docker/k8s trong learn"* → hiểu sai lần 1 (agent CLI nối về máy học viên) → thầy sửa: *"thiết kế playground để tụi học trò học... gồm có RAG, docker, k8s"* → hiểu sai lần 2 (gắn vào challenge DevOps có sẵn) → thầy sửa: *"rag k8s docker có tuyến nội dung riêng"* → hỏi lại qua `AskUserQuestion`, thầy xác nhận: **giống RAG Playground THẬT đang có (công khai, không login, không gắn khóa/challenge)**. Dừng ở lưu proposal theo đúng yêu cầu — CHƯA prototype/build.

## Khuôn mẫu — RAG Playground thật (đọc source xác nhận, không đoán)
`src/modules/rag/public-rag-playground.service.ts` + `public-rag-playground-cleanup.service.ts` + `github-repo-import.service.ts` + entity `RagPlaygroundSessionEntity`:
- **PUBLIC, không đăng nhập** — session ẩn danh (`sessionId` client-generate), KHÔNG có `courseId`/`challengeId`/`contentId` (đứng hoàn toàn độc lập, không nested trong khóa nào).
- Import nội dung theo 4 kiểu (`sourceKind`): paste / upload / **sample** (kịch bản mẫu có sẵn) / github (import repo qua `GithubRepoImportService`) → index vào Qdrant collection ephemeral `playground-${sessionId}`.
- **Cron cleanup theo TTL** (`PublicRagPlaygroundCleanupService`) quét `lastAccessedAt` idle → tự dọn, tránh leak collection vĩnh viễn. Q&A turns KHÔNG persist (chỉ trong RAM qua `RagPlaygroundRunRegistryService`) — CHỈ session metadata persist.

**Đây là khuôn kiến trúc bắt buộc mirror** cho Docker Playground + Kubernetes Playground: public/ephemeral/TTL-cleanup/session-based, KHÔNG phải feature trong `/learn` gắn khóa học.

## `.mount` — tuyến nội dung riêng (mới, song song `courses/`)
Đề xuất `.mount/data/playgrounds/{docker,kubernetes}/scenarios/` — kịch bản mẫu (starter Dockerfile/compose.yaml cho Docker; starter Deployment+Service manifest cho K8s), mirror đúng vai trò `sourceKind: "sample"` của RAG Playground ("Repo mẫu"). Đây là **track content ĐỘC LẬP**, không thuộc `courses/<course>/...` nào — khớp đúng "tuyến nội dung riêng" thầy chốt.

## ⚠️ Khác biệt kỹ thuật CĂN BẢN vs RAG Playground — CHƯA giải, cần spike riêng
RAG Playground chỉ **INDEX văn bản** (đọc) — an toàn tuyệt đối, rẻ. Docker/K8s Playground phải cấp cho người dùng ẩn danh **1 môi trường THỰC THI thật** (`docker build/run`, `kubectl apply`) — khác hẳn cấp độ rủi ro:
- Cần sandbox cô lập mạnh — kiến trúc gần nhất đã nghiên cứu (WebSearch phiên brainstorm): **Play with Docker / Killercoda dùng Docker-in-Docker** để giả lập nhiều máy ảo trong 1 container, môi trường **ephemeral trên cloud của họ** (không đụng máy người dùng — đúng hướng "playground" thầy muốn, KHÁC hướng agent-nối-máy-học-viên tôi hiểu sai lần 1).
- Hạ tầng self-host tương đương **CHƯA có trong repo** — Judge0 hiện tại chỉ sandbox chạy SOURCE CODE (compile+run tight-scoped), không phải cấp toàn quyền Docker daemon/K8s API.
- Rủi ro cụ thể (ẩn danh + thực thi thật): đào coin, DoS lẫn nhau, container escape, spam tạo session vô hạn (tốn CPU/RAM/network thật — nặng hơn hẳn RAG Playground vốn chỉ tốn embedding).
- Cần trước khi build: giới hạn tài nguyên cứng/session (CPU/RAM/disk quota) · **không cho network egress** ra ngoài sandbox · TTL ngắn hơn RAG Playground (session tốn tài nguyên thật nên nên auto-kill sau 30-60 phút, không để "idle lâu" như RAG) · có thể cần rate-limit theo IP/captcha chống bot tạo hàng loạt session.

→ **Đây là quyết định hạ tầng lớn, ngoài phạm vi 1 layout-brainstorm** — cần 1 spike/nghiên cứu hạ tầng riêng (DevOps/infra chốt phương án cô lập + chi phí vận hành) trước khi cam kết build UI.

## Shape đề xuất (để bàn khi quay lại brainstorm chi tiết — CHƯA chốt)
- Route độc lập kiểu `/playground` (song song `/learn`, không nested) — hub chọn loại: RAG (đã có) · Docker · Kubernetes.
- Mỗi playground: (1) màn **SETUP** — chọn kịch bản mẫu (từ `.mount/data/playgrounds/<kind>/scenarios/`) hoặc dán Dockerfile/compose/manifest riêng, mirror UI import của RAG Playground · (2) màn **WORKSPACE** full-bleed — panel trạng thái container/pod thời gian thực + terminal/log (tinh thần Killercoda: browser terminal + status), phiên hết hạn tự dọn theo TTL.

## Files/thư mục liên quan khi build (chưa đụng — chỉ liệt kê để tra)
BE tham khảo: `src/modules/rag/public-rag-playground*.ts` · `src/modules/databases/postgresql/primary/entities/rag-playground-session.entity.ts` · `src/features/api/core/graphql/mutations/rag-playground/**`.
Content mới: `.mount/data/playgrounds/{docker,kubernetes}/scenarios/` (chưa tồn tại, cần tạo khi build).

## Trạng thái
⏳ **PENDING** — dừng ở lưu định hướng theo đúng yêu cầu thầy ("cứ lưu proposal lại đã"). CHƯA prototype, CHƯA thiết kế chi tiết UI/state matrix, CHƯA build gì.
**Việc tiếp theo** (khi thầy sẵn sàng đi tiếp): (1) spike hạ tầng sandbox Docker-in-Docker/kind-trong-container (chốt phương án cô lập + chi phí trước), (2) quay lại `/starci-fe-layout-brainstorm` dựng prototype UI đầy đủ (như đã làm cho RAG Playground/Mock Interview) SAU KHI (1) có hướng khả thi.
