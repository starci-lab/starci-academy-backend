// Local production-image proof only; does not submit forms or touch the VPS.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const image = process.argv[2];
if (!image || !/^form-copilot:[a-zA-Z0-9_.-]+$/.test(image)) throw new Error("Supply the local form-copilot image tag");
const port = 14317;
const probe = createServer();
await new Promise((resolvePromise, reject) => probe.once("error", reject).listen({ host: "127.0.0.1", port, exclusive: true }, resolvePromise));
await new Promise((resolvePromise) => probe.close(resolvePromise));
const name = `form-copilot-smoke-${randomBytes(5).toString("hex")}`;
const password = randomBytes(32).toString("hex");
const env = { ...process.env, DATABASE_URL: "postgresql://form_copilot:form_copilot@host.docker.internal:54329/form_copilot", FORM_COPILOT_AUTH_PASSWORD: password };
const docker = (args) => execFileSync("docker", args, { cwd: root, env, windowsHide: true, timeout: 60_000, encoding: "utf8" }).trim();
let id;
try {
  id = docker(["run", "-d", "--name", name, "--init", "--security-opt", `seccomp=${resolve(root, "infra/vps/seccomp_profile.json")}`, "-p", `127.0.0.1:${port}:4317`, "--env", "DATABASE_URL", "--env", "FORM_COPILOT_AUTH_PASSWORD", "--env", "FORM_COPILOT_ENABLE_SUBMISSIONS=false", image]);
  const base = `http://127.0.0.1:${port}`;
  for (let count = 0; ; count++) {
    try { if ((await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) })).ok) break; } catch {}
    if (count >= 30) throw new Error("Container did not become healthy; inspect its sanitized startup logs");
    await new Promise(resolvePromise => setTimeout(resolvePromise, 500));
  }
  const auth = { Authorization: `Basic ${Buffer.from(`operator:${password}`).toString("base64")}` };
  assert.equal((await fetch(base)).status, 401);
  assert.equal((await fetch(`${base}/api/fixed/meta`)).status, 401);
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
  assert.equal((await fetch(`${base}/api/fixed/batches`, { method: "POST", headers: { Origin: "https://form.doanhnghieptayson.vn", "Content-Type": "application/json" }, body: "{}" })).status, 401);
  const preflight = await fetch(`${base}/api/fixed/batches`, { method: "OPTIONS", headers: { Origin: "https://form.doanhnghieptayson.vn", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,content-type" } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "https://form.doanhnghieptayson.vn");
  assert.equal((await fetch(`${base}/api/fixed/batches`, { method: "POST", headers: { ...auth, Origin: "https://elsewhere.invalid", "Content-Type": "application/json" }, body: "{}" })).status, 403);
  const meta = await (await fetch(`${base}/api/fixed/meta`, { headers: auth })).json();
  assert.equal(meta.synthetic, true);
  assert.equal(meta.enabled, false);
  assert.equal(meta.totalCount, 519);
  assert.equal(meta.completingCount, 519);
  assert.equal(meta.screenedOutCount, 0);
  assert.equal(meta.eligibleCount, 519);
  assert.equal((await fetch(base, { headers: auth })).status, 200);
  assert.equal((await fetch(`${base}/api/ai/analyze`, { method: "POST", headers: auth })).status, 404);
  console.log(JSON.stringify({ ok: true, image, containerId: id, authenticatedUi: true, unauthenticatedBlocked: true, corsPreflight: true, csrfBlocked: true, postgresReady: true, fixedDatasetRows: meta.eligibleCount, submissionsEnabled: false, createdBatches: 0, liveSubmissions: 0, deployed: false }));
} finally {
  // Remove only the exact ephemeral container created above; preserve all volumes.
  if (id && /^[a-f0-9]{64}$/.test(id)) docker(["rm", "-f", id]);
}
