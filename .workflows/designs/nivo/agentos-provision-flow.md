<!-- starci-workflow: v2 -->

## plan

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | `nivo` |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | `nivo` / `@nivo/app` |
| Repo / branch | Frontend `D:\Repositories\nivo-fe` @ `session/surface-branch-and-dead-vocabulary`; Backend `D:\Repositories\nivo-backend` @ `main` |
| Purpose | Chốt hướng trải nghiệm cho luồng chọn gói → tạo request/order → thanh toán → chờ AgentOS provision qua K8s watch/Socket.IO → vào trang quản lý. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-provision-flow.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\ |

### Evidence

| Nguồn | Kết luận dùng cho thiết kế |
|---|---|
| `nivo-fe/apps/app/src/modules/api/console.ts` | Đã có `catalogItems`, `myCatalogOrders`, `myAgentWorkspace`, `myInstances`, `myPodOpenclawStatus`; status workspace/instance là `String!`, không được tự bịa enum UI. |
| `nivo-fe/apps/app/src/components/blocks/provisioning/FleetRow/index.tsx` | Có thể REUSE hàng resource và mapping tone `provisioning`/`ready`/`failed`; chưa đủ cho timeline nhiều mốc. |
| `nivo-fe/apps/app/src/components/layouts/ConsoleNav/index.tsx` | Destination `agentos` đang tồn tại nhưng `route: null`; cần route thật và owner page mới. |
| Backend `order-catalog-item` | `orderCatalogItem` tạo `PendingPayment` order + invoice; không tự provision ở thời điểm order. |
| Backend `/provisioning` gateway | Có room theo owner và các event `order.fulfilling`, `workspace.status`, `deployment.status`; payload có identity, status, reason và timestamp. |
| Backend realtime probe | K8s watcher → transition emitter → gateway → owner room đã có probe cho deployment status; đây là business truth để UI nghe, không polling thay thế. |
| Frontend runtime | `@nivo/app` hiện thiếu Socket.IO client, mutation catalog/payment, route AgentOS và management surface; đây là các backend/transport enabler phải ghi rõ trước Apply. |

### Product brief

Mục tiêu là làm cho người mua luôn biết ba điều: request đã được nhận chưa, hệ thống đang làm bước nào, và khi nào có thể vào quản lý. `ready` chỉ được coi là điểm chuyển trang khi identity workspace đã có, deployment đã Ready và pod check không từ chối; Socket.IO là kênh cập nhật nhanh, còn khi reconnect/đi vào lại trang thì GraphQL query là nguồn reconcile.

Các state bắt buộc: catalogue/loading/refused; xác nhận gói; order pending payment; payment accepted/fulfilling; workspace provisioning; K8s deployment watching; ready + management CTA; failed có reason và retry/support; socket disconnected/reconnected; người dùng rời trang rồi quay lại; event trùng hoặc đến sai thứ tự phải không làm lùi trạng thái.

### Direction matrix

| Proposal | Quyết định sản phẩm | Khi phù hợp |
|---|---|---|
| A — Một hành trình liên tục | Một trang dẫn từ chọn gói đến live timeline; giữ CTA duy nhất, tự mở quản lý khi đủ điều kiện. | Người mua mới, một workspace, cần cảm giác liền mạch. **Khuyến nghị mặc định.** |
| B — Provisioning center | Route riêng có thể quay lại; timeline là tài sản bền vững, cho phép rời trang và quay lại. | Provision lâu, người dùng cần làm việc khác, cần xem lại lịch sử mốc. |
| C — Command center | Split view: bên trái runtime snapshot, bên phải event stream; ưu tiên vận hành nhiều workspace và debug. | Người dùng power-user/operator; mật độ thông tin cao hơn. |

### Ownership / contract classification

| Surface | Phân loại | Ghi chú |
|---|---|---|
| `FleetRow` identity/kind/status | REUSE | Giữ vocabulary và tone hiện có. |
| Provision timeline | NEW | Quan hệ nhiều mốc và event order chưa có owner hiện tại. |
| Provisioning center route | NEW | `ConsoleNav` đã giữ destination nhưng chưa có route. |
| Order/payment mutation client | EXTEND | Thêm vào transport mutation riêng, không trộn vào read-only `console.ts`. |
| Socket.IO provisioning client | NEW | Kết nối `/provisioning`, subscribe owner room, dedupe/reconcile. |
| AgentOS management page | NEW | Chỉ mở sau readiness proof; không dùng URL giả trước khi backend trả endpoint/identity. |

### Proposal tracking

Preview root: `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\`  
PID: `6568`  
Port: `8084`  
Index: `http://127.0.0.1:8084/`

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| AgentOS provision flow r1 | http://127.0.0.1:8084/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\index.html` | `3E6ED8FBB0294CA0F901CB0F9122FDE2D62D6F10170ED8057C883A82C2AF9EB1` | `đang chờ chọn direction` |

| Direction | Tab | Status |
|---|---|---|
| A — Một hành trình liên tục | http://127.0.0.1:8084/proposal-a.html | `đang chờ` |
| B — Provisioning center | http://127.0.0.1:8084/proposal-b.html | `đang chờ` |
| C — Command center | http://127.0.0.1:8084/proposal-c.html | `đang chờ` |

| Proposal | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| A — Một hành trình liên tục | [mở proposal A](http://127.0.0.1:8084/proposal-a.html) | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\proposal-a.html` | `64B4B64C3D2188F371DDE82A467CCB3CA2147829A5A344A5AAB4BFC2AB4D7069` | `đang chờ` |
| B — Provisioning center | [mở proposal B](http://127.0.0.1:8084/proposal-b.html) | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\proposal-b.html` | `F0BCE758C95A6B622C0C37DABF75B638E46BE714AC35FE52E40A31D456659B01` | `đang chờ` |
| C — Command center | [mở proposal C](http://127.0.0.1:8084/proposal-c.html) | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\proposal-c.html` | `AB29EF8B5601F6E803F516CAD1E305ECB0FDFE190F216F45C145DBA3912D67EF` | `đang chờ` |

### OUTPUTS

| Concept | Result |
|---|---|
| Luồng provision AgentOS | Được đóng khung thành request/order → fulfillment → workspace/deployment watch → readiness → management. |
| Ba hướng sản phẩm | A liền mạch, B bền vững theo route, C operator command center; mỗi hướng có HTML responsive để so sánh. |
| Boundary backend/transport | Đã tách rõ phần UI có thể reuse với capability còn thiếu: payment/mutation, Socket.IO client, readiness contract và management route. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-provision-flow.md` | `added` — brief Plan bằng tiếng Việt, evidence, direction matrix, ownership, acceptance states và tracking. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\index.html` | `added` — trang chọn proposal. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\proposal-a.html` | `added` — hướng hành trình liên tục. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\proposal-b.html` | `added` — hướng provisioning center quay lại được. |
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\proposal-c.html` | `added` — hướng command center split view. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn hướng làm cơ sở cho Review | **A — Một hành trình liên tục (khuyến nghị)**; B — Provisioning center; C — Command center; hoặc yêu cầu phối hợp A+B. |

### WARNINGS

| Warning | Impact |
|---|---|
| `orderCatalogItem` hiện chỉ tạo PendingPayment order + invoice; flow “request → thanh toán → tạo” cần xác nhận mutation/payment boundary trước Apply. | Nếu coi order là đã provision ngay, UI sẽ hứa sai trạng thái thương mại. |
| Frontend hiện chưa có Socket.IO client và route AgentOS. | Proposal là evidence disposable; chưa phải production implementation. |
| Backend workspace status là `String!` và payload event có `reason` tự do. | Review phải chốt mapping status/terminal conditions dựa trên enum/runtime thật, không hardcode từ mock. |
| Có nhiều thay đổi chưa commit trong `nivo-fe` và `nivo-backend`. | Apply phải chụp baseline riêng và không được đưa thay đổi ngoài boundary vào diff. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Chưa có direction nào bị từ chối. |

### OWED

| Owed | Cleared by |
|---|---|
| Xác định proposal được chọn | Người dùng chọn A/B/C hoặc phối hợp A+B. |
| Chốt contract thanh toán và readiness | `$starci-fe-design-review` đối chiếu live GraphQL schema, payment flow, Socket.IO payload và management endpoint. |
| Đánh giá visual trên cùng viewport/locale/auth state | Mở các URL preview và phản hồi trước khi vào Review. |

Plan đã đủ evidence để mời `$starci-fe-design-review`; cần direction của người dùng trước khi chuyển tiếp.

## plan r2

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Chạy lại Plan, xác nhận preview HTML sống, giữ nguyên ba hướng và chuẩn bị lựa chọn cho Review. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-provision-flow.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\ |

### Rerun evidence

| Check | Result |
|---|---|
| Proposal index | `http://127.0.0.1:8084/` trả HTTP `200`. |
| Proposal A/B/C | Cả ba URL trả HTTP `200`; server PID `6568` vẫn chạy. |
| Preview integrity | `index.html` digest `3E6ED8FBB0294CA0F901CB0F9122FDE2D62D6F10170ED8057C883A82C2AF9EB1`; A/B/C giữ nguyên digest đã ghi ở plan trước. |
| Production source | Không thay đổi; chỉ workflow và disposable preview evidence. |
| Workflow validation | Record Nivo không còn lỗi schema. Global validator vẫn báo lỗi pre-existing ở `designs/starci-academy/learn-branch.md`; không sửa ngoài scope. |

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| AgentOS provision flow r1 | http://127.0.0.1:8084/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\index.html` | `3E6ED8FBB0294CA0F901CB0F9122FDE2D62D6F10170ED8057C883A82C2AF9EB1` | `đang chờ chọn direction` |

| Direction | Tab | Status |
|---|---|---|
| A — Một hành trình liên tục | http://127.0.0.1:8084/proposal-a.html | `đang chờ` |
| B — Provisioning center | http://127.0.0.1:8084/proposal-b.html | `đang chờ` |
| C — Command center | http://127.0.0.1:8084/proposal-c.html | `đang chờ` |

### OUTPUTS

| Concept | Result |
|---|---|
| Plan rerun | Đã xác nhận lại cùng brief và ba proposal, không tạo workflow record thứ hai. |
| Live evidence | Index và ba proposal đang mở được trên port `8084`. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-provision-flow.md` | `appended` — `plan r2` rerun evidence và kết quả validator. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn direction để chuyển sang `$starci-fe-design-review` | **A — Một hành trình liên tục (khuyến nghị)**; B — Provisioning center; C — Command center; hoặc phối hợp A+B. |

### WARNINGS

| Warning | Impact |
|---|---|
| Global validator còn lỗi cũ trong `starci-academy/learn-branch.md`. | Không thể tuyên bố toàn bộ workflow root xanh nếu chưa xử lý record cũ; record Nivo đã pass các rule của nó. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| None | None | Chưa có direction nào bị từ chối. |

### OWED

| Owed | Cleared by |
|---|---|
| Lựa chọn direction | Người dùng chọn A/B/C hoặc A+B. |
| Review backend/payment/readiness boundary | `$starci-fe-design-review` sau khi có direction. |

## plan r3

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Ghi nhận lựa chọn A+B: hành trình liên tục kết hợp sidebar theo dõi bước và khả năng rời/quay lại. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-provision-flow.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\ |

### Selected direction

| Decision | Result |
|---|---|
| Direction | **A+B — Hành trình liên tục + sidebar** |
| Reason | Giữ cảm giác “đã bắt đầu thì đi đến cùng”, đồng thời sidebar làm mốc định vị bền vững khi người dùng rời trang hoặc quay lại. |
| Rejected for this revision | C giữ lại cho operator console tương lai, nhưng không làm hướng chính vì quá thiên về hạ tầng và mật độ cao. |
| Copy correction | Không nói K8s, Socket.IO hay tên event với người dùng; chỉ nói Nivo đang chuẩn bị workspace và tiến trình được cập nhật trực tiếp. |

### Acceptance states

| State | Must show |
|---|---|
| Chọn gói / xác nhận | Gói, giá, bước hiện tại và CTA duy nhất. |
| Đã tạo request | Identity đơn hàng/workspace và mốc đã ghi nhận. |
| Đang chuẩn bị | Sidebar ở bước 3, timeline có mốc hiện tại, cho phép rời trang. |
| Quay lại | Rehydrate trạng thái hiện tại, không reset về loading giả. |
| Sẵn sàng | Bước 4 sáng lên và CTA vào quản lý workspace xuất hiện. |
| Lỗi / mất kết nối | Nói việc người dùng cần biết, giữ reason hữu ích, có đường quay lại hoặc thử lại; không lộ cơ chế nội bộ. |

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| AgentOS provision flow r1 | http://127.0.0.1:8084/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\index.html` | `3E6ED8FBB0294CA0F901CB0F9122FDE2D62D6F10170ED8057C883A82C2AF9EB1` | `đã chọn A+B` |

| Direction | Tab | Status |
|---|---|---|
| A+B — Hành trình + sidebar | http://127.0.0.1:8084/proposal-ab.html | `đã chọn` |
| A — Hành trình liên tục | http://127.0.0.1:8084/proposal-a.html | `đã từ chối làm hướng chính` |
| B — Provisioning center độc lập | http://127.0.0.1:8084/proposal-b.html | `đã từ chối làm hướng chính` |

### OUTPUTS

| Concept | Result |
|---|---|
| Selected direction | A+B được chọn làm brief chính cho Review. |
| Combined preview | Proposal hợp nhất đang chạy tại `http://127.0.0.1:8084/proposal-ab.html`. |
| User-facing language | Đã loại bỏ thuật ngữ K8s/Socket.IO/event khỏi copy hiển thị. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\proposal-ab.html` | `added` — preview hợp nhất hành trình + sidebar, responsive và không lộ cơ chế nội bộ. |
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-provision-flow.md` | `appended` — `plan r3`, lựa chọn A+B, acceptance states và rejection rationale. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Xác nhận chuyển brief A+B sang Review | **Có — mời `$starci-fe-design-review`**; hoặc yêu cầu chỉnh lại sidebar/copy trước Review. |

### WARNINGS

| Warning | Impact |
|---|---|
| Proposal A/B cũ vẫn được giữ làm evidence lịch sử. | Không dùng chúng làm Apply baseline; chỉ `proposal-ab.html` là hướng đã chọn. |
| Readiness và payment boundary chưa được Review chốt với live contract. | Review phải xác nhận điều kiện nào mới được mở management CTA. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| C — Command center làm hướng chính | Giữ làm hướng tương lai cho operator | Người dùng đã chọn A+B; C nói quá nhiều về hạ tầng cho luồng mua mới. |
| Copy “K8s đang dựng deployment / Socket.IO đang nhận workspace.status” | “Nivo đang chuẩn bị workspace / Tiến trình đang được cập nhật trực tiếp” | Người dùng yêu cầu không nói về code/cơ chế nội bộ. |

### OWED

| Owed | Cleared by |
|---|---|
| Review challenge brief A+B | `$starci-fe-design-review` đọc live contracts, states, ownership và boundary. |
| Chốt production file tree | Review phê duyệt exact boundary trước Apply. |

## plan r4

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo / @nivo/app |
| Repo / branch | Frontend D:\Repositories\nivo-fe @ session/surface-branch-and-dead-vocabulary; Backend D:\Repositories\nivo-backend @ main |
| Purpose | Sửa hierarchy theo feedback: hành trình A+B là flex row ở đầu nội dung; sidebar chỉ giữ navigation console. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-provision-flow.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ workflow này và D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\ |

### Revision evidence

| Decision | Result |
|---|---|
| Journey placement | Flex row ngang ở phía trên heading/content, có connector giữa 4 bước. |
| Sidebar ownership | Chỉ là navigation `Overview / Apps / AgentOS / Ví / Hỗ trợ`; không chứa journey step. |
| Responsive behavior | Flex row có thể scroll ngang trên viewport hẹp; sidebar thu về top navigation. |
| Selected preview | `proposal-ab-top-journey.html`, HTTP `200`, SHA-256 `D117F7E6DD301D4F80DC38EADC461742A2D5C3A48B71226B269085254757A258`. |

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| AgentOS provision flow r1 | http://127.0.0.1:8084/ | `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\index.html` | `3E6ED8FBB0294CA0F901CB0F9122FDE2D62D6F10170ED8057C883A82C2AF9EB1` | `đã chọn A+B, hierarchy revised` |

| Direction | Tab | Status |
|---|---|---|
| A+B revised — Journey flex row trên content + sidebar navigation | http://127.0.0.1:8084/proposal-ab-top-journey.html | `đã chọn` |
| A+B previous — Journey trong sidebar | http://127.0.0.1:8084/proposal-ab.html | `đã từ chối` |

### OUTPUTS

| Concept | Result |
|---|---|
| Hierarchy revision | Journey là flex row ngang ở đầu nội dung chính; sidebar không còn gánh trạng thái journey. |
| Combined direction | A+B vẫn giữ nguyên: hành trình liên tục + khả năng rời/quay lại. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\.previews\designs\nivo\agentos-provision-flow\r1\proposal-ab-top-journey.html` | `added` — revision hierarchy đã sửa. |
| `D:\Repositories\starci-academy-backend\.workflows\designs\nivo\agentos-provision-flow.md` | `appended` — `plan r4` ghi nhận feedback và revision. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chuyển revision A+B này sang Review? | **Có — mời `$starci-fe-design-review`**; hoặc yêu cầu chỉnh tiếp hierarchy/copy. |

### WARNINGS

| Warning | Impact |
|---|---|
| Preview cũ `proposal-ab.html` vẫn tồn tại để giữ lịch sử. | Không dùng preview cũ làm hướng triển khai. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Đặt journey trong sidebar | Flex row ngang ở đầu content | Sidebar là navigation; journey là tiến trình của flow. |

### OWED

| Owed | Cleared by |
|---|---|
| Xác nhận revision hierarchy | Người dùng mở `proposal-ab-top-journey.html`. |
| Review exact owner/state/file boundary | `$starci-fe-design-review`. |
