import { describe, expect, it, vi } from "vitest";
import { FixedScheduler, type DispatcherStore } from "./scheduler.js";
import type { DispatcherLease } from "./repository.js";
import type { ClaimedJob } from "./types.js";

const job: ClaimedJob = { id: "job", batchId: "batch", workerId: "worker", row: { id: "S001", answers: { answer: "synthetic" } }, scheduledAt: "2030-01-01T00:00:00Z" };
function harness() {
  const lease = { alive: true, close: vi.fn(async () => {}), verify: vi.fn(async () => {}) } as unknown as DispatcherLease;
  const store = {
    tryAcquireDispatcher: vi.fn(async () => lease), recover: vi.fn(async () => {}), maintain: vi.fn(async () => {}),
    claim: vi.fn(async () => job), beforeSubmit: vi.fn(async () => {}), finish: vi.fn(async () => {}),
  } satisfies DispatcherStore;
  return { lease, store };
}
describe("durable fixed dispatcher", () => {
  it("never claims or opens a browser when submissions are disabled", async () => {
    const { store } = harness();
    const runner = vi.fn();
    const scheduler = new FixedScheduler(store, runner, () => false);
    await scheduler.tick(); await scheduler.tick();
    expect(store.recover).toHaveBeenCalledTimes(1);
    expect(store.maintain).toHaveBeenCalledTimes(2);
    expect(store.claim).not.toHaveBeenCalled();
    expect(runner).not.toHaveBeenCalled();
    await scheduler.stop();
  });
  it("a standby replica does not recover or claim the leader's live work", async () => {
    const { store } = harness();
    store.tryAcquireDispatcher.mockResolvedValue(null as unknown as DispatcherLease);
    const scheduler = new FixedScheduler(store, vi.fn(), () => true);
    await scheduler.tick();
    expect(store.recover).not.toHaveBeenCalled(); expect(store.claim).not.toHaveBeenCalled();
    await scheduler.stop();
  });
  it("persists beforeSubmit before allowing driver completion and records confirmed success", async () => {
    const { store } = harness();
    const scheduler = new FixedScheduler(store, async (_row, hooks) => {
      await hooks.beforeSubmit();
      expect(store.beforeSubmit).toHaveBeenCalledTimes(1);
      return { status: "succeeded", detail: "Fixture confirmation visible" };
    }, () => true);
    await scheduler.tick();
    expect(store.finish).toHaveBeenCalledWith(job, "succeeded", "Fixture confirmation visible");
    await scheduler.stop();
  });
  it("records uncertainty after the boundary, without retrying inside the tick", async () => {
    const { store } = harness();
    const runner = vi.fn(async (_row, hooks) => { await hooks.beforeSubmit(); throw new Error("connection dropped"); });
    const scheduler = new FixedScheduler(store, runner, () => true);
    await scheduler.tick();
    expect(runner).toHaveBeenCalledTimes(1);
    expect(store.finish).toHaveBeenCalledWith(job, "uncertain", expect.stringContaining("no automatic retry"));
    await scheduler.stop();
  });
  it("cannot publish false success without a durable boundary", async () => {
    const { store } = harness();
    const scheduler = new FixedScheduler(store, async () => ({ status: "succeeded", detail: "bogus" }), () => true);
    await scheduler.tick();
    expect(store.finish).toHaveBeenCalledWith(job, "failed", expect.stringContaining("without the required"));
    await scheduler.stop();
  });
  it("does not permit submission when durable boundary persistence fails", async () => {
    const { store } = harness();
    store.beforeSubmit.mockRejectedValue(new Error("database unavailable"));
    const click = vi.fn();
    const scheduler = new FixedScheduler(store, async (_row, hooks) => {
      await hooks.beforeSubmit(); click(); return { status: "succeeded", detail: "fixture" };
    }, () => true);
    await scheduler.tick();
    expect(click).not.toHaveBeenCalled();
    expect(store.finish).toHaveBeenCalledWith(job, "failed", expect.any(String));
    await scheduler.stop();
  });
  it("coalesces concurrent ticks so one browser is active", async () => {
    const { store } = harness();
    let release!: () => void;
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    const runner = vi.fn(async () => { await waiting; return { status: "failed" as const, detail: "fixture" }; });
    const scheduler = new FixedScheduler(store, runner, () => true);
    const first = scheduler.tick(); const second = scheduler.tick();
    expect(first).toBe(second);
    release(); await Promise.all([first, second]);
    expect(store.claim).toHaveBeenCalledTimes(1); expect(runner).toHaveBeenCalledTimes(1);
    await scheduler.stop();
  });
  it("a persistence failure relinquishes leadership for conservative restart recovery", async () => {
    const { store, lease } = harness();
    const report = vi.fn();
    store.finish.mockRejectedValue(new Error("lost result"));
    const scheduler = new FixedScheduler(store, async () => ({ status: "failed", detail: "fixture" }), () => true, report);
    await scheduler.tick();
    expect(lease.close).toHaveBeenCalledTimes(1); expect(report).toHaveBeenCalledTimes(1);
    await scheduler.stop();
  });
});
