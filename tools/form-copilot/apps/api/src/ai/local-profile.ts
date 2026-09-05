import type { FillProposal, FormField, Profile } from "@form-copilot/contracts";

function normalized(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function proposalsFromLocalProfile(fields: FormField[], profile: Profile): FillProposal[] {
  const facts = new Map(Object.entries(profile).map(([key, value]) => [normalized(key), value]));
  return fields.flatMap((field): FillProposal[] => {
    const candidates = [normalized(field.name), normalized(field.label)].filter(Boolean);
    const matchedKey = candidates.find((candidate) => facts.has(candidate));
    if (!matchedKey) return [];
    const raw = facts.get(matchedKey);
    if (raw === undefined || typeof raw === "number" && !Number.isFinite(raw)) return [];
    const value = Array.isArray(raw) ? raw : typeof raw === "boolean" ? raw : String(raw);
    return [{ fieldId: field.id, value, confidence: 1, reason: "Khớp chính xác với hồ sơ local", source: "profile", requiresReview: false }];
  });
}
