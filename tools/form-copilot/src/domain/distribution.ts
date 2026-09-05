import type { DistributionSpec, FillProposal, FormField } from "./contracts.js";

function xmur3(seed: string): () => number {
  let hash = 1_779_033_703 ^ seed.length;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3_432_918_353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2_246_822_507);
    hash = Math.imul(hash ^ (hash >>> 13), 3_266_489_909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  return () => {
    let value = seed += 0x6d2b79f5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function createRandom(seed: string): () => number {
  return mulberry32(xmur3(seed)());
}

export function sampleNormal(random: () => number, mean: number, standardDeviation: number): number {
  const first = Math.max(random(), Number.EPSILON);
  const second = random();
  const zScore = Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
  return mean + zScore * standardDeviation;
}

export function proposalsFromDistributions(
  specs: DistributionSpec[],
  fields: FormField[],
  seed: string,
): FillProposal[] {
  const byId = new Map(fields.map((field) => [field.id, field]));
  const random = createRandom(seed);

  return specs.flatMap((spec): FillProposal[] => {
    const field = byId.get(spec.fieldId);
    if (!field) return [];

    if (spec.kind === "normal") {
      let value = sampleNormal(random, spec.mean, spec.standardDeviation);
      const minimum = spec.min ?? field.min;
      const maximum = spec.max ?? field.max;
      if (minimum !== undefined) value = Math.max(minimum, value);
      if (maximum !== undefined) value = Math.min(maximum, value);
      if (spec.integer) value = Math.round(value);
      return [{
        fieldId: field.id,
        value: String(value),
        confidence: 1,
        reason: `Seeded normal sample (μ=${spec.mean}, σ=${spec.standardDeviation})`,
        source: "synthetic",
        requiresReview: true,
      }];
    }

    const entries = Object.entries(spec.weights).filter(([, weight]) => weight > 0);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let cursor = random() * total;
    let selected = entries.at(-1)?.[0] ?? "";
    for (const [value, weight] of entries) {
      cursor -= weight;
      if (cursor <= 0) {
        selected = value;
        break;
      }
    }
    return [{
      fieldId: field.id,
      value: selected,
      confidence: 1,
      reason: "Seeded categorical sample from configured weights",
      source: "synthetic",
      requiresReview: true,
    }];
  });
}
