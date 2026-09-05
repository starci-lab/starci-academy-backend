// Run in the final image with --network none, its normal non-root USER and
// reviewed seccomp policy. No application config, database, credentials or URLs.
import { readFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { chromium } from "playwright-core";

let browser;
let context;
let stage = "preconditions";
let report;
try {
  if (process.platform !== "linux" || typeof process.getuid !== "function") throw new Error("Run this proof in the final Linux container, not the host workstation");
  if (process.getuid() === 0) throw new Error("Refusing root: use the image's non-root user");
  const status = await readFile("/proc/self/status", "utf8");
  const seccompMode = Number(status.match(/^Seccomp:\s*(\d+)$/m)?.[1]);
  if (seccompMode !== 2) throw new Error("A filtering seccomp policy must be active; unconfined execution is not a valid proof");
  for (const kind of ["CapEff", "CapPrm", "CapBnd"]) {
    const mask = status.match(new RegExp(`^${kind}:\\s*([0-9a-f]+)$`, "m"))?.[1];
    if (!mask || (BigInt(`0x${mask}`) & (1n << 21n)) !== 0n) throw new Error("CAP_SYS_ADMIN or privileged execution is not permitted for this proof");
  }
  if (Object.values(networkInterfaces()).flat().some((entry) => entry && !entry.internal)) throw new Error("Run with --network none; only loopback interfaces are permitted");
  stage = "sandboxed-launch";
  // Do not pass database/auth/API credentials from the app process to Chromium.
  const env = Object.fromEntries(["PATH", "HOME", "LANG", "LC_ALL", "TMPDIR", "XDG_RUNTIME_DIR"].filter((key) => process.env[key] !== undefined).map((key) => [key, process.env[key]]));
  const executablePath = process.env.FORM_COPILOT_BROWSER_EXECUTABLE_PATH;
  browser = await chromium.launch({ headless: true, chromiumSandbox: true, args: ["--enable-automation"], timeout: 30_000, env, ...(executablePath ? { executablePath } : {}) });
  const cdp = await browser.newBrowserCDPSession();
  const command = await cdp.send("Browser.getBrowserCommandLine");
  const forbiddenFlags = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-seccomp-filter-sandbox", "--disable-namespace-sandbox", "--single-process", "--no-zygote"];
  if (command.arguments.some((argument) => forbiddenFlags.some((flag) => argument === flag || argument.startsWith(`${flag}=`)))) throw new Error("A sandbox-disabling browser argument was present");
  await cdp.detach();
  stage = "local-renderer";
  context = await browser.newContext({ offline: true, serviceWorkers: "block" });
  let interceptedRequests = 0;
  await context.route("**/*", async (route) => { interceptedRequests++; await route.abort("blockedbyclient"); });
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  await page.setContent('<!doctype html><html><head><meta charset="utf-8"><title>Local sandbox proof</title></head><body><h1>Local synthetic browser smoke</h1><label><input type="radio" name="proof" value="local-only">Local only</label><output id="result"></output><script>document.querySelector("input").addEventListener("change", () => { document.querySelector("output").textContent = "Local renderer completed"; });</script></body></html>');
  await page.getByRole("radio", { name: "Local only", exact: true }).check();
  if (await page.locator("#result").innerText() !== "Local renderer completed" || page.url() !== "about:blank") throw new Error("Local renderer interaction did not complete");
  if (interceptedRequests !== 0) throw new Error("Unexpected network request from the local-only smoke fixture");
  report = { ok: true, platform: "linux", uid: process.getuid(), containerSeccompMode: seccompMode, capSysAdmin: false, network: "loopback-only; context offline; requests blocked", chromiumSandboxRequested: true, sandboxDisablingFlagsPresent: false, sandboxedLaunch: true, browserVersion: browser.version(), localRendererProof: true, remoteRequests: 0, liveFormSubmissions: 0 };
} catch (error) {
  process.exitCode = 1;
  // First line only: do not dump launch commands, inherited environment or logs.
  report = { ok: false, stage, detail: error instanceof Error ? error.message.split("\n")[0].slice(0, 300) : "Browser smoke failed", liveFormSubmissions: 0 };
} finally {
  let cleanupFailed = false;
  try { await context?.close(); } catch { cleanupFailed = true; }
  try { await browser?.close(); } catch { cleanupFailed = true; }
  if (cleanupFailed) { process.exitCode = 1; report = { ok: false, stage: "cleanup", detail: "Browser context did not close cleanly", liveFormSubmissions: 0 }; }
}
console.log(JSON.stringify(report));
