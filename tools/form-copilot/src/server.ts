import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { ZodError, z } from "zod";
import { OpenRouterAgent } from "./agent/openrouter.js";
import { config } from "./config.js";
import { AnalyzeRequestSchema, ProfileSchema } from "./domain/contracts.js";
import { originAllowed } from "./domain/policy.js";
import { analyzeForm } from "./services/analyze.js";
import { LocalStore } from "./storage/store.js";

const app = express();
const store = new LocalStore();
const agent = new OpenRouterAgent(config.openRouterKey, config.openRouterModel);
const policy = { allowedOrigins: [...config.allowedOrigins], syntheticOrigins: [...config.syntheticOrigins] };

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function cors(request: Request, response: Response, next: NextFunction): void {
  const origin = request.headers.origin;
  if (origin && (origin.startsWith("chrome-extension://") || origin === `http://${config.host}:${config.port}`)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Form-Copilot-Secret");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  }
  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }
  next();
}

function authenticate(request: Request, response: Response, next: NextFunction): void {
  const candidate = request.header("x-form-copilot-secret") ?? "";
  if (!safeEqual(candidate, config.pairingSecret)) {
    response.status(401).json({ error: "PAIRING_REQUIRED", message: "Pair the extension with the local agent." });
    return;
  }
  next();
}

app.disable("x-powered-by");
app.use(cors);
app.use(express.json({ limit: "256kb", strict: true }));
app.use(express.static(resolve("public"), { extensions: ["html"] }));

app.get("/", (_request, response) => response.redirect("/demo"));
app.get("/v1/health", (_request, response) => {
  response.json({
    status: "ok",
    version: "0.1.0",
    provider: "openrouter",
    configured: agent.configured,
    model: agent.model,
  });
});

app.use("/v1", authenticate);

app.post("/v1/policy/check", (request, response) => {
  const input = z.object({ url: z.string().url(), mode: z.enum(["assist", "synthetic"]) }).strict().parse(request.body);
  const allowed = originAllowed(input.url, input.mode === "synthetic" ? policy.syntheticOrigins : policy.allowedOrigins);
  response.json({ allowed, origin: new URL(input.url).origin, mode: input.mode });
});

app.post("/v1/analyze", async (request, response, next) => {
  try {
    const input = AnalyzeRequestSchema.parse(request.body);
    response.json(await analyzeForm(input, policy, agent, store));
  } catch (error) {
    next(error);
  }
});

app.get("/v1/profile", (_request, response) => response.json({ profile: store.getProfile() }));
app.put("/v1/profile", (request, response) => {
  const profile = ProfileSchema.parse(request.body);
  store.setProfile(profile);
  response.json({ saved: true, profile });
});

app.get("/v1/history", (request, response) => {
  const limit = z.coerce.number().int().min(1).max(100).catch(30).parse(request.query.limit);
  response.json({ items: store.listHistory(limit) });
});

app.post("/v1/privacy/clear", (request, response) => {
  const input = z.object({ confirmation: z.literal("DELETE LOCAL DATA") }).strict().parse(request.body);
  void input;
  store.clearPrivateData();
  response.json({ cleared: true });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    response.status(400).json({ error: "INVALID_INPUT", issues: error.issues });
    return;
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status = /allowlist|outside scope|Synthetic mode/i.test(message) ? 403 : 500;
  response.status(status).json({ error: status === 403 ? "POLICY_BLOCKED" : "AGENT_ERROR", message });
});

app.listen(config.port, config.host, () => {
  console.log(`Form Copilot listening at http://${config.host}:${config.port}`);
  console.log(`Demo form: http://${config.host}:${config.port}/demo`);
  console.log(`Pairing secret: ${config.pairingSecret}`);
  console.log(agent.configured ? `OpenRouter model: ${agent.model}` : "OpenRouter key: not configured");
});
