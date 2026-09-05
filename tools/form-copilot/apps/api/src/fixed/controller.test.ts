import { describe, expect, it, vi } from "vitest";
import { FixedController } from "./controller.js";
import { FixedService } from "./service.js";
import { AppController } from "../app.controller.js";
import type { FixedRepository } from "./repository.js";

describe("fixed-only API boundary", () => {
  it("rejects arbitrary target URLs and malformed timezones before scheduling", () => {
    const createBatch = vi.fn();
    const controller = new FixedController({ createBatch } as unknown as FixedService);
    const body = { requestId: "18a5e536-617b-4c27-a84f-232c9907437d", mode: "immediate", count: 1, timezone: "UTC" };
    expect(() => controller.create({ ...body, url: "https://untrusted.example" })).toThrow("Unrecognized key");
    expect(() => controller.create({ ...body, timezone: "not-a-zone" })).toThrow("IANA");
    expect(createBatch).not.toHaveBeenCalled();
    controller.create(body); expect(createBatch).toHaveBeenCalledWith(body);
  });
  it("wraps list responses while returning individual batches directly", async () => {
    const batch = { id: "batch", status: "paused" };
    const service = {
      listBatches: vi.fn(async () => [batch]), getBatch: vi.fn(async () => batch),
      transition: vi.fn(async () => batch),
    } as unknown as FixedService;
    const controller = new FixedController(service);
    expect(await controller.list()).toEqual({ items: [batch] });
    expect(await controller.detail("batch")).toBe(batch);
    expect(await controller.pause("batch")).toBe(batch);
    expect(await controller.resume("batch")).toBe(batch);
    expect(await controller.cancel("batch")).toBe(batch);
  });
  it("metadata explicitly labels synthetic data and explains disabled submissions", async () => {
    const availableCount = vi.fn(async () => 1);
    const service = new FixedService({ availableCount } as unknown as FixedRepository,
      async () => ({ name: "Synthetic rehearsal fixture", digest: "fixture", rows: [{ id: "fixture-1", answers: {} }] }), vi.fn(), false);
    await service.onModuleInit();
    expect(await service.meta()).toMatchObject({
      synthetic: true, enabled: false, datasetName: "Synthetic rehearsal fixture", eligibleCount: 1, availableCount: 1,
      disabledReason: expect.stringContaining("chưa cho phép gửi dữ liệu ra Google Form"),
    });
  });
  it("health checks expose no credentials, models, or submission flags", async () => {
    const health = vi.fn(async () => true);
    const controller = new AppController({ health } as unknown as FixedRepository);
    expect(await controller.health()).toEqual({ ok: true, status: "ok", version: "0.2.0" });
    health.mockResolvedValue(false);
    await expect(controller.health()).rejects.toThrow("Database is unavailable");
  });
});
