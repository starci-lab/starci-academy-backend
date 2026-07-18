# Kubernetes playground — 20-step guided path brief

Course: `2-devops-mastery` · Playground: `1-kubernetes` · Steps folder: `.mount/data/courses/2-devops-mastery/playgrounds/1-kubernetes/steps/`

All 20 steps are TERMINAL steps (fields: title · body · commandHint · verifyResourceKind · verifyResourceNamePattern · verifyExpectedStatus). No RAG steps in this playground. Difficulty rises 0 (absolute beginner) → 19 (advanced). Steps 0, 2/3 (merged), 7, 8 reuse/adapt the 5 existing step files; the rest are new.

---

0. `0-create-kind-cluster` — **Dựng cluster kind**
   Goal: Tạo một cluster Kubernetes cục bộ bằng `kind`.
   commandHint: `kind create cluster --name starci-demo`
   verify: Node · pattern (empty) · status `Ready`
   (= existing `0-create-kind-cluster`, unchanged)

1. `1-get-nodes` — **Xem danh sách Node**
   Goal: Liệt kê các Node trong cluster để kiểm tra cluster đã sẵn sàng bằng `kubectl get nodes`.
   commandHint: `kubectl get nodes`
   verify: Node · pattern (empty) · status `Ready`

2. `2-run-bare-pod` — **Chạy một Pod trần**
   Goal: Tạo trực tiếp một Pod tên `web-bare` chạy image `nginx` (không qua Deployment).
   commandHint: `kubectl run web-bare --image=nginx`
   verify: Pod · pattern `web-bare` · status `Running`

3. `3-pod-vs-deployment-self-healing` — **Pod vs Deployment: tự hồi phục**
   Goal: Apply một Deployment `web` rồi xoá Pod của nó theo label để quan sát Kubernetes tự tạo Pod mới thay thế (self-healing).
   commandHint: `kubectl apply -f deployment.yaml && kubectl delete pod -l app=web`
   verify: Pod · pattern `web-` · status `Running`
   (adapted from existing `1-bare-pod-vs-self-healing`, renamed/renumbered, command tweaked to delete by label instead of a fixed pod name)

4. `4-scale-replicas` — **Tăng số bản sao (scale)**
   Goal: Tăng Deployment `web` lên 3 bản sao để chịu tải tốt hơn.
   commandHint: `kubectl scale deployment/web --replicas=3`
   verify: Deployment · pattern `web` · status (empty)

5. `5-labels-and-selectors` — **Gắn nhãn & chọn theo label**
   Goal: Gắn nhãn `tier=frontend` cho các Pod của `web` rồi liệt kê đúng các Pod đó bằng label selector.
   commandHint: `kubectl label pods -l app=web tier=frontend && kubectl get pods -l tier=frontend`
   verify: Pod · pattern `web-` · status `Running`

6. `6-clusterip-service` — **Expose Service ClusterIP**
   Goal: Expose Deployment `web` ra nội bộ cluster bằng một Service kiểu ClusterIP.
   commandHint: `kubectl expose deployment/web --port=80 --target-port=80 --name=web-internal`
   verify: Service · pattern `web-internal` · status (empty)

7. `7-expose-nodeport-service` — **Expose Service NodePort**
   Goal: Expose Deployment `web` ra ngoài bằng một Service kiểu NodePort.
   commandHint: `kubectl apply -f service.yaml`
   verify: Service · pattern `web` · status (empty)
   (= existing `2-expose-nodeport-service`, renumbered only)

8. `8-configmap` — **ConfigMap**
   Goal: Apply một ConfigMap chứa cấu hình cho Deployment `web`.
   commandHint: `kubectl apply -f configmap.yaml`
   verify: ConfigMap · pattern `web-config` · status (empty)
   (= existing `3-configmap`, renumbered only)

9. `9-secret` — **Secret**
   Goal: Tạo một Secret chứa thông tin nhạy cảm (mật khẩu database) cho Deployment `web`.
   commandHint: `kubectl create secret generic web-secret --from-literal=DB_PASSWORD=starci123`
   verify: Secret · pattern `web-secret` · status (empty)

10. `10-env-from-configmap-and-secret` — **Nạp biến môi trường từ ConfigMap & Secret**
    Goal: Cập nhật Deployment `web` để nạp biến môi trường từ `web-config` và `web-secret`.
    commandHint: `kubectl set env deployment/web --from=configmap/web-config --from=secret/web-secret`
    verify: Deployment · pattern `web` · status (empty)

11. `11-rolling-update` — **Rolling update**
    Goal: Cập nhật image của Deployment `web` sang phiên bản mới bằng chiến lược rolling update.
    commandHint: `kubectl set image deployment/web app=myapp:v2`
    verify: Deployment · pattern `web` · status (empty)
    (split off from existing combined `4-rolling-update-and-rollback`)

12. `12-rollback` — **Rollback về phiên bản trước**
    Goal: Hoàn tác Deployment `web` về revision trước đó khi bản mới lỗi.
    commandHint: `kubectl rollout undo deployment/web`
    verify: Deployment · pattern `web` · status (empty)
    (split off from existing combined `4-rolling-update-and-rollback`)

13. `13-readiness-and-liveness-probe` — **Readiness & Liveness probe**
    Goal: Apply Deployment `web` có cấu hình readiness/liveness probe để Kubernetes tự kiểm tra sức khoẻ Pod.
    commandHint: `kubectl apply -f deployment-with-probes.yaml`
    verify: Pod · pattern `web-` · status `Running`

14. `14-resource-requests-and-limits` — **Resource requests & limits**
    Goal: Apply Deployment `web` có khai báo requests/limits CPU-RAM để kiểm soát tài nguyên mỗi Pod.
    commandHint: `kubectl apply -f deployment-with-resources.yaml`
    verify: Pod · pattern `web-` · status `Running`

15. `15-namespace` — **Namespace**
    Goal: Tạo một Namespace riêng tên `starci-demo` để cô lập tài nguyên.
    commandHint: `kubectl create namespace starci-demo`
    verify: Namespace · pattern `starci-demo` · status `Active`

16. `16-job` — **Job chạy một lần**
    Goal: Tạo một Job chạy tác vụ một lần rồi chờ hoàn tất.
    commandHint: `kubectl create job data-migration --image=busybox -- echo done`
    verify: Job · pattern `data-migration` · status (empty)

17. `17-cronjob` — **CronJob định kỳ**
    Goal: Tạo một CronJob chạy tác vụ định kỳ mỗi phút để dọn log tạm.
    commandHint: `kubectl create cronjob log-cleanup --image=busybox --schedule="*/1 * * * *" -- echo cleaning`
    verify: Job · pattern `log-cleanup` · status (empty)
    (no CronJob kind in the supported verify enum; the CronJob's triggered Job — named `log-cleanup-<timestamp>` — is what gets checked, substring pattern `log-cleanup` matches)

18. `18-horizontal-pod-autoscaler` — **Horizontal Pod Autoscaler**
    Goal: Bật autoscale cho Deployment `web` để tự động tăng/giảm số Pod theo tải CPU.
    commandHint: `kubectl autoscale deployment/web --min=2 --max=5 --cpu-percent=80`
    verify: Deployment · pattern `web` · status (empty)
    (no HPA kind in the supported verify enum; verifies the Deployment the HPA controls)

19. `19-describe-and-logs-debugging` — **Debug bằng describe & logs**
    Goal: Dùng `kubectl describe` và `kubectl logs` để chẩn đoán vì sao Pod của Deployment `web` không chạy đúng.
    commandHint: `kubectl describe pod -l app=web && kubectl logs -l app=web`
    verify: Pod · pattern `web-` · status `Running`

---

## Migration note for Author phase
- Existing `1-bare-pod-vs-self-healing` splits into new step 2 (bare Pod) + step 3 (self-healing) — old folder should be removed once 2/3 exist.
- Existing `2-expose-nodeport-service` → renumber to folder `7-expose-nodeport-service` (content unchanged).
- Existing `3-configmap` → renumber to folder `8-configmap` (content unchanged).
- Existing `4-rolling-update-and-rollback` splits into new step 11 (rolling update only) + step 12 (rollback only) — old folder should be removed once 11/12 exist.
- `0-create-kind-cluster` stays at index 0, unchanged.
- vi.md authored first per step, en.md as faithful mirror, same field order.
