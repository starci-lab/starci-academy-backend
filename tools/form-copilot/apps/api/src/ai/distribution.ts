import type { DistributionSpec, FillProposal, FormField } from "@form-copilot/contracts";

export type SyntheticPlanRule =
  | { fieldId: string; strategy: "normal-option"; mean: number; standardDeviation: number; group: string; offset: number; reverse: boolean; orderedValues: string[]; rationale: string }
  | { fieldId: string; strategy: "categorical"; weights: Record<string, number>; rationale: string }
  | { fieldId: string; strategy: "constant"; value: string | boolean | string[]; rationale: string }
  | { fieldId: string; strategy: "omit"; rationale: string };

export interface SyntheticPlan { summary: string; rules: SyntheticPlanRule[] }
export interface SyntheticScheduleItem { index: number; scheduledAt: string; seed: string }

export function batchSafeSyntheticPlan(plan: SyntheticPlan): SyntheticPlan {
  return { ...plan, rules: plan.rules.filter((rule) => rule.strategy === "categorical" || rule.strategy === "normal-option") };
}

function randomSource(seed: string): () => number {
  let hash = 1_779_033_703 ^ seed.length;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3_432_918_353);
    hash = (hash << 13) | (hash >>> 19);
  }
  hash = Math.imul(hash ^ (hash >>> 16), 2_246_822_507);
  hash = Math.imul(hash ^ (hash >>> 13), 3_266_489_909);
  let state = (hash ^ (hash >>> 16)) >>> 0;
  return () => {
    let value = state += 0x6d2b79f5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function sampleSeededNormal(seed: string, mean: number, standardDeviation: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, sampleNormal(randomSource(seed), mean, standardDeviation)));
}

export function generateSyntheticSchedule(seed: string, startAt: string, endAt: string, countMin: number, countMax: number): SyntheticScheduleItem[] {
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) throw new Error("Invalid synthetic schedule window");
  if (!Number.isInteger(countMin) || !Number.isInteger(countMax) || countMin < 1 || countMax > 400 || countMin > countMax) throw new Error("Invalid synthetic batch count range");
  const random = randomSource(`${seed}:schedule`);
  const count = countMin + Math.floor(random() * (countMax - countMin + 1));
  return Array.from({ length: count }, (_, offset) => ({
    index: offset + 1,
    scheduledAt: new Date(start + Math.floor(random() * (end - start + 1))).toISOString(),
    seed: `${seed}:respondent:${offset + 1}`,
  })).sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt)).map((item, offset) => ({ ...item, index: offset + 1 }));
}

export function executeSyntheticPlan(plan: SyntheticPlan, fields: FormField[], seed: string): FillProposal[] {
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const groupSamples = new Map<string, number>();
  return plan.rules.flatMap((rule): FillProposal[] => {
    const field = fieldsById.get(rule.fieldId);
    if (!field || rule.strategy === "omit") return [];
    let value: FillProposal["value"];
    let detail: string;
    if (rule.strategy === "normal-option") {
      if (field.options.length < 2) return [];
      const allowedValues = new Set(field.options.map((option) => option.value));
      const orderedValues = rule.orderedValues.filter((value, index, values) => allowedValues.has(value) && values.indexOf(value) === index);
      if (orderedValues.length !== field.options.length) return [];
      const maximum = orderedValues.length;
      const groupKey = `${rule.group}:${rule.mean}:${rule.standardDeviation}`;
      const latent = groupSamples.get(groupKey) ?? sampleSeededNormal(`${seed}:group:${groupKey}`, rule.mean, rule.standardDeviation, 1, maximum);
      groupSamples.set(groupKey, latent);
      const itemScore = sampleSeededNormal(`${seed}:field:${field.id}`, latent + rule.offset, Math.min(0.6, rule.standardDeviation * 0.35), 1, maximum);
      let optionIndex = Math.round(itemScore) - 1;
      if (rule.reverse) optionIndex = maximum - 1 - optionIndex;
      value = orderedValues[optionIndex] ?? orderedValues[0] ?? "";
      detail = `AI plan normal-option; semantic order=${orderedValues.join(" < ")}; group=${rule.group}, μ=${rule.mean}, σ=${rule.standardDeviation}, latent=${latent.toFixed(2)}, item=${itemScore.toFixed(2)}${rule.reverse ? ", reverse-scored" : ""}`;
    } else if (rule.strategy === "categorical") {
      const allowedWeights = Object.fromEntries(Object.entries(rule.weights).filter(([candidate, weight]) => field.options.some((option) => option.value === candidate) && weight > 0));
      const entries = Object.entries(allowedWeights);
      if (!entries.length) return [];
      const random = randomSource(`${seed}:field:${field.id}`);
      const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
      let cursor = random() * total;
      value = entries.at(-1)?.[0] ?? "";
      for (const [candidate, weight] of entries) { cursor -= weight; if (cursor <= 0) { value = candidate; break; } }
      detail = "AI plan categorical weights executed by seeded backend RNG";
    } else {
      value = rule.value;
      detail = "AI plan constant value";
    }
    return [{ fieldId: field.id, value, confidence: 1, reason: `${rule.rationale} · ${detail}`, source: "synthetic", requiresReview: true }];
  });
}

export function sampleNormal(random: () => number, mean: number, standardDeviation: number): number {
  const first = Math.max(random(), Number.EPSILON);
  return mean + Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * random()) * standardDeviation;
}

export function generateDistributionProposals(specs: DistributionSpec[], fields: FormField[], seed: string): FillProposal[] {
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const random = randomSource(seed);
  return specs.flatMap((spec): FillProposal[] => {
    const field = fieldsById.get(spec.fieldId);
    if (!field) return [];
    if (spec.kind === "normal") {
      let value = sampleNormal(random, spec.mean, spec.standardDeviation);
      const minimum = spec.min ?? field.min;
      const maximum = spec.max ?? field.max;
      if (minimum !== undefined) value = Math.max(minimum, value);
      if (maximum !== undefined) value = Math.min(maximum, value);
      if (spec.integer) value = Math.round(value);
      return [{ fieldId: field.id, value: String(value), confidence: 1, reason: `Seeded normal sample (μ=${spec.mean}, σ=${spec.standardDeviation})`, source: "synthetic", requiresReview: true }];
    }
    const entries = Object.entries(spec.weights).filter(([, weight]) => weight > 0);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let cursor = random() * total;
    let selected = entries.at(-1)?.[0] ?? "";
    for (const [value, weight] of entries) {
      cursor -= weight;
      if (cursor <= 0) { selected = value; break; }
    }
    return [{ fieldId: field.id, value: selected, confidence: 1, reason: "Seeded categorical sample", source: "synthetic", requiresReview: true }];
  });
}
