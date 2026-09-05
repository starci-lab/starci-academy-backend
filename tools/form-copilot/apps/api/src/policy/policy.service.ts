import { ForbiddenException, Injectable } from "@nestjs/common";
import type { FillProposal, FormField, FormSnapshot } from "@form-copilot/contracts";

const SENSITIVE_PATTERN = /(?:password|passcode|otp|one.?time|captcha|cvv|cvc|credit.?card|card.?number|signature|social.?security|ssn|passport|citizen.?id|national.?id|tax.?id)/i;

function originOf(url: string): string {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new ForbiddenException("Only HTTP(S) forms are supported");
  return parsed.origin.toLowerCase();
}

function matches(url: string, rawPattern: string): boolean {
  const target = new URL(url);
  const origin = target.origin.toLowerCase();
  const pattern = rawPattern.trim().toLowerCase().replace(/\/$/, "");
  if (pattern === origin) return true;
  const wildcardPort = pattern.match(/^(https?:\/\/[^/:]+):\*$/);
  if (wildcardPort) return origin === wildcardPort[1] || origin.startsWith(`${wildcardPort[1]}:`);
  const wildcardHost = pattern.match(/^(https?):\/\/\*\.([^/:]+)$/);
  if (wildcardHost) return target.protocol === `${wildcardHost[1]}:` && target.hostname.endsWith(`.${wildcardHost[2]}`);

  let allowed: URL;
  try {
    allowed = new URL(pattern);
  } catch {
    return false;
  }
  if (allowed.origin.toLowerCase() !== origin) return false;

  const allowedPath = allowed.pathname.toLowerCase().replace(/\/$/, "");
  const targetPath = target.pathname.toLowerCase().replace(/\/$/, "");
  if (!allowedPath) return true;
  if (allowedPath.endsWith("/*")) {
    const prefix = allowedPath.slice(0, -2);
    return targetPath === prefix || targetPath.startsWith(`${prefix}/`);
  }
  return targetPath === allowedPath;
}

@Injectable()
export class PolicyService {
  originAllowed(url: string, patterns: readonly string[]): boolean {
    originOf(url);
    return patterns.some((pattern) => matches(url, pattern));
  }

  assertOrigin(url: string, mode: "assist" | "synthetic", allowed: readonly string[], synthetic: readonly string[]): void {
    const patterns = mode === "synthetic" ? synthetic : allowed;
    if (!this.originAllowed(url, patterns)) throw new ForbiddenException(`${new URL(url).origin} is not allowlisted for ${mode} mode`);
  }

  isSensitive(field: FormField): boolean {
    return SENSITIVE_PATTERN.test(`${field.name} ${field.label} ${field.description}`);
  }

  safeForm(form: FormSnapshot): FormSnapshot {
    const fields = form.fields.filter((field) => !this.isSensitive(field));
    if (!fields.length) throw new ForbiddenException("No in-scope editable fields were found");
    return { ...form, fields };
  }

  cloudProjection(form: FormSnapshot): unknown {
    return {
      title: form.title.slice(0, 240),
      fields: form.fields.filter((field) => !this.isSensitive(field)).map((field) => ({
        id: field.id,
        kind: field.kind,
        label: field.label.slice(0, 240),
        description: field.description.slice(0, 320),
        section: field.section.slice(0, 160),
        required: field.required,
        multiple: field.multiple,
        min: field.min,
        max: field.max,
        maxLength: field.maxLength,
        options: field.options.map((option) => ({ label: option.label.slice(0, 160), value: option.value.slice(0, 240) })),
      })),
    };
  }

  validateProposal(field: FormField, proposal: FillProposal): boolean {
    if (this.isSensitive(field)) return false;
    if (field.kind === "checkbox") return typeof proposal.value === "boolean" || Array.isArray(proposal.value);
    if (field.kind === "select" || field.kind === "radio") {
      const values = Array.isArray(proposal.value) ? proposal.value : [String(proposal.value)];
      const allowed = new Set(field.options.map((option) => option.value));
      return values.every((value) => allowed.has(value));
    }
    if (field.kind === "number" || field.kind === "range") {
      const number = Number(proposal.value);
      return Number.isFinite(number) && (field.min === undefined || number >= field.min) && (field.max === undefined || number <= field.max);
    }
    return typeof proposal.value === "string";
  }
}
