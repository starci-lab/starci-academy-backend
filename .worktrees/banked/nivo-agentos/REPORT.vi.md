# AgentOS — hiện trạng và backlog hoàn thiện hai module

Phạm vi mới nhất của anh: **hoàn thiện AgentOS với đúng hai module — Chatbot và Kế toán — cùng các luồng nghiệp vụ của chúng**. Template App, Expert Academy, Scheduling, Knowledge Hub độc lập, Sales Copilot và các workbench SMB mở rộng để sau. Tri thức/tài liệu vẫn là năng lực dùng bên trong hai module.

Đã lập **17 workflow dự kiến** tại [ORDER.md](ORDER.md). Đây là kho việc để agent nhận sau, chưa phải 17 mission được chạy hay 17 bằng chứng sản phẩm hoàn tất.

## Kết luận nghiệp vụ

AgentOS đã có nền tảng đáng kể: mua/cấp phát workspace, quản lý module, Setup/Test/Apply, phiên hội thoại, desired state, controller jobs, tài liệu và recovery. Khoảng cách lớn hiện nay là **khép hành trình thật và kết nối kết quả nghiệp vụ**, không phải dựng lại tất cả từ đầu.

**Chatbot** có hai nhánh tên cần gom về một danh tính sản phẩm: `support-desk` đang nằm trong bộ module ban đầu và có setup/operations/test contracts; `multichannel-chatbot` vẫn được catalog resolve ở đường tương thích. Cả hai dùng kind `customer-support`, nhưng không đồng nghĩa là cùng một offer hay có cùng workbench. Đề xuất dùng contract giàu bằng chứng nhất làm nền rồi quyết định tên hiển thị và tương thích trong AG-001; không tự tạo thêm một chatbot thứ ba.

**Kế toán không bắt đầu từ số không.** `finance-copilot` đã có kind `accounting`, trường thiết lập nghiệp vụ, reply/task/tool contract và widget `nivo.finance-approval`. Tuy nhiên adapter thực thi hiện trả `FINANCE_EXTERNAL_MUTATION_NOT_OWNED`. Điều này chứng minh việc từ chối tác động ra ngoài, **chưa chứng minh có một luồng kế toán sử dụng được từ đầu đến cuối**. AG-011 cần nối contract đã chốt tới ghi nhận chứng từ, phân loại, duyệt, ghi sổ và đối soát thật.

Đề xuất MVP Kế toán để AG-001 cụ thể hóa: **nhận chứng từ → kiểm tra dữ liệu/nguồn → phân loại thu/chi → yêu cầu người có quyền duyệt → ghi sổ → đối soát/xem báo cáo → điều chỉnh có lịch sử**. Đây là phạm vi đề xuất, chưa phải quyết định về provider, chế độ kế toán hay tự động chuyển tiền. Không biến widget duyệt thành bằng chứng đã thanh toán.

## Cách đọc “đã làm”

| Nhãn | Ý nghĩa |
| --- | --- |
| Có source | Đã đọc thấy implementation ở checkout đã xác định; chưa suy ra chạy đúng. |
| Có test | Có test/spec tương ứng; phải xem nó thực sự thử gì. |
| Có receipt lịch sử | Phiên trước ghi nhận kết quả tại head đó; không tự áp sang head mới. |
| Đã vào main | Đã quan sát commit trong main; chưa đồng nghĩa đã push, serve hoặc walk. |
| Thiếu proof | Chưa có bộ bằng chứng đủ để kết luận flow hoàn chỉnh. |
| Khoảng trống xác nhận | Đã đọc thấy thiếu kết nối hoặc giới hạn cụ thể trong source. |

Không đưa ra phần trăm hoàn thành: tập yêu cầu cho **hai module** chưa được đóng thành coverage matrix hiện hành, và số file/API/test không phải số hành trình hoàn tất.

## Đã làm gì, còn gì

| Mảng | Đã có bằng chứng | Phần còn thiếu / cần kiểm lại | Workflow |
| --- | --- | --- | --- |
| Danh tính và ví | Core auth/OTP/reset, ví, thanh toán, top-up và các suite tương ứng hiện hữu | Chứng minh chuỗi đăng nhập → mua AgentOS → cấp phát, lỗi/compensation và nhiều workspace cùng tài khoản ở một delivery | AG-007 |
| Workspace control-centre | FE `7cff0ea` chứa return-to và xử lý null instance. Trong lúc kiểm kê, BE main tiến từ `fae6462e` tới `ca60f419`, chứa bản sửa nullable instance | Receipt git.publish của phiên gốc ghi nhận origin/main ca60f419 và các gate đã pass; không giao lại việc sửa. Còn kiểm lại API và Setup trên cặp head cuối | AG-002 |
| Module registry | Catalog và kind/workbench version/digest, bộ module khởi tạo và tương thích legacy | Chọn đúng hai offer Chatbot/Kế toán; danh tính Chatbot phải rõ; không xóa installation của kind tạm hoãn | AG-001, AG-008 |
| Setup | Private setup session, draft/context, gate registry, UI VI/EN | Kiểm input/gate từng module; bảo đảm Kế toán không bị bắt thỏa một Telegram gate không thuộc nghiệp vụ của nó | AG-006 |
| Test | Test run/assertion persistence, declarative sandbox và fixture contracts | Một số “e2e” chỉ đọc DDL hoặc đánh giá fixture. Cần Test từ API thật, chứng minh isolation và nguồn kết quả | AG-006, AG-019 |
| Apply/Live | `applySetup` yêu cầu completed setup và matching Test; Apply phát desired state/job, `liveEnabled=false` | `applyContextVersion` đi thẳng tới activate: cần chốt chính sách rollback/áp phiên bản và kiểm đường đi vòng. Chỉ mở Live sau đúng runtime acknowledgement | AG-006 |
| Chatbot nghiệp vụ | Customer-support adapter, conversation/task/session/event/action contracts và UI chat/workbench | Generic adapter chỉ trả `decisionRecorded=true`, `externalMutation=false`. Phải truy dedicated runner để nối nhận tin → trả lời → bàn giao → đóng hội thoại và chứng minh hiệu ứng thật | AG-009, AG-013 |
| Kế toán nghiệp vụ | `finance-copilot/accounting`, setup fields, approval widget; source families cho money/expense/price-list/completion đã có | Adapter hiện từ chối external mutation. Chưa có proof cho chuỗi chứng từ → duyệt → ghi sổ/đối soát của module. Cần contract, persistence, workbench và denial paths thống nhất | AG-001, AG-011 |
| Tri thức/chứng từ | Upload original/manifest, owned document verification, knowledge package và ingestion/recovery source | Hai gói nghề chỉ có hai tài liệu ngắn/gói; đường Module Studio AI đã đọc chưa gọi retrieval. Cần bổ sung nội dung và chứng minh agent dùng đúng tri thức, quyền, phiên bản và nguồn dữ liệu thật | AG-012 |
| Kênh và Execute | Channel APIs, controller outbox, reply/action service và các suite channel | Chọn kênh launch, thử đích test đã được cho phép; duplicate/retry/outage không tạo tin hoặc thao tác trùng; draft khác sent | AG-013 |
| Quyền truy cập app | HTTP và WebSocket upgrade của n8n kiểm launch session | Sau upgrade, socket forwarding đang không có kiểm thu hồi liên tục trong service đã đọc. Cần proof Stop/expiry/recovery đóng quyền đang mở | AG-014 |
| Recovery outer workspace | Business head `implemented` tại `c87accaf`, commit đã nằm trong BE main; source/quality/reconcile receipts trước đó | Chưa coi source proof là live recovery proof. Cần thí nghiệm nonproduction có phạm vi: retry 15 phút, stop wins, sync generation, replacement target, dữ liệu giữ ở Core | AG-015 |
| UX/UI Setup | Typography/muted contrast đã có commit trên FE main; deep-link walk từng pass một case | Hit-area owner release/consumer còn phải re-observe; phone reach UX-9, đủ trạng thái và golden chưa tự đóng từ một case | AG-003, AG-005 |
| Ranh giới nghiệp vụ | Business rules và code guards/action version/digest tồn tại | Kiểm phủ các ranh giới áp dụng cho Chatbot/Kế toán bằng API/tool calls, gồm cross-owner, tự duyệt, bằng chứng tiền, dữ liệu nhạy cảm và bàn giao | AG-018 |
| Bằng chứng cuối | Nhiều session, test và captures lịch sử | Phân loại static/unit/DB/API/browser/provider; chỉ dùng đúng lane để kết luận. Cần reconcile tại cặp head cuối với cả hai module | AG-019, AG-020 |

Xem [Second brain của hai module](SECOND-BRAIN.vi.md): lớp tri thức, nguồn cung cấp, quyền chia sẻ và khoảng trống triển khai đã quan sát.

## Ba luồng cần đóng

**Luồng nền:** tài khoản → ví/đơn AgentOS → cấp phát → workspace sẵn sàng → mở workspace → chọn một trong hai module → tạo/cài → Setup → Test đúng context → Apply → runtime nhận đúng phiên bản → Operate. Lỗi có trạng thái, owner và hành động tiếp; refresh/retry không đổi danh tính hay tính tiền lần hai.

**Chatbot:** kết nối kênh được chọn → nhận sự kiện một lần → nhận diện hội thoại/khách đúng workspace → lấy cấu hình/tri thức đã Apply → trả lời trong phạm vi → nếu thiếu quyền/bằng chứng thì bàn giao → người tiếp quản → kết thúc → giữ lịch sử/kết quả. Retry không phát tin trùng; trạng thái “đã gửi” cần acknowledgement thực tế. Giá, tiền, cam kết và dữ liệu người nhận phải có guard tương ứng.

**Kế toán (MVP đề xuất):** thiết lập đơn vị/tiền tệ/nguồn chứng từ/quyền duyệt → nhập chứng từ → kiểm tra thiếu/trùng/không khớp → phân loại thu/chi/công nợ → trình duyệt → ghi bản ghi sổ → đối soát → báo cáo/xuất dữ liệu → điều chỉnh có dấu vết. Phân biệt tiền đã nhận, doanh thu ghi nhận, hóa đơn và khoản khấu trừ; một yêu cầu không đủ chứng từ hoặc chưa được duyệt không được báo hoàn tất. Luật có hiệu lực theo thời gian phải được kiểm chứng ở mission thích hợp; báo cáo này không xác nhận quy định thuế hiện hành.

## Ưu tiên giao agent

1. **AG-001:** đóng hợp đồng hai module; rõ canonical Chatbot và phạm vi kế toán. **AG-002:** tiếp nhận kết quả phiên publish hiện có, không tạo sửa trùng. **AG-003:** xử lý package UI còn thiếu theo bằng chứng mới.
2. **AG-004/006/014:** fixture và flow matrix, cổng Test/Apply/Live, thu hồi quyền đang mở. **AG-005/007/008:** đủ khả năng sử dụng và nền mua/cài hai module.
3. **AG-009/011:** hoàn thiện Chatbot và Kế toán; **AG-012/013:** tri thức, chứng từ, kênh và Execute dùng chung.
4. **AG-015/018/019/020:** recovery, denial, API/browser proof và business reconciliation cuối.

Chatbot và Kế toán có thể được phân tích độc lập. Source writers dùng chung BE/FE vẫn phải giữ lease và chạy theo runtime, không ghi đồng thời cùng checkout.

## Bằng chứng và giới hạn

Kiểm kê ngày 05/09/2026, đọc source và receipt lịch sử; **không chạy lại product test, browser walk, seed, gửi tin hoặc thao tác cluster trong phiên này**. [evidence.json](evidence.json) giữ đường dẫn và SHA-256 của các tài liệu/source đầu vào; `bank.mjs freshness` phát hiện tài liệu thay đổi trong khi đang làm. File trong session lịch sử có thể tiếp tục được cập nhật, nên head/hash phải rebind khi kích hoạt.

Nguồn chính:

- [biz.md](D:/Repositories/nivo-backend/biz.md), [business.md](D:/Repositories/nivo-backend/business.md): product và luồng nghiệp vụ; những dòng lịch sử “chưa build” phải đối chiếu source mới.
- [Module catalog](D:/Repositories/nivo-backend/src/modules/bussiness/agentos-solution-modules/catalog/agentos-solution-module-catalog.service.ts), [studio manifests](D:/Repositories/nivo-backend/src/modules/bussiness/agentos-module-studio/catalog/runtime-manifests.ts): danh tính/module contracts.
- [Operations adapter](D:/Repositories/nivo-backend/apps/agentos-controlplane/src/module-operations/module-operation-adapter-registry.service.ts): accounting refusal và recorded-only behavior.
- [Studio service](D:/Repositories/nivo-backend/src/modules/bussiness/agentos-module-studio/agentos-module-studio.service.ts): Setup/Test/Apply/Live.
- [n8n access proxy](D:/Repositories/nivo-backend/apps/agentos-controlplane/src/n8n-access/n8n-access-proxy.service.ts): quyền ở upgrade và vòng chuyển tiếp socket.
- [Module evidence test](D:/Repositories/nivo-backend/src/tests/e2e/nivo/agentos-module-test-evidence.e2e-spec.ts), [module operations test](D:/Repositories/nivo-backend/src/tests/e2e/nivo/agentos-module-operations.e2e-spec.ts): giới hạn của lane hiện mang tên e2e.
- [Recovery model](../../businesses/features/agentos-workspace-recovery/model.json), [Setup reachability](../../../.claude/tests/evidence/20260905-nivo-reachability-fix.md), [phiên BE publication](../../sessions/20260905-102233-nivo-be-publish-reachability/state.json): trạng thái và provenance lịch sử.

Bank không thay business head, không tự xác nhận thiết kế, không thêm operator/route vào `.claude`. Mỗi workflow có goal draft, dependencies, acceptance, evidence, test targets, seed/cleanup boundary và hướng kích hoạt bằng runtime hiện hành. Xem [quy ước bank](../README.md).
