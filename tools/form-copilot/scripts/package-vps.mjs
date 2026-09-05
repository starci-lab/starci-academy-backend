import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "artifacts/vps");
const includes = ["package.json", "package-lock.json", "tsconfig.base.json", "Dockerfile", ".dockerignore", "README.md", "scope.yaml", "apps/api/package.json", "apps/api/tsconfig.json", "apps/api/src", "apps/api/data", "apps/web/package.json", "apps/web/tsconfig.json", "apps/web/index.html", "apps/web/vite.config.ts", "apps/web/src", "apps/web/public", "packages/contracts/package.json", "packages/contracts/tsconfig.json", "packages/contracts/src", "infra/vps/compose.yaml", "infra/vps/Caddyfile", "infra/vps/DEPLOY.md", "infra/vps/seccomp_profile.json", "infra/vps/seccomp-provenance.json", "scripts/smoke-browser.mjs"];
const files = [];
const forbidden = /(?:^|\/)(?:\.env(?:\..*)?|node_modules|\.git|browser-profile[^/]*)(?:\/|$)|\.(?:key|pem|p12|pfx)$/i;
async function collect(path) {
  const full = resolve(root, path);
  if (!full.startsWith(root + sep)) throw new Error("Package path escapes project");
  const info = await lstat(full);
  if (info.isSymbolicLink()) throw new Error(`Do not package symlinks: ${path}`);
  const name = relative(root, full).split(sep).join("/");
  if (forbidden.test(name)) throw new Error(`Sensitive/ignored path in package: ${name}`);
  if (info.isDirectory()) {
    for (const child of await readdir(full)) await collect(`${name}/${child}`);
  } else {
    const contents = await readFile(full);
    if (/-----BEGIN (?:OPENSSH |RSA |EC )?PRIVATE KEY-----/.test(contents.toString("utf8"))) throw new Error(`Private key detected: ${name}`);
    if (/sk-or-v1-[a-f0-9]{32,}/i.test(contents.toString("utf8"))) throw new Error(`API key detected: ${name}`);
    files.push({ path: name, size: contents.length, sha256: createHash("sha256").update(contents).digest("hex") });
  }
}
includes.push(".stacks/vps/README.md", "scripts/package-vps.mjs", "scripts/macos-service.mjs");
for (const entry of includes) await collect(entry);
files.sort((a, b) => a.path.localeCompare(b.path));
const digest = createHash("sha256").update(JSON.stringify(files)).digest("hex");
await mkdir(output, { recursive: true });
const archive = resolve(output, `form-copilot-${digest.slice(0, 16)}.tar.gz`);
execFileSync("tar", ["-czf", archive, "-C", root, ...files.map(file => file.path)], { windowsHide: true, timeout: 60_000 });
// Verify the bytes actually packaged, not only the source before tar read it.
for (const file of files) {
  const contents = execFileSync("tar", ["-xOf", archive, file.path], { windowsHide: true, timeout: 15_000, maxBuffer: 20 * 1024 * 1024 });
  if (contents.length !== file.size || createHash("sha256").update(contents).digest("hex") !== file.sha256) {
    throw new Error(`Archive/source mismatch; do not deploy this archive: ${file.path}`);
  }
}
const archiveDigest = createHash("sha256").update(await readFile(archive)).digest("hex");
const manifest = { generatedAt: new Date().toISOString(), sourceDigest: digest, archiveSha256: archiveDigest, archive, files, secretsIncluded: false, deployed: false };
await writeFile(resolve(output, "package-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ archive, fileCount: files.length, sourceDigest: digest, archiveSha256: archiveDigest, secretsIncluded: false, deployed: false }, null, 2));
