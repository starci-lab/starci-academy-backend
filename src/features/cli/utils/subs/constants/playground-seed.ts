import type {
    PlaygroundSeedDefinition,
} from "../types"

/**
 * Seed data for the DevOps Mastery course's ("2-devops-mastery") playgrounds.
 * Consumed by the `playground-seed` CLI command — idempotent on
 * `playgrounds.slug` / `playground_steps.sortIndex`.
 */
export const PLAYGROUND_SEED_DEFINITIONS: ReadonlyArray<PlaygroundSeedDefinition> = [
    {
        slug: "docker",
        title: "Docker",
        description: "Chạy container, build image, và quản lý volume/port với Docker CLI thật.",
        icon: "🐳",
        steps: [
            {
                title: "Chạy container đầu tiên",
                body: "Khởi động một container Nginx nền (detached) với tên `starci-demo`.",
                commandHint: "docker run -d --name starci-demo nginx",
                verifyResourceKind: "Container",
                verifyResourceNamePattern: "starci-demo",
                verifyExpectedStatus: "Running",
            },
            {
                title: "Build image từ Dockerfile",
                body: "Build một image từ `Dockerfile` trong thư mục hiện tại, gắn tag `v1`.",
                commandHint: "docker build -t starci-demo:v1 .",
                verifyResourceKind: "Image",
                verifyResourceNamePattern: "starci-demo:v1",
                verifyExpectedStatus: null,
            },
            {
                title: "Layer cache — build lại",
                body: "Build lại image với tag `v2` và quan sát layer cache tăng tốc build.",
                commandHint: "docker build -t starci-demo:v2 .",
                verifyResourceKind: "Image",
                verifyResourceNamePattern: "starci-demo:v2",
                verifyExpectedStatus: null,
            },
            {
                title: "Volume & port mapping",
                body: "Chạy container mới có mount volume và map port 8081 ra port 80 của container.",
                commandHint: "docker run -d --name starci-demo-vol -p 8081:80 -v starci-vol:/usr/share/nginx/html nginx",
                verifyResourceKind: "Container",
                verifyResourceNamePattern: "starci-demo-vol",
                verifyExpectedStatus: "Running",
            },
            {
                title: "Kiểm tra lại mọi container",
                body: "Liệt kê toàn bộ container (kể cả đã dừng) để xác nhận `starci-demo` từ bước 1 vẫn còn.",
                commandHint: "docker ps -a",
                verifyResourceKind: "Container",
                verifyResourceNamePattern: "starci-demo",
                verifyExpectedStatus: "Running",
            },
        ],
    },
    {
        slug: "kubernetes",
        title: "Kubernetes",
        description: "Dựng cluster kind, quan sát self-healing, expose Service, và rolling update thật.",
        icon: "☸️",
        steps: [
            {
                title: "Dựng cluster kind",
                body: "Tạo một cluster Kubernetes cục bộ bằng `kind`.",
                commandHint: "kind create cluster --name starci-demo",
                verifyResourceKind: "Node",
                verifyResourceNamePattern: "",
                verifyExpectedStatus: "Ready",
            },
            {
                title: "Bare Pod vs self-healing",
                body: "Apply một Deployment rồi xoá thủ công một Pod trần để quan sát self-healing.",
                commandHint: "kubectl apply -f deployment.yaml && kubectl delete pod web-bare",
                verifyResourceKind: "Pod",
                verifyResourceNamePattern: "web-",
                verifyExpectedStatus: "Running",
            },
            {
                title: "Expose Service NodePort",
                body: "Expose Deployment `web` ra ngoài bằng một Service kiểu NodePort.",
                commandHint: "kubectl apply -f service.yaml",
                verifyResourceKind: "Service",
                verifyResourceNamePattern: "web",
                verifyExpectedStatus: null,
            },
            {
                title: "ConfigMap",
                body: "Apply một ConfigMap chứa cấu hình cho Deployment `web`.",
                commandHint: "kubectl apply -f configmap.yaml",
                verifyResourceKind: "ConfigMap",
                verifyResourceNamePattern: "web-config",
                verifyExpectedStatus: null,
            },
            {
                title: "Rolling update + rollback",
                body: "Cập nhật image của Deployment `web` rồi rollback về phiên bản trước.",
                commandHint: "kubectl set image deployment/web app=myapp:v2 && kubectl rollout undo deployment/web",
                verifyResourceKind: "Deployment",
                verifyResourceNamePattern: "web",
                verifyExpectedStatus: null,
            },
        ],
    },
]
