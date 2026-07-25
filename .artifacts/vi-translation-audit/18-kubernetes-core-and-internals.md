# Audit dịch VI — 18-kubernetes-core-and-internals

Tầng 3 (verify đối nghịch + tổng hợp) trên findings thô tầng 1+2. Đối chiếu từng snippet với file gốc trên đĩa + rule `terminology-bold.md` §2 (polysemy) và §5 (bẫy false-positive). Mặc định nghi ngờ false-positive, chỉ giữ finding có bằng chứng chắc chắn từ nội dung thật.

## Bảng finding CONFIRMED

| Lesson | Type | Severity | Snippet | Sửa |
|---|---|---|---|---|
| 0-pods-and-deployments | bold-inline-code | high | `**\`strategy.rollingUpdate\` (\`maxUnavailable: 0\`, \`maxSurge: 1\`)** định cách đổi version...` (dòng 163) | Bỏ `**` bọc ngoài; giữ nguyên inline-code: `` `strategy.rollingUpdate` (`maxUnavailable: 0`, `maxSurge: 1`) `` định cách đổi version... |
| 0-pods-and-deployments | bold-inline-code | high | `**\`readinessProbe httpGet /healthz\`** là điều kiện...` (dòng 163) | Bỏ `**`, giữ inline-code thường. |
| 0-pods-and-deployments | bold-adhoc | high | `- **Docker Engine / Docker Desktop** đang chạy, cùng **\`kind\`** và **\`kubectl\`** đã cài...` (dòng 190) | "Docker Engine / Docker Desktop" không phải jargon Loại 3, không nằm closed-list §3A → bỏ bold ad-hoc. Bỏ `**` quanh `kind`/`kubectl` (inline-code). |
| 0-pods-and-deployments | bold-inline-code | high | `- **Windows:** dùng **\`Invoke-RestMethod\`** thay cho **\`curl\`**...` (dòng 191) | Nhãn "Windows:" không nằm closed-list §3A → bỏ bold. Bỏ `**` quanh `Invoke-RestMethod`/`curl`. |
| 0-pods-and-deployments | bold-adhoc | high | `**Pod — đơn vị deploy nhỏ nhất, và vòng đời của nó.**` + bold rải `**Pending**`/`**Running**`/`**Succeeded**`/`**Failed**`/`**Unknown**`, `**\`restartPolicy\`**`, `**kubelet**`, `**controller**` trong cùng đoạn (dòng 463) | Bỏ bold trùm câu mở đầu + bold Loại 1/2/enum giữa văn xuôi (đưa Pending/Running/... về inline-code nếu cần nhấn, KHÔNG bold). Chỉ giữ **ephemeral** (jargon Loại 3). |
| 0-pods-and-deployments | bold-adhoc | high | `**\`restartPolicy\` và self-healing là hai cơ chế khác tầng, làm bởi hai chủ thể khác nhau**...` (dòng 15) | Bold trùm cả câu key-takeaway VÀ lấn inline-code `restartPolicy` — bỏ hết, để văn xuôi thường. |
| 0-pods-and-deployments | bold-adhoc | high | `**\`spec.replicas: 3\` là "desired state" — số bản sao bạn MONG MUỐN, không phải lệnh chạy một lần.**` (dòng 160) | Bỏ bold trùm câu + lấn inline-code; có thể giữ **desired state** bold riêng nếu coi là jargon Loại 3. |
| 1-services-and-ingress | bold-inline-code | high | `- **\`selector: app: web-blue\`** là toàn bộ "liên kết"...` (dòng 140) | Bỏ `**` quanh inline-code, giữ backtick. |
| 1-services-and-ingress | bold-inline-code | med | `- **\`ingressClassName: nginx\`** quyết định **controller nào** xử lý Ingress này.` (dòng 176) | Bỏ `**` quanh inline-code VÀ bỏ bold quanh "controller nào" (Loại 2 "controller" bị bold giữa văn xuôi — cấm §3B.2). |
| 2-configmaps-secrets-and-volumes | bold-inline-code | high | `- **\`emptyDir: {}\`** là volume rỗng tạo cùng Pod và **mount vào cả hai container**...` (dòng 183) | Bỏ `**` quanh inline-code VÀ bỏ bold ad-hoc quanh "mount vào cả hai container". |
| 3-namespaces-rbac-and-quotas | bold-inline-code | high | `- **\`ResourceQuota.spec.hard\`** đặt trần cho **tổng** toàn namespace...` (dòng 168) | Bỏ `**` quanh inline-code VÀ bỏ bold ad-hoc quanh "tổng" (từ Loại 1 phổ thông). |
| 6-node-runtime-kubelet-kube-proxy-cri | bold-inline-code | med | `- **\`crictl\`** (CRI debug CLI...)` (dòng 155) | Bỏ `**`, chỉ giữ inline-code `crictl`. |
| 9-admission-controllers-and-extensions | bold-inline-code | med | `Plugin phổ biến: **\`neat\`** ..., **\`tree\`** ..., **\`who-can\`** ..., **\`ctx\`/\`ns\`** ...` (dòng 566) | *Sửa mô tả so với finding thô*: cả 4 plugin đều bị bold+backtick đồng nhất (KHÔNG có ca thiếu backtick như finding thô mô tả) — nhưng vi phạm cốt lõi (bold quanh inline-code) vẫn đúng cho cả 4. Bỏ hết `**`, giữ backtick thường: `neat`, `tree`, `who-can`, `ctx`/`ns`. |
| 9-admission-controllers-and-extensions | bold-inline-code | med | `- **\`kyverno\` CLI** + **\`krew\`** (\`kubectl krew install <plugin>\`).` (dòng 205) | Bold lấn cả chữ "CLI" ngoài code — tách: `kyverno` CLI + `krew`, không bold. |
| 8-csi-and-storage-lifecycle | bold-loai12 | high | `**CSI architecture — controller + node + sidecar.** CSI là spec gRPC định nghĩa 3 service: **Identity** (...), **Controller** (...), **Node** (...).` (dòng 396) | Bỏ bold trùm câu tiêu đề + bold rải Loại 2 (controller, node, sidecar, service) giữa văn xuôi — chỉ giữ inline-code cho method (`CreateVolume`...). |
| 9-admission-controllers-and-extensions | bold-loai12 | high | `**Operator pattern — controller-runtime + Reconcile loop.** Operator là CRD + controller pair. **Controller** sub là K8s controller-manager pattern...` (dòng 525) | Bỏ bold trùm tiêu đề bullet + bold từ Loại 2 "Controller" đơn lẻ giữa câu; áp mật độ bold §8 (bold lần đầu mỗi lesson) cho jargon còn lại. |
| 0-pods-and-deployments (challenge `2-selector-collision-and-ownership-forensics-hard`) | no-diacritics | low | `...cho thấy cả hai Deployment nay đều đủ đúng số \`replicas\`...` (dòng 76 VÀ dòng 109, lặp y hệt) | "nay" (thời gian) sai chính tả — phải là "này" (chỉ định quay lại "cả hai Deployment" đã nhắc). Sửa cả 2 chỗ. |
| module-wide (SSOT §6/§8) | bold-inline-code | high | Mẫu hình lặp lại xuyên suốt 10 `bodies/0-agnostic/vi.md`: bold quanh tên field/CLI trong backtick hoặc quanh tên phần mềm dạng list-label (Docker Engine, Windows:, kind, kubectl, helm, crictl, kyverno, krew, jq, kubebuilder, cert-manager...) trong mục "Điều kiện cần trước" và bullet giải thích field. | Vi phạm HỆ THỐNG — cần 1 đợt sweep nesting-safe (§6) bỏ `**` quanh mọi inline-code + nhãn ad-hoc trong toàn bộ 10 lesson bodies. Challenges hiện SẠCH pattern này (chỉ dính lỗi chính tả riêng lẻ như finding "nay"/"này" ở trên). |

## Số finding bị drop

**0/18 bị drop.** Toàn bộ 18 finding thô đều được xác nhận là vi phạm thật sau khi đọc lại nguyên văn file trên đĩa và đối chiếu §2/§5.

Ghi chú riêng: finding #13 (plugin `neat`/`tree`/`who-can`/`ctx`/`ns`) được GIỮ nhưng đã sửa lại phần mô tả — bản thô nói "neat/who-can bị bold không backtick, tree/ctx/ns có backtick" nhưng đọc lại dòng 566 thật thì **cả 4 đều bold+backtick đồng nhất**, không có sự khác biệt như mô tả. Vi phạm cốt lõi (bold quanh inline-code) vẫn đúng nên không drop, chỉ sửa mô tả nguyên nhân cho khớp thực tế.

Không phát hiện bẫy false-positive đã biết trong §5 nào bị lặp lại ở batch này (không có case "phân mảnh"/"source code"/"chuỗi tự do"/"mục đích" bị đổi nhầm) — toàn bộ 18 finding đều thuộc nhóm bold-kỹ-thuật (inline-code/ad-hoc/Loại-1-2) hoặc lỗi chính tả, không liên quan polysemy §2.

## Verdict

**CẦN SỬA NHIỀU** — vi phạm bold-quanh-inline-code lặp lại có hệ thống trên ít nhất 7/10 lesson bodies của module (rõ nhất: 0-pods, 1-services, 2-configmaps, 3-namespaces, 6-node-runtime, 8-csi, 9-admission), cần một đợt sweep nesting-safe riêng theo §6 thay vì sửa tay từng chỗ.
