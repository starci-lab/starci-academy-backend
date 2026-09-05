import assert from "node:assert/strict";
import test from "node:test";
import { api, ApiError, isDefinitiveBatchRejection } from "./api.ts";

test("API list performs a read-only non-cached fixed endpoint request", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (...args) => {
    calls.push(args);
    return new Response(JSON.stringify({ items: [] }), { status: 200 });
  });
  assert.deepEqual(await api.batches(), { items: [] });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "/api/fixed/batches");
  assert.equal(calls[0][1].method, undefined);
  assert.equal(calls[0][1].cache, "no-store");
});

test("creation is not auto-retried on network failure; explicit retry preserves body", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    calls.push(init.body);
    if (calls.length === 1) throw new Error("network lost after commit");
    return new Response(JSON.stringify({ id: "fixture-batch" }), { status: 200 });
  });
  const payload = { mode: "immediate", count: 2, timezone: "UTC", requestId: "287c8d1d-63de-4216-8f46-05a1da0b2304" };
  await assert.rejects(api.createBatch(payload), (error) => error instanceof ApiError && error.status === 0);
  assert.equal(calls.length, 1);
  await api.createBatch(payload);
  assert.equal(calls.length, 2);
  assert.equal(calls[0], calls[1]);
  assert.equal(JSON.parse(calls[1]).requestId, payload.requestId);
});

test("HTTP validation error is surfaced with status and no retry", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    return new Response(JSON.stringify({ message: ["Count unavailable", "Choose a lower count"] }), { status: 400 });
  });
  await assert.rejects(api.createBatch({}), (error) => error instanceof ApiError && error.status === 400 && error.message.includes("Choose a lower count"));
  assert.equal(calls, 1);
});

test("insufficient-row 409 propagates the exact precommit code and permits editing", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({
    code: "INSUFFICIENT_ROWS", message: "Only 2 rows remain. Choose a lower count.",
  }), { status: 409 }));
  await assert.rejects(api.createBatch({ count: 3 }), (error) => {
    assert.equal(error.status, 409);
    assert.equal(error.code, "INSUFFICIENT_ROWS");
    assert.equal(isDefinitiveBatchRejection(error), true);
    return true;
  });
});

test("other conflicts and uncertain outcomes retain their frozen retry request", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({
    code: "REQUEST_ID_CONFLICT", message: "Request ID conflict",
  }), { status: 409 }));
  await assert.rejects(api.createBatch({}), (error) => {
    assert.equal(error.code, "REQUEST_ID_CONFLICT");
    assert.equal(isDefinitiveBatchRejection(error), false);
    return true;
  });
  for (const status of [0, 408, 409, 425, 429, 500, 502, 503]) {
    assert.equal(isDefinitiveBatchRejection(new ApiError("uncertain", status)), false);
  }
  assert.equal(isDefinitiveBatchRejection(new ApiError("wrong status", 500, "INSUFFICIENT_ROWS")), false);
  assert.equal(isDefinitiveBatchRejection(new ApiError("wrong code", 409, "insufficient_rows")), false);
});

test("unexpected success response remains unconfirmed", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("not JSON", { status: 200 }));
  await assert.rejects(api.batches(), (error) => error instanceof ApiError && error.status === 0);
});

test("detail IDs are encoded and cancellation uses only the fixed action endpoint", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (...args) => {
    calls.push(args);
    return new Response(JSON.stringify({ id: "fixture" }), { status: 200 });
  });
  await api.batch("id/with spaces");
  await api.action("fixture", "cancel");
  assert.equal(calls[0][0], "/api/fixed/batches/id%2Fwith%20spaces");
  assert.equal(calls[1][0], "/api/fixed/batches/fixture/cancel");
  assert.equal(calls[1][1].method, "POST");
});
