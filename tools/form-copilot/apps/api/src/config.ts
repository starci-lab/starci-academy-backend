import { config as loadEnvironment } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
loadEnvironment({ path: resolve(projectRoot, ".env.local"), quiet: true });
loadEnvironment({ path: resolve(projectRoot, ".env"), quiet: true });

function list(value: string | undefined, fallback: string[]): string[] {
  return (value ? value.split(",") : fallback).map((item) => item.trim()).filter(Boolean);
}

const port = Number(process.env.FORM_COPILOT_PORT ?? 4317);
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("FORM_COPILOT_PORT must be a valid TCP port");
const production = process.env.NODE_ENV === "production";
const authUser = process.env.FORM_COPILOT_AUTH_USER ?? "operator";
const authPassword = process.env.FORM_COPILOT_AUTH_PASSWORD ?? "";
if (production && (!process.env.DATABASE_URL || authPassword.length < 20 || /^replace[_-]/i.test(authPassword))) {
  throw new Error("Production requires DATABASE_URL and a FORM_COPILOT_AUTH_PASSWORD of at least 20 characters");
}
if (authUser.includes(":") || !authUser.trim()) throw new Error("Invalid dashboard authentication username");

export const appConfig = {
  host: process.env.FORM_COPILOT_HOST ?? "127.0.0.1",
  port,
  production,
  authUser,
  authPassword,
  publicOrigins: list(process.env.FORM_COPILOT_PUBLIC_ORIGINS, production
    ? ["https://form.doanhnghieptayson.vn", "https://api.form.doanhnghieptayson.vn"]
    : ["http://localhost:4317", "http://127.0.0.1:4317", "http://localhost:5173", "http://127.0.0.1:5173"]),
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://form_copilot:form_copilot@127.0.0.1:54329/form_copilot",
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openRouterModel: process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4-flash",
  allowedOrigins: list(process.env.FORM_COPILOT_ALLOWED_FORM_ORIGINS, ["http://localhost:*", "http://127.0.0.1:*"]),
  syntheticOrigins: list(process.env.FORM_COPILOT_SYNTHETIC_ORIGINS, ["http://localhost:*", "http://127.0.0.1:*"]),
} as const;
