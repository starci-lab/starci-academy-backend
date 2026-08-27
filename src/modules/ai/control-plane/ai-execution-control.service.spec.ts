import type {
    EntityManager,
} from "typeorm"
import {
    AiExecutionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-execution.entity"
import {
    AiExecutionControlService,
} from "./ai-execution-control.service"
import {
    EXECUTION_DIGEST_DOMAINS,
    canonicalExecutionDate,
    executionDigestHex,
} from "./execution-digest"
import {
    AiExecutionCapability,
    AiExecutionState,
} from "./types/execution-state"

function executionFixture(): AiExecutionEntity {
    return Object.assign(new AiExecutionEntity(),
        {
            id: "7ffb0ee7-190d-48d2-af8c-d41bfa2c8a44",
            actorUserId: null,
            actorKey: "system:user-42",
            capability: AiExecutionCapability.ControlPlaneProbe,
            idempotencyKey: "request-1",
            requestHash: "a".repeat(64),
            contractVersion: "academy-ai-engine-slice00-v3",
            incarnationId: "c17e46e2-16b5-5aad-a2dd-e399d1cebbf7",
            generation: 0,
            version: "1",
            state: AiExecutionState.Accepted,
            claimantKey: null,
            leaseTokenHash: null,
            leaseExpiresAt: null,
            leaseCommandOperation: null,
            leaseCommandFenceHash: null,
            leaseCommandOutcomeVersion: null,
            leaseCommandOutcomeExpiresAt: null,
            deadlineAt: new Date("2026-08-27T11:00:00.000Z"),
            resultHash: null,
            errorCode: null,
            terminalKind: null,
            terminalKey: null,
            terminalPayloadHash: null,
            terminalFenceHash: null,
            acceptedAt: new Date("2026-08-27T10:00:00.000Z"),
            startedAt: null,
            terminalAt: null,
            createdAt: new Date("2026-08-27T10:00:00.000Z"),
            updatedAt: new Date("2026-08-27T10:00:00.000Z"),
        })
}

function serviceHarness(execution: AiExecutionEntity): {
    service: AiExecutionControlService
    save: jest.Mock
} {
    const save = jest.fn(async (entity: AiExecutionEntity) => entity)
    const transactionManager = {
        query: jest.fn(async (statement: string) => {
            if (statement.includes("ai_runtime_control")) {
                return [{
                    active_incarnation_id: execution.incarnationId,
                    accepting: true,
                    incarnation_state: "active",
                }]
            }
            if (statement.includes("clock_timestamp")) {
                return [{
                    now: new Date("2026-08-27T10:05:00.000Z"),
                }]
            }
            return []
        }),
        findOne: jest.fn().mockResolvedValue(execution),
        save,
    } as unknown as EntityManager
    const entityManager = {
        transaction: jest.fn(async (_isolation, work) => work(transactionManager)),
    } as unknown as EntityManager
    return {
        service: new AiExecutionControlService(entityManager),
        save,
    }
}

describe("AiExecutionControlService",
    () => {
        it("keeps Slice 00 dark when runtime admission is disabled",
            async () => {
                const transactionManager = {
                    query: jest.fn().mockResolvedValue([{
                        active_incarnation_id: "c17e46e2-16b5-5aad-a2dd-e399d1cebbf7",
                        accepting: false,
                        incarnation_state: "active",
                    }]),
                    findOne: jest.fn().mockResolvedValue(null),
                } as unknown as EntityManager
                const entityManager = {
                    transaction: jest.fn(async (_isolation, work) => work(transactionManager)),
                } as unknown as EntityManager
                const service = new AiExecutionControlService(entityManager)

                const result = await service.accept({
                    actorUserId: null,
                    actorKey: "system:user-42",
                    capability: AiExecutionCapability.ControlPlaneProbe,
                    idempotencyKey: "request-1",
                    contractVersion: "academy-ai-engine-slice00-v3",
                    deadlineAt: new Date("2026-08-27T11:00:00.000Z"),
                })

                expect(result).toEqual({
                    ok: false,
                    error: {
                        code: "not_accepting",
                        message: "The AI runtime control plane is not accepting executions",
                    },
                })
            })

        it("replays an accepted request after admission is disabled",
            async () => {
                const execution = executionFixture()
                const transactionManager = {
                    query: jest.fn().mockResolvedValue([{
                        active_incarnation_id: execution.incarnationId,
                        accepting: false,
                        incarnation_state: "active",
                    }]),
                    findOne: jest.fn().mockResolvedValue(execution),
                } as unknown as EntityManager
                const entityManager = {
                    transaction: jest.fn(async (_isolation, work) => work(transactionManager)),
                } as unknown as EntityManager
                const service = new AiExecutionControlService(entityManager)
                const input = {
                    actorUserId: null,
                    actorKey: execution.actorKey,
                    capability: execution.capability,
                    idempotencyKey: execution.idempotencyKey,
                    contractVersion: execution.contractVersion,
                    deadlineAt: execution.deadlineAt,
                }
                execution.requestHash = executionDigestHex(
                    EXECUTION_DIGEST_DOMAINS.accept,
                    {
                        actorKey: input.actorKey,
                        actorUserId: input.actorUserId,
                        capability: input.capability,
                        contractVersion: input.contractVersion,
                        deadlineAt: canonicalExecutionDate(input.deadlineAt),
                        idempotencyKey: input.idempotencyKey,
                    },
                )

                const result = await service.accept(input)

                expect(result).toMatchObject({
                    ok: true,
                    replayed: true,
                })
            })

        it("returns a strong owner read without exposing lease token material",
            async () => {
                const execution = executionFixture()
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue(execution),
                } as unknown as EntityManager
                const service = new AiExecutionControlService(entityManager)

                const result = await service.get({
                    executionId: execution.id,
                    actorKey: execution.actorKey,
                    isAdmin: false,
                })

                expect(result.ok).toBe(true)
                if (result.ok) {
                    expect(result.execution.id).toBe(execution.id)
                    expect(result.execution).not.toHaveProperty("leaseTokenHash")
                    expect(result.execution).not.toHaveProperty("idempotencyKey")
                    expect(result.execution).not.toHaveProperty("requestHash")
                }
            })

        it("rejects a strong read by a different actor",
            async () => {
                const execution = executionFixture()
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue(execution),
                } as unknown as EntityManager
                const service = new AiExecutionControlService(entityManager)

                await expect(service.get({
                    executionId: execution.id,
                    actorKey: "user:other",
                    isAdmin: false,
                })).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code: "forbidden",
                    },
                })
            })

        it("returns a claim token once and replays the command without disclosing it",
            async () => {
                const execution = executionFixture()
                const {
                    service,
                    save,
                } = serviceHarness(execution)
                const input = {
                    executionId: execution.id,
                    claimantKey: "worker:one",
                    commandKey: "claim:one",
                    expectedVersion: "1",
                    leaseDurationMs: 60_000,
                }

                const first = await service.claim(input)
                const replay = await service.claim(input)

                expect(first.ok).toBe(true)
                if (first.ok) {
                    expect(first.replayed).toBe(false)
                    expect(first.leaseToken).toEqual(expect.any(String))
                    expect(first.leaseToken).not.toHaveLength(0)
                }
                expect(replay).toMatchObject({
                    ok: true,
                    replayed: true,
                })
                if (replay.ok) {
                    expect(replay.leaseToken).toBeUndefined()
                }
                expect(execution.leaseTokenHash).toBeInstanceOf(Buffer)
                expect(save).toHaveBeenCalledTimes(1)
            })

        it("completes once and treats an ambiguous-commit retry as a replay",
            async () => {
                const execution = executionFixture()
                const {
                    service,
                    save,
                } = serviceHarness(execution)
                const claim = await service.claim({
                    executionId: execution.id,
                    claimantKey: "worker:one",
                    commandKey: "claim:one",
                    expectedVersion: "1",
                    leaseDurationMs: 60_000,
                })
                expect(claim.ok).toBe(true)
                if (!claim.ok || !claim.leaseToken) {
                    throw new TypeError("Claim did not return its winning token")
                }
                const input = {
                    executionId: execution.id,
                    claimantKey: "worker:one",
                    terminalKey: "complete:one",
                    expectedVersion: "2",
                    leaseToken: claim.leaseToken,
                    resultHash: "b".repeat(64),
                }

                const first = await service.complete(input)
                const replay = await service.complete(input)

                expect(first).toMatchObject({
                    ok: true,
                    replayed: false,
                    execution: {
                        state: "completed",
                        version: "3",
                    },
                })
                expect(replay).toMatchObject({
                    ok: true,
                    replayed: true,
                    execution: {
                        state: "completed",
                        version: "3",
                    },
                })
                expect(save).toHaveBeenCalledTimes(2)
            })

        it("fences a cancelled running execution by advancing generation",
            async () => {
                const execution = executionFixture()
                const {
                    service,
                } = serviceHarness(execution)
                const claim = await service.claim({
                    executionId: execution.id,
                    claimantKey: "worker:one",
                    commandKey: "claim:one",
                    expectedVersion: "1",
                    leaseDurationMs: 60_000,
                })
                expect(claim.ok).toBe(true)

                const result = await service.cancel({
                    executionId: execution.id,
                    actorKey: execution.actorKey,
                    terminalKey: "cancel:one",
                    expectedVersion: "2",
                    isAdmin: false,
                    reasonCode: "owner_request",
                })

                expect(result).toMatchObject({
                    ok: true,
                    replayed: false,
                    execution: {
                        state: "cancelled",
                        generation: 1,
                        version: "3",
                    },
                })
                expect(execution.leaseTokenHash).toBeNull()
                expect(execution.leaseExpiresAt).toBeNull()
            })
    })
