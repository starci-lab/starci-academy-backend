import { z } from "zod";
export * from "./fixed.js";

export const FieldKindSchema = z.enum([
  "text", "textarea", "number", "email", "tel", "url", "date", "datetime-local",
  "time", "select", "radio", "checkbox", "range", "color",
]);

export const FormOptionSchema = z.object({
  label: z.string().trim().min(1).max(240),
  value: z.string().max(500),
}).strict();

export const FormFieldSchema = z.object({
  id: z.string().trim().min(1).max(160),
  name: z.string().max(240).default(""),
  kind: FieldKindSchema,
  label: z.string().trim().min(1).max(500),
  description: z.string().max(1_000).default(""),
  section: z.string().max(300).default(""),
  required: z.boolean().default(false),
  multiple: z.boolean().default(false),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  step: z.number().positive().finite().optional(),
  maxLength: z.number().int().positive().max(20_000).optional(),
  options: z.array(FormOptionSchema).max(100).default([]),
}).strict();

export const FormSnapshotSchema = z.object({
  url: z.string().url().max(2_048),
  title: z.string().trim().min(1).max(500),
  description: z.string().max(2_000).default(""),
  fields: z.array(FormFieldSchema).min(1).max(250),
}).strict();

export const ProfileValueSchema = z.union([
  z.string().max(4_000), z.number().finite(), z.boolean(), z.array(z.string().max(1_000)).max(50),
]);
export const ProfileSchema = z.record(z.string().trim().min(1).max(160), ProfileValueSchema);

export const NormalDistributionSchema = z.object({
  fieldId: z.string().min(1).max(160),
  kind: z.literal("normal"),
  mean: z.number().finite(),
  standardDeviation: z.number().positive().finite(),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  integer: z.boolean().default(false),
}).strict();

export const CategoricalDistributionSchema = z.object({
  fieldId: z.string().min(1).max(160),
  kind: z.literal("categorical"),
  weights: z.record(z.string().max(500), z.number().nonnegative().finite()),
}).strict().refine((value) => Object.values(value.weights).some((weight) => weight > 0), {
  message: "At least one categorical weight must be greater than zero",
});

export const DistributionSpecSchema = z.discriminatedUnion("kind", [
  NormalDistributionSchema,
  CategoricalDistributionSchema,
]);

export const ProposalValueSchema = z.union([
  z.string().max(20_000), z.boolean(), z.array(z.string().max(2_000)).max(100),
]);
export const FillProposalSchema = z.object({
  fieldId: z.string().min(1).max(160),
  value: ProposalValueSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string().trim().min(1).max(800),
  source: z.enum(["profile", "prompt", "inference", "synthetic"]),
  requiresReview: z.boolean(),
}).strict();
export const FillProposalArraySchema = z.array(FillProposalSchema).max(250);

export const OpenSessionRequestSchema = z.object({ url: z.string().url().max(2_048) }).strict();
export const OpenSessionResponseSchema = z.object({
  sessionId: z.string().uuid(),
  form: FormSnapshotSchema,
}).strict();

export const AnalyzeRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  prompt: z.string().trim().min(1).max(8_000),
  mode: z.enum(["assist", "synthetic"]),
  distributions: z.array(DistributionSpecSchema).max(100).default([]),
  seed: z.string().trim().min(1).max(160).default("form-copilot"),
}).strict();

export const AnalyzeResponseSchema = z.object({
  runId: z.string().uuid(),
  formSnapshotId: z.string().uuid(),
  conversationId: z.string().uuid(),
  model: z.string(),
  cached: z.boolean(),
  proposals: FillProposalArraySchema,
  notices: z.array(z.string()),
}).strict();

export const SyntheticBatchRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(8_000),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  countMin: z.number().int().min(1).max(400),
  countMax: z.number().int().min(1).max(400),
  seed: z.string().trim().min(1).max(160).default("form-copilot-batch"),
}).strict().superRefine((value, context) => {
  if (value.countMin > value.countMax) context.addIssue({ code: "custom", path: ["countMax"], message: "countMax must be greater than or equal to countMin" });
  if (Date.parse(value.startAt) > Date.parse(value.endAt)) context.addIssue({ code: "custom", path: ["endAt"], message: "endAt must be after startAt" });
});

export const SyntheticBatchRowSchema = z.object({
  index: z.number().int().positive(),
  scheduledAt: z.string().datetime(),
  seed: z.string(),
  proposals: FillProposalArraySchema,
}).strict();

export const SyntheticBatchResponseSchema = z.object({
  batchId: z.string().uuid(),
  model: z.string(),
  planSummary: z.string(),
  plannedCount: z.number().int().min(1).max(400),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  rows: z.array(SyntheticBatchRowSchema).min(1).max(400),
  submitted: z.literal(false),
}).strict();

export const ApplyRequestSchema = z.object({ proposals: FillProposalArraySchema.min(1) }).strict();
export const ApplyResponseSchema = z.object({ applied: z.number().int().nonnegative(), skipped: z.number().int().nonnegative() }).strict();

export type FieldKind = z.infer<typeof FieldKindSchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type FormSnapshot = z.infer<typeof FormSnapshotSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type DistributionSpec = z.infer<typeof DistributionSpecSchema>;
export type FillProposal = z.infer<typeof FillProposalSchema>;
export type OpenSessionRequest = z.infer<typeof OpenSessionRequestSchema>;
export type OpenSessionResponse = z.infer<typeof OpenSessionResponseSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
export type SyntheticBatchRequest = z.infer<typeof SyntheticBatchRequestSchema>;
export type SyntheticBatchResponse = z.infer<typeof SyntheticBatchResponseSchema>;
export type ApplyRequest = z.infer<typeof ApplyRequestSchema>;
export type ApplyResponse = z.infer<typeof ApplyResponseSchema>;
