import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { chromium, type Page, type Browser, type BrowserContext } from "playwright-core";
import { FIXED_FIELDS, FIXED_FORM_ID, FIXED_FORM_URL, SCREENING_FIELDS, validateFixedRow, type FixedDatasetRow } from "./dataset.js";
import type { SubmissionIntent } from "./types.js";

type Entry = [number, [string, unknown?, number?][], number | boolean, string[]?, ...unknown[]];
export interface SchemaItem { id: number; title: string; description: string | null; type: number; entries: Entry[] | null; next: number | null }
export interface FixedFormSchema { formId: string; resolvedUrl: string; sha256: string; structure: { title: string; items: SchemaItem[] } }
export interface FormRunHooks { beforeSubmit: (intent: SubmissionIntent) => Promise<void> }
export interface FormRunResult extends Partial<SubmissionIntent> { status: "succeeded" | "screened_out" | "failed" | "uncertain"; detail: string }
export interface VisibleAnswer { code: string; options: string[]; selected: string | null }
export interface FormPageState { url: string; structure: FixedFormSchema["structure"] | null; fields: VisibleAnswer[]; next: boolean; submit: boolean; confirmation: boolean; blocker: string | null }
/** Narrow browser seam for local fixtures. Production never accepts a caller-supplied URL. */
export interface FixedFormPage {
  open(): Promise<void>;
  snapshot(): Promise<FormPageState>;
  choose(code: string, option: string): Promise<void>;
  next(): Promise<void>;
  submit(): Promise<void>;
}

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const normalizeOption = (label: string) => label.normalize("NFC").replace(/\s+/g, " ").trim();
const yesNo: Record<string, string> = { "1": "Yes / Có", "0": "No / Không" };
const likert: Record<string, string> = {
  "1": "1 - Strongly disagree / Hoàn toàn không đồng ý", "2": "2 - Disagree / Không đồng ý", "3": "3 - Neutral / Trung lập",
  "4": "4 - Agree / Đồng ý", "5": "5 - Strongly agree / Hoàn toàn đồng ý",
};
const demographics: Record<string, Record<string, string>> = {
  D1_Age: { "18-22": "18-22", "23-27": "23-27", "28-34": "28-34", "35+": "35 trở lên / 35+" },
  D2_Gender: { Female: "Nữ / Female", Male: "Nam / Male", Other: "Khác / Other", "Prefer not to say": "Không muốn trả lời / Prefer not to say" },
  D3_Status: { Student: "Học sinh / Sinh viên (Student)", Working: "Đi làm (Working)", "Both studying and working": "Vừa học vừa làm (Both)", Other: "Khác (Other)" },
};
const uncodedItems: Record<number, string> = { 670753711: "Consent", 1167937533: "D1_Age", 2125450785: "D2_Gender", 841413909: "D3_Status" };
const codeOf = (item: SchemaItem, entry: Entry): string => {
  const label = item.type === 7 ? entry[3]?.[0] : item.title;
  const code = label?.match(/\[([A-Z]{1,3}\d)\]/)?.[1] ?? uncodedItems[item.id];
  if (!code || !FIXED_FIELDS.includes(code)) throw new Error("Unsupported or uncoded form field");
  return code;
};
export function optionFor(code: string, answer: string): string {
  const value = (SCREENING_FIELDS as readonly string[]).includes(code) ? yesNo[answer] : demographics[code] ? demographics[code][answer] : likert[answer];
  if (!value) throw new Error(`Unsupported answer for ${code}`);
  return value;
}
export async function loadFixedFormSchema(): Promise<FixedFormSchema> {
  const schema = JSON.parse(await readFile(new URL("../../data/fixed-form-schema.json", import.meta.url), "utf8")) as FixedFormSchema;
  if (schema.formId !== FIXED_FORM_ID || hash(schema.structure) !== schema.sha256 || schema.structure.items.filter((item) => item.type === 8).length !== 12) throw new Error("Pinned form schema is invalid");
  return schema;
}

interface PlannedAnswer { code: string; label: string; options: string[] }
interface PlannedSection { id: number; title: string; answers: PlannedAnswer[]; next: number | null }
export interface FixedFormPlan { sections: PlannedSection[]; intent: SubmissionIntent }
/** Follow declared choice branches, never assume worksheet or form row order. */
export function planFixedForm(row: FixedDatasetRow, schema: FixedFormSchema): FixedFormPlan {
  validateFixedRow(row);
  const sections: Array<{ id: number; title: string; entries: Array<{ item: SchemaItem; entry: Entry }>; next: number | null }> = [{ id: 0, title: schema.structure.title, entries: [], next: null }];
  for (const item of schema.structure.items) {
    if (item.type === 8) { sections.push({ id: item.id, title: item.title, entries: [], next: item.next }); continue; }
    if (item.type === 6 && !item.entries) continue;
    if (![2, 7].includes(item.type) || !item.entries) throw new Error("Unsupported form control type");
    const section = sections.at(-1)!;
    for (const entry of item.entries) section.entries.push({ item, entry });
  }
  const path: PlannedSection[] = [];
  let closeReason: string | null = null;
  let index = 0;
  while (index < sections.length) {
    const source = sections[index]!;
    const section: PlannedSection = { id: source.id, title: source.title, answers: [], next: source.next };
    if (path.some((prior) => prior.id === section.id)) throw new Error("Form branching cycle detected");
    for (const { item, entry } of source.entries) {
      const code = codeOf(item, entry);
      const answer = row.answers[code];
      if (answer === undefined) throw new Error(`Missing answer on reachable form path: ${code}`);
      const label = optionFor(code, answer);
      const options = entry[1].map((option) => option[0]);
      const selected = entry[1].filter((option) => normalizeOption(option[0]) === normalizeOption(label));
      if (selected.length !== 1 || !entry[2]) throw new Error(`Form options or required flag changed: ${code}`);
      section.answers.push({ code, label: selected[0]![0], options });
      if (selected[0]![2] !== undefined) {
        section.next = selected[0]![2]!;
        const target = sections.find((candidate) => candidate.id === section.next);
        if (target?.next === -3) closeReason = `${code}=${answer}`;
      }
    }
    path.push(section);
    if (section.next === -3) break;
    if (section.next === null || section.next === -2) index++;
    else {
      index = sections.findIndex((candidate) => candidate.id === section.next);
      if (index < 0) throw new Error("Unknown form branch target");
    }
  }
  const codes = path.flatMap((section) => section.answers.map((answer) => answer.code));
  const terminal = path.at(-1);
  const screenedOut = terminal?.next === -3;
  if (!screenedOut && (codes.length !== 52 || new Set(codes).size !== 52 || FIXED_FIELDS.some((code) => !codes.includes(code)))) throw new Error("Completing branch does not cover all 52 answers");
  if (screenedOut && (!closeReason || terminal.answers.length)) throw new Error("Screen-out branch is not a declared answerless terminal section");
  return {
    sections: path,
    intent: {
      expectedStatus: screenedOut ? "screened_out" : "succeeded",
      terminalPageId: screenedOut ? terminal.id : null,
      terminalPageTitle: screenedOut ? terminal.title : null,
      closeReason: screenedOut ? closeReason : null,
    },
  };
}

function assertFixedUrl(url: string, schema: FixedFormSchema): void {
  const candidate = new URL(url);
  const resolved = new URL(schema.resolvedUrl);
  const allowedPaths = [new URL(FIXED_FORM_URL).pathname, resolved.pathname, resolved.pathname.replace(/\/viewform$/, "/formResponse")];
  if (candidate.origin !== "https://docs.google.com" || !allowedPaths.includes(candidate.pathname)) throw new Error("Form navigated outside the fixed target; login or redirect requires review");
}
function assertPage(state: FormPageState, schema: FixedFormSchema): void {
  assertFixedUrl(state.url, schema);
  if (state.blocker) throw new Error(state.blocker);
  if (!state.structure || hash(state.structure) !== schema.sha256) throw new Error("Form schema changed; rebind and review before submitting");
}
function checkSection(state: FormPageState, expected: PlannedSection, selected: boolean): void {
  if (state.fields.length !== expected.answers.length || new Set(state.fields.map((field) => field.code)).size !== state.fields.length) throw new Error("Visible section fields changed");
  for (const answer of expected.answers) {
    const field = state.fields.find((candidate) => candidate.code === answer.code);
    if (!field || JSON.stringify(field.options.map(normalizeOption).sort()) !== JSON.stringify(answer.options.map(normalizeOption).sort())) throw new Error(`Visible options changed: ${answer.code}`);
    if (selected && normalizeOption(field.selected ?? "") !== normalizeOption(answer.label)) throw new Error(`Answer was not selected: ${answer.code}`);
  }
}

/** Full deterministic traversal. Call only with the production adapter or a local test fixture. */
export async function runFixedFormWithPage(row: FixedDatasetRow, hooks: FormRunHooks, page: FixedFormPage, schema: FixedFormSchema): Promise<FormRunResult> {
  let submitAttempted = false;
  let intent: SubmissionIntent = { expectedStatus: "succeeded", terminalPageId: null, terminalPageTitle: null, closeReason: null };
  try {
    const plan = planFixedForm(row, schema);
    intent = plan.intent;
    await page.open();
    for (const [index, section] of plan.sections.entries()) {
      let state = await page.snapshot();
      assertPage(state, schema);
      checkSection(state, section, false);
      for (const answer of section.answers) await page.choose(answer.code, answer.label);
      state = await page.snapshot();
      assertPage(state, schema);
      checkSection(state, section, true);
      const last = index === plan.sections.length - 1;
      if (!last) {
        if (!state.next || state.submit) throw new Error("Form navigation differs from the pinned branch plan");
        await page.next();
      } else {
        if (!state.submit || state.next) throw new Error("Final submit control missing or ambiguous");
        await hooks.beforeSubmit(intent); // Durable intent must finish before the first possible final click.
        submitAttempted = true;
        await page.submit();
        let result = await page.snapshot();
        assertFixedUrl(result.url, schema);
        if (!result.blocker && !result.confirmation && intent.expectedStatus === "screened_out") {
          // Google can render an answerless screen-out section with a Next-labelled control,
          // then expose the real Submit control on one final answerless page. The durable
          // boundary is already recorded before either control; never loop or guess further.
          assertPage(result, schema);
          if (result.fields.length || !result.submit || result.next) throw new Error("Screen-out did not reach the single final submit control");
          await page.submit();
          result = await page.snapshot();
          assertFixedUrl(result.url, schema);
        }
        if (result.blocker || !result.confirmation || result.fields.length) throw new Error("Remote confirmation was not observed after final submit");
        return { ...intent, status: intent.expectedStatus, detail: intent.expectedStatus === "screened_out" ? `Remote confirmation observed after the declared early-close branch (${intent.closeReason}).` : "Remote confirmation observed after submitting the complete source-backed synthetic response." };
      }
    }
    throw new Error("Form did not reach final submit");
  } catch (error) {
    const detail = error instanceof Error ? error.message.split("\n")[0]!.slice(0, 240) : "Form execution failed";
    return { ...intent, status: submitAttempted ? "uncertain" : "failed", detail: submitAttempted ? `Submission may have occurred. Do not retry automatically. ${detail}` : detail };
  }
}

// The third exact message is declared by the fixed form's public metadata [1][2][0].
// It is not a fuzzy "thank you" match: URL, empty fields and the durable submit boundary still apply.
const CONFIRMATION_MESSAGES = [
  "Your response has been recorded.",
  "Câu trả lời của bạn đã được ghi lại.",
  "Cảm ơn bạn đã hoàn thành khảo sát! / Thank you for completing the survey!",
] as const;

/** Page-realm callback: navigation readiness is a question change, never loading-button text. */
function formTransitionMarker({ before, submitting, confirmations, labels }: { before: string | null; submitting: boolean; confirmations: readonly string[]; labels: readonly string[] }): string | false {
  const body = document.body;
  if (!body || document.readyState === "loading") return false;
  const visible = (element: Element) => !!(element as HTMLElement).getClientRects().length && getComputedStyle(element).visibility !== "hidden";
  const groups = [...document.querySelectorAll('[role="radiogroup"]')].filter(visible);
  const questions = groups.map((group) => {
    const params = group.closest('[role="listitem"]')?.querySelector('[data-params]')?.getAttribute("data-params") ?? "";
    const questionId = params.match(/%\.@\.\[(\d+)/)?.[1] ?? "";
    const label = (group.getAttribute("aria-labelledby") ?? "").split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
    return [questionId, group.getAttribute("aria-label") ?? "", label];
  });
  const normalize = (text: string) => text.normalize("NFC").replace(/\s+/g, " ").trim();
  const navigationCount = [...document.querySelectorAll('[role="button"],button')].filter((element) => visible(element) && labels.includes(normalize(element.textContent ?? ""))).length;
  const signature = JSON.stringify({ questions, navigationCount });
  if (before === null) return groups.length || navigationCount === 1 ? signature : false;
  if (submitting) {
    const lines = body.innerText.normalize("NFC").split(/\n/).map((line) => line.replace(/\s+/g, " ").trim());
    const confirmed = confirmations.some((message) => lines.includes(message));
    return !groups.length && confirmed && /\/formResponse$/.test(location.pathname) ? "confirmed" : false;
  }
  return navigationCount === 1 && signature !== before ? signature : false;
}

type NavigationAction = "next" | "submit";
const NAVIGATION_LABELS: Record<NavigationAction, readonly string[]> = {
  next: ["Next", "Tiếp", "Tiếp theo"],
  submit: ["Submit", "Gửi", "Nộp"],
};

export class PlaywrightFixedFormPage implements FixedFormPage {
  private groups = new Map<string, number>();
  private submitUsesNextControl = false;
  constructor(private readonly page: Page, private readonly schema: FixedFormSchema) {}
  async open(): Promise<void> { await this.page.goto(FIXED_FORM_URL, { waitUntil: "domcontentloaded", timeout: 45_000 }); }
  async snapshot(): Promise<FormPageState> {
    const dom = await this.page.evaluate((confirmations) => {
      const visible = (element: Element) => !!(element as HTMLElement).getClientRects().length && getComputedStyle(element).visibility !== "hidden";
      const body = document.body.innerText;
      const publicData = [...document.scripts].map((script) => script.textContent ?? "").map((script) => script.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);/)).find(Boolean);
      let structure = null;
      if (publicData) {
        const metadata = JSON.parse(publicData[1]!);
        const form = Array.isArray(metadata?.[1]) ? metadata[1] : null;
        const items = form && Array.isArray(form[1]) ? form[1] : null;
        // Google keeps FB_PUBLIC_LOAD_DATA_ on some confirmation pages, but that
        // payload is not the editable form schema and may omit the item array.
        // A successful POST must therefore be judged by the exact confirmation
        // message and /formResponse boundary below, not by parsing absent fields.
        if (form && items) {
          structure = {
            title: typeof form[8] === "string" ? form[8] : "",
            items: items.map((raw: unknown): SchemaItem => {
              const item = Array.isArray(raw) ? raw : [];
              return {
                id: Number(item[0]),
                title: typeof item[1] === "string" ? item[1] : "",
                description: typeof item[2] === "string" ? item[2] : null,
                type: Number(item[3]),
                entries: Array.isArray(item[4]) ? item[4] as Entry[] : null,
                next: typeof item[5] === "number" ? item[5] : null,
              };
            }),
          };
        }
      }
      const groups = [...document.querySelectorAll('[role="radiogroup"]')].map((group, index) => {
        const block = group.closest('[role="listitem"]');
        const params = block?.querySelector('[data-params]')?.getAttribute("data-params") ?? "";
        const blockId = Number(params.match(/%\.@\.\[(\d+)/)?.[1]);
        const labelled = (group.getAttribute("aria-labelledby") ?? "").split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
        const radios = [...group.querySelectorAll('[role="radio"]')].filter(visible);
        return { index, blockId, label: `${group.getAttribute("aria-label") ?? ""} ${labelled}`, visible: visible(group), options: radios.map((radio) => radio.getAttribute("data-value") ?? radio.getAttribute("aria-label") ?? ""), selected: radios.find((radio) => radio.getAttribute("aria-checked") === "true")?.getAttribute("data-value") ?? radios.find((radio) => radio.getAttribute("aria-checked") === "true")?.getAttribute("aria-label") ?? null };
      }).filter((group) => group.visible);
      const buttons = [...document.querySelectorAll('[role="button"],button')].filter(visible).map((button) => (button.textContent ?? "").normalize("NFC").replace(/\s+/g, " ").trim());
      const challenge = [...document.querySelectorAll('iframe[src*="recaptcha"],iframe[src*="captcha"],input[type="password"]')].some(visible);
      const blocker = challenge || /verify (?:that )?you are (?:a )?human|unusual traffic|xác minh bạn là con người/i.test(body) ? "CAPTCHA or identity challenge requires manual review" :
        /sign in to continue|you need permission|you must be signed in|đăng nhập để tiếp tục|bạn cần có quyền/i.test(body) ? "Login or permission is required" : null;
      const lines = body.normalize("NFC").split(/\n/).map((line) => line.replace(/\s+/g, " ").trim());
      return { structure, groups, buttons, lines, blocker, confirmation: confirmations.some((message) => lines.includes(message)) };
    }, CONFIRMATION_MESSAGES);
    this.groups.clear();
    const fields = dom.groups.map((group) => {
      const item = this.schema.structure.items.find((candidate) => candidate.id === group.blockId);
      if (!item?.entries) throw new Error("Unknown visible form question");
      const code = item.type === 7 ? group.label.match(/\[([A-Z]{1,3}\d)\]/)?.[1] : codeOf(item, item.entries[0]!);
      if (!code || !item.entries.some((entry) => codeOf(item, entry) === code) || this.groups.has(code)) throw new Error("Matrix row label missing or ambiguous");
      this.groups.set(code, group.index);
      return { code, options: group.options, selected: group.selected };
    });
    const nextCount = dom.buttons.filter((text) => NAVIGATION_LABELS.next.includes(text)).length;
    const submitCount = dom.buttons.filter((text) => NAVIGATION_LABELS.submit.includes(text)).length;
    const terminalTitles = this.schema.structure.items
      .filter((item) => item.type === 8 && item.next === -3)
      .map((item) => normalizeOption(item.title));
    const terminalNextSubmit = fields.length === 0 && nextCount === 1 && submitCount === 0
      && terminalTitles.filter((title) => dom.lines.includes(title)).length === 1;
    this.submitUsesNextControl = terminalNextSubmit;
    return {
      url: this.page.url(), structure: dom.structure, fields,
      next: nextCount === 1 && !terminalNextSubmit,
      submit: submitCount === 1 || terminalNextSubmit,
      confirmation: dom.confirmation && /\/formResponse(?:[?#]|$)/.test(this.page.url()),
      blocker: dom.blocker ?? (nextCount > 1 || submitCount > 1 || (nextCount === 1 && submitCount === 1) ? "Navigation control is missing or ambiguous" : null),
    };
  }
  async choose(code: string, option: string): Promise<void> {
    const index = this.groups.get(code);
    if (index === undefined) throw new Error(`Visible field missing: ${code}`);
    // snapshot() stores indices from this same unfiltered CSS node list, not the accessibility tree.
    const group = this.page.locator('[role="radiogroup"]').nth(index);
    if (!await group.isVisible()) throw new Error(`Visible field missing: ${code}`);
    const expected = normalizeOption(option);
    const radios = await group.locator('[role="radio"]').elementHandles();
    try {
      const matches: typeof radios = [];
      for (const radio of radios) {
        const value = await radio.getAttribute("data-value") ?? await radio.getAttribute("aria-label") ?? "";
        if (await radio.isVisible() && normalizeOption(value) === expected) matches.push(radio);
      }
      if (matches.length !== 1) throw new Error(`Exact option value unavailable or ambiguous: ${code}`);
      // Hold the exact matching element, then recheck current siblings before a real click.
      // Matrix accessible names append question context; source identity remains data-value.
      const radio = matches[0]!;
      const unchanged = await radio.evaluate((element, value) => {
        if (!(element instanceof Element)) return false;
        const visible = (node: Element) => !!(node as HTMLElement).getClientRects().length && getComputedStyle(node).visibility !== "hidden";
        const normalize = (text: string) => text.normalize("NFC").replace(/\s+/g, " ").trim();
        const parent = element.closest('[role="radiogroup"]');
        if (!element.isConnected || !parent || !visible(parent)) return false;
        const exact = [...parent.querySelectorAll('[role="radio"]')].filter((node) =>
          visible(node) && normalize(node.getAttribute("data-value") ?? node.getAttribute("aria-label") ?? "") === value);
        return exact.length === 1 && exact[0] === element;
      }, expected);
      if (!unchanged) throw new Error(`Exact option changed before click: ${code}`);
      await radio.click({ timeout: 15_000 });
      const selectedValue = await radio.getAttribute("data-value") ?? await radio.getAttribute("aria-label") ?? "";
      if (await radio.getAttribute("aria-checked") !== "true" || normalizeOption(selectedValue) !== expected) {
        throw new Error(`Selection did not persist: ${code}`);
      }
    } finally { await Promise.all(radios.map((radio) => radio.dispose())); }
  }
  private async press(action: NavigationAction): Promise<void> {
    const labels = action === "submit" && this.submitUsesNextControl ? NAVIGATION_LABELS.next : NAVIGATION_LABELS[action];
    const ready = await this.page.waitForFunction(formTransitionMarker, { before: null, submitting: false, confirmations: CONFIRMATION_MESSAGES, labels }, { timeout: 30_000 });
    const before = await ready.jsonValue();
    await ready.dispose();
    if (typeof before !== "string") throw new Error("Form question identities are unavailable");
    const buttons = await this.page.locator('[role="button"],button').elementHandles();
    try {
      const matches: typeof buttons = [];
      for (const button of buttons) {
        if (await button.isVisible() && labels.includes(normalizeOption(await button.textContent() ?? ""))) matches.push(button);
      }
      if (matches.length !== 1) throw new Error("Navigation control is missing or ambiguous");
      const button = matches[0]!;
      const unchanged = await button.evaluate((element, allowed) => {
        if (!(element instanceof Element) || !element.isConnected) return false;
        const visible = (node: Element) => !!(node as HTMLElement).getClientRects().length && getComputedStyle(node).visibility !== "hidden";
        const normalize = (text: string) => text.normalize("NFC").replace(/\s+/g, " ").trim();
        const current = [...document.querySelectorAll('[role="button"],button')].filter((node) =>
          visible(node) && allowed.includes(normalize(node.textContent ?? "")));
        return current.length === 1 && current[0] === element;
      }, labels);
      if (!unchanged) throw new Error("Navigation control changed before click");
      // The fixed Google form performs full-document POST navigation. Arm the waiter before
      // the final click, including when /formResponse navigates to the same pathname.
      const finalNavigation = action === "submit"
        ? this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30_000 })
        : null;
      await button.click({ timeout: 15_000 });
      if (finalNavigation) {
        await finalNavigation;
        return;
      }
    } finally { await Promise.all(buttons.map((button) => button.dispose())); }
    const nextLabels = action === "next" ? [...NAVIGATION_LABELS.next, ...NAVIGATION_LABELS.submit] : labels;
    const transition = await this.page.waitForFunction(formTransitionMarker, { before, submitting: action === "submit", confirmations: CONFIRMATION_MESSAGES, labels: nextLabels }, { timeout: 30_000 });
    await transition.dispose();
    await this.page.waitForLoadState("domcontentloaded");
  }
  async next(): Promise<void> { await this.press("next"); }
  async submit(): Promise<void> { await this.press("submit"); }
}

export async function runFixedFormRow(row: FixedDatasetRow, hooks: FormRunHooks): Promise<FormRunResult> {
  const emptyIntent: SubmissionIntent = { expectedStatus: "succeeded", terminalPageId: null, terminalPageTitle: null, closeReason: null };
  if (process.env.FORM_COPILOT_ENABLE_SUBMISSIONS !== "true") return { ...emptyIntent, status: "failed", detail: "Live submissions are disabled in this runtime." };
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  try {
    validateFixedRow(row);
    const schema = await loadFixedFormSchema();
    const executablePath = process.env.FORM_COPILOT_BROWSER_EXECUTABLE_PATH;
    const browserEnv = Object.fromEntries(["PATH", "HOME", "USERPROFILE", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "TMPDIR", "LANG", "LC_ALL", "XDG_RUNTIME_DIR"].filter((key) => process.env[key] !== undefined).map((key) => [key, process.env[key]!]));
    browser = await chromium.launch({ headless: process.env.FORM_COPILOT_BROWSER_HEADLESS !== "false", chromiumSandbox: true, env: browserEnv, ...(executablePath ? { executablePath } : {}) });
    context = await browser.newContext({ locale: "en-US", serviceWorkers: "block" });
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    return await runFixedFormWithPage(row, hooks, new PlaywrightFixedFormPage(page, schema), schema);
  } catch {
    return { ...emptyIntent, status: "failed", detail: "Could not initialize the fixed-form browser or validated dataset. Check executable, sandbox support and schema files." };
  } finally {
    await context?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);
  }
}
