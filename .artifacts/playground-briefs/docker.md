# Docker Playground — Guided Path Brief (20 steps, 0-easy → 19-advanced)

Target: `.mount/data/courses/2-devops-mastery/playgrounds/0-docker/steps/`
All steps are **terminal** steps (fields: title · body · commandHint · verifyResourceKind · verifyResourceNamePattern · verifyExpectedStatus).

Existing 5 steps are KEPT as the easy foundation, renumbered/lightly reworded into this arc:
old `0-run-first-container` → new 0 · old `4-list-all-containers` → new 1 · old `1-build-image-from-dockerfile` → new 5 · old `2-layer-cache-rebuild` → new 7 (merged with `.dockerignore`) · old `3-volume-and-port-mapping` → new 8.

Sandbox scaffold dependency notes for the Author phase:
- Steps 5-7, 16 assume a `Dockerfile` (+ a `Dockerfile.multistage` for step 16) already exists in the sandbox working dir.
- Step 12-13 assume a `docker-compose.yml` (2+ services) already exists in the sandbox working dir.
- Container/image names are namespaced `starci-demo*` throughout so verify-name-pattern matching stays unambiguous.

---

0. `run-first-container`
   - title (vi): Chạy container đầu tiên
   - goal (vi): Khởi động một container Nginx nền (detached) với tên `starci-demo`.
   - commandHint: `docker run -d --name starci-demo nginx`
   - verify: Container · namePattern `starci-demo` · status `Running`

1. `list-all-containers`
   - title (vi): Kiểm tra lại mọi container
   - goal (vi): Liệt kê toàn bộ container (kể cả đã dừng) để xác nhận `starci-demo` vẫn tồn tại.
   - commandHint: `docker ps -a`
   - verify: Container · namePattern `starci-demo` · status `Running`

2. `view-container-logs`
   - title (vi): Xem log container
   - goal (vi): Xem log stdout/stderr của `starci-demo` để kiểm tra Nginx đã khởi động thành công.
   - commandHint: `docker logs starci-demo`
   - verify: Container · namePattern `starci-demo` · status (empty — existence/log check only)

3. `exec-into-container`
   - title (vi): Vào bên trong container
   - goal (vi): Chạy một lệnh bên trong container `starci-demo` đang sống để kiểm tra phiên bản Nginx.
   - commandHint: `docker exec -it starci-demo nginx -v`
   - verify: Container · namePattern `starci-demo` · status `Running`

4. `stop-and-remove-container`
   - title (vi): Dừng và xoá container
   - goal (vi): Dừng rồi xoá hẳn container `starci-demo` bằng một lệnh duy nhất.
   - commandHint: `docker rm -f starci-demo`
   - verify: Container · namePattern `starci-demo` · status (empty — resource removed)

5. `build-image-from-dockerfile`
   - title (vi): Build image từ Dockerfile
   - goal (vi): Build một image từ `Dockerfile` trong thư mục hiện tại, gắn tag `v1`.
   - commandHint: `docker build -t starci-demo:v1 .`
   - verify: Image · namePattern `starci-demo:v1` · status (empty)

6. `tag-image-version`
   - title (vi): Gắn tag phiên bản cho image
   - goal (vi): Gắn thêm tag `latest` cho image `starci-demo:v1` vừa build, không build lại từ đầu.
   - commandHint: `docker tag starci-demo:v1 starci-demo:latest`
   - verify: Image · namePattern `starci-demo:latest` · status (empty)

7. `layer-cache-rebuild`
   - title (vi): Dùng .dockerignore & build lại
   - goal (vi): Thêm `.dockerignore` rồi build lại image tag `v2`, quan sát layer cache tăng tốc build.
   - commandHint: `docker build -t starci-demo:v2 .`
   - verify: Image · namePattern `starci-demo:v2` · status (empty)

8. `volume-and-port-mapping`
   - title (vi): Volume & port mapping
   - goal (vi): Chạy container mới có mount volume và map port 8081 ra port 80 của container.
   - commandHint: `docker run -d --name starci-demo-vol -p 8081:80 -v starci-vol:/usr/share/nginx/html nginx`
   - verify: Container · namePattern `starci-demo-vol` · status `Running`

9. `env-vars`
   - title (vi): Truyền biến môi trường
   - goal (vi): Chạy container mới truyền biến môi trường `APP_ENV=production` vào bên trong.
   - commandHint: `docker run -d --name starci-demo-env -e APP_ENV=production nginx`
   - verify: Container · namePattern `starci-demo-env` · status `Running`

10. `bind-mount-local-folder`
    - title (vi): Bind mount thư mục local
    - goal (vi): Chạy container mới bind-mount thư mục `./html` trên máy host vào `/usr/share/nginx/html`.
    - commandHint: `docker run -d --name starci-demo-bind -v $(pwd)/html:/usr/share/nginx/html nginx`
    - verify: Container · namePattern `starci-demo-bind` · status `Running`

11. `connect-containers-network`
    - title (vi): Kết nối container qua network
    - goal (vi): Tạo network riêng rồi kết nối container `starci-demo-vol` vào network đó.
    - commandHint: `docker network create starci-net && docker network connect starci-net starci-demo-vol`
    - verify: Network · namePattern `starci-net` · status (empty)

12. `compose-up-multi-container`
    - title (vi): Compose up — chạy multi-container
    - goal (vi): Dùng `docker compose up -d` để khởi chạy nhiều container cùng lúc theo `docker-compose.yml`.
    - commandHint: `docker compose up -d`
    - verify: Container · namePattern (empty — compose-prefixed names vary) · status `Running`

13. `compose-logs-and-down`
    - title (vi): Xem log & tắt compose
    - goal (vi): Xem log tổng hợp rồi tắt toàn bộ stack bằng `docker compose down`.
    - commandHint: `docker compose down`
    - verify: Container · namePattern (empty) · status (empty — stack removed)

14. `healthcheck`
    - title (vi): Thêm healthcheck cho container
    - goal (vi): Chạy container mới có khai báo `--health-cmd` để Docker tự kiểm tra sức khoẻ định kỳ.
    - commandHint: `docker run -d --name starci-demo-health --health-cmd="curl -f http://localhost || exit 1" --health-interval=5s nginx`
    - verify: Container · namePattern `starci-demo-health` · status `Running`

15. `restart-policy`
    - title (vi): Đặt restart policy
    - goal (vi): Chạy container mới với `--restart unless-stopped` để tự khởi động lại khi Docker restart.
    - commandHint: `docker run -d --name starci-demo-restart --restart unless-stopped nginx`
    - verify: Container · namePattern `starci-demo-restart` · status `Running`

16. `multi-stage-build`
    - title (vi): Multi-stage build — image nhỏ gọn
    - goal (vi): Build image bằng Dockerfile multi-stage để có kích thước nhỏ gọn hơn, tag `slim`.
    - commandHint: `docker build -t starci-demo:slim -f Dockerfile.multistage .`
    - verify: Image · namePattern `starci-demo:slim` · status (empty)

17. `resource-limits`
    - title (vi): Giới hạn tài nguyên (CPU/RAM)
    - goal (vi): Chạy container mới giới hạn tối đa 256MB RAM và 0.5 CPU.
    - commandHint: `docker run -d --name starci-demo-limit --memory=256m --cpus=0.5 nginx`
    - verify: Container · namePattern `starci-demo-limit` · status `Running`

18. `image-prune-cleanup`
    - title (vi): Dọn dẹp image thừa (prune)
    - goal (vi): Xoá toàn bộ image "dangling" không còn container nào dùng tới.
    - commandHint: `docker image prune -f`
    - verify: Image · namePattern (empty — any dangling image) · status (empty)

19. `inspect-format`
    - title (vi): Inspect & format kết quả
    - goal (vi): Dùng `docker inspect --format` để trích xuất đúng trường `State.Status` dạng JSON.
    - commandHint: `docker inspect --format='{{json .State.Status}}' starci-demo-limit`
    - verify: Container · namePattern `starci-demo-limit` · status `Running`
