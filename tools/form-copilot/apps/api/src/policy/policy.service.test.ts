import { describe, expect, it } from "vitest";
import type { FormField, FormSnapshot } from "@form-copilot/contracts";
import { PolicyService } from "./policy.service.js";

const textField = (overrides: Partial<FormField> = {}): FormField => ({
  id: "name", name: "name", kind: "text", label: "Họ và tên", description: "", section: "", required: true, multiple: false, options: [], ...overrides,
});

describe("PolicyService", () => {
  const policy = new PolicyService();

  it("allows only explicitly configured localhost ports", () => {
    expect(policy.originAllowed("http://127.0.0.1:5173/form", ["http://127.0.0.1:*"])).toBe(true);
    expect(policy.originAllowed("https://example.com/form", ["http://127.0.0.1:*"])).toBe(false);
  });

  it("can scope an allowlist entry to one exact form path", () => {
    const form = "https://docs.google.com/forms/d/form-owned-by-user/*";
    expect(policy.originAllowed("https://docs.google.com/forms/d/form-owned-by-user/viewform?pli=1", [form])).toBe(true);
    expect(policy.originAllowed("https://docs.google.com/forms/d/a-different-form/viewform", [form])).toBe(false);
    expect(policy.originAllowed("https://docs.google.com/document/d/form-owned-by-user/edit", [form])).toBe(false);
  });

  it("removes sensitive fields before persistence and cloud calls", () => {
    const form: FormSnapshot = {
      url: "http://127.0.0.1:5173/form", title: "Demo", description: "",
      fields: [textField(), textField({ id: "otp", name: "one_time_password", label: "OTP" })],
    };
    expect(policy.safeForm(form).fields.map((field) => field.id)).toEqual(["name"]);
    expect(JSON.stringify(policy.cloudProjection(form))).not.toContain("OTP");
  });

  it("rejects select proposals outside the declared options", () => {
    const field = textField({ kind: "select", options: [{ label: "A", value: "a" }] });
    expect(policy.validateProposal(field, { fieldId: "name", value: "b", confidence: 1, reason: "test", source: "prompt", requiresReview: true })).toBe(false);
  });
});
