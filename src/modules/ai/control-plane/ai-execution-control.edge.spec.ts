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
    digestLeaseToken,
    executionDigestHex,
} from "./execution-digest"
import type {
    AcceptExecutionInput,
} from "./types/accept-execution.input"
import type {
    CancelExecutionInput,
} from "./types/cancel-execution.input"
import type {
    ClaimExecutionInput,
} from "./types/claim-execution.input"
import type {
    CompleteExecutionInput,
} from "./types/complete-execution.input"
import type {
    FailExecutionInput,
} from "./types/fail-execution.input"
import type {
    HeartbeatExecutionInput,
} from "./types/heartbeat-execution.input"
import {
    AiExecutionCapability,
    AiExecutionState,
} from "./types/execution-state"

const NOW = new Date("2026-08-27T10:05:00.000Z")
const INCARNATION_ID = "c17e46e2-16b5-5aad-a2dd-e399d1cebbf7"
const EXECUTION_ID = "7ffb0ee7-190d-48d2-af8c-d41bfa2c8a44"
const LEASE_TOKEN = Buffer.alloc(32,
    7).toString("base64url")

function executionFixture(overrides: Partial<AiExecutionEntity> = {
}): AiExecutionEntity {
    return Object.assign(new AiExecutionEntity(),
        {
            id: EXECUTION_ID,
            actorUserId: null,
            actorKey: "system:user-42",
            capability: AiExecutionCapability.ControlPlaneProbe,
            idempotencyKey: "request-1",
            requestHash: "a".repeat(64),
            contractVersion: "academy-ai-engine-slice00-v4",
            incarnationId: INCARNATION_ID,
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
            ...overrides,
        })
}

function acceptInput(overrides: Partial<AcceptExecutionInput> = {
}): AcceptExecutionInput {
    return {
        actorUserId: null,
        actorKey: "system:user-42",
        capability: AiExecutionCapability.ControlPlaneProbe,
        idempotencyKey: "request-1",
        contractVersion: "academy-ai-engine-slice00-v4",
        deadlineAt: new Date("2026-08-27T11:00:00.000Z"),
        ...overrides,
    }
}

function claimInput(overrides: Partial<ClaimExecutionInput> = {
}): ClaimExecutionInput {
    return {
        executionId: EXECUTION_ID,
        claimantKey: "worker:one",
        commandKey: "claim:one",
        expectedVersion: "1",
        leaseDurationMs: 60_000,
        ...overrides,
    }
}

function runningExecution(overrides: Partial<AiExecutionEntity> = {
}): AiExecutionEntity {
    return executionFixture({
        state: AiExecutionState.Running,
        claimantKey: "worker:one",
        leaseTokenHash: digestLeaseToken(LEASE_TOKEN),
        leaseExpiresAt: new Date("2026-08-27T10:10:00.000Z"),
        startedAt: NOW,
        version: "2",
        ...overrides,
    })
}

function managerHarness(options: {
    control?: null | {
        active_incarnation_id: string
        accepting: boolean
        incarnation_state: string
    }
    execution?: AiExecutionEntity | null
    insertIds?: Array<{id: string}>
    due?: Array<AiExecutionEntity>
    now?: Date
} = {
}): {
    manager: EntityManager
    query: jest.Mock
    findOne: jest.Mock
    save: jest.Mock
} {
    const execution = options.execution === undefined
        ? executionFixture()
        : options.execution
    const control = options.control === undefined
        ? {
            active_incarnation_id: INCARNATION_ID,
            accepting: true,
            incarnation_state: "active",
        }
        : options.control
    const due = options.due ?? []
    const query = jest.fn(async (statement: string) => {
        if (statement.includes("ai_runtime_control")) {
            return control ? [control] : []
        }
        if (statement.includes("clock_timestamp() AS")) {
            return [{
                now: options.now ?? NOW,
            }]
        }
        if (statement.includes("INSERT INTO")) {
            return options.insertIds ?? []
        }
        if (statement.includes("SELECT \"id\" FROM")) {
            return due.map((candidate) => ({
                id: candidate.id,
            }))
        }
        return []
    })
    const findOne = jest.fn().mockResolvedValue(execution)
    const save = jest.fn(async (entity: AiExecutionEntity) => entity)
    const manager = {
        query,
        findOne,
        findOneByOrFail: jest.fn(async (_entity, queryOptions) => {
            const candidate = due.find((item) => item.id === queryOptions.id)
            if (!candidate) {
                throw new Error("missing fixture")
            }
            return candidate
        }),
        save,
    } as unknown as EntityManager
    return {
        manager,
        query,
        findOne,
        save,
    }
}

function serviceFor(manager: EntityManager,
    transaction?: jest.Mock): AiExecutionControlService {
    const entityManager = {
        ...manager,
        transaction: transaction ?? jest.fn(async (_isolation, work) => work(manager)),
    } as unknown as EntityManager
    return new AiExecutionControlService(entityManager)
}

describe("AiExecutionControlService edge contracts",
    () => {
        it.each([
            acceptInput({
                capability: "unsupported" as AiExecutionCapability,
            }),
            acceptInput({
                actorKey: "invalid",
            }),
            acceptInput({
                idempotencyKey: "",
            }),
            acceptInput({
                idempotencyKey: "x".repeat(193),
            }),
            acceptInput({
                contractVersion: "",
            }),
            acceptInput({
                contractVersion: "x".repeat(65),
            }),
            acceptInput({
                deadlineAt: new Date("invalid"),
            }),
        ])("rejects malformed accept input before opening a transaction",
            async (input) => {
                const harness = managerHarness()
                const transaction = jest.fn()
                const result = await serviceFor(harness.manager,
                    transaction).accept(input)

                expect(result).toMatchObject({
                    ok: false,
                    error: {
                        code: "invalid_input",
                    },
                })
                expect(transaction).not.toHaveBeenCalled()
            })

        it("accepts user identity and inserts a new execution",
            async () => {
                const userId = "7ffb0ee7-190d-48d2-af8c-d41bfa2c8a44"
                const input = acceptInput({
                    actorUserId: userId,
                    actorKey: `user:${userId}`,
                })
                const execution = executionFixture({
                    actorUserId: input.actorUserId,
                    actorKey: input.actorKey,
                })
                execution.requestHash = executionDigestHex(EXECUTION_DIGEST_DOMAINS.accept,
                    {
                        actorKey: input.actorKey,
                        actorUserId: input.actorUserId,
                        capability: input.capability,
                        contractVersion: input.contractVersion,
                        deadlineAt: canonicalExecutionDate(input.deadlineAt),
                        idempotencyKey: input.idempotencyKey,
                    })
                const harness = managerHarness({
                    execution,
                    insertIds: [{
                        id: execution.id,
                    }],
                })
                harness.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(execution)

                await expect(serviceFor(harness.manager).accept(input)).resolves.toMatchObject({
                    ok: true,
                    replayed: false,
                })
                expect(harness.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO"),
                    expect.any(Array))
            })

        it.each([
            {
                name: "missing control",
                options: {
                    control: null,
                },
                code: "not_accepting",
            },
            {
                name: "inactive incarnation",
                options: {
                    execution: null,
                    control: {
                        active_incarnation_id: INCARNATION_ID,
                        accepting: true,
                        incarnation_state: "draining",
                    },
                },
                code: "not_accepting",
            },
            {
                name: "expired deadline",
                options: {
                    execution: null,
                },
                input: acceptInput({
                    deadlineAt: new Date("2026-08-27T10:04:00.000Z"),
                }),
                code: "deadline_expired",
            },
            {
                name: "excessive deadline",
                options: {
                    execution: null,
                },
                input: acceptInput({
                    deadlineAt: new Date("2026-08-28T10:06:00.000Z"),
                }),
                code: "invalid_input",
            },
        ])("rejects accept state: $name",
            async ({ options, input, code }) => {
                const harness = managerHarness(options)
                await expect(serviceFor(harness.manager).accept(input ?? acceptInput()))
                    .resolves.toMatchObject({
                        ok: false,
                        error: {
                            code,
                        },
                    })
            })

        it("detects accept idempotency conflicts before and after insert arbitration",
            async () => {
                const existing = executionFixture({
                    requestHash: "f".repeat(64),
                })
                const early = managerHarness({
                    execution: existing,
                })
                await expect(serviceFor(early.manager).accept(acceptInput())).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code: "AI_EXECUTION_IDEMPOTENCY_MISMATCH",
                    },
                })

                const late = managerHarness({
                    execution: null,
                })
                late.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(existing)
                await expect(serviceFor(late.manager).accept(acceptInput())).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code: "AI_EXECUTION_IDEMPOTENCY_MISMATCH",
                    },
                })

                late.findOne.mockReset().mockResolvedValue(null)
                await expect(serviceFor(late.manager).accept(acceptInput())).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code: "state_conflict",
                    },
                })
            })

        it.each([
            claimInput({
                leaseDurationMs: 999,
            }),
            claimInput({
                claimantKey: "",
            }),
            claimInput({
                commandKey: "",
            }),
            claimInput({
                expectedVersion: "0",
            }),
        ])("rejects malformed claim input",
            async (input) => {
                const harness = managerHarness()
                await expect(serviceFor(harness.manager).claim(input)).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code: "invalid_input",
                    },
                })
            })

        it.each([
            {
                name: "missing execution",
                execution: null,
                code: "not_found",
            },
            {
                name: "wrong state",
                execution: executionFixture({
                    state: AiExecutionState.Completed,
                }),
                code: "state_conflict",
            },
            {
                name: "wrong version",
                execution: executionFixture({
                    version: "2",
                }),
                code: "version_conflict",
            },
            {
                name: "inactive incarnation",
                execution: executionFixture({
                    incarnationId: "ad933385-da1a-4aa8-9c46-a21a48105925",
                }),
                code: "state_conflict",
            },
            {
                name: "expired deadline",
                execution: executionFixture({
                    deadlineAt: new Date("2026-08-27T10:04:00.000Z"),
                }),
                code: "deadline_expired",
            },
        ])("rejects claim state: $name",
            async ({ execution, code }) => {
                const harness = managerHarness({
                    execution,
                })
                await expect(serviceFor(harness.manager).claim(claimInput())).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code,
                    },
                })
            })

        it("heartbeats and replays a live lease without extending beyond deadline",
            async () => {
                const execution = executionFixture({
                    deadlineAt: new Date("2026-08-27T10:08:00.000Z"),
                })
                const harness = managerHarness({
                    execution,
                })
                const service = serviceFor(harness.manager)
                const claimed = await service.claim(claimInput({
                    leaseDurationMs: 300_000,
                }))
                if (!claimed.ok || !claimed.leaseToken) {
                    throw new Error("claim fixture failed")
                }
                const input: HeartbeatExecutionInput = {
                    executionId: execution.id,
                    claimantKey: "worker:one",
                    commandKey: "heartbeat:one",
                    expectedVersion: "2",
                    leaseDurationMs: 300_000,
                    leaseToken: claimed.leaseToken,
                }

                const first = await service.heartbeat(input)
                const replay = await service.heartbeat(input)

                expect(first).toMatchObject({
                    ok: true,
                    replayed: false,
                })
                expect(replay).toMatchObject({
                    ok: true,
                    replayed: true,
                })
                expect(execution.leaseExpiresAt).toEqual(execution.deadlineAt)
            })

        it.each([
            {
                leaseDurationMs: 999,
            },
            {
                claimantKey: "",
            },
            {
                commandKey: "",
            },
            {
                leaseToken: "bad token",
            },
            {
                expectedVersion: "0",
            },
        ])("rejects malformed heartbeat input",
            async (override) => {
                const input: HeartbeatExecutionInput = {
                    executionId: EXECUTION_ID,
                    claimantKey: "worker:one",
                    commandKey: "heartbeat:one",
                    expectedVersion: "2",
                    leaseDurationMs: 60_000,
                    leaseToken: LEASE_TOKEN,
                    ...override,
                }
                const harness = managerHarness()
                await expect(serviceFor(harness.manager).heartbeat(input)).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code: "invalid_input",
                    },
                })
            })

        it.each([
            {
                name: "not running",
                execution: executionFixture(),
                code: "state_conflict",
            },
            {
                name: "wrong version",
                execution: runningExecution({
                    version: "3",
                }),
                code: "version_conflict",
            },
            {
                name: "inactive incarnation",
                execution: runningExecution({
                    incarnationId: "ad933385-da1a-4aa8-9c46-a21a48105925",
                }),
                code: "state_conflict",
            },
            {
                name: "wrong claimant",
                execution: runningExecution({
                    claimantKey: "worker:other",
                }),
                code: "lease_conflict",
            },
            {
                name: "expired lease",
                execution: runningExecution({
                    leaseExpiresAt: new Date("2026-08-27T10:04:00.000Z"),
                }),
                code: "lease_expired",
            },
            {
                name: "expired deadline",
                execution: runningExecution({
                    deadlineAt: new Date("2026-08-27T10:04:00.000Z"),
                }),
                code: "deadline_expired",
            },
        ])("rejects heartbeat authority: $name",
            async ({ execution, code }) => {
                const harness = managerHarness({
                    execution,
                })
                await expect(serviceFor(harness.manager).heartbeat({
                    executionId: EXECUTION_ID,
                    claimantKey: "worker:one",
                    commandKey: "heartbeat:one",
                    expectedVersion: "2",
                    leaseDurationMs: 60_000,
                    leaseToken: LEASE_TOKEN,
                })).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code,
                    },
                })
            })

        it("fails a live execution and replays the exact terminal command",
            async () => {
                const execution = runningExecution()
                const harness = managerHarness({
                    execution,
                })
                const service = serviceFor(harness.manager)
                const input: FailExecutionInput = {
                    executionId: EXECUTION_ID,
                    claimantKey: "worker:one",
                    terminalKey: "fail:one",
                    expectedVersion: "2",
                    leaseToken: LEASE_TOKEN,
                    errorCode: "MODEL_TIMEOUT",
                }

                await expect(service.fail(input)).resolves.toMatchObject({
                    ok: true,
                    replayed: false,
                    execution: {
                        state: "failed",
                    },
                })
                await expect(service.fail(input)).resolves.toMatchObject({
                    ok: true,
                    replayed: true,
                })
            })

        it.each([
            {
                errorCode: "",
            },
            {
                terminalKey: "",
            },
            {
                claimantKey: "",
            },
            {
                leaseToken: "bad token",
            },
            {
                expectedVersion: "0",
            },
        ])("rejects malformed fail input",
            async (override) => {
                const input: FailExecutionInput = {
                    executionId: EXECUTION_ID,
                    claimantKey: "worker:one",
                    terminalKey: "fail:one",
                    expectedVersion: "2",
                    leaseToken: LEASE_TOKEN,
                    errorCode: "MODEL_TIMEOUT",
                    ...override,
                }
                const harness = managerHarness()
                await expect(serviceFor(harness.manager).fail(input)).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code: "invalid_input",
                    },
                })
            })

        it("rejects malformed complete input and missing terminal execution",
            async () => {
                const harness = managerHarness({
                    execution: null,
                })
                const service = serviceFor(harness.manager)
                const valid: CompleteExecutionInput = {
                    executionId: EXECUTION_ID,
                    claimantKey: "worker:one",
                    terminalKey: "complete:one",
                    expectedVersion: "2",
                    leaseToken: LEASE_TOKEN,
                    resultHash: "b".repeat(64),
                }

                await expect(service.complete({
                    ...valid,
                    resultHash: "B".repeat(64),
                })).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code: "invalid_input",
                    },
                })
                await expect(service.complete(valid)).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code: "not_found",
                    },
                })
            })

        it.each([
            {
                terminalKey: "",
            },
            {
                reasonCode: "",
            },
            {
                expectedVersion: "0",
            },
        ])("rejects malformed cancel input",
            async (override) => {
                const input: CancelExecutionInput = {
                    executionId: EXECUTION_ID,
                    actorKey: "system:user-42",
                    terminalKey: "cancel:one",
                    expectedVersion: "1",
                    isAdmin: false,
                    reasonCode: "owner_request",
                    ...override,
                }
                const harness = managerHarness()
                await expect(serviceFor(harness.manager).cancel(input)).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code: "invalid_input",
                    },
                })
            })

        it.each([
            {
                name: "missing execution",
                execution: null,
                input: {
                },
                code: "not_found",
            },
            {
                name: "foreign owner",
                execution: executionFixture(),
                input: {
                    actorKey: "system:other",
                },
                code: "forbidden",
            },
            {
                name: "terminal state",
                execution: executionFixture({
                    state: AiExecutionState.Completed,
                }),
                input: {
                },
                code: "state_conflict",
            },
            {
                name: "wrong version",
                execution: executionFixture({
                    version: "2",
                }),
                input: {
                },
                code: "version_conflict",
            },
        ])("rejects cancel state: $name",
            async ({ execution, input, code }) => {
                const harness = managerHarness({
                    execution,
                })
                await expect(serviceFor(harness.manager).cancel({
                    executionId: EXECUTION_ID,
                    actorKey: "system:user-42",
                    terminalKey: "cancel:one",
                    expectedVersion: "1",
                    isAdmin: false,
                    reasonCode: "owner_request",
                    ...input,
                })).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code,
                    },
                })
            })

        it("allows an administrator to cancel an accepted execution",
            async () => {
                const execution = executionFixture()
                const harness = managerHarness({
                    execution,
                })
                await expect(serviceFor(harness.manager).cancel({
                    executionId: EXECUTION_ID,
                    actorKey: "system:admin",
                    terminalKey: "cancel:admin",
                    expectedVersion: "1",
                    isAdmin: true,
                    reasonCode: "admin_request",
                })).resolves.toMatchObject({
                    ok: true,
                    replayed: false,
                })
            })

        it("returns not-found from a strong read",
            async () => {
                const harness = managerHarness({
                    execution: null,
                })
                await expect(serviceFor(harness.manager).get({
                    executionId: EXECUTION_ID,
                    actorKey: "system:user-42",
                    isAdmin: false,
                })).resolves.toMatchObject({
                    ok: false,
                    error: {
                        code: "not_found",
                    },
                })
            })

        it("reconciles accepted deadline and running lease expiry in one bounded batch",
            async () => {
                const accepted = executionFixture({
                    id: "7ffb0ee7-190d-48d2-af8c-d41bfa2c8a45",
                    deadlineAt: new Date("2026-08-27T10:04:00.000Z"),
                })
                const running = runningExecution({
                    id: "7ffb0ee7-190d-48d2-af8c-d41bfa2c8a46",
                    leaseExpiresAt: new Date("2026-08-27T10:04:00.000Z"),
                })
                const harness = managerHarness({
                    due: [accepted,
                        running],
                })

                await expect(serviceFor(harness.manager).reconcileExpired({
                    batchSize: 150.9,
                })).resolves.toEqual({
                    reconciledExecutionIds: [accepted.id,
                        running.id],
                })
                expect(accepted.errorCode).toBe("DEADLINE_EXPIRED")
                expect(running.errorCode).toBe("LEASE_EXPIRED")
                expect(harness.query).toHaveBeenCalledWith(expect.stringContaining("SKIP LOCKED"),
                    [100])
            })

        it("uses the default/minimum reconcile bounds and fails closed without active control",
            async () => {
                const active = managerHarness()
                await expect(serviceFor(active.manager).reconcileExpired()).resolves.toEqual({
                    reconciledExecutionIds: [],
                })
                await serviceFor(active.manager).reconcileExpired({
                    batchSize: 0.4,
                })
                expect(active.query).toHaveBeenCalledWith(expect.stringContaining("SKIP LOCKED"),
                    [1])

                const inactive = managerHarness({
                    control: null,
                })
                await expect(serviceFor(inactive.manager).reconcileExpired()).resolves.toMatchObject({
                    error: {
                        code: "not_accepting",
                    },
                })
            })

        it("returns each operation-specific retry exhaustion result",
            async () => {
                jest.spyOn(Math,
                    "random").mockReturnValue(0)
                const harness = managerHarness()
                const transaction = jest.fn().mockRejectedValue({
                    driverError: {
                        code: "40001",
                    },
                })
                const service = serviceFor(harness.manager,
                    transaction)
                const heartbeat: HeartbeatExecutionInput = {
                    executionId: EXECUTION_ID,
                    claimantKey: "worker:one",
                    commandKey: "heartbeat:one",
                    expectedVersion: "2",
                    leaseDurationMs: 60_000,
                    leaseToken: LEASE_TOKEN,
                }
                const cancel: CancelExecutionInput = {
                    executionId: EXECUTION_ID,
                    actorKey: "system:user-42",
                    terminalKey: "cancel:one",
                    expectedVersion: "1",
                    isAdmin: false,
                    reasonCode: "owner_request",
                }
                const complete: CompleteExecutionInput = {
                    executionId: EXECUTION_ID,
                    claimantKey: "worker:one",
                    terminalKey: "complete:one",
                    expectedVersion: "2",
                    leaseToken: LEASE_TOKEN,
                    resultHash: "b".repeat(64),
                }

                await expect(service.accept(acceptInput())).resolves.toMatchObject({
                    error: {
                        code: "retryable_conflict",
                    },
                })
                await expect(service.claim(claimInput())).resolves.toMatchObject({
                    error: {
                        code: "retryable_conflict",
                    },
                })
                await expect(service.heartbeat(heartbeat)).resolves.toMatchObject({
                    error: {
                        code: "retryable_conflict",
                    },
                })
                await expect(service.cancel(cancel)).resolves.toMatchObject({
                    error: {
                        code: "retryable_conflict",
                    },
                })
                await expect(service.complete(complete)).resolves.toMatchObject({
                    error: {
                        code: "retryable_conflict",
                    },
                })
                await expect(service.reconcileExpired()).resolves.toMatchObject({
                    error: {
                        code: "retryable_conflict",
                    },
                })
                expect(transaction).toHaveBeenCalledTimes(18)
            })

        it("retries a deadlock once and rethrows non-retryable failures",
            async () => {
                const harness = managerHarness({
                    control: null,
                })
                const transaction = jest.fn()
                    .mockRejectedValueOnce({
                        code: "40P01",
                    })
                    .mockImplementationOnce(async (_isolation, work) => work(harness.manager))
                await expect(serviceFor(harness.manager,
                    transaction).accept(acceptInput())).resolves.toMatchObject({
                    error: {
                        code: "not_accepting",
                    },
                })

                const fatal = new Error("fatal")
                const fatalTransaction = jest.fn().mockRejectedValue(fatal)
                await expect(serviceFor(harness.manager,
                    fatalTransaction).accept(acceptInput())).rejects.toBe(fatal)
            })
    })
