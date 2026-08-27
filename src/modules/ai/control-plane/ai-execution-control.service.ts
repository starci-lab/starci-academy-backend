import {
    randomBytes,
    randomInt,
    randomUUID,
} from "node:crypto"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AiExecutionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-execution.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    EXECUTION_DIGEST_DOMAINS,
    canonicalExecutionDate,
    digestLeaseToken,
    executionDigest,
    executionDigestHex,
    executionDigestsEqual,
} from "./execution-digest"
import type {
    AcceptExecutionInput,
} from "./types/accept-execution.input"
import type {
    AcceptExecutionResult,
} from "./types/accept-execution.result"
import type {
    CancelExecutionInput,
} from "./types/cancel-execution.input"
import type {
    ClaimExecutionInput,
} from "./types/claim-execution.input"
import type {
    CompleteExecutionInput,
} from "./types/complete-execution.input"
import {
    AiExecutionErrorCode,
} from "./types/execution-errors"
import type {
    ExecutionTransitionResult,
} from "./types/execution-transition.result"
import {
    AiExecutionCapability,
    AiExecutionState,
    AiExecutionTerminalKind,
    AiLeaseCommandOperation,
} from "./types/execution-state"
import type {
    AiExecutionView,
} from "./types/execution-view"
import type {
    FailExecutionInput,
} from "./types/fail-execution.input"
import type {
    GetExecutionInput,
} from "./types/get-execution.input"
import type {
    HeartbeatExecutionInput,
} from "./types/heartbeat-execution.input"
import type {
    ReconcileExpiredExecutionsInput,
} from "./types/reconcile-expired-executions.input"
import type {
    ReconcileExpiredExecutionsResult,
} from "./types/reconcile-expired-executions.result"

interface RuntimeControlRow {
    active_incarnation_id: string
    accepting: boolean
    incarnation_state: string
}

interface DatabaseNowRow {
    now: Date
}

interface ExecutionIdRow {
    id: string
}

interface DriverErrorCarrier {
    code?: string
    driverError?: {
        code?: string
    }
}

interface TerminalCommand {
    kind: AiExecutionTerminalKind
    key: string
    payload: unknown
    tokenHash: Buffer | null
    expectedVersion: string
    nextState: AiExecutionState.Completed | AiExecutionState.Failed | AiExecutionState.Cancelled
    resultHash: string | null
    errorCode: string | null
    incrementGeneration: boolean
}

const MAX_RECONCILE_BATCH = 100
const MIN_LEASE_DURATION_MS = 1_000
const MAX_LEASE_DURATION_MS = 300_000
const MAX_DEADLINE_DURATION_MS = 86_400_000
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAYS_MS = [25,
    50,
    100]

@Injectable()
/** Durable, provider-neutral lifecycle control for Slice 00 AI executions. */
export class AiExecutionControlService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
    }

    /** Accept one idempotent control-plane probe while admission is enabled. */
    async accept(input: AcceptExecutionInput): Promise<AcceptExecutionResult> {
        const validationError = this.validateAcceptInput(input)
        if (validationError) {
            return validationError
        }
        const requestHash = executionDigestHex(
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
        return this.withTransactionRetry(async (manager) => {
            const control = await this.lockRuntimeControl(manager)
            if (!control) {
                return this.failure(AiExecutionErrorCode.NotAccepting,
                    "The AI runtime control plane is unavailable")
            }
            const existing = await manager.findOne(AiExecutionEntity,
                {
                    where: {
                        actorKey: input.actorKey,
                        capability: input.capability,
                        idempotencyKey: input.idempotencyKey,
                    },
                    lock: {
                        mode: "pessimistic_write",
                    },
                })
            if (existing) {
                if (existing.requestHash !== requestHash) {
                    return this.failure(AiExecutionErrorCode.IdempotencyConflict,
                        "The idempotency key is already bound to another request")
                }
                return {
                    ok: true,
                    replayed: true,
                    execution: this.toView(existing),
                }
            }
            if (control.incarnation_state !== "active") {
                return this.failure(AiExecutionErrorCode.NotAccepting,
                    "The AI runtime control plane is unavailable")
            }
            if (!control.accepting) {
                return this.failure(AiExecutionErrorCode.NotAccepting,
                    "The AI runtime control plane is not accepting executions")
            }
            const now = await this.databaseNow(manager)
            if (input.deadlineAt.getTime() <= now.getTime()) {
                return this.failure(AiExecutionErrorCode.DeadlineExpired,
                    "The execution deadline has elapsed")
            }
            if (input.deadlineAt.getTime() - now.getTime() > MAX_DEADLINE_DURATION_MS) {
                return this.failure(AiExecutionErrorCode.InvalidInput,
                    "The execution deadline exceeds the 24 hour bound")
            }
            const inserted = await manager.query(
                `INSERT INTO "public"."ai_executions" (
                    "id", "actor_user_id", "actor_key", "capability", "idempotency_key",
                    "request_hash", "contract_version", "incarnation_id", "state",
                    "deadline_at", "accepted_at", "created_at", "updated_at"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'accepted', $9, $10, $10, $10)
                ON CONFLICT ("actor_key", "capability", "idempotency_key") DO NOTHING
                RETURNING "id"`,
                [randomUUID(),
                    input.actorUserId,
                    input.actorKey,
                    input.capability,
                    input.idempotencyKey,
                    requestHash,
                    input.contractVersion,
                    control.active_incarnation_id,
                    input.deadlineAt,
                    now],
            ) as Array<ExecutionIdRow>
            const execution = inserted.length > 0
                ? await this.lockExecution(manager,
                    inserted[0].id)
                : await manager.findOne(AiExecutionEntity,
                    {
                        where: {
                            actorKey: input.actorKey,
                            capability: input.capability,
                            idempotencyKey: input.idempotencyKey,
                        },
                        lock: {
                            mode: "pessimistic_write",
                        },
                    })
            if (!execution) {
                return this.failure(AiExecutionErrorCode.StateConflict,
                    "The execution could not be loaded after acceptance")
            }
            if (execution.requestHash !== requestHash) {
                return this.failure(AiExecutionErrorCode.IdempotencyConflict,
                    "The idempotency key is already bound to another request")
            }
            return {
                ok: true,
                replayed: inserted.length === 0,
                execution: this.toView(execution),
            }
        },
        () => this.failure(AiExecutionErrorCode.RetryableConflict,
            "Concurrent transaction conflict; retry the accept command"))
    }

    /** Claim one accepted execution and return the winning lease token once. */
    async claim(input: ClaimExecutionInput): Promise<ExecutionTransitionResult> {
        if (!this.validLeaseInput(input.leaseDurationMs)
            || !this.validBoundedKey(input.claimantKey,
                192)
            || !this.validBoundedKey(input.commandKey,
                192)
            || !this.validVersion(input.expectedVersion)) {
            return this.failure(AiExecutionErrorCode.InvalidInput,
                "Claim input violates the Slice 00 contract")
        }
        return this.withTransactionRetry(async (manager) => {
            const control = await this.lockRuntimeControl(manager)
            const execution = await this.lockExecution(manager,
                input.executionId)
            if (!control || !execution) {
                return this.failure(AiExecutionErrorCode.NotFound,
                    "Execution not found")
            }
            const now = await this.databaseNow(manager)
            if (execution.state === AiExecutionState.Running
                && execution.leaseTokenHash) {
                const replayFenceHash = this.leaseFenceHash({
                    operation: AiLeaseCommandOperation.Claim,
                    execution,
                    claimantKey: input.claimantKey,
                    commandKey: input.commandKey,
                    expectedVersion: input.expectedVersion,
                    leaseDurationMs: input.leaseDurationMs,
                    tokenHash: execution.leaseTokenHash,
                })
                if (this.isLeaseReplay(execution,
                    AiLeaseCommandOperation.Claim,
                    replayFenceHash)) {
                    const replayFailure = this.validateReplayWindow(execution,
                        now)
                    if (replayFailure) {
                        return replayFailure
                    }
                    return {
                        ok: true,
                        replayed: true,
                        execution: this.toView(execution),
                    }
                }
            }
            if (execution.state !== AiExecutionState.Accepted) {
                return this.failure(AiExecutionErrorCode.StateConflict,
                    "Only accepted executions can be claimed")
            }
            if (execution.version !== input.expectedVersion) {
                return this.failure(AiExecutionErrorCode.VersionConflict,
                    "Execution version does not match")
            }
            if (execution.incarnationId !== control.active_incarnation_id
                || control.incarnation_state !== "active") {
                return this.failure(AiExecutionErrorCode.StateConflict,
                    "Execution belongs to an inactive runtime incarnation")
            }
            if (execution.deadlineAt.getTime() <= now.getTime()) {
                return this.failure(AiExecutionErrorCode.DeadlineExpired,
                    "The execution deadline has elapsed")
            }
            const leaseToken = randomBytes(32).toString("base64url")
            const leaseTokenHash = digestLeaseToken(leaseToken)
            const fenceHash = this.leaseFenceHash({
                operation: AiLeaseCommandOperation.Claim,
                execution,
                claimantKey: input.claimantKey,
                commandKey: input.commandKey,
                expectedVersion: input.expectedVersion,
                leaseDurationMs: input.leaseDurationMs,
                tokenHash: leaseTokenHash,
            })
            const nextVersion = this.incrementVersion(input.expectedVersion)
            const leaseExpiresAt = new Date(Math.min(
                now.getTime() + input.leaseDurationMs,
                execution.deadlineAt.getTime(),
            ))
            execution.state = AiExecutionState.Running
            execution.claimantKey = input.claimantKey
            execution.leaseTokenHash = leaseTokenHash
            execution.leaseExpiresAt = leaseExpiresAt
            execution.leaseCommandOperation = AiLeaseCommandOperation.Claim
            execution.leaseCommandFenceHash = fenceHash
            execution.leaseCommandOutcomeVersion = nextVersion
            execution.leaseCommandOutcomeExpiresAt = leaseExpiresAt
            execution.startedAt = now
            execution.version = nextVersion
            execution.updatedAt = now
            await manager.save(execution)
            return {
                ok: true,
                replayed: false,
                execution: this.toView(execution),
                leaseToken,
            }
        },
        () => this.failure(AiExecutionErrorCode.RetryableConflict,
            "Concurrent transaction conflict; retry the claim command"))
    }

    /** Renew the live lease held by the current claimant. */
    async heartbeat(input: HeartbeatExecutionInput): Promise<ExecutionTransitionResult> {
        if (!this.validLeaseInput(input.leaseDurationMs)
            || !this.validBoundedKey(input.claimantKey,
                192)
            || !this.validBoundedKey(input.commandKey,
                192)
            || !this.validLeaseToken(input.leaseToken)
            || !this.validVersion(input.expectedVersion)) {
            return this.failure(AiExecutionErrorCode.InvalidInput,
                "Heartbeat input violates the Slice 00 contract")
        }
        const tokenHash = digestLeaseToken(input.leaseToken)
        return this.withTransactionRetry(async (manager) => {
            const control = await this.lockRuntimeControl(manager)
            const execution = await this.lockExecution(manager,
                input.executionId)
            if (!control || !execution) {
                return this.failure(AiExecutionErrorCode.NotFound,
                    "Execution not found")
            }
            const now = await this.databaseNow(manager)
            const fenceHash = this.leaseFenceHash({
                operation: AiLeaseCommandOperation.Heartbeat,
                execution,
                claimantKey: input.claimantKey,
                commandKey: input.commandKey,
                expectedVersion: input.expectedVersion,
                leaseDurationMs: input.leaseDurationMs,
                tokenHash,
            })
            if (this.isLeaseReplay(execution,
                AiLeaseCommandOperation.Heartbeat,
                fenceHash)) {
                const replayFailure = this.validateReplayWindow(execution,
                    now)
                if (replayFailure) {
                    return replayFailure
                }
                return {
                    ok: true,
                    replayed: true,
                    execution: this.toView(execution),
                }
            }
            const authorityFailure = await this.validateLiveAuthority(
                manager,
                control,
                execution,
                input.claimantKey,
                input.expectedVersion,
                tokenHash,
            )
            if (authorityFailure) {
                return authorityFailure
            }
            const mutationNow = await this.databaseNow(manager)
            const nextVersion = this.incrementVersion(input.expectedVersion)
            const leaseExpiresAt = new Date(Math.min(
                mutationNow.getTime() + input.leaseDurationMs,
                execution.deadlineAt.getTime(),
            ))
            execution.leaseExpiresAt = leaseExpiresAt
            execution.leaseCommandOperation = AiLeaseCommandOperation.Heartbeat
            execution.leaseCommandFenceHash = fenceHash
            execution.leaseCommandOutcomeVersion = nextVersion
            execution.leaseCommandOutcomeExpiresAt = leaseExpiresAt
            execution.version = nextVersion
            execution.updatedAt = mutationNow
            await manager.save(execution)
            return {
                ok: true,
                replayed: false,
                execution: this.toView(execution),
            }
        },
        () => this.failure(AiExecutionErrorCode.RetryableConflict,
            "Concurrent transaction conflict; retry the heartbeat command"))
    }

    /** Complete a live execution with a canonical result digest. */
    async complete(input: CompleteExecutionInput): Promise<ExecutionTransitionResult> {
        if (!/^[0-9a-f]{64}$/.test(input.resultHash)
            || !this.validBoundedKey(input.terminalKey,
                192)
            || !this.validBoundedKey(input.claimantKey,
                192)
            || !this.validLeaseToken(input.leaseToken)
            || !this.validVersion(input.expectedVersion)) {
            return this.failure(AiExecutionErrorCode.InvalidInput,
                "Result hash must be lowercase hexadecimal SHA-256")
        }
        return this.finishLeasedExecution(input.executionId,
            input.claimantKey,
            input.leaseToken,
            {
                kind: AiExecutionTerminalKind.Complete,
                key: input.terminalKey,
                payload: {
                    resultHash: input.resultHash,
                },
                tokenHash: digestLeaseToken(input.leaseToken),
                expectedVersion: input.expectedVersion,
                nextState: AiExecutionState.Completed,
                resultHash: input.resultHash,
                errorCode: null,
                incrementGeneration: false,
            })
    }

    /** Fail a live execution with a stable, non-sensitive error code. */
    async fail(input: FailExecutionInput): Promise<ExecutionTransitionResult> {
        if (!this.validBoundedKey(input.errorCode,
            96)
            || !this.validBoundedKey(input.terminalKey,
                192)
            || !this.validBoundedKey(input.claimantKey,
                192)
            || !this.validLeaseToken(input.leaseToken)
            || !this.validVersion(input.expectedVersion)) {
            return this.failure(AiExecutionErrorCode.InvalidInput,
                "Fail input violates the Slice 00 contract")
        }
        return this.finishLeasedExecution(input.executionId,
            input.claimantKey,
            input.leaseToken,
            {
                kind: AiExecutionTerminalKind.Fail,
                key: input.terminalKey,
                payload: {
                    errorCode: input.errorCode,
                },
                tokenHash: digestLeaseToken(input.leaseToken),
                expectedVersion: input.expectedVersion,
                nextState: AiExecutionState.Failed,
                resultHash: null,
                errorCode: input.errorCode,
                incrementGeneration: false,
            })
    }

    /** Cancel an accepted or running execution as its owner or an administrator. */
    async cancel(input: CancelExecutionInput): Promise<ExecutionTransitionResult> {
        if (!this.validBoundedKey(input.terminalKey,
            192)
            || !this.validBoundedKey(input.reasonCode,
                96)
            || !this.validVersion(input.expectedVersion)) {
            return this.failure(AiExecutionErrorCode.InvalidInput,
                "Cancel input violates the Slice 00 contract")
        }
        return this.withTransactionRetry(async (manager) => {
            const control = await this.lockRuntimeControl(manager)
            const execution = await this.lockExecution(manager,
                input.executionId)
            if (!control || !execution) {
                return this.failure(AiExecutionErrorCode.NotFound,
                    "Execution not found")
            }
            if (!input.isAdmin && execution.actorKey !== input.actorKey) {
                return this.failure(AiExecutionErrorCode.Forbidden,
                    "Execution is not owned by this actor")
            }
            const command: TerminalCommand = {
                kind: AiExecutionTerminalKind.Cancel,
                key: input.terminalKey,
                payload: {
                    actorKey: input.actorKey,
                    reasonCode: input.reasonCode,
                },
                tokenHash: null,
                expectedVersion: input.expectedVersion,
                nextState: AiExecutionState.Cancelled,
                resultHash: null,
                errorCode: null,
                incrementGeneration: true,
            }
            const replay = this.terminalReplay(execution,
                command)
            if (replay) {
                return replay
            }
            if (execution.state !== AiExecutionState.Accepted
                && execution.state !== AiExecutionState.Running) {
                return this.failure(AiExecutionErrorCode.StateConflict,
                    "Only active executions can be cancelled")
            }
            if (execution.version !== input.expectedVersion) {
                return this.failure(AiExecutionErrorCode.VersionConflict,
                    "Execution version does not match")
            }
            const now = await this.databaseNow(manager)
            await this.applyTerminal(manager,
                execution,
                command,
                now)
            return {
                ok: true,
                replayed: false,
                execution: this.toView(execution),
            }
        },
        () => this.failure(AiExecutionErrorCode.RetryableConflict,
            "Concurrent transaction conflict; retry the cancel command"))
    }

    /** Return one execution with a strong primary-store read. */
    async get(input: GetExecutionInput): Promise<ExecutionTransitionResult> {
        const execution = await this.entityManager.findOne(AiExecutionEntity,
            {
                where: {
                    id: input.executionId,
                },
            })
        if (!execution) {
            return this.failure(AiExecutionErrorCode.NotFound,
                "Execution not found")
        }
        if (!input.isAdmin && execution.actorKey !== input.actorKey) {
            return this.failure(AiExecutionErrorCode.Forbidden,
                "Execution is not owned by this actor")
        }
        return {
            ok: true,
            replayed: false,
            execution: this.toView(execution),
        }
    }

    /** Fence and fail expired accepted or running executions in a bounded batch. */
    async reconcileExpired(
        input: ReconcileExpiredExecutionsInput = {
        },
    ): Promise<ReconcileExpiredExecutionsResult> {
        const batchSize = Math.min(MAX_RECONCILE_BATCH,
            Math.max(1,
                Math.trunc(input.batchSize ?? MAX_RECONCILE_BATCH)))
        return this.withTransactionRetry<ReconcileExpiredExecutionsResult>(async (manager) => {
            const control = await this.lockRuntimeControl(manager)
            if (control?.incarnation_state !== "active") {
                return {
                    error: {
                        code: AiExecutionErrorCode.NotAccepting,
                        message: "The AI runtime control plane is unavailable",
                    },
                }
            }
            const due = await manager.query(
                `SELECT "id" FROM "public"."ai_executions"
                WHERE ("state" = 'accepted' AND "deadline_at" <= clock_timestamp())
                   OR ("state" = 'running' AND ("lease_expires_at" <= clock_timestamp() OR "deadline_at" <= clock_timestamp()))
                ORDER BY "deadline_at", "id"
                FOR UPDATE SKIP LOCKED
                LIMIT $1`,
                [batchSize],
            ) as Array<ExecutionIdRow>
            const reconciledExecutionIds: Array<string> = []
            for (const candidate of due) {
                const execution = await manager.findOneByOrFail(AiExecutionEntity,
                    {
                        id: candidate.id,
                    })
                const now = await this.databaseNow(manager)
                const errorCode = execution.state === AiExecutionState.Running
                    && execution.leaseExpiresAt
                    && execution.leaseExpiresAt.getTime() <= now.getTime()
                    ? "LEASE_EXPIRED"
                    : "DEADLINE_EXPIRED"
                await this.applyTerminal(manager,
                    execution,
                    {
                        kind: AiExecutionTerminalKind.Reconcile,
                        key: `reconcile:${execution.id}:${execution.generation}:${execution.version}`,
                        payload: {
                            errorCode,
                        },
                        tokenHash: execution.leaseTokenHash,
                        expectedVersion: execution.version,
                        nextState: AiExecutionState.Failed,
                        resultHash: null,
                        errorCode,
                        incrementGeneration: true,
                    },
                    now)
                reconciledExecutionIds.push(execution.id)
            }
            return {
                reconciledExecutionIds,
            }
        },
        () => ({
            error: {
                code: AiExecutionErrorCode.RetryableConflict,
                message: "Concurrent transaction conflict; retry reconciliation",
            },
        }))
    }

    private async finishLeasedExecution(
        executionId: string,
        claimantKey: string,
        leaseToken: string,
        command: TerminalCommand,
    ): Promise<ExecutionTransitionResult> {
        const tokenHash = digestLeaseToken(leaseToken)
        return this.withTransactionRetry(async (manager) => {
            const control = await this.lockRuntimeControl(manager)
            const execution = await this.lockExecution(manager,
                executionId)
            if (!control || !execution) {
                return this.failure(AiExecutionErrorCode.NotFound,
                    "Execution not found")
            }
            const replay = this.terminalReplay(execution,
                command)
            if (replay) {
                return replay
            }
            const authorityFailure = await this.validateLiveAuthority(
                manager,
                control,
                execution,
                claimantKey,
                command.expectedVersion,
                tokenHash,
            )
            if (authorityFailure) {
                return authorityFailure
            }
            const now = await this.databaseNow(manager)
            await this.applyTerminal(manager,
                execution,
                command,
                now)
            return {
                ok: true,
                replayed: false,
                execution: this.toView(execution),
            }
        },
        () => this.failure(AiExecutionErrorCode.RetryableConflict,
            "Concurrent transaction conflict; retry the terminal command"))
    }

    private async validateLiveAuthority(
        manager: EntityManager,
        control: RuntimeControlRow,
        execution: AiExecutionEntity,
        claimantKey: string,
        expectedVersion: string,
        tokenHash: Buffer,
    ): Promise<ExecutionTransitionResult | null> {
        if (execution.state !== AiExecutionState.Running) {
            return this.failure(AiExecutionErrorCode.StateConflict,
                "Execution is not running")
        }
        if (execution.version !== expectedVersion) {
            return this.failure(AiExecutionErrorCode.VersionConflict,
                "Execution version does not match")
        }
        if (execution.incarnationId !== control.active_incarnation_id
            || control.incarnation_state !== "active") {
            return this.failure(AiExecutionErrorCode.StateConflict,
                "Execution belongs to an inactive runtime incarnation")
        }
        if (execution.claimantKey !== claimantKey
            || !execution.leaseTokenHash
            || !executionDigestsEqual(execution.leaseTokenHash,
                tokenHash)) {
            return this.failure(AiExecutionErrorCode.LeaseConflict,
                "Lease authority does not match")
        }
        const now = await this.databaseNow(manager)
        if (!execution.leaseExpiresAt || execution.leaseExpiresAt.getTime() <= now.getTime()) {
            return this.failure(AiExecutionErrorCode.LeaseExpired,
                "The execution lease has elapsed")
        }
        if (execution.deadlineAt.getTime() <= now.getTime()) {
            return this.failure(AiExecutionErrorCode.DeadlineExpired,
                "The execution deadline has elapsed")
        }
        return null
    }

    private async applyTerminal(
        manager: EntityManager,
        execution: AiExecutionEntity,
        command: TerminalCommand,
        now: Date,
    ): Promise<void> {
        const payloadHash = executionDigest(EXECUTION_DIGEST_DOMAINS.terminalPayload,
            command.payload)
        const fenceHash = this.terminalFenceHash(execution,
            command,
            payloadHash)
        execution.state = command.nextState
        execution.claimantKey = null
        execution.leaseTokenHash = null
        execution.leaseExpiresAt = null
        execution.leaseCommandOperation = null
        execution.leaseCommandFenceHash = null
        execution.leaseCommandOutcomeVersion = null
        execution.leaseCommandOutcomeExpiresAt = null
        execution.resultHash = command.resultHash
        execution.errorCode = command.errorCode
        execution.terminalKind = command.kind
        execution.terminalKey = command.key
        execution.terminalPayloadHash = payloadHash
        execution.terminalFenceHash = fenceHash
        execution.terminalAt = now
        execution.generation += command.incrementGeneration ? 1 : 0
        execution.version = this.incrementVersion(execution.version)
        execution.updatedAt = now
        await manager.save(execution)
    }

    private terminalReplay(
        execution: AiExecutionEntity,
        command: TerminalCommand,
    ): ExecutionTransitionResult | null {
        if (!execution.terminalPayloadHash || !execution.terminalFenceHash) {
            return null
        }
        const payloadHash = executionDigest(EXECUTION_DIGEST_DOMAINS.terminalPayload,
            command.payload)
        const fenceHash = this.terminalFenceHash(execution,
            command,
            payloadHash,
            execution.generation - (command.incrementGeneration ? 1 : 0))
        if (execution.terminalKind === command.kind
            && execution.terminalKey === command.key
            && executionDigestsEqual(execution.terminalPayloadHash,
                payloadHash)
            && executionDigestsEqual(execution.terminalFenceHash,
                fenceHash)) {
            return {
                ok: true,
                replayed: true,
                execution: this.toView(execution),
            }
        }
        return null
    }

    private terminalFenceHash(
        execution: AiExecutionEntity,
        command: TerminalCommand,
        payloadHash: Buffer,
        generation = execution.generation,
    ): Buffer {
        return executionDigest(EXECUTION_DIGEST_DOMAINS.terminalFence,
            {
                executionId: execution.id,
                expectedVersion: command.expectedVersion,
                generation,
                incarnationId: execution.incarnationId,
                operation: command.kind,
                payloadHash: payloadHash.toString("hex"),
                terminalKey: command.key,
                ...(command.kind === AiExecutionTerminalKind.Cancel
                    ? {
                    }
                    : {
                        incarnationId: execution.incarnationId,
                        leaseTokenHashHex: command.tokenHash?.toString("hex") ?? null,
                    }),
            })
    }

    private leaseFenceHash(input: {
        operation: AiLeaseCommandOperation
        execution: AiExecutionEntity
        claimantKey: string
        commandKey: string
        expectedVersion: string
        leaseDurationMs: number
        tokenHash: Buffer | null
    }): Buffer {
        return executionDigest(EXECUTION_DIGEST_DOMAINS.lease,
            {
                commandKey: input.commandKey,
                executionId: input.execution.id,
                expectedVersion: input.expectedVersion,
                generation: input.execution.generation,
                incarnationId: input.execution.incarnationId,
                leaseDurationMs: input.leaseDurationMs,
                operation: input.operation,
                leaseTokenHashHex: input.tokenHash?.toString("hex") ?? null,
                ...(input.operation === AiLeaseCommandOperation.Claim
                    ? {
                        claimantKey: input.claimantKey,
                    }
                    : {
                    }),
            })
    }

    private isLeaseReplay(
        execution: AiExecutionEntity,
        operation: AiLeaseCommandOperation,
        fenceHash: Buffer,
    ): boolean {
        return execution.state === AiExecutionState.Running
            && execution.leaseCommandOperation === operation
            && execution.leaseCommandFenceHash !== null
            && execution.leaseCommandOutcomeExpiresAt !== null
            && execution.leaseCommandOutcomeVersion === execution.version
            && executionDigestsEqual(execution.leaseCommandFenceHash,
                fenceHash)
    }

    private validateReplayWindow(
        execution: AiExecutionEntity,
        now: Date,
    ): ExecutionTransitionResult | null {
        if (execution.deadlineAt.getTime() <= now.getTime()) {
            return this.failure(AiExecutionErrorCode.DeadlineExpired,
                "The execution deadline has elapsed")
        }
        if (!execution.leaseCommandOutcomeExpiresAt
            || execution.leaseCommandOutcomeExpiresAt.getTime() <= now.getTime()) {
            return this.failure(AiExecutionErrorCode.LeaseExpired,
                "The execution lease has elapsed")
        }
        return null
    }

    private async lockRuntimeControl(manager: EntityManager): Promise<RuntimeControlRow | null> {
        const rows = await manager.query(
            `SELECT c."active_incarnation_id", c."accepting", i."state" AS "incarnation_state"
            FROM "public"."ai_runtime_control" c
            JOIN "public"."ai_runtime_incarnations" i ON i."id" = c."active_incarnation_id"
            WHERE c."id" = 1
            FOR SHARE OF c`,
        ) as Array<RuntimeControlRow>
        return rows[0] ?? null
    }

    private async lockExecution(
        manager: EntityManager,
        executionId: string,
    ): Promise<AiExecutionEntity | null> {
        return manager.findOne(AiExecutionEntity,
            {
                where: {
                    id: executionId,
                },
                lock: {
                    mode: "pessimistic_write",
                },
            })
    }

    private async databaseNow(manager: EntityManager): Promise<Date> {
        const rows = await manager.query("SELECT clock_timestamp() AS \"now\"") as Array<DatabaseNowRow>
        return rows[0].now
    }

    private toView(execution: AiExecutionEntity): AiExecutionView {
        return {
            id: execution.id,
            actorUserId: execution.actorUserId,
            actorKey: execution.actorKey,
            capability: execution.capability,
            contractVersion: execution.contractVersion,
            incarnationId: execution.incarnationId,
            generation: execution.generation,
            version: execution.version,
            state: execution.state,
            claimantKey: execution.claimantKey,
            leaseExpiresAt: execution.leaseExpiresAt,
            deadlineAt: execution.deadlineAt,
            resultHash: execution.resultHash,
            errorCode: execution.errorCode,
            terminalKind: execution.terminalKind,
            acceptedAt: execution.acceptedAt,
            startedAt: execution.startedAt,
            terminalAt: execution.terminalAt,
            createdAt: execution.createdAt,
            updatedAt: execution.updatedAt,
        }
    }

    private validateAcceptInput(input: AcceptExecutionInput): AcceptExecutionResult | null {
        if (input.capability !== AiExecutionCapability.ControlPlaneProbe
            || !this.validActorIdentity(input.actorKey,
                input.actorUserId)
            || input.idempotencyKey.length === 0
            || input.idempotencyKey.length > 192
            || input.contractVersion.length === 0
            || input.contractVersion.length > 64
            || Number.isNaN(input.deadlineAt.getTime())) {
            return this.failure(AiExecutionErrorCode.InvalidInput,
                "Accept input violates the Slice 00 contract")
        }
        return null
    }

    private validLeaseInput(durationMs: number): boolean {
        return Number.isSafeInteger(durationMs)
            && durationMs >= MIN_LEASE_DURATION_MS
            && durationMs <= MAX_LEASE_DURATION_MS
    }

    private validActorIdentity(actorKey: string, actorUserId: string | null): boolean {
        if (actorUserId) {
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actorUserId)
                && actorKey === `user:${actorUserId}`
        }
        return /^system:[A-Za-z0-9._:-]{1,185}$/.test(actorKey)
            && actorKey.length <= 192
    }

    private validBoundedKey(value: string, maximumLength: number): boolean {
        return value.length > 0 && Buffer.byteLength(value,
            "utf8") <= maximumLength
    }

    private validLeaseToken(value: string): boolean {
        if (!/^[A-Za-z0-9_-]+$/.test(value)) {
            return false
        }
        const decoded = Buffer.from(value,
            "base64url")
        return decoded.length >= 16 && decoded.toString("base64url") === value
    }

    private validVersion(value: string): boolean {
        return /^[1-9]\d*$/.test(value)
    }

    private incrementVersion(value: string): string {
        return (BigInt(value) + 1n).toString()
    }

    private failure(code: AiExecutionErrorCode, message: string): {
        ok: false
        error: {
            code: AiExecutionErrorCode
            message: string
        }
    } {
        return {
            ok: false,
            error: {
                code,
                message,
            },
        }
    }

    private async withTransactionRetry<T>(
        work: (manager: EntityManager) => Promise<T>,
        retryExhausted: () => T,
    ): Promise<T> {
        let lastFailure: unknown
        for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt += 1) {
            try {
                return await this.entityManager.transaction("READ COMMITTED",
                    work)
            } catch (error_: unknown) {
                lastFailure = error_
                if (!this.isRetryableTransactionFailure(error_)) {
                    throw error_
                }
                if (attempt === MAX_RETRY_ATTEMPTS - 1) {
                    return retryExhausted()
                }
                const delay = randomInt(RETRY_DELAYS_MS[attempt] + 1)
                await new Promise<void>((resolve) => {
                    setTimeout(resolve,
                        delay)
                })
            }
        }
        if (this.isRetryableTransactionFailure(lastFailure)) {
            return retryExhausted()
        }
        throw lastFailure
    }

    private isRetryableTransactionFailure(failure: unknown): boolean {
        if (!failure || typeof failure !== "object") {
            return false
        }
        const carrier = failure as DriverErrorCarrier
        const code = carrier.driverError?.code ?? carrier.code
        return code === "40001" || code === "40P01"
    }
}
