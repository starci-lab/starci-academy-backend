import { existsSync } from "node:fs";
import { chromium } from "playwright-core";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { FIXED_FORM_URL, loadFixedDataset, type FixedDatasetRow } from "./dataset.js";
import { loadFixedFormSchema, normalizeOption, optionFor, planFixedForm, PlaywrightFixedFormPage, runFixedFormRow, runFixedFormWithPage, type FixedFormPage, type FixedFormSchema, type FormPageState } from "./form-runner.js";

let row: FixedDatasetRow;
let screenedRow: FixedDatasetRow;
let schema: FixedFormSchema;
beforeAll(async () => {
  const rows = (await loadFixedDataset()).rows;
  row = rows.find((candidate) => candidate.sourceStatus === "VALID")!;
  screenedRow = { id: "TEST-SCREENED", answers: { Consent: "1", S0: "0" }, sourceStatus: "TEST_FIXTURE" };
  schema = await loadFixedFormSchema();
});

class FakePage implements FixedFormPage {
  index = 0;
  events: string[] = [];
  selected = new Map<string, string>();
  plan = planFixedForm(row, schema);
  afterSubmit = false;
  mutation?: (state: FormPageState) => void;
  submitError = false;
  confirmation = true;
  async open() { this.events.push("open"); }
  async choose(code: string, option: string) { this.selected.set(code, option); }
  async next() { this.events.push("next"); this.index++; }
  async submit() { this.events.push("submit"); this.afterSubmit = true; if (this.submitError) throw new Error("Connection lost"); }
  async snapshot() {
    const state: FormPageState = {
      url: this.afterSubmit ? schema.resolvedUrl.replace("viewform", "formResponse") : schema.resolvedUrl,
      structure: schema.structure,
      fields: this.afterSubmit ? [] : this.plan.sections[this.index]!.answers.map((answer) => ({ code: answer.code, options: answer.options, selected: this.selected.get(answer.code) ?? null })),
      next: !this.afterSubmit && this.index !== this.plan.sections.length - 1,
      submit: !this.afterSubmit && this.index === this.plan.sections.length - 1,
      confirmation: this.afterSubmit && this.confirmation,
      blocker: null,
    };
    this.mutation?.(state);
    return state;
  }
}

describe("fixed form safety and deterministic traversal", () => {
  it("plans all 52 answers across 12 eligible pages, respecting the consent branch", () => {
    const plan = planFixedForm(row, schema);
    expect(plan.sections).toHaveLength(12);
    expect(plan.sections[1]!.id).toBe(648925430);
    expect(plan.sections.some((section) => section.id === 1486587414)).toBe(false);
    expect(plan.sections.flatMap((section) => section.answers)).toHaveLength(52);
    expect(plan.sections.flatMap((section) => section.answers).find((answer) => answer.code === "S5")!.label).toBe("No / Không");
    expect(plan.intent.expectedStatus).toBe("succeeded");
  });
  it("maps bilingual options exactly, without fuzzy or positional substitution", () => {
    expect(optionFor("D1_Age", "35+")).toBe("35 trở lên / 35+");
    expect(optionFor("D3_Status", "Both studying and working")).toBe("Vừa học vừa làm (Both)");
    expect(optionFor("D2_Gender", "Prefer not to say")).toBe("Không muốn trả lời / Prefer not to say");
    expect(optionFor("SMC1", "3")).toBe("3 - Neutral / Trung lập");
    expect(normalizeOption(" Yes  / Có ")).toBe("Yes / Có");
    expect(() => optionFor("D3_Status", "both")).toThrow();
  });
  it("completes traversal and durably invokes beforeSubmit before the final click", async () => {
    const page = new FakePage();
    const hooks = { beforeSubmit: async () => { page.events.push("persist"); } };
    expect((await runFixedFormWithPage(row, hooks, page, schema)).status).toBe("succeeded");
    expect(page.events.filter((event) => event === "next")).toHaveLength(11);
    expect(page.events.slice(-2)).toEqual(["persist", "submit"]);
    expect(page.selected.size).toBe(52);
  });
  it("submits the declared answerless early-close page and records a screened-out intent", async () => {
    const previous = row;
    row = screenedRow;
    const page = new FakePage();
    const intents: unknown[] = [];
    const result = await runFixedFormWithPage(screenedRow, { beforeSubmit: async (intent) => { page.events.push("persist"); intents.push(intent); } }, page, schema);
    row = previous;
    expect(result).toMatchObject({ status: "screened_out", terminalPageId: 1486587414, closeReason: expect.stringMatching(/^(Consent|S[0-5])=[01]$/) });
    expect(page.plan.sections.at(-1)).toMatchObject({ id: 1486587414, answers: [] });
    expect(page.events.slice(-2)).toEqual(["persist", "submit"]);
    expect(intents).toEqual([expect.objectContaining({ expectedStatus: "screened_out", terminalPageId: 1486587414 })]);
  });
  it.each(["login", "captcha", "schema", "missing", "option", "early-submit", "redirect"])("stops on %s before submission", async (kind) => {
    const page = new FakePage();
    page.mutation = (state) => {
      if (kind === "login") state.blocker = "Login or permission is required";
      if (kind === "captcha") state.blocker = "CAPTCHA requires manual review";
      if (kind === "schema") state.structure = { ...schema.structure, title: "Changed" };
      if (kind === "missing") state.fields = [];
      if (kind === "option") state.fields[0]!.options = ["yes", "no"];
      if (kind === "early-submit") state.submit = true;
      if (kind === "redirect") state.url = "https://accounts.google.com/signin";
    };
    const beforeSubmit = vi.fn(async () => undefined);
    expect((await runFixedFormWithPage(row, { beforeSubmit }, page, schema)).status).toBe("failed");
    expect(beforeSubmit).not.toHaveBeenCalled();
    expect(page.events).not.toContain("submit");
  });
  it("does not click submit when the durable write fails", async () => {
    const page = new FakePage();
    expect((await runFixedFormWithPage(row, { beforeSubmit: async () => { throw new Error("Database unavailable"); } }, page, schema)).status).toBe("failed");
    expect(page.events).not.toContain("submit");
  });
  it.each(["network", "no-confirmation"])("marks %s after the ambiguity boundary uncertain, never success", async (kind) => {
    const page = new FakePage();
    page.submitError = kind === "network";
    page.confirmation = kind !== "no-confirmation";
    const result = await runFixedFormWithPage(row, { beforeSubmit: async () => undefined }, page, schema);
    expect(result.status).toBe("uncertain");
    expect(result.detail).toContain("Do not retry automatically");
    expect(page.events.filter((event) => event === "submit")).toHaveLength(1);
  });
  it("never initializes a browser when live submissions are disabled", async () => {
    vi.stubEnv("FORM_COPILOT_ENABLE_SUBMISSIONS", "false");
    expect((await runFixedFormRow(row, { beforeSubmit: vi.fn() })).detail).toContain("disabled");
    vi.unstubAllEnvs();
  });
});

const chrome = process.env.FORM_COPILOT_TEST_BROWSER_EXECUTABLE_PATH ?? (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : chromium.executablePath());
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

describe.skipIf(!existsSync(chrome))("local multi-section DOM fixture (no live Google Form requests)", () => {
  it.each([
    { message: "Cảm ơn bạn đã hoàn thành khảo sát! / Thank you for completing the survey!".normalize("NFD"), confirmed: true },
    { message: "Cảm ơn bạn đã quan tâm. / Thank you for your interest.", confirmed: false },
    { message: "Preview: Cảm ơn bạn đã hoàn thành khảo sát! / Thank you for completing the survey!", confirmed: false },
  ])("recognizes only an exact terminal confirmation: $confirmed", async ({ message, confirmed }) => {
    const browser = await chromium.launch({ headless: true, executablePath: chrome, chromiumSandbox: true });
    const context = await browser.newContext({ serviceWorkers: "block" });
    try {
      await context.route("**/*", (route) => route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><body>${escapeHtml(message)}</body>` }));
      const page = await context.newPage();
      await page.goto(schema.resolvedUrl.replace("viewform", "formResponse"));
      const state = await new PlaywrightFixedFormPage(page, schema).snapshot();
      expect(state.confirmation).toBe(confirmed);
      expect(state.fields).toHaveLength(0);
    } finally { await context.close(); await browser.close(); }
  }, 30_000);

  it("accepts an exact confirmation when Google's public-data payload omits form items", async () => {
    const browser = await chromium.launch({ headless: true, executablePath: chrome, chromiumSandbox: true });
    const context = await browser.newContext({ serviceWorkers: "block" });
    try {
      const partialMetadata = [null, []];
      await context.route("**/*", (route) => route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: `<!doctype html><body><script>var FB_PUBLIC_LOAD_DATA_ = ${JSON.stringify(partialMetadata)};</script>Your response has been recorded.</body>`,
      }));
      const page = await context.newPage();
      await page.goto(schema.resolvedUrl.replace("viewform", "formResponse"));
      const state = await new PlaywrightFixedFormPage(page, schema).snapshot();
      expect(state).toMatchObject({ confirmation: true, structure: null, fields: [] });
    } finally { await context.close(); await browser.close(); }
  }, 30_000);

  it.each(["missing", "duplicate-next", "duplicate-submit"])("rejects %s controls without clicking", async (kind) => {
    const browser = await chromium.launch({ headless: true, executablePath: chrome, chromiumSandbox: true });
    const context = await browser.newContext({ serviceWorkers: "block" });
    await context.route("**/*", (route) => route.abort());
    const page = await context.newPage();
    try {
      const labels = kind === "missing" ? [] : kind === "duplicate-next" ? ["Tiếp", "Tiếp".normalize("NFD")] : ["Gửi", "G\u01b0\u0309i"];
      const buttons = labels.map((label) => `<button onclick="document.body.dataset.clicks='1'">${escapeHtml(label)}</button>`).join("");
      await page.setContent(`<body data-clicks="0"><div role="listitem"><div data-params="%.@.[670753711]"><div role="radiogroup" aria-label="Consent"><div role="radio">Yes</div></div></div></div>${buttons}</body>`);
      const adapter = new PlaywrightFixedFormPage(page, schema);
      const state = await adapter.snapshot();
      if (kind === "missing") expect([state.next, state.submit]).toEqual([false, false]);
      else expect(state.blocker).toBe("Navigation control is missing or ambiguous");
      await expect(kind === "duplicate-next" ? adapter.next() : adapter.submit()).rejects.toThrow("Navigation control is missing or ambiguous");
      expect(await page.locator("body").getAttribute("data-clicks")).toBe("0");
    } finally { await context.close(); await browser.close(); }
  }, 30_000);

  it.each(["matrix-context", "hidden-prefix", "duplicate", "missing", "aria-fallback", "rerender"])("matches source option values safely: %s", async (kind) => {
    const browser = await chromium.launch({ headless: true, executablePath: chrome, chromiumSandbox: true });
    const context = await browser.newContext({ serviceWorkers: "block" });
    await context.route("**/*", (route) => route.abort());
    const page = await context.newPage();
    const expected = optionFor("SMC1", "4");
    const item = schema.structure.items.find((candidate) => candidate.type === 7 && candidate.entries?.some((entry) => entry[3]?.[0]?.includes("[SMC1]")))!;
    const metadata: unknown[] = [null, []];
    const inner = metadata[1] as unknown[];
    inner[1] = schema.structure.items.map((entry) => [entry.id, entry.title, entry.description, entry.type, entry.entries, entry.next]);
    inner[8] = schema.structure.title;
    const optionValues = [1, 2, 3, 4, 5].map((value) => optionFor("SMC1", String(value))).filter((value) => kind !== "missing" || value !== expected);
    if (kind === "duplicate") optionValues.push(expected);
    const radio = (value: string, hidden = false) => {
      const accessible = kind === "aria-fallback" ? value : `${value}, câu trả lời cho [SMC1] Matrix question context`;
      const select = "for(const r of this.parentElement.children)r.setAttribute('aria-checked','false');this.setAttribute('aria-checked','true')";
      const rerender = kind === "rerender" ? ";const fresh=this.parentElement.cloneNode(true);fresh.querySelector('[aria-checked=true]').setAttribute('data-rerendered','true');this.parentElement.replaceWith(fresh)" : "";
      return `<div role="radio" tabindex="0" aria-label="${escapeHtml(accessible)}" ${kind === "aria-fallback" ? "" : `data-value="${escapeHtml(value)}"`} aria-checked="false" ${hidden ? 'style="display:none"' : ""} onclick="document.body.dataset.clicks=String(Number(document.body.dataset.clicks||0)+1);${select}${rerender}">${escapeHtml(value)}</div>`;
    };
    try {
      const hiddenPrefix = kind === "hidden-prefix" ? `<div role="radiogroup" style="display:none">${radio(expected)}</div>` : "";
      const hiddenDuplicate = kind === "hidden-prefix" ? radio(expected, true) : "";
      await page.setContent(`<body data-clicks="0"><script>var FB_PUBLIC_LOAD_DATA_ = ${JSON.stringify(metadata)};</script>${hiddenPrefix}<div role="listitem"><div data-params="%.@.[${item.id}]"><div role="radiogroup" aria-label="[SMC1] Matrix question context">${optionValues.map((value) => radio(value)).join("")}${hiddenDuplicate}</div></div></div></body>`);
      const adapter = new PlaywrightFixedFormPage(page, schema);
      const state = await adapter.snapshot();
      expect(state.fields).toHaveLength(1);
      expect(state.fields[0]!.code).toBe("SMC1");
      if (kind === "duplicate" || kind === "missing") {
        await expect(adapter.choose("SMC1", expected)).rejects.toThrow("Exact option value unavailable or ambiguous: SMC1");
        expect(await page.locator("body").getAttribute("data-clicks")).toBe("0");
      } else {
        if (kind !== "aria-fallback") expect(await page.getByRole("radio", { name: expected, exact: true }).count()).toBe(0);
        await adapter.choose("SMC1", expected);
        expect(await page.locator("body").getAttribute("data-clicks")).toBe("1");
        expect((await adapter.snapshot()).fields[0]!.selected).toBe(expected);
        if (kind === "rerender") expect(await page.locator('[role="radio"][data-rerendered="true"]').count()).toBe(1);
      }
    } finally { await context.close(); await browser.close(); }
  }, 30_000);

  it("waits through loading text and a transient missing body until question identity changes", async () => {
    const browser = await chromium.launch({ headless: true, executablePath: chrome, chromiumSandbox: true });
    const context = await browser.newContext({ serviceWorkers: "block" });
    // This regression uses about:blank only; even an accidental request must not escape.
    await context.route("**/*", (route) => route.abort());
    const page = await context.newPage();
    const question = (id: number, label: string) => `<div role="listitem"><div data-params="%.@.[${id}]"><span id="question-label">${label}</span><div role="radiogroup" aria-labelledby="question-label"><div role="radio">Yes</div></div></div></div>`;
    try {
      await page.setContent(`<body>${question(1, "First question")}<button onclick="this.textContent='Loading…'">Next</button></body>`);
      const adapter = new PlaywrightFixedFormPage(page, schema);
      let settled = false;
      const advancing = adapter.next().finally(() => { settled = true; });
      // Attach a rejection handler immediately so the original null-body defect is reported by the assertion.
      void advancing.catch(() => undefined);
      await page.waitForFunction(() => document.querySelector("button")?.textContent === "Loading…");
      await page.waitForTimeout(100);
      expect(settled, "button loading text must not complete section navigation").toBe(false);
      await page.evaluate(() => { document.body.remove(); });
      await page.waitForTimeout(100);
      expect(settled, "a transient document with no body must remain pending, not throw").toBe(false);
      await page.evaluate((html) => {
        const body = document.createElement("body");
        body.innerHTML = html;
        document.documentElement.append(body);
      }, `${question(2, "Second question")}<button>Next</button>`);
      await expect(advancing).resolves.toBeUndefined();
      expect(settled).toBe(true);
    } finally { await context.close(); await browser.close(); }
  }, 30_000);

  it.each([
    { language: "English", nextLabel: "Next", submitLabel: "Submit", confirmation: "Your response has been recorded." },
    { language: "Google partially decomposed Vietnamese", nextLabel: "Tiếp".normalize("NFD"), submitLabel: "G\u01b0\u0309i", confirmation: "Câu trả lời của bạn đã được ghi lại.".normalize("NFD") },
    { language: "NFD Vietnamese", nextLabel: "Tiếp theo".normalize("NFD"), submitLabel: "Gửi".normalize("NFD"), confirmation: "Câu trả lời của bạn đã được ghi lại.".normalize("NFD") },
    { language: "Owned form custom confirmation", nextLabel: "Tiếp", submitLabel: "G\u01b0\u0309i", confirmation: "Cảm ơn bạn đã hoàn thành khảo sát! / Thank you for completing the survey!".normalize("NFD") },
  ])("walks all 52 answers with $language controls and confirmation", async ({ nextLabel, submitLabel, confirmation }) => {
    const browser = await chromium.launch({ headless: true, executablePath: chrome, chromiumSandbox: true });
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    const plan = planFixedForm(row, schema);
    const events: string[] = [];
    const requestedPaths: string[] = [];
    const metadata: unknown[] = [null, []];
    const inner = metadata[1] as unknown[];
    inner[1] = schema.structure.items.map((item) => [item.id, item.title, item.description, item.type, item.entries, item.next]);
    inner[8] = schema.structure.title;
    const fixture = (index: number) => {
      const content = plan.sections[index]!.answers.map((answer) => {
        const item = schema.structure.items.find((candidate) => candidate.entries?.some((entry) => candidate.type === 7 ? entry[3]?.[0]?.includes(`[${answer.code}]`) : candidate.title.includes(`[${answer.code}]`) || ({ Consent: 670753711, D1_Age: 1167937533, D2_Gender: 2125450785, D3_Status: 841413909 } as Record<string, number>)[answer.code] === candidate.id))!;
        const caption = item.type === 7 ? `[${answer.code}] Matrix source caption` : item.title;
        return `<div role="listitem"><div data-params="%.@.[${item.id}]"><span id="label-${answer.code}">${escapeHtml(caption)}</span><div role="radiogroup" aria-labelledby="label-${answer.code}">${answer.options.map((option) => `<div tabindex="0" role="radio" aria-label="${escapeHtml(option)}" data-value="${escapeHtml(option)}" aria-checked="false" onclick="for(const r of this.parentElement.children)r.setAttribute('aria-checked','false');this.setAttribute('aria-checked','true')">${escapeHtml(option)}</div>`).join("")}</div></div></div>`;
      }).join("");
      return `<!doctype html><html><head><meta charset="utf-8"></head><body><h1>Local synthetic fixture section ${index + 1}</h1><script>var FB_PUBLIC_LOAD_DATA_ = ${JSON.stringify(metadata)};</script><form>${content}</form><a role="button" href="${index === plan.sections.length - 1 ? schema.resolvedUrl.replace("viewform", "formResponse") : `${FIXED_FORM_URL}?fixtureSection=${index + 1}`}">${escapeHtml(index === plan.sections.length - 1 ? submitLabel : nextLabel)}</a></body></html>`;
    };
    await context.route("**/*", async (route) => {
      // Fail closed: every browser request is intercepted and served locally or aborted.
      const url = new URL(route.request().url());
      if (url.hostname !== "docs.google.com") { await route.abort(); return; }
      requestedPaths.push(url.pathname);
      if (url.pathname.endsWith("/formResponse")) {
        events.push("submit-request");
        await route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><body>${escapeHtml(confirmation)}</body>` });
      } else await route.fulfill({ contentType: "text/html", body: fixture(Number(url.searchParams.get("fixtureSection") ?? "0")) });
    });
    try {
      const result = await runFixedFormWithPage(row, { beforeSubmit: async () => { events.push("durable-write"); } }, new PlaywrightFixedFormPage(page, schema), schema);
      expect(result, result.detail).toMatchObject({ status: "succeeded" });
      expect(events).toEqual(["durable-write", "submit-request"]);
      expect(requestedPaths.filter((path) => path.endsWith("/viewform"))).toHaveLength(12);
      expect(requestedPaths.filter((path) => path.endsWith("/formResponse"))).toHaveLength(1);
    } finally { await context.close(); await browser.close(); }
  }, 60_000);

  it.each(["Submit", "Tiếp"])("walks a screening branch to the answerless terminal page through %s and confirms screen-out", async (terminalLabel) => {
    const browser = await chromium.launch({ headless: true, executablePath: chrome, chromiumSandbox: true });
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    const plan = planFixedForm(screenedRow, schema);
    const events: string[] = [];
    const requestedPaths: string[] = [];
    const metadata: unknown[] = [null, []];
    const inner = metadata[1] as unknown[];
    inner[1] = schema.structure.items.map((item) => [item.id, item.title, item.description, item.type, item.entries, item.next]);
    inner[8] = schema.structure.title;
    const fixture = (index: number) => {
      const section = plan.sections[index]!;
      const content = section.answers.map((answer) => {
        const item = schema.structure.items.find((candidate) => candidate.entries?.some((entry) => candidate.type === 7 ? entry[3]?.[0]?.includes(`[${answer.code}]`) : candidate.title.includes(`[${answer.code}]`) || ({ Consent: 670753711, D1_Age: 1167937533, D2_Gender: 2125450785, D3_Status: 841413909 } as Record<string, number>)[answer.code] === candidate.id))!;
        const caption = item.type === 7 ? `[${answer.code}] Matrix source caption` : item.title;
        return `<div role="listitem"><div data-params="%.@.[${item.id}]"><span id="label-${answer.code}">${escapeHtml(caption)}</span><div role="radiogroup" aria-labelledby="label-${answer.code}">${answer.options.map((option) => `<div tabindex="0" role="radio" aria-label="${escapeHtml(option)}" data-value="${escapeHtml(option)}" aria-checked="false" onclick="for(const r of this.parentElement.children)r.setAttribute('aria-checked','false');this.setAttribute('aria-checked','true')">${escapeHtml(option)}</div>`).join("")}</div></div></div>`;
      }).join("");
      const last = index === plan.sections.length - 1;
      const target = last
        ? terminalLabel === "Tiếp" ? `${FIXED_FORM_URL}?fixtureTerminalSubmit=1` : schema.resolvedUrl.replace("viewform", "formResponse")
        : `${FIXED_FORM_URL}?fixtureSection=${index + 1}`;
      return `<!doctype html><html><head><meta charset="utf-8"></head><body><h1>${escapeHtml(section.title)}</h1><script>var FB_PUBLIC_LOAD_DATA_ = ${JSON.stringify(metadata)};</script><form>${content}</form><a role="button" href="${target}">${last ? terminalLabel : "Next"}</a></body></html>`;
    };
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== "docs.google.com") { await route.abort(); return; }
      requestedPaths.push(url.pathname);
      if (url.searchParams.has("fixtureTerminalSubmit")) {
        const terminal = plan.sections.at(-1)!;
        await route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><body><h1>${escapeHtml(terminal.title)}</h1><script>var FB_PUBLIC_LOAD_DATA_ = ${JSON.stringify(metadata)};</script><a role="button" href="${schema.resolvedUrl.replace("viewform", "formResponse")}">Submit</a></body>` });
      } else if (url.pathname.endsWith("/formResponse")) {
        events.push("submit-request");
        await route.fulfill({ contentType: "text/html; charset=utf-8", body: "<!doctype html><body>Your response has been recorded.</body>" });
      } else await route.fulfill({ contentType: "text/html", body: fixture(Number(url.searchParams.get("fixtureSection") ?? "0")) });
    });
    try {
      const result = await runFixedFormWithPage(screenedRow, { beforeSubmit: async (intent) => { events.push("durable-write"); expect(intent).toEqual(plan.intent); } }, new PlaywrightFixedFormPage(page, schema), schema);
      expect(result, result.detail).toMatchObject({ status: "screened_out", terminalPageId: 1486587414, closeReason: plan.intent.closeReason });
      expect(plan.sections.at(-1)?.answers).toEqual([]);
      expect(events).toEqual(["durable-write", "submit-request"]);
      expect(requestedPaths.filter((path) => path.endsWith("/formResponse"))).toHaveLength(1);
    } finally { await context.close(); await browser.close(); }
  }, 60_000);
});
