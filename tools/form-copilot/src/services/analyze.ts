import type { AnalyzeRequest, AnalyzeResponse, FillProposal } from "../domain/contracts.js";
import { proposalsFromDistributions } from "../domain/distribution.js";
import { assertRequestAllowed, validateProposal, type PolicyConfig } from "../domain/policy.js";
import { OpenRouterAgent } from "../agent/openrouter.js";
import { LocalStore } from "../storage/store.js";

function mergeProposals(ai: FillProposal[], synthetic: FillProposal[]): FillProposal[] {
  const merged = new Map(ai.map((proposal) => [proposal.fieldId, proposal]));
  for (const proposal of synthetic) merged.set(proposal.fieldId, proposal);
  return [...merged.values()];
}

export async function analyzeForm(
  request: AnalyzeRequest,
  policy: PolicyConfig,
  agent: OpenRouterAgent,
  store: LocalStore,
): Promise<AnalyzeResponse> {
  assertRequestAllowed(request, policy);
  const cacheKey = store.cacheKey(request, agent.model);
  const cachedProposals = store.getCached(cacheKey);
  const notices: string[] = [];

  let aiProposals: FillProposal[];
  let cached = false;
  if (cachedProposals) {
    aiProposals = cachedProposals;
    cached = true;
    notices.push("Đã dùng kết quả local cache vì form, prompt, profile và model không đổi.");
  } else if (agent.configured) {
    aiProposals = await agent.propose(request);
    store.setCached(cacheKey, agent.model, aiProposals);
  } else {
    aiProposals = [];
    notices.push("Chưa cấu hình OPENROUTER_API_KEY; chỉ tạo được dữ liệu synthetic đã khai báo.");
  }

  const synthetic = request.mode === "synthetic"
    ? proposalsFromDistributions(request.distributions, request.form.fields, request.seed)
    : [];
  const fields = new Map(request.form.fields.map((field) => [field.id, field]));
  const proposals = mergeProposals(aiProposals, synthetic).filter((proposal) => {
    const field = fields.get(proposal.fieldId);
    return field ? validateProposal(field, proposal) : false;
  });

  if (proposals.length === 0) notices.push("Không có đề xuất hợp lệ. Hãy bổ sung profile, prompt hoặc distribution.");
  const runId = store.saveRun(request, agent.model, proposals, cached);
  return { runId, model: agent.model, cached, proposals, notices };
}
