import type { AnalyzeRequest, FillProposal, FormField } from "./contracts.js";

const SENSITIVE_PATTERN = /(?:password|passcode|otp|one.?time|captcha|cvv|cvc|credit.?card|card.?number|signature|social.?security|ssn|passport|citizen.?id|national.?id|tax.?id)/i;

export interface PolicyConfig {
  allowedOrigins: string[];
  syntheticOrigins: string[];
}

function normalizeOrigin(url: string): string {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error("Only HTTP(S) form origins are supported");
  }
  return parsed.origin.toLowerCase();
}

function matchesOrigin(origin: string, pattern: string): boolean {
  const normalizedPattern = pattern.trim().toLowerCase().replace(/\/$/, "");
  if (!normalizedPattern) return false;
  if (normalizedPattern === origin) return true;

  const wildcardPort = normalizedPattern.match(/^(https?:\/\/[^/:]+):\*$/);
  if (wildcardPort) {
    return origin === wildcardPort[1] || origin.startsWith(`${wildcardPort[1]}:`);
  }

  const wildcardHost = normalizedPattern.match(/^(https?):\/\/\*\.([^/:]+)$/);
  if (wildcardHost) {
    const parsed = new URL(origin);
    return parsed.protocol === `${wildcardHost[1]}:` && parsed.hostname.endsWith(`.${wildcardHost[2]}`);
  }

  return false;
}

export function originAllowed(url: string, patterns: string[]): boolean {
  const origin = normalizeOrigin(url);
  return patterns.some((pattern) => matchesOrigin(origin, pattern));
}

export function isSensitiveField(field: FormField): boolean {
  return SENSITIVE_PATTERN.test(`${field.name} ${field.label} ${field.description}`);
}

export function assertRequestAllowed(request: AnalyzeRequest, config: PolicyConfig): void {
  if (!originAllowed(request.form.url, config.allowedOrigins)) {
    throw new Error(`Origin ${new URL(request.form.url).origin} is not allowlisted`);
  }
  if (request.mode === "synthetic" && !originAllowed(request.form.url, config.syntheticOrigins)) {
    throw new Error("Synthetic mode is limited to localhost or explicitly allowlisted test origins");
  }
  const sensitive = request.form.fields.filter(isSensitiveField);
  if (sensitive.length > 0) {
    throw new Error(`Sensitive fields are outside scope: ${sensitive.map((field) => field.label).join(", ")}`);
  }
}

export function validateProposal(field: FormField, proposal: FillProposal): boolean {
  if (isSensitiveField(field)) return false;
  if (field.kind === "checkbox") return typeof proposal.value === "boolean" || Array.isArray(proposal.value);
  if (["select", "radio"].includes(field.kind)) {
    const values = Array.isArray(proposal.value) ? proposal.value : [String(proposal.value)];
    const allowed = new Set(field.options.map((option) => option.value));
    return values.every((value) => allowed.has(value));
  }
  if (["number", "range"].includes(field.kind)) {
    const numeric = Number(proposal.value);
    return Number.isFinite(numeric)
      && (field.min === undefined || numeric >= field.min)
      && (field.max === undefined || numeric <= field.max);
  }
  return typeof proposal.value === "string";
}
