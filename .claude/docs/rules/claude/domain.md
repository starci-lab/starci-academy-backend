# Domain — Claude Mastery (`4-claude-mastery`) — ⚠️ BRIEF (ĐỀ XUẤT, thầy chốt)

> **Trạng thái: TRỐNG** — 0 module, không meta, không content. Đây là **BRIEF đề xuất** hoàn toàn (chưa grounded gì) để thầy chốt khóa này LÀ GÌ + có nên tồn tại tách khỏi AI/LLM Mastery không, TRƯỚC khi gen.

## 1. Định vị (đề xuất — cần thầy chốt)
- **Giả thuyết:** khóa chuyên sâu **xây dựng với Claude / hệ sinh thái Anthropic** — khác `ai-llm-mastery` (LLM generic) ở chỗ đào sâu ĐÚNG Claude: API, tool use, MCP, agents, Claude Code, skills.
- **Rủi ro định vị:** dễ **trùng** `ai-llm-mastery` (prompt/API/agent). Cần thầy quyết ranh giới: (a) Claude Mastery = "dùng Claude như 1 sản phẩm/nền tảng" (Claude Code, MCP, skills, sub-agents, computer use) — thiên **tooling/workflow**; (b) ai-llm = engineering LLM generic. HOẶC gộp 2 khóa.

## 2. Bản đồ giáo trình ĐỀ XUẤT (nếu giữ hướng "xây với Claude")
| Cụm | Module đề xuất |
|---|---|
| **Claude API core** | messages-api-and-models · system-prompts-and-roles · structured-output-and-tool-use |
| **Tối ưu** | prompt-caching · extended-thinking · streaming · batch-and-cost |
| **Agent + tích hợp** | tool-use-and-agent-loops · mcp-model-context-protocol · sub-agents-and-orchestration |
| **Claude Code / workflow** | claude-code-basics · skills-and-slash-commands · hooks-and-automation |
| **Nâng cao** | computer-use · multimodal-vision · safety-and-guardrails |

## 3. Quy ước domain đề xuất
- **Lang:** agnostic / TS-Python (Anthropic SDK). Provider = **Claude only** ([[claude-api]] skill = nguồn model-id/pricing/param THẬT — KHÔNG bịa).
- **E2E:** gọi Claude API thật (require-creds `ANTHROPIC_API_KEY`) HOẶC minh hoạ qua Claude Code/MCP local.
- **Grounding CỨNG:** model IDs (Opus 4.8/Sonnet 5/Haiku 4.5...), pricing, param theo `claude-api` skill — đây là khóa dễ SAI model-id nhất nếu không bám nguồn.

## 4. Câu hỏi cho thầy (BẮT BUỘC chốt trước khi gen)
1. **Khóa này có tồn tại riêng không**, hay gộp vào `ai-llm-mastery`?
2. Nếu riêng: định vị (a) tooling/Claude-Code-workflow hay (b) Claude-API-engineering?
3. Đối tượng: dev muốn build sản phẩm trên Claude? hay power-user Claude Code?
4. Số module + có capstone (vd build 1 agent/MCP server thật)?

## 5. Cho gen/audit
- **KHÔNG gen được** tới khi thầy chốt §1/§4 (khóa trống hoàn toàn, rủi ro trùng ai-llm cao). Domain.md này = brief đặt câu hỏi định hướng, KHÔNG phải curriculum chốt.
