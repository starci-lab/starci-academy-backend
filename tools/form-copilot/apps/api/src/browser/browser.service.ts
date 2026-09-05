import { Injectable, NotFoundException, OnApplicationShutdown } from "@nestjs/common";
import { FormSnapshotSchema, type FillProposal, type FormSnapshot } from "@form-copilot/contracts";
import { randomUUID } from "node:crypto";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";

interface BrowserSession { context: BrowserContext; page: Page; form: FormSnapshot }

@Injectable()
export class BrowserService implements OnApplicationShutdown {
  #browser?: Browser;
  readonly #sessions = new Map<string, BrowserSession>();

  async open(url: string): Promise<{ sessionId: string; form: FormSnapshot }> {
    const context = await (await this.#getBrowser()).newContext({ viewport: null, locale: "vi-VN" });
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForFunction(() => {
        const candidates = [...document.querySelectorAll<HTMLElement>('input:not([type="hidden"]), textarea, select, [role="radio"], [role="checkbox"], [role="listbox"]')];
        return candidates.some((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && element.getAttribute("aria-disabled") !== "true";
        });
      }, undefined, { timeout: 10_000 }).catch(() => undefined);
      const form = await this.#scanPage(page);
      const sessionId = randomUUID();
      this.#sessions.set(sessionId, { context, page, form });
      return { sessionId, form };
    } catch (error) { await context.close(); throw error; }
  }

  async scan(sessionId: string): Promise<FormSnapshot> {
    const session = this.#session(sessionId);
    session.form = await this.#scanPage(session.page);
    return session.form;
  }

  async apply(sessionId: string, proposals: FillProposal[]): Promise<{ applied: number; skipped: number }> {
    return this.#session(sessionId).page.evaluate((items) => {
      let applied = 0;
      let skipped = 0;
      const emit = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      };
      const setTextValue = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) => {
        if (element instanceof HTMLSelectElement) element.value = value;
        else {
          const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(element, value);
        }
        emit(element);
      };
      for (const proposal of items) {
        const elements = [...document.querySelectorAll<HTMLElement>(`[data-form-copilot-id="${CSS.escape(proposal.fieldId)}"]`)];
        if (!elements.length) { skipped += 1; continue; }
        const values = Array.isArray(proposal.value) ? proposal.value.map(String) : [String(proposal.value)];
        for (const element of elements) {
          const role = element.getAttribute("role");
          const ariaValue = element.dataset.value ?? element.dataset.answerValue ?? element.getAttribute("aria-label") ?? cleanElementText(element);
          if (role === "radio") {
            if (values.includes(ariaValue) && element.getAttribute("aria-checked") !== "true") element.click();
          } else if (role === "checkbox") {
            const shouldCheck = Array.isArray(proposal.value) ? values.includes(ariaValue) : Boolean(proposal.value);
            if ((element.getAttribute("aria-checked") === "true") !== shouldCheck) element.click();
          } else if (element instanceof HTMLInputElement && element.type === "radio") {
            element.checked = values.includes(element.value); emit(element);
          } else if (element instanceof HTMLInputElement && element.type === "checkbox") {
            element.checked = Array.isArray(proposal.value) ? values.includes(element.value) : Boolean(proposal.value); emit(element);
          } else if (element instanceof HTMLSelectElement && element.multiple) {
            [...element.options].forEach((option) => { option.selected = values.includes(option.value); }); emit(element);
          } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
            setTextValue(element, values[0] ?? "");
          }
          element.dataset.formCopilotFilled = "true";
        }
        applied += 1;
      }
      if (!document.getElementById("form-copilot-highlight-style")) {
        const style = document.createElement("style");
        style.id = "form-copilot-highlight-style";
        style.textContent = `[data-form-copilot-filled="true"] { outline: 3px solid rgba(124,58,237,.42) !important; outline-offset: 2px !important; }`;
        document.head.append(style);
      }
      window.setTimeout(() => document.querySelectorAll<HTMLElement>("[data-form-copilot-filled]").forEach((element) => delete element.dataset.formCopilotFilled), 2_500);
      return { applied, skipped };

      function cleanElementText(element: Element): string {
        return (element.textContent ?? "").replace(/\s+/g, " ").trim();
      }
    }, proposals);
  }

  async screenshot(sessionId: string): Promise<Buffer> { return this.#session(sessionId).page.screenshot({ type: "png" }); }
  async close(sessionId: string): Promise<void> { const session = this.#session(sessionId); this.#sessions.delete(sessionId); await session.context.close(); }

  async #getBrowser(): Promise<Browser> {
    if (this.#browser?.isConnected()) return this.#browser;
    this.#browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--start-maximized"] });
    return this.#browser;
  }

  #session(id: string): BrowserSession {
    const session = this.#sessions.get(id);
    if (!session) throw new NotFoundException("Browser session not found or backend was restarted");
    return session;
  }

  async #scanPage(page: Page): Promise<FormSnapshot> {
    const snapshot = await page.evaluate(() => {
      const clean = (value: string | null | undefined, max = 1_000) => (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
      const visible = (element: Element) => { const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0; };
      const labelText = (label: HTMLLabelElement) => {
        const clone = label.cloneNode(true) as HTMLLabelElement;
        clone.querySelectorAll("input, textarea, select, button").forEach((control) => control.remove());
        return clean(clone.textContent, 500).replace(/\s*\*+\s*$/, "");
      };
      const labelFor = (element: HTMLElement) => {
        const label = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement
          ? element.labels?.[0] ?? element.closest("label")
          : element.closest("label");
        const placeholder = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.placeholder : "";
        const name = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement ? element.name : "";
        return clean((label ? labelText(label) : "") || element.getAttribute("aria-label") || placeholder || name || "Trường chưa đặt tên", 500);
      };
      const descriptionFor = (element: Element) => clean(clean(element.getAttribute("aria-describedby")).split(" ").map((id) => document.getElementById(id)?.textContent ?? "").join(" "), 1_000);
      const sectionFor = (element: Element) => {
        const legend = element.closest("fieldset")?.querySelector(":scope > legend")?.textContent;
        if (legend) return clean(legend, 300);
        let cursor: Element | null = element;
        while (cursor) {
          let sibling = cursor.previousElementSibling;
          while (sibling) { if (/^H[1-4]$/.test(sibling.tagName)) return clean(sibling.textContent, 300); sibling = sibling.previousElementSibling; }
          cursor = cursor.parentElement;
        }
        return "";
      };
      const numericAttribute = (element: Element, name: string) => { const raw = element.getAttribute(name); if (!raw) return undefined; const value = Number(raw); return Number.isFinite(value) ? value : undefined; };
      const controls = [...document.querySelectorAll<HTMLElement>('input, textarea, select, [role="radio"], [role="checkbox"], [role="listbox"]')]
        .filter((element) => visible(element) && element.getAttribute("aria-disabled") !== "true")
        .filter((element) => !(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) || (!element.disabled && (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) || !element.readOnly)))
        .filter((element) => !(element instanceof HTMLInputElement) || !["hidden", "password", "file", "submit", "button", "reset", "image"].includes(element.type));
      const consumed = new Set<Element>();
      const fields: Array<Record<string, unknown>> = [];
      for (const element of controls) {
        if (consumed.has(element)) continue;
        const inputType = element instanceof HTMLInputElement ? element.type : "";
        const role = element.getAttribute("role");
        const nativeName = element instanceof HTMLInputElement ? element.name : "";
        const nativeGroup = (inputType === "radio" || inputType === "checkbox") && Boolean(nativeName);
        const ariaGroup = (role === "radio" || role === "checkbox") ? element.getAttribute("aria-labelledby") : null;
        const questionRoot = element.closest('[role="listitem"]');
        const grouped = nativeGroup
          ? controls.filter((candidate) => candidate instanceof HTMLInputElement && candidate.type === inputType && candidate.name === nativeName)
          : (role === "radio" || role === "checkbox")
            ? controls.filter((candidate) => candidate.getAttribute("role") === role && (ariaGroup ? candidate.getAttribute("aria-labelledby") === ariaGroup : candidate.closest('[role="listitem"]') === questionRoot))
            : [element];
        grouped.forEach((candidate) => consumed.add(candidate));
        const existingId = grouped.find((candidate) => candidate.dataset.formCopilotId)?.dataset.formCopilotId;
        const id = existingId ?? `fc-${crypto.randomUUID()}`;
        grouped.forEach((candidate) => { candidate.dataset.formCopilotId = id; });
        let kind = element instanceof HTMLTextAreaElement ? "textarea" : element instanceof HTMLSelectElement || role === "listbox" ? "select" : role || inputType || "text";
        if (!["text", "textarea", "number", "email", "tel", "url", "date", "datetime-local", "time", "select", "radio", "checkbox", "range", "color"].includes(kind)) kind = "text";
        const options = element instanceof HTMLSelectElement
          ? [...element.options].filter((option) => option.value !== "").map((option) => ({ label: clean(option.textContent, 240), value: option.value.slice(0, 500) }))
          : (inputType === "radio" || role === "radio" || role === "checkbox" || grouped.length > 1)
            ? grouped.map((candidate) => {
              const value = candidate instanceof HTMLInputElement
                ? candidate.value
                : candidate.dataset.value ?? candidate.dataset.answerValue ?? candidate.getAttribute("aria-label") ?? candidate.textContent ?? "";
              return { label: labelFor(candidate), value: clean(value, 500) };
            }) : [];
        const ariaQuestion = questionRoot?.querySelector('[role="heading"]')?.textContent;
        const groupLabel = (inputType === "radio" || role === "radio" || role === "checkbox" || grouped.length > 1)
          ? clean(element.closest("fieldset")?.querySelector(":scope > legend")?.textContent || ariaQuestion, 500).replace(/\s*\*+\s*$/, "") : "";
        const label = groupLabel || labelFor(element);
        const section = sectionFor(element).replace(/\s*\*+\s*$/, "");
        const name = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement ? element.name : element.getAttribute("aria-labelledby") ?? "";
        fields.push({ id, name: clean(name, 240), kind, label, description: descriptionFor(element), section: section === label ? "" : section,
          required: grouped.some((candidate) => candidate instanceof HTMLInputElement ? candidate.required : candidate.getAttribute("aria-required") === "true") || Boolean(questionRoot?.querySelector('[aria-label*="Required"], [aria-label*="Bắt buộc"]')),
          multiple: element instanceof HTMLSelectElement ? element.multiple : grouped.length > 1 && (inputType === "checkbox" || role === "checkbox"),
          min: numericAttribute(element, "min"), max: numericAttribute(element, "max"), step: numericAttribute(element, "step"),
          maxLength: (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) && element.maxLength > 0 ? element.maxLength : undefined, options } );
      }
      return { url: location.href, title: clean(document.querySelector("h1")?.textContent || document.title || "Form chưa đặt tên", 500),
        description: clean(document.querySelector('meta[name="description"]')?.getAttribute("content"), 2_000), fields };
    });
    return FormSnapshotSchema.parse(snapshot);
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([...this.#sessions.values()].map((session) => session.context.close()));
    await this.#browser?.close();
  }
}
