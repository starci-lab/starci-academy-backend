import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

export interface DashboardSecurityOptions { username: string; password: string; allowedOrigins: readonly string[] }

export function credentialsMatch(header: string | undefined, username: string, password: string): boolean {
  if (!header || header.length > 2_048 || !/^Basic [A-Za-z0-9+/]+={0,2}$/i.test(header)) return false;
  const decoded = Buffer.from(header.slice(6), "base64");
  const actual = createHash("sha256").update(decoded).digest();
  decoded.fill(0);
  const expected = createHash("sha256").update(`${username}:${password}`).digest();
  return timingSafeEqual(actual, expected);
}

export function dashboardSecurity(options: DashboardSecurityOptions): RequestHandler {
  return (request, response, next) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "same-origin");
    response.setHeader("Cache-Control", "no-store");
    // A preflight carries no credentials. It grants no access to the actual operation.
    if (request.method === "OPTIONS" && request.headers["access-control-request-method"]) {
      const origin = request.headers.origin;
      const method = request.headers["access-control-request-method"];
      const headers = String(request.headers["access-control-request-headers"] ?? "").toLowerCase().split(",").map((item) => item.trim()).filter(Boolean);
      if (!origin || !options.allowedOrigins.includes(origin) || !["GET", "POST"].includes(String(method)) || headers.some((item) => !["authorization", "content-type"].includes(item))) {
        response.status(403).json({ message: "Nguồn yêu cầu không được phép." });
        return;
      }
      next();
      return;
    }
    const healthOnly = request.method === "GET" && request.path === "/api/health";
    if (!healthOnly && options.password && !credentialsMatch(request.headers.authorization, options.username, options.password)) {
      response.setHeader("WWW-Authenticate", 'Basic realm="Form Scheduler", charset="UTF-8"');
      response.status(401).json({ message: "Cần đăng nhập để sử dụng công cụ." });
      return;
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.origin;
      if ((origin && !options.allowedOrigins.includes(origin)) || request.headers["sec-fetch-site"] === "cross-site") {
        response.status(403).json({ message: "Nguồn yêu cầu không được phép." });
        return;
      }
    }
    next();
  };
}
