import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const command = process.argv[2] ?? "print";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entry = resolve(root, "apps/api/dist/main.js");
const label = "com.formcopilot.api";
const agent = resolve(homedir(), `Library/LaunchAgents/${label}.plist`);
const logDir = resolve(homedir(), "Library/Logs/FormCopilot");
const uid = process.getuid?.();

function xml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function plist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key><array><string>${xml(process.execPath)}</string><string>${xml(entry)}</string></array>
  <key>WorkingDirectory</key><string>${xml(root)}</string>
  <key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
  <key>ProcessType</key><string>Interactive</string>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>EnvironmentVariables</key><dict><key>NODE_ENV</key><string>production</string></dict>
  <key>StandardOutPath</key><string>${xml(resolve(logDir, "api.log"))}</string>
  <key>StandardErrorPath</key><string>${xml(resolve(logDir, "api.error.log"))}</string>
</dict></plist>\n`;
}

if (command === "print") {
  process.stdout.write(plist());
  process.exit(0);
}

if (process.platform !== "darwin" || uid === undefined) {
  throw new Error("macOS LaunchAgent commands must run on macOS. Use `npm run service:mac:print` to inspect the generated plist elsewhere.");
}

if (command === "install") {
  if (!existsSync(entry)) throw new Error("Build first with `npm run build`.");
  if (!existsSync(resolve(root, ".env.local"))) throw new Error("Create .env.local first; credentials are never embedded in the plist.");
  mkdirSync(dirname(agent), { recursive: true });
  mkdirSync(logDir, { recursive: true });
  writeFileSync(agent, plist(), { mode: 0o600 });
  try { execFileSync("launchctl", ["bootout", `gui/${uid}`, agent], { stdio: "ignore" }); } catch { /* not loaded */ }
  execFileSync("launchctl", ["bootstrap", `gui/${uid}`, agent], { stdio: "inherit" });
  execFileSync("launchctl", ["kickstart", "-k", `gui/${uid}/${label}`], { stdio: "inherit" });
  console.log(`Installed ${label}. Logs: ${logDir}`);
} else if (command === "uninstall") {
  try { execFileSync("launchctl", ["bootout", `gui/${uid}`, agent], { stdio: "inherit" }); } catch { /* already stopped */ }
  if (existsSync(agent)) rmSync(agent);
  console.log(`Uninstalled ${label}. Local database and logs were kept.`);
} else {
  throw new Error("Expected install, uninstall, or print");
}
