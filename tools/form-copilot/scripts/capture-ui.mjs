import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const baseUrl = process.env.FORM_COPILOT_UI_URL ?? "http://127.0.0.1:5173";
const formUrl = `${baseUrl}/demo-form.html`;
const output = resolve("artifacts/ui-audit");
const viewports = [
  { name: "wide", width: 1440, height: 1000 },
  { name: "intermediate", width: 900, height: 1000 },
  { name: "compact", width: 390, height: 844 },
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.screenshot({ path: resolve(output, `${viewport.name}-start.png`), fullPage: true });
    await page.getByLabel("URL form").fill(formUrl);
    await page.getByRole("button", { name: "Mở & đọc form" }).click();
    await page.getByRole("heading", { name: "Khảo sát trải nghiệm workshop" }).waitFor({ timeout: 20_000 });
    await page.locator(".browser-frame img").evaluate((image) => image.complete && image.naturalWidth > 0 || new Promise((resolveLoaded) => image.addEventListener("load", () => resolveLoaded(true), { once: true })));
    await page.screenshot({ path: resolve(output, `${viewport.name}-workspace.png`), fullPage: true });
    await page.getByRole("button", { name: "Phân tích và tạo đề xuất" }).click();
    await page.getByText("Review queue", { exact: true }).waitFor({ timeout: 20_000 });
    await page.screenshot({ path: resolve(output, `${viewport.name}-review.png`), fullPage: true });
    await page.getByRole("button", { name: "Đóng phiên" }).click();
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(`Captured ${viewports.length * 3} screenshots in ${output}`);
