import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function list(value: string | undefined, fallback: string[]): string[] {
  return (value ? value.split(",") : fallback).map((item) => item.trim()).filter(Boolean);
}

function pairingSecret(): string {
  if (process.env.FORM_COPILOT_PAIRING_SECRET) return process.env.FORM_COPILOT_PAIRING_SECRET;
  const dataDirectory = resolve(".data");
  const path = resolve(dataDirectory, "pairing-secret");
  mkdirSync(dataDirectory, { recursive: true });
  if (existsSync(path)) return readFileSync(path, "utf8").trim();
  const secret = randomBytes(24).toString("base64url");
  writeFileSync(path, secret, { encoding: "utf8", mode: 0o600 });
  return secret;
}

export const config = {
  host: process.env.FORM_COPILOT_HOST ?? "127.0.0.1",
  port: Number(process.env.FORM_COPILOT_PORT ?? 4317),
  pairingSecret: pairingSecret(),
  openRouterKey: process.env.OPENROUTER_API_KEY,
  openRouterModel: process.env.OPENROUTER_MODEL ?? "~openai/gpt-latest",
  allowedOrigins: list(process.env.FORM_COPILOT_ALLOWED_FORM_ORIGINS, [
    "http://localhost:*",
    "http://127.0.0.1:*",
  ]),
  syntheticOrigins: list(process.env.FORM_COPILOT_SYNTHETIC_ORIGINS, [
    "http://localhost:*",
    "http://127.0.0.1:*",
  ]),
} as const;

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65_535) {
  throw new Error("FORM_COPILOT_PORT must be a valid TCP port");
}
