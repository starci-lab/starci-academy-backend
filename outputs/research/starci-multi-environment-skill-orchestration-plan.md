# Plan chuẩn hóa StarCi Skills cho Codex, Claude Code và Qwen Code

Ngày lập: 2026-09-11  
Trạng thái: đề xuất kiến trúc, chưa triển khai runtime  
Phạm vi: lớp thực thi skill và điều phối agent qua Orca

## 1. Kết luận điều hành

StarCi có hai execution plane tách biệt, nhưng dùng chung contract nghiệp vụ:

- `solo`: StarCi skill chạy trong **Codex hoặc Claude Code**, thực hiện tuần tự toàn bộ workflow gồm nhiều operation. Mỗi operation có trạng thái, gate và output riêng; một agent không đồng nghĩa một operation.
- `orchestrated`: **100% chạy qua Orca**. Orca tạo coordinator, task DAG và các worker worktree; Codex, Claude Code hoặc Qwen Code chỉ là execution environment của từng worker.

Skill không tự chọn trực tiếp CLI hay model. Skill lập `WorkflowRequest` gồm nhiều operation; mỗi operation phát ra `ExecutionRequest` chuẩn với capability, phạm vi sở hữu, dependency và điều kiện nghiệm thu. Resolver dùng yêu cầu này cùng inventory runtime để chọn profile. Trong solo, Codex/Claude chạy từng operation tuần tự trong worktree của workflow. Trong orches, Orca adapter tạo coordinator/workers và trả receipt chuẩn.

Luồng chuẩn:

```text
StarCi Skill
  -> WorkflowRequest [op-1 -> gate-1 -> op-2 -> ... -> final-gate]
  -> mode
     |- solo -> Codex/Claude workflow runner -> one workflow worktree
     `- orchestrated -> Orca Run/Task/Dispatch -> coordinator + worker worktrees
  -> per-operation Chain Resolver
  -> ExecutionReceipt[] + WorkflowReceipt
```

Điểm quan trọng nhất: solo là workflow tuần tự có thể resume, không phải prompt một phát. Cơ chế team/subagent có sẵn trong từng vendor không được dùng để biến solo thành orches ngầm. Khi cần song song, chia agent hoặc DAG, request phải chuyển sang `orchestrated` và Orca là nơi duy nhất lưu DAG, dispatch, câu hỏi, escalation, trạng thái hoàn tất và lịch sử fallback.

## 2. Điều thầy yêu cầu, diễn giải thành invariant

### 2.1 Ma trận vai trò

| Môi trường | Host solo workflow | Worker trong Orca orches | Cách khởi chạy khi orches |
|---|---:|---:|---|
| Codex | Có | Có | Managed agent adapter |
| Claude Code | Có | Có | Managed agent adapter |
| Qwen Code | Không trong scope v1 | Có | Command-terminal adapter |

Không môi trường nào được phép chạy trực tiếp trên primary checkout. Solo tạo một worktree cho toàn workflow, rồi chạy nhiều operation tuần tự trong đó. Orches tạo coordinator worktree và worker worktree qua Orca.

### 2.2 Một skill, nhiều môi trường

Không nhân bản ba bản `SKILL.md`. Một skill canonical mô tả nghiệp vụ, quyền sở hữu và output. Những khác biệt môi trường được đặt tại profile, resolver và adapter. Như vậy sửa quy tắc nghiệp vụ một lần, mọi môi trường nhận cùng một nghĩa.

### 2.3 Chain hai tầng

Mỗi operation có:

1. Thứ tự ưu tiên môi trường.
2. Chuỗi model/profile trong từng môi trường.

Ví dụ operation `backend-implementation`:

```yaml
environmentOrder:
  - codex
  - claude
  - qwen

environmentChains:
  codex:
    - profile: codex-gpt-5.6-sol-working
    - profile: codex-gpt-6-astra-working
  claude:
    - profile: claude-opus-4.1-working
    - profile: claude-sonnet-4.5-working
  qwen:
    - profile: qwen-qwen3.8-max-worker
    - profile: qwen-qwen3.8-flash-worker
```

Resolver flatten theo thứ tự xác định trước, nhưng chỉ giữ các candidate thỏa capability, runtime availability, quota, chính sách quyền và mode.

## 3. Các contract bắt buộc

### 3.1 WorkflowRequest

```yaml
apiVersion: starci.workflow/v1
kind: WorkflowRequest
metadata:
  workflowId: wf-agentos-backend-001
  project: nivo
spec:
  skill: starci
  mode: solo
  soloHost: codex
  source:
    repository: D:/Repositories/nivo-backend
    baseRef: origin/main
  operations:
    - id: inspect
      operation: requirements-inspection
      dependsOn: []
      gate: requirements-confirmed
    - id: design
      operation: backend-design
      dependsOn: [inspect]
      gate: design-valid
    - id: implement
      operation: backend-implementation
      dependsOn: [design]
      gate: focused-tests-green
    - id: verify
      operation: integration-verification
      dependsOn: [implement]
      gate: integration-green
```

### 3.2 ExecutionRequest của từng operation

```yaml
apiVersion: starci.execution/v1
kind: ExecutionRequest
metadata:
  requestId: req-agentos-accounting-001
  project: nivo
spec:
  skill: starci
  operation: backend-implementation
  mode: solo
  workflowId: wf-agentos-backend-001
  operationId: implement
  capabilityRequirements:
    - repository-edit
    - test-execution
    - worktree
  source:
    repository: D:/Repositories/nivo-backend
    baseRef: origin/main
  ownership:
    owns: [agentos-backend, agentos-tests]
  acceptance:
    - lint
    - typecheck
    - unit-tests
    - integration-tests
    - starci-validator
    - git-diff-check
  lifecycle:
    fallbackPolicy: safe-no-effect-only
    retainOnFailure: true
```

### 3.3 ResolvedExecution

Resolver phải xuất kết quả có thể audit, không chỉ trả tên model:

```yaml
apiVersion: starci.execution/v1
kind: ResolvedExecution
requestId: req-agentos-accounting-001
selected:
  environment: codex
  profile: codex-gpt-5.6-sol-working
  model: gpt-5.6-sol
  adapter: orca-managed-agent
candidates:
  - environment: codex
    profile: codex-gpt-5.6-sol-working
    eligible: true
  - environment: claude
    profile: claude-opus-4.1-working
    eligible: false
    reason: runtime-unavailable
```

### 3.4 ExecutionReceipt và WorkflowReceipt

Receipt là sự thật vận hành của một lần chạy, nhưng không được nhét vào SRS/SDS:

```yaml
apiVersion: starci.execution/v1
kind: ExecutionReceipt
requestId: req-agentos-accounting-001
runId: run-123
taskId: task-456
dispatchId: dispatch-789
worktree:
  id: wt-abc
  path: C:/Users/Hi/orca/workspaces/nivo-backend/accounting
  baseRef: origin/main
agent:
  environment: codex
  requestedModel: gpt-5.6-sol
  observedModel: gpt-5.6-sol
state: running
effectState: unknown
attempt: 1
```

Phải tách `requestedModel` và `observedModel`. Không quan sát được model thì để `unavailable`, tuyệt đối không suy diễn từ cấu hình mong muốn.

`WorkflowReceipt` chứa danh sách operation receipt theo thứ tự, gate đã qua, operation hiện tại và resume cursor. Khi Codex/Claude bị dừng, StarCi tiếp tục từ operation chưa hoàn tất thay vì chạy lại mù toàn workflow.

## 4. Lifecycle solo: workflow tuần tự nhiều operation

Solo chạy trong Codex hoặc Claude Code bằng StarCi skill và workflow runner:

1. Đọc bootstrap, route host/project và chọn workflow phù hợp.
2. Xác nhận goal, source of truth, phạm vi và acceptance của toàn workflow.
3. Tạo một worktree mới từ `baseRef`; ghi `WorkflowReceipt` ban đầu.
4. Duyệt operations theo thứ tự dependency.
5. Trước mỗi operation, resolver chọn profile/model hợp lệ cho host hiện tại.
6. Load đúng reference/skill cần cho operation, không tải toàn bộ tài liệu không liên quan.
7. Thực thi operation trong cùng workflow worktree.
8. Chạy gate của operation; ghi diff summary, test result và effect state vào receipt vận hành.
9. Gate đỏ thì sửa trong cùng operation hoặc dừng tại resume cursor; không nhảy sang operation sau.
10. Gate xanh mới chuyển sang operation kế tiếp.
11. Sau operation cuối, chạy integration gate toàn workflow.
12. Chỉ merge/push khi lifecycle policy và quyền người dùng cho phép.

Ví dụ workflow backend tối thiểu:

```text
inspect requirements
  -> validate SRS/SDS
  -> design operation
  -> implementation operation
  -> focused tests
  -> integration verification
  -> review
  -> merge gate
```

Solo không được sửa trên `main`, không được bỏ receipt, không được chạy hai operation có hiệu ứng đồng thời và không được tự fallback sau khi đã tạo hiệu ứng không rõ trạng thái. Nếu workflow phát hiện cần nhiều writer hoặc parallelism, nó phải dừng tại gate và đề xuất chuyển sang Orca orches.

## 5. Lifecycle orchestrated: bắt buộc qua Orca

`orchestrated` không có implementation path nào ngoài Orca. StarCi skill gửi `WorkflowRequest` cho Orca execution API; Orca dựng một coordinator worktree và N worker worktree:

```text
Coordinator worktree
  |- Accounting worker worktree
  |- Chatbot worker worktree
  `- Sales worker worktree
```

Coordinator sở hữu:

- task DAG và dependency;
- shared contract và file dùng chung;
- xử lý question/escalation;
- review diff và output của từng worker;
- merge tuần tự;
- regression gate cuối.

Worker chỉ sửa module/test thuộc phạm vi đã giao. Nếu cần đổi shared contract, worker gửi question/escalation; coordinator đánh giá và tự sửa phần dùng chung, sau đó thông báo contract mới cho các worker. Không để hai worker cùng sở hữu một shared file.

Mỗi dispatch phải chứa đủ:

- skill và operation;
- repository, base ref và worktree path;
- phạm vi được sửa và phạm vi cấm sửa;
- dependencies;
- source-of-truth cần đọc;
- acceptance commands;
- cách báo `question`, `escalation`, `worker_done`.

## 6. Adapter theo môi trường

### 6.1 Codex và Claude Code

Hai môi trường này dùng `orca worker-start` khi Orca đã quản lý trực tiếp agent/model. Adapter phải:

- tạo hoặc nhận worktree đã sẵn sàng;
- truyền model/profile cụ thể;
- gắn agent vào Task/Dispatch;
- quan sát model thực tế nếu runtime cung cấp;
- chuẩn hóa trạng thái về receipt.

### 6.2 Qwen Code

Orca hiện không hỗ trợ Qwen qua cờ model của managed worker giống Codex/Claude. Vì vậy Qwen dùng low-level command-terminal adapter:

1. `orca worktrees create`.
2. Chờ worktree sẵn sàng.
3. Tạo terminal trong worktree và chạy lệnh Qwen với model/profile cụ thể.
4. Chờ TUI ở trạng thái nhận input.
5. Dùng dispatch `--inject` để gửi prompt chuẩn.
6. Theo dõi terminal và chuẩn hóa kết quả thành cùng `ExecutionReceipt`.

Qwen phải dùng từng model như một candidate riêng. Không dùng fallback ẩn bên trong CLI vì nó làm Orca mất dấu model nào thực sự thực thi attempt.

### 6.3 Approval

Profile cần ghi approval mode rõ ràng, không dùng tên mơ hồ:

- Codex: policy do adapter map sang cờ CLI hỗ trợ.
- Claude: policy do adapter map sang permission mode tương ứng.
- Qwen: dùng `--approval-mode auto` cho tự động có kiểm soát; `yolo` chỉ khi operation cho phép rõ ràng.

Approval mode là capability/policy, không phải model. Resolver phải loại candidate không đáp ứng policy của operation.

## 7. Worktree policy

Orca và Git đều cho phép nhiều working tree dùng chung repository nhưng có HEAD, index và files riêng. Vì vậy:

- Task độc lập tạo từ `origin/main` hoặc base ref được request chỉ định.
- Task phụ thuộc chỉ tạo từ branch cha khi dependency thật sự cần code chưa merge.
- Quan hệ parent/child trong Orca dùng để trình bày và giám sát; không được mặc định coi parent worktree là Git base.
- Mỗi worker, kể cả worker chỉ review, vẫn có worktree riêng theo invariant của hệ thống này.
- Coordinator merge tuần tự, chạy regression sau mỗi merge để định vị lỗi chính xác.

## 8. Fallback an toàn

Fallback chỉ được phép khi attempt trước thỏa cả hai điều kiện:

1. Lỗi thuộc nhóm cho phép: runtime unavailable, model unsupported, quota/rate limit hoặc lỗi khởi tạo trước dispatch.
2. `effectState: none` được chứng minh.

Nếu `effectState` là `unknown` hoặc agent đã sửa file/chạy mutation, hệ thống dừng và yêu cầu coordinator reconcile. Không tự chạy model tiếp theo vì có thể tạo hai writer trên cùng một nghiệp vụ.

Mỗi retry phải tạo attempt mới và giữ linkage tới dispatch trước. Không sửa receipt cũ để giả như attempt đầu chưa tồn tại.

## 9. Cấu trúc source đề xuất

```text
.claude/
  SKILL.md
  profiles/
    registry.yaml
    codex.yaml
    claude.yaml
    qwen.yaml
  execution/
    contracts.mjs
    resolve.mjs
    create.mjs
    receipts.mjs
    adapters/
      orca-managed-agent.mjs
      orca-command-terminal.mjs
  schemas/
    execution-request.schema.json
    execution-receipt.schema.json
    profile-registry-v3.schema.json
  references/
    execution-solo.md
    execution-orchestrated.md
    environment-adapters.md
  scripts/
    execution.mjs
  tests/
    execution-resolve.spec.mjs
    execution-create.spec.mjs
    execution-fallback.spec.mjs
    execution-compatibility.spec.mjs
```

`SKILL.md` giữ ngắn: mô tả khi nào dùng, load order và invariant. Chi tiết mode/adapter chuyển vào `references/`; logic lặp lại và dễ sai chuyển vào script. Đây là cách progressive disclosure phù hợp với chuẩn thiết kế skill.

## 10. API/CLI chuẩn đề xuất

```powershell
node .claude/scripts/execution.mjs resolve --request request.yaml --json
node .claude/scripts/execution.mjs create --request request.yaml --json
node .claude/scripts/execution.mjs show --receipt receipt.yaml --json
node .claude/scripts/execution.mjs retry --receipt receipt.yaml --json
node .claude/scripts/execution.mjs release --receipt receipt.yaml --json
```

API nội bộ tương ứng:

```ts
resolveExecution(request, inventory): ResolvedExecution
createExecution(request, resolved): Promise<ExecutionReceipt>
retryExecution(receipt, inventory): Promise<ExecutionReceipt>
releaseExecution(receipt): Promise<ReleaseReceipt>
```

Không để skill gọi trực tiếp `orca`, `codex`, `claude` hay `qwen`. Mọi lần tạo agent phải đi qua API này để giữ cùng validation và audit trail.

## 11. Plan triển khai

### Giai đoạn 1 — Contract và registry v3

- Thêm `mode`, capability requirements và environment chains.
- Viết schema cho request, resolved result và receipt.
- Migrate registry hiện tại nhưng giữ adapter đọc v2 trong một revision chuyển tiếp.
- Test toàn bộ ma trận 3 môi trường x 2 mode.

Kết quả: resolver thuần, deterministic, chưa tạo process.

### Giai đoạn 2 — Solo workflow runner cho Codex/Claude

- Implement `WorkflowRequest`, operation cursor và gate state.
- Tạo một workflow worktree từ base ref rõ ràng.
- Chạy tuần tự nhiều operation trong Codex hoặc Claude.
- Hỗ trợ resume đúng operation và ngăn orches ngầm bằng native teams/subagents.

Kết quả: Codex và Claude chạy solo end-to-end, step-by-step, trên một worktree riêng.

### Giai đoạn 3 — Orca adapters, gồm Qwen command-terminal

- Implement low-level worktree + terminal + inject.
- Chuẩn hóa readiness và completion signal.
- Test riêng `qwen3.8-max` và `qwen3.8-flash` như hai candidate độc lập.

Kết quả: Orca có thể chọn Codex, Claude hoặc Qwen làm worker bằng cùng contract và receipt.

### Giai đoạn 4 — Orchestrated DAG

- Thêm coordinator node và worker nodes.
- Enforce ownership, dependency và shared-contract escalation.
- Review/merge tuần tự; regression sau từng merge.

Kết quả: Accounting, Chatbot và Sales có thể chạy song song dưới một coordinator.

### Giai đoạn 5 — Safe fallback

- Phân loại lỗi trước hiệu ứng/sau hiệu ứng.
- Ghi `effectState` và attempt lineage.
- Chỉ retry candidate kế tiếp khi `effectState:none`.

Kết quả: chain resolve không gây double-write.

### Giai đoạn 6 — Skill integration

- Rút gọn skill canonical.
- Thêm references cho solo, orches và adapters.
- Cập nhật host/project bootstrap để luôn gọi execution API.
- Không đưa execution evidence vào SRS/SDS; SRS/SDS tiếp tục là source of truth về nghiệp vụ và thiết kế.

### Giai đoạn 7 — Nghiệm thu

Chạy năm nhóm smoke test:

1. Codex solo.
2. Claude solo.
3. Orca orchestrated với Codex worker.
4. Orca orchestrated với Claude worker.
5. Orca orchestrated với Qwen worker.

Mỗi test phải chứng minh:

- worktree riêng được tạo;
- đúng model/profile được yêu cầu;
- observed model không bị bịa;
- task/dispatch linkage đầy đủ;
- worker chỉ sửa phạm vi sở hữu;
- fallback chỉ diễn ra khi chưa có effect;
- release/retain đúng policy;
- primary checkout không bị worker sửa trực tiếp.

Ước lượng kỹ thuật ban đầu: 7–12 giờ thực thi và kiểm thử tập trung, chưa tính sửa lỗi tích hợp phát sinh trong Orca runtime.

## 12. Quyết định kiến trúc cần chốt

Đề xuất chốt mặc định như sau:

1. Solo workflow chạy trong Codex/Claude; orches bắt buộc 100% qua Orca.
2. Cả solo và orches đều tạo worktree, nhưng solo dùng một worktree cho chuỗi operation còn orches dùng coordinator + worker worktrees.
3. Một canonical skill; không sao chép skill theo vendor.
4. Resolver hai tầng: môi trường trước, model/profile sau.
5. Codex/Claude dùng managed adapter; Qwen dùng command-terminal adapter.
6. Mỗi fallback model là một attempt hiển thị trong Orca.
7. Solo không dùng native team/subagent để chia writer; mọi orchestration nhiều agent phải chuyển qua Orca DAG.
8. Receipt vận hành nằm ngoài SRS/SDS.
9. Không fallback khi effect không được chứng minh là `none`.
10. Model ID luôn ghi đầy đủ như `gpt-5.6-sol`, `gpt-6-astra`, `qwen3.8-max`, không dùng biệt danh mơ hồ kiểu `sol-fresh`.

## 13. Nguồn chính

- [Orca Orchestration](https://www.onorca.dev/docs/cli/orchestration)
- [Orca Worktrees](https://www.onorca.dev/docs/model/worktrees)
- [Orca CLI Reference](https://www.onorca.dev/docs/cli/reference)
- [Orca Skills](https://www.onorca.dev/docs/cli/skills)
- [Git worktree documentation](https://git-scm.com/docs/git-worktree.html)
- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code agent teams](https://code.claude.com/docs/en/agent-teams)
- [Qwen Code model providers](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/model-providers/)
- [Qwen Code approval mode](https://qwenlm.github.io/qwen-code-docs/en/users/features/approval-mode/)
- [Qwen Code multi-agent coordination](https://qwenlm.github.io/qwen-code-docs/en/users/features/multi-agent-coordination/)
- [Qwen Code Task tool](https://qwenlm.github.io/qwen-code-docs/en/developers/tools/task/)
- [Qwen Code skills](https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/)
- [OpenAI model and agent guidance](https://developers.openai.com/api/docs/guides/latest-model)
