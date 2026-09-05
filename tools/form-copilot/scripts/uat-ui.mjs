import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const baseUrl = "http://127.0.0.1:5173";
const formUrl = `${baseUrl}/demo-form.html`;
const output = resolve("artifacts/ui-audit");
const widths = [359, 699, 700, 701, 899, 900, 1019, 1020, 1021, 1440];
const results = [];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

async function overflow(page) {
  return page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
}

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    const start = await overflow(page);
    await page.getByLabel("URL form").fill(formUrl);
    await page.getByRole("button", { name: "Mở & đọc form" }).click();
    await page.getByRole("heading", { name: "Khảo sát trải nghiệm workshop" }).waitFor({ timeout: 20_000 });
    const workspace = await overflow(page);
    await page.getByRole("button", { name: "Phân tích và tạo đề xuất" }).click();
    await page.getByText("Review queue", { exact: true }).waitFor({ timeout: 20_000 });
    const review = await overflow(page);
    results.push({ width, start, workspace, review, pass: [start, workspace, review].every((state) => state.content <= state.viewport) });
    await page.getByRole("button", { name: "Đóng phiên" }).click();
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const element = document.activeElement;
    const style = element ? getComputedStyle(element) : null;
    return { tag: element?.tagName ?? "", name: element?.getAttribute("aria-label") ?? element?.textContent?.trim().slice(0, 80) ?? "", outline: style?.outlineStyle ?? "none" };
  });
  await page.getByRole("button", { name: "Mở lịch sử" }).click();
  await page.getByRole("dialog", { name: "Lịch sử" }).waitFor();
  await page.waitForTimeout(250);
  const historyBox = await page.getByRole("dialog", { name: "Lịch sử" }).boundingBox();
  await page.screenshot({ path: resolve(output, "intermediate-history.png") });
  await page.keyboard.press("Escape");
  const historyClosed = await page.getByRole("dialog", { name: "Lịch sử" }).count() === 0;
  await page.getByRole("button", { name: "Hồ sơ local" }).click();
  await page.getByRole("dialog", { name: "Hồ sơ local" }).waitFor();
  await page.waitForTimeout(250);
  const profileBox = await page.getByRole("dialog", { name: "Hồ sơ local" }).boundingBox();
  await page.screenshot({ path: resolve(output, "intermediate-profile.png") });
  console.log(JSON.stringify({ boundaries: results, focus, historyClosed, historyBox, profileBox }, null, 2));
  await page.close();
} finally {
  await browser.close();
}
