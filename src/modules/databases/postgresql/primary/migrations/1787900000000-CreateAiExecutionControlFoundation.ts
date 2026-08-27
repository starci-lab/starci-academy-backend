import type {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

const BOOTSTRAP_INCARNATION_ID = "c17e46e2-16b5-5aad-a2dd-e399d1cebbf7"
const BOOTSTRAP_RELEASE_SHA = "451ac8583742bfdbc565e32070e756ab35aa9c1b"

/** Create the dark, non-accepting Slice 00 execution-control foundation. */
export class CreateAiExecutionControlFoundation1787900000000 implements MigrationInterface {
    name = "CreateAiExecutionControlFoundation1787900000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $roles$
            DECLARE
                runtime_role record;
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'starci_primary_objects_owner')
                   OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'starci_primary_migrator')
                   OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'starci_core_runtime') THEN
                    RAISE EXCEPTION 'Slice 00 database principals are not provisioned';
                END IF;
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'starci_primary_objects_owner' AND rolcanlogin) THEN
                    RAISE EXCEPTION 'starci_primary_objects_owner must be NOLOGIN';
                END IF;
                SELECT * INTO runtime_role FROM pg_roles WHERE rolname = 'starci_core_runtime';
                IF runtime_role.rolsuper OR runtime_role.rolcreatedb OR runtime_role.rolcreaterole
                   OR runtime_role.rolbypassrls OR runtime_role.rolinherit THEN
                    RAISE EXCEPTION 'starci_core_runtime has forbidden role attributes';
                END IF;
                IF EXISTS (
                    SELECT 1 FROM pg_auth_members
                    WHERE member = (SELECT oid FROM pg_roles WHERE rolname = 'starci_core_runtime')
                ) THEN
                    RAISE EXCEPTION 'starci_core_runtime must not inherit another role';
                END IF;
                IF has_schema_privilege('starci_core_runtime', 'public', 'CREATE') THEN
                    RAISE EXCEPTION 'starci_core_runtime must not CREATE in public schema';
                END IF;
                IF NOT pg_has_role('starci_primary_migrator', 'starci_primary_objects_owner', 'MEMBER') THEN
                    RAISE EXCEPTION 'starci_primary_migrator must be a member of starci_primary_objects_owner';
                END IF;
            END
            $roles$
        `)
        await queryRunner.query(`
            CREATE TABLE "public"."ai_runtime_incarnations" (
                "id" uuid NOT NULL,
                "reason" varchar(32) NOT NULL,
                "state" varchar(16) NOT NULL,
                "release_sha" varchar(64) NOT NULL,
                "contract_version" varchar(64) NOT NULL,
                "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
                "activated_at" timestamptz NULL,
                "retired_at" timestamptz NULL,
                CONSTRAINT "pk_ai_runtime_incarnations" PRIMARY KEY ("id"),
                CONSTRAINT "ck_ai_runtime_incarnations_reason" CHECK ("reason" IN ('bootstrap', 'deploy', 'restore', 'manual_recovery')),
                CONSTRAINT "ck_ai_runtime_incarnations_state" CHECK ("state" IN ('preparing', 'active', 'retired')),
                CONSTRAINT "ck_ai_runtime_incarnations_release_sha" CHECK (char_length("release_sha") BETWEEN 7 AND 64),
                CONSTRAINT "ck_ai_runtime_incarnations_state_times" CHECK (
                    ("state" = 'preparing' AND "activated_at" IS NULL AND "retired_at" IS NULL)
                    OR ("state" = 'active' AND "activated_at" IS NOT NULL AND "retired_at" IS NULL)
                    OR ("state" = 'retired' AND "activated_at" IS NOT NULL AND "retired_at" IS NOT NULL AND "retired_at" >= "activated_at")
                )
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_ai_runtime_incarnations_one_active"
            ON "public"."ai_runtime_incarnations" ((1)) WHERE "state" = 'active'
        `)
        await queryRunner.query(`
            CREATE TABLE "public"."ai_runtime_control" (
                "id" smallint NOT NULL,
                "active_incarnation_id" uuid NOT NULL,
                "accepting" boolean NOT NULL DEFAULT false,
                "version" bigint NOT NULL DEFAULT 0,
                "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
                "updated_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
                CONSTRAINT "pk_ai_runtime_control" PRIMARY KEY ("id"),
                CONSTRAINT "ck_ai_runtime_control_singleton" CHECK ("id" = 1),
                CONSTRAINT "ck_ai_runtime_control_version" CHECK ("version" >= 0),
                CONSTRAINT "ck_ai_runtime_control_time" CHECK ("updated_at" >= "created_at"),
                CONSTRAINT "fk_ai_runtime_control_active_incarnation" FOREIGN KEY ("active_incarnation_id")
                    REFERENCES "public"."ai_runtime_incarnations"("id") ON UPDATE RESTRICT ON DELETE RESTRICT
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "public"."ai_executions" (
                "id" uuid NOT NULL,
                "actor_user_id" uuid NULL,
                "actor_key" varchar(192) NOT NULL,
                "capability" varchar(96) NOT NULL,
                "idempotency_key" varchar(192) NOT NULL,
                "request_hash" char(64) NOT NULL,
                "contract_version" varchar(64) NOT NULL,
                "incarnation_id" uuid NOT NULL,
                "generation" integer NOT NULL DEFAULT 0,
                "version" bigint NOT NULL DEFAULT 1,
                "state" varchar(16) NOT NULL,
                "claimant_key" varchar(192) NULL,
                "lease_token_hash" bytea NULL,
                "lease_expires_at" timestamptz NULL,
                "lease_command_operation" varchar(16) NULL,
                "lease_command_fence_hash" bytea NULL,
                "lease_command_outcome_version" bigint NULL,
                "lease_command_outcome_expires_at" timestamptz NULL,
                "deadline_at" timestamptz NOT NULL,
                "result_hash" char(64) NULL,
                "error_code" varchar(96) NULL,
                "terminal_kind" varchar(16) NULL,
                "terminal_key" varchar(192) NULL,
                "terminal_payload_hash" bytea NULL,
                "terminal_fence_hash" bytea NULL,
                "accepted_at" timestamptz NOT NULL,
                "started_at" timestamptz NULL,
                "terminal_at" timestamptz NULL,
                "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
                "updated_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
                CONSTRAINT "pk_ai_executions" PRIMARY KEY ("id"),
                CONSTRAINT "fk_ai_executions_actor_user" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON UPDATE RESTRICT ON DELETE SET NULL,
                CONSTRAINT "fk_ai_executions_incarnation" FOREIGN KEY ("incarnation_id") REFERENCES "public"."ai_runtime_incarnations"("id") ON UPDATE RESTRICT ON DELETE RESTRICT,
                CONSTRAINT "uq_ai_executions_accept_identity" UNIQUE ("actor_key", "capability", "idempotency_key"),
                CONSTRAINT "ck_ai_executions_capability" CHECK ("capability" = 'control_plane_probe'),
                CONSTRAINT "ck_ai_executions_generation" CHECK ("generation" >= 0),
                CONSTRAINT "ck_ai_executions_version" CHECK ("version" >= 1),
                CONSTRAINT "ck_ai_executions_state" CHECK ("state" IN ('accepted', 'running', 'completed', 'failed', 'cancelled')),
                CONSTRAINT "ck_ai_executions_request_hash" CHECK ("request_hash" ~ '^[0-9a-f]{64}$'),
                CONSTRAINT "ck_ai_executions_result_hash" CHECK ("result_hash" IS NULL OR "result_hash" ~ '^[0-9a-f]{64}$'),
                CONSTRAINT "ck_ai_executions_lease_token_hash" CHECK ("lease_token_hash" IS NULL OR octet_length("lease_token_hash") = 32),
                CONSTRAINT "ck_ai_executions_lease_command_operation" CHECK ("lease_command_operation" IS NULL OR "lease_command_operation" IN ('claim', 'heartbeat')),
                CONSTRAINT "ck_ai_executions_lease_command_fence_hash" CHECK ("lease_command_fence_hash" IS NULL OR octet_length("lease_command_fence_hash") = 32),
                CONSTRAINT "ck_ai_executions_lease_command_outcome_version" CHECK ("lease_command_outcome_version" IS NULL OR "lease_command_outcome_version" >= 2),
                CONSTRAINT "ck_ai_executions_terminal_kind" CHECK ("terminal_kind" IS NULL OR "terminal_kind" IN ('complete', 'fail', 'cancel', 'reconcile')),
                CONSTRAINT "ck_ai_executions_terminal_payload_hash" CHECK ("terminal_payload_hash" IS NULL OR octet_length("terminal_payload_hash") = 32),
                CONSTRAINT "ck_ai_executions_terminal_fence_hash" CHECK ("terminal_fence_hash" IS NULL OR octet_length("terminal_fence_hash") = 32),
                CONSTRAINT "ck_ai_executions_time" CHECK (
                    "deadline_at" > "accepted_at"
                    AND ("started_at" IS NULL OR "started_at" >= "accepted_at")
                    AND ("lease_expires_at" IS NULL OR ("started_at" IS NOT NULL AND "lease_expires_at" > "started_at"))
                    AND ("lease_expires_at" IS NULL OR "lease_expires_at" <= "deadline_at")
                    AND ("terminal_at" IS NULL OR "terminal_at" >= "accepted_at")
                    AND "updated_at" >= "created_at"
                ),
                CONSTRAINT "ck_ai_executions_state_shape" CHECK (
                    ("state" = 'accepted'
                        AND "generation" = 0 AND "version" = 1
                        AND "claimant_key" IS NULL AND "lease_token_hash" IS NULL AND "lease_expires_at" IS NULL
                        AND "lease_command_operation" IS NULL AND "lease_command_fence_hash" IS NULL
                        AND "lease_command_outcome_version" IS NULL AND "lease_command_outcome_expires_at" IS NULL
                        AND "started_at" IS NULL AND "terminal_at" IS NULL AND "terminal_kind" IS NULL
                        AND "terminal_key" IS NULL AND "terminal_payload_hash" IS NULL AND "terminal_fence_hash" IS NULL
                        AND "result_hash" IS NULL AND "error_code" IS NULL)
                    OR ("state" = 'running'
                        AND "claimant_key" IS NOT NULL AND "lease_token_hash" IS NOT NULL AND "lease_expires_at" IS NOT NULL
                        AND "lease_command_operation" IS NOT NULL AND "lease_command_fence_hash" IS NOT NULL
                        AND "lease_command_outcome_version" = "version"
                        AND "lease_command_outcome_expires_at" = "lease_expires_at"
                        AND "started_at" IS NOT NULL AND "terminal_at" IS NULL AND "terminal_kind" IS NULL
                        AND "terminal_key" IS NULL AND "terminal_payload_hash" IS NULL AND "terminal_fence_hash" IS NULL
                        AND "result_hash" IS NULL AND "error_code" IS NULL)
                    OR ("state" = 'completed'
                        AND "claimant_key" IS NULL AND "lease_token_hash" IS NULL AND "lease_expires_at" IS NULL
                        AND "lease_command_operation" IS NULL AND "lease_command_fence_hash" IS NULL
                        AND "lease_command_outcome_version" IS NULL AND "lease_command_outcome_expires_at" IS NULL
                        AND "started_at" IS NOT NULL AND "terminal_at" IS NOT NULL AND "terminal_kind" = 'complete' AND "terminal_key" IS NOT NULL
                        AND "terminal_payload_hash" IS NOT NULL AND "terminal_fence_hash" IS NOT NULL
                        AND "result_hash" IS NOT NULL AND "error_code" IS NULL)
                    OR ("state" = 'failed'
                        AND "claimant_key" IS NULL AND "lease_token_hash" IS NULL AND "lease_expires_at" IS NULL
                        AND "lease_command_operation" IS NULL AND "lease_command_fence_hash" IS NULL
                        AND "lease_command_outcome_version" IS NULL AND "lease_command_outcome_expires_at" IS NULL
                        AND "terminal_at" IS NOT NULL AND "terminal_kind" IN ('fail', 'reconcile') AND "terminal_key" IS NOT NULL
                        AND "terminal_payload_hash" IS NOT NULL AND "terminal_fence_hash" IS NOT NULL
                        AND "result_hash" IS NULL AND "error_code" IS NOT NULL
                        AND ("terminal_kind" = 'reconcile' OR "started_at" IS NOT NULL))
                    OR ("state" = 'cancelled'
                        AND "claimant_key" IS NULL AND "lease_token_hash" IS NULL AND "lease_expires_at" IS NULL
                        AND "lease_command_operation" IS NULL AND "lease_command_fence_hash" IS NULL
                        AND "lease_command_outcome_version" IS NULL AND "lease_command_outcome_expires_at" IS NULL
                        AND "terminal_at" IS NOT NULL AND "terminal_kind" = 'cancel' AND "terminal_key" IS NOT NULL
                        AND "terminal_payload_hash" IS NOT NULL AND "terminal_fence_hash" IS NOT NULL
                        AND "result_hash" IS NULL AND "error_code" IS NULL)
                )
            )
        `)
        await queryRunner.query("CREATE INDEX \"ix_ai_executions_state_lease\" ON \"public\".\"ai_executions\" (\"state\", \"lease_expires_at\")")
        await queryRunner.query("CREATE INDEX \"ix_ai_executions_state_deadline\" ON \"public\".\"ai_executions\" (\"state\", \"deadline_at\")")
        await queryRunner.query("CREATE INDEX \"ix_ai_executions_actor_created\" ON \"public\".\"ai_executions\" (\"actor_key\", \"created_at\" DESC)")

        await queryRunner.query(`
            INSERT INTO "public"."ai_runtime_incarnations" (
                "id", "reason", "state", "release_sha", "contract_version", "activated_at"
            ) VALUES (
                '${BOOTSTRAP_INCARNATION_ID}', 'bootstrap', 'active', '${BOOTSTRAP_RELEASE_SHA}', 'academy-ai-engine-slice00-v3', clock_timestamp()
            )
        `)
        await queryRunner.query(`
            INSERT INTO "public"."ai_runtime_control" ("id", "active_incarnation_id", "accepting")
            VALUES (1, '${BOOTSTRAP_INCARNATION_ID}', false)
        `)
        await queryRunner.query("REVOKE ALL ON TABLE \"public\".\"ai_runtime_incarnations\", \"public\".\"ai_runtime_control\", \"public\".\"ai_executions\" FROM PUBLIC")
        await queryRunner.query(`
            DO $roles$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'starci_primary_objects_owner') THEN
                    ALTER TABLE "public"."ai_runtime_incarnations" OWNER TO "starci_primary_objects_owner";
                    ALTER TABLE "public"."ai_runtime_control" OWNER TO "starci_primary_objects_owner";
                    ALTER TABLE "public"."ai_executions" OWNER TO "starci_primary_objects_owner";
                END IF;
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'starci_core_runtime') THEN
                    GRANT USAGE ON SCHEMA public TO "starci_core_runtime";
                    GRANT SELECT ON TABLE "public"."ai_runtime_incarnations", "public"."ai_runtime_control", "public"."ai_executions" TO "starci_core_runtime";
                    GRANT INSERT, UPDATE ON TABLE "public"."ai_executions" TO "starci_core_runtime";
                    GRANT UPDATE ("id") ON TABLE "public"."ai_runtime_control" TO "starci_core_runtime";
                    REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE "public"."ai_runtime_incarnations", "public"."ai_runtime_control", "public"."ai_executions" FROM "starci_core_runtime";
                    REVOKE INSERT, UPDATE ON TABLE "public"."ai_runtime_incarnations" FROM "starci_core_runtime";
                    REVOKE INSERT ON TABLE "public"."ai_runtime_control" FROM "starci_core_runtime";
                END IF;
            END
            $roles$
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE \"public\".\"ai_executions\"")
        await queryRunner.query("DROP TABLE \"public\".\"ai_runtime_control\"")
        await queryRunner.query("DROP INDEX \"public\".\"uq_ai_runtime_incarnations_one_active\"")
        await queryRunner.query("DROP TABLE \"public\".\"ai_runtime_incarnations\"")
    }
}
