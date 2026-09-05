import { describe, expect, it } from "vitest";
import { credentialsMatch, dashboardSecurity } from "./dashboard-security.js";

describe("dashboard authentication", () => {
  const encoded = (value: string) => `Basic ${Buffer.from(value).toString("base64")}`;
  it("matches only the exact configured credential", () => {
    expect(credentialsMatch(encoded("operator:example-test-password"), "operator", "example-test-password")).toBe(true);
    expect(credentialsMatch(encoded("operator:wrong"), "operator", "example-test-password")).toBe(false);
    expect(credentialsMatch(encoded("else:example-test-password"), "operator", "example-test-password")).toBe(false);
  });
  it("rejects missing, invalid or oversized headers", () => {
    for (const header of [undefined, "Bearer x", "Basic %%%", "Basic " + "a".repeat(3_000)]) {
      expect(credentialsMatch(header, "operator", "password")).toBe(false);
    }
  });
  it("does not bypass security for a route starting with the health path", () => {
    const statuses: number[] = [];
    const middleware = dashboardSecurity({ username: "operator", password: "password", allowedOrigins: [] });
    const response = { setHeader: () => {}, status: (value: number) => { statuses.push(value); return response; }, json: () => {} };
    middleware({ method: "GET", path: "/api/health/anything", headers: {} } as never, response as never, () => { throw new Error("must not call next"); });
    expect(statuses).toEqual([401]);
  });
  it("blocks cross-origin writes even with valid authentication", () => {
    const statuses: number[] = [];
    const middleware = dashboardSecurity({ username: "operator", password: "password", allowedOrigins: ["https://form.doanhnghieptayson.vn"] });
    const response = { setHeader: () => {}, status: (value: number) => { statuses.push(value); return response; }, json: () => {} };
    middleware({ method: "POST", path: "/api/fixed/batches", headers: { authorization: encoded("operator:password"), origin: "https://elsewhere.invalid" } } as never, response as never, () => { throw new Error("must not call next"); });
    expect(statuses).toEqual([403]);
  });
  it("allows only valid preflights, not unauthenticated actual operations", () => {
    const statuses: number[] = [];
    let calls = 0;
    const middleware = dashboardSecurity({ username: "operator", password: "password", allowedOrigins: ["https://form.doanhnghieptayson.vn"] });
    const response = { setHeader: () => {}, status: (value: number) => { statuses.push(value); return response; }, json: () => {} };
    const headers = { origin: "https://form.doanhnghieptayson.vn", "access-control-request-method": "POST", "access-control-request-headers": "authorization,content-type" };
    middleware({ method: "OPTIONS", path: "/api/fixed/batches", headers } as never, response as never, () => { calls++; });
    middleware({ method: "POST", path: "/api/fixed/batches", headers: { origin: headers.origin } } as never, response as never, () => { calls++; });
    middleware({ method: "OPTIONS", path: "/api/fixed/batches", headers: { ...headers, origin: "https://elsewhere.invalid" } } as never, response as never, () => { calls++; });
    middleware({ method: "OPTIONS", path: "/api/fixed/batches", headers: { ...headers, "access-control-request-method": "DELETE" } } as never, response as never, () => { calls++; });
    expect(calls).toBe(1);
    expect(statuses).toEqual([401, 403, 403]);
  });
});
