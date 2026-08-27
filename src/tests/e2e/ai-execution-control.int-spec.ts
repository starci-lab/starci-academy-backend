import {
    DataSource,
} from "typeorm"
import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    AiExecutionControlService,
} from "@modules/ai/control-plane/ai-execution-control.service"
import {
    AiExecutionCapability,
} from "@modules/ai/control-plane/types/execution-state"
import {
    AiExecutionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-execution.entity"
import {
    AiRuntimeControlEntity,
} from "@modules/databases/postgresql/primary/entities/ai-runtime-control.entity"
import {
    AiRuntimeIncarnationEntity,
} from "@modules/databases/postgresql/primary/entities/ai-runtime-incarnation.entity"
import {
    CreateAiExecutionControlFoundation1787900000000,
} from "@modules/databases/postgresql/primary/migrations/1787900000000-CreateAiExecutionControlFoundation"
import {
    AiExecutionControlFoundationTestModule,
} from "@tests/helpers/ai-execution-control-foundation-test.module"

interface CountRow {
    count: string
}

interface PrivilegeRow {
    can_select: boolean
    can_insert: boolean
    can_update: boolean
    can_delete: boolean
    can_insert_control: boolean
    can_update_control_id: boolean
    can_update_control_accepting: boolean
}

interface IdentityRow {
    current_user: string
    session_user: string
}

interface BackendPidRow {
    pid: number
}

interface ResourceIdentityRow {
    incarnation: string | null
    control: string | null
    execution: string | null
    users: string | null
}

describe("AI execution control PostgreSQL contract",
    () => {
        let dataSource: DataSource
        let runtimeDataSource: DataSource
        let moduleRef: TestingModule
        let service: AiExecutionControlService

        beforeAll(async () => {
            dataSource = new DataSource({
                type: "postgres",
                host: process.env.POSTGRESQL_PRIMARY_HOST,
                port: Number(process.env.POSTGRESQL_PRIMARY_PORT),
                username: process.env.POSTGRESQL_PRIMARY_USERNAME,
                password: process.env.POSTGRESQL_PRIMARY_PASSWORD,
                database: process.env.POSTGRESQL_PRIMARY_DATABASE,
                entities: [
                    AiRuntimeIncarnationEntity,
                    AiRuntimeControlEntity,
                    AiExecutionEntity,
                ],
                migrations: [CreateAiExecutionControlFoundation1787900000000],
                migrationsTransactionMode: "each",
                synchronize: false,
                extra: {
                    max: 32,
                },
            })
            await dataSource.initialize()
            await dataSource.query("CREATE TABLE IF NOT EXISTS \"public\".\"users\" (\"id\" uuid PRIMARY KEY)")
            await dataSource.query(`
                DO $roles$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'starci_primary_objects_owner') THEN
                        CREATE ROLE "starci_primary_objects_owner" NOLOGIN NOINHERIT;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'starci_primary_migrator') THEN
                        CREATE ROLE "starci_primary_migrator" NOLOGIN NOINHERIT;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'starci_core_runtime') THEN
                        CREATE ROLE "starci_core_runtime" LOGIN NOINHERIT PASSWORD 'slice00-runtime-test';
                    END IF;
                END
                $roles$
            `)
            await dataSource.query("GRANT \"starci_primary_objects_owner\" TO \"starci_primary_migrator\"")
            await dataSource.runMigrations()
            runtimeDataSource = new DataSource({
                type: "postgres",
                host: process.env.POSTGRESQL_PRIMARY_HOST,
                port: Number(process.env.POSTGRESQL_PRIMARY_PORT),
                username: "starci_core_runtime",
                password: "slice00-runtime-test",
                database: process.env.POSTGRESQL_PRIMARY_DATABASE,
                entities: [AiExecutionEntity],
                synchronize: false,
                extra: {
                    max: 32,
                },
            })
            await runtimeDataSource.initialize()
            moduleRef = await Test.createTestingModule({
                imports: [AiExecutionControlFoundationTestModule.register(runtimeDataSource.manager)],
            }).compile()
            service = moduleRef.get(AiExecutionControlService)
        })

        afterAll(async () => {
            await moduleRef?.close()
            if (runtimeDataSource?.isInitialized) {
                await runtimeDataSource.destroy()
            }
            if (dataSource?.isInitialized) {
                await dataSource.destroy()
            }
        })

        it("creates the exact seeded dark foundation once",
            async () => {
                const migrations = await dataSource.runMigrations()
                const incarnations = await dataSource.query(
                    "SELECT count(*)::text AS \"count\" FROM \"ai_runtime_incarnations\"",
                ) as Array<CountRow>
                const controls = await dataSource.query(
                    "SELECT count(*)::text AS \"count\" FROM \"ai_runtime_control\" WHERE \"id\" = 1 AND \"accepting\" = false",
                ) as Array<CountRow>
                const executions = await dataSource.query(
                    "SELECT count(*)::text AS \"count\" FROM \"ai_executions\"",
                ) as Array<CountRow>

                expect(migrations).toHaveLength(0)
                expect(incarnations[0].count).toBe("1")
                expect(controls[0].count).toBe("1")
                expect(executions[0].count).toBe("0")
            })

        it("grants the runtime only the frozen table privileges",
            async () => {
                const rows = await dataSource.query(`
                    SELECT
                        has_table_privilege('starci_core_runtime', 'public.ai_executions', 'SELECT') AS "can_select",
                        has_table_privilege('starci_core_runtime', 'public.ai_executions', 'INSERT') AS "can_insert",
                        has_table_privilege('starci_core_runtime', 'public.ai_executions', 'UPDATE') AS "can_update",
                        has_table_privilege('starci_core_runtime', 'public.ai_executions', 'DELETE') AS "can_delete",
                        has_table_privilege('starci_core_runtime', 'public.ai_runtime_control', 'INSERT') AS "can_insert_control",
                        has_column_privilege('starci_core_runtime', 'public.ai_runtime_control', 'id', 'UPDATE') AS "can_update_control_id",
                        has_column_privilege('starci_core_runtime', 'public.ai_runtime_control', 'accepting', 'UPDATE') AS "can_update_control_accepting"
                `) as Array<PrivilegeRow>

                expect(rows[0]).toEqual({
                    can_select: true,
                    can_insert: true,
                    can_update: true,
                    can_delete: false,
                    can_insert_control: false,
                    can_update_control_id: true,
                    can_update_control_accepting: false,
                })
                const identity = await runtimeDataSource.query(
                    "SELECT current_user, session_user",
                ) as Array<IdentityRow>
                expect(identity[0]).toEqual({
                    current_user: "starci_core_runtime",
                    session_user: "starci_core_runtime",
                })
                await expect(runtimeDataSource.query(
                    "DELETE FROM \"public\".\"ai_executions\"",
                )).rejects.toBeDefined()
                await expect(runtimeDataSource.query(
                    "INSERT INTO \"public\".\"ai_runtime_control\" (\"id\", \"active_incarnation_id\") SELECT 1, \"id\" FROM \"public\".\"ai_runtime_incarnations\" LIMIT 1",
                )).rejects.toBeDefined()
                await expect(runtimeDataSource.query(
                    "CREATE TABLE \"public\".\"slice00_forbidden_probe\" (\"id\" integer)",
                )).rejects.toBeDefined()
            })

        it("allows one winner in a concurrent claim race and replays terminal completion",
            async () => {
                const queryRunners = Array.from({
                    length: 32,
                },
                () => runtimeDataSource.createQueryRunner())
                await Promise.all(queryRunners.map((queryRunner) => queryRunner.connect()))
                const backendRows = await Promise.all(queryRunners.map(async (queryRunner) => {
                    const rows = await queryRunner.query(
                        "SELECT pg_backend_pid() AS \"pid\"",
                    ) as Array<BackendPidRow>
                    return rows[0]
                }))
                expect(new Set(backendRows.map((row) => row.pid)).size).toBe(32)
                await Promise.all(queryRunners.map((queryRunner) => queryRunner.release()))

                await dataSource.query(
                    "UPDATE \"public\".\"ai_runtime_control\" SET \"accepting\" = true, \"version\" = \"version\" + 1, \"updated_at\" = clock_timestamp() WHERE \"id\" = 1",
                )
                const accepted = await service.accept({
                    actorUserId: null,
                    actorKey: "system:integration-user",
                    capability: AiExecutionCapability.ControlPlaneProbe,
                    idempotencyKey: "integration:claim-race",
                    contractVersion: "academy-ai-engine-slice00-v3",
                    deadlineAt: new Date(Date.now() + 300_000),
                })
                expect(accepted.ok).toBe(true)
                if (!accepted.ok) {
                    throw new TypeError("Execution was not accepted")
                }

                const claims = await Promise.all(Array.from({
                    length: 32,
                },
                (_, index) => service.claim({
                    executionId: accepted.execution.id,
                    claimantKey: `worker:${index}`,
                    commandKey: `claim:${index}`,
                    expectedVersion: "1",
                    leaseDurationMs: 60_000,
                })))
                const winners = claims.filter((claim) => claim.ok && !claim.replayed && claim.leaseToken)

                expect(winners).toHaveLength(1)
                const winner = winners[0]
                if (!winner.ok || !winner.leaseToken) {
                    throw new TypeError("Claim race did not return one winning token")
                }
                const completed = await service.complete({
                    executionId: accepted.execution.id,
                    claimantKey: winner.execution.claimantKey ?? "",
                    terminalKey: "complete:integration",
                    expectedVersion: winner.execution.version,
                    leaseToken: winner.leaseToken,
                    resultHash: "b".repeat(64),
                })
                const replayed = await service.complete({
                    executionId: accepted.execution.id,
                    claimantKey: winner.execution.claimantKey ?? "",
                    terminalKey: "complete:integration",
                    expectedVersion: winner.execution.version,
                    leaseToken: winner.leaseToken,
                    resultHash: "b".repeat(64),
                })

                expect(completed).toMatchObject({
                    ok: true,
                    replayed: false,
                    execution: {
                        state: "completed",
                    },
                })
                expect(replayed).toMatchObject({
                    ok: true,
                    replayed: true,
                    execution: {
                        state: "completed",
                    },
                })
            })

        it("rolls back only Slice 00 resources on a disposable clone",
            async () => {
                await runtimeDataSource.destroy()
                await dataSource.undoLastMigration()
                const resources = await dataSource.query(`
                    SELECT
                        to_regclass('public.ai_runtime_incarnations')::text AS "incarnation",
                        to_regclass('public.ai_runtime_control')::text AS "control",
                        to_regclass('public.ai_executions')::text AS "execution",
                        to_regclass('public.users')::text AS "users"
                `) as Array<ResourceIdentityRow>

                expect(resources[0]).toEqual({
                    incarnation: null,
                    control: null,
                    execution: null,
                    users: "users",
                })
                await dataSource.runMigrations()
            })
    })
