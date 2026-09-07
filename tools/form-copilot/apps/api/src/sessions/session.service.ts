import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { AnalyzeRequest, AnalyzeResponse, ApplyRequest, ApplyResponse, FillProposal, FormSnapshot, OpenSessionResponse, SyntheticBatchRequest, SyntheticBatchResponse } from "@form-copilot/contracts";
import { batchSafeSyntheticPlan, executeSyntheticPlan, generateDistributionProposals, generateSyntheticSchedule } from "../ai/distribution.js";
import { proposalsFromLocalProfile } from "../ai/local-profile.js";
import { OpenRouterService } from "../ai/openrouter.service.js";
import { BrowserService } from "../browser/browser.service.js";
import { appConfig } from "../config.js";
import { DatabaseService } from "../data/database.service.js";
import { PolicyService } from "../policy/policy.service.js";

@Injectable()
export class SessionService {
  constructor(
    @Inject(BrowserService) private readonly browser: BrowserService,
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(OpenRouterService) private readonly agent: OpenRouterService,
    @Inject(PolicyService) private readonly policy: PolicyService,
  ) {}

  async open(url: string): Promise<OpenSessionResponse> {
    this.policy.assertOrigin(url, "assist", appConfig.allowedOrigins, appConfig.syntheticOrigins);
    const opened = await this.browser.open(url);
    const form = this.policy.safeForm(opened.form);
    await this.database.upsertFormSnapshot(form);
    return { sessionId: opened.sessionId, form };
  }

  async scan(sessionId: string): Promise<FormSnapshot> {
    const form = this.policy.safeForm(await this.browser.scan(sessionId));
    await this.database.upsertFormSnapshot(form);
    return form;
  }

  async analyze(sessionId: string, request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const form = this.policy.safeForm(await this.browser.scan(sessionId));
    this.policy.assertOrigin(form.url, request.mode, appConfig.allowedOrigins, appConfig.syntheticOrigins);
    const formSnapshotId = await this.database.upsertFormSnapshot(form);
    let conversationId: string;
    try { conversationId = await this.database.ensureConversation(request.conversationId, formSnapshotId); }
    catch (error) { throw new BadRequestException(error instanceof Error ? error.message : "Invalid conversation"); }
    const priorTurns = await this.database.turns(conversationId);
    const cloudForm = this.policy.cloudProjection(form);
    const cacheKey = this.database.fingerprint({ cloudForm, request, priorTurns, model: this.agent.model });
    const cached = await this.database.cached(cacheKey);
    const notices: string[] = ["Profile matching được xử lý local; profile không được gửi sang OpenRouter."];
    let ai: FillProposal[];
    let cacheHit = false;
    if (cached) { ai = cached; cacheHit = true; notices.push("Đã dùng PostgreSQL cache vì context và prompt không đổi."); }
    else if (this.agent.configured && request.mode === "synthetic") {
      const plan = await this.agent.compileSyntheticPlan(cloudForm, request);
      ai = executeSyntheticPlan(plan, form.fields, request.seed);
      notices.push(`AI sampling plan: ${plan.summary}`);
      await this.database.cache(cacheKey, this.agent.model, ai);
    }
    else if (this.agent.configured) { ai = await this.agent.propose(cloudForm, request, priorTurns); await this.database.cache(cacheKey, this.agent.model, ai); }
    else { ai = []; notices.push("Chưa cấu hình OPENROUTER_API_KEY; chỉ dùng profile local và distribution."); }

    const localProfile = request.mode === "assist" ? proposalsFromLocalProfile(form.fields, await this.database.getProfile()) : [];
    const generated = request.mode === "synthetic" ? generateDistributionProposals(request.distributions, form.fields, request.seed) : [];
    const merged = new Map(ai.map((proposal) => [proposal.fieldId, proposal]));
    localProfile.forEach((proposal) => merged.set(proposal.fieldId, proposal));
    generated.forEach((proposal) => merged.set(proposal.fieldId, proposal));
    const fields = new Map(form.fields.map((field) => [field.id, field]));
    const proposals = [...merged.values()].filter((proposal) => { const field = fields.get(proposal.fieldId); return field ? this.policy.validateProposal(field, proposal) : false; });
    if (!proposals.length) notices.push("Không có đề xuất hợp lệ; bổ sung prompt, profile hoặc distribution.");
    const runId = await this.database.saveTurn(conversationId, request, this.agent.model, proposals, cacheHit);
    return { runId, formSnapshotId, conversationId, model: this.agent.model, cached: cacheHit, proposals, notices };
  }

  async syntheticBatch(sessionId: string, request: SyntheticBatchRequest): Promise<SyntheticBatchResponse> {
    const form = this.policy.safeForm(await this.browser.scan(sessionId));
    this.policy.assertOrigin(form.url, "synthetic", appConfig.allowedOrigins, appConfig.syntheticOrigins);
    if (!this.agent.configured) throw new BadRequestException("OpenRouter must be connected before compiling a synthetic batch plan");
    const formSnapshotId = await this.database.upsertFormSnapshot(form);
    const plan = batchSafeSyntheticPlan(await this.agent.compileSyntheticPlan(this.policy.cloudProjection(form), { prompt: request.prompt, mode: "synthetic", distributions: [], seed: request.seed }));
    const fields = new Map(form.fields.map((field) => [field.id, field]));
    const rows = generateSyntheticSchedule(request.seed, request.startAt, request.endAt, request.countMin, request.countMax).map((scheduled) => ({
      ...scheduled,
      proposals: executeSyntheticPlan(plan, form.fields, scheduled.seed).filter((proposal) => {
        const field = fields.get(proposal.fieldId);
        return field ? this.policy.validateProposal(field, proposal) : false;
      }),
    }));
    const batchId = await this.database.saveSyntheticBatch(formSnapshotId, this.agent.model, request, plan.summary, rows);
    return { batchId, model: this.agent.model, planSummary: plan.summary, plannedCount: rows.length, startAt: request.startAt, endAt: request.endAt, rows, submitted: false };
  }

  async apply(sessionId: string, request: ApplyRequest): Promise<ApplyResponse> {
    const form = this.policy.safeForm(await this.browser.scan(sessionId));
    this.policy.assertOrigin(form.url, "assist", appConfig.allowedOrigins, appConfig.syntheticOrigins);
    const fields = new Map(form.fields.map((field) => [field.id, field]));
    const valid = request.proposals.filter((proposal) => { const field = fields.get(proposal.fieldId); return field ? this.policy.validateProposal(field, proposal) : false; });
    if (!valid.length) throw new BadRequestException("No valid proposals to apply");
    return this.browser.apply(sessionId, valid);
  }

  screenshot(sessionId: string): Promise<Buffer> { return this.browser.screenshot(sessionId); }
  close(sessionId: string): Promise<void> { return this.browser.close(sessionId); }
}
