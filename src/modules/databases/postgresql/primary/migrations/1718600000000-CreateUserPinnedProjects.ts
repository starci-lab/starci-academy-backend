import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates the `user_pinned_projects` table backing the profile "pinned projects"
 * feature, together with the `project_pin_type` enum, the user / enrollment
 * foreign keys (both ON DELETE CASCADE), and the per-user lookup index.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically in environments where
 * `synchronize` is disabled.
 */
export class CreateUserPinnedProjects1718600000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "CreateUserPinnedProjects1718600000000"

    /**
     * Forward migration: create enum, table, FKs and index.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        // create the discriminator enum first — the table column references it by type
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_pin_type') THEN
                    CREATE TYPE "project_pin_type" AS ENUM ('course', 'external');
                END IF;
            END
            $$;
        `)

        // create the table; nullable columns mirror the entity (external vs course pins)
        await queryRunner.query(`
            CREATE TABLE "user_pinned_projects" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "type" "project_pin_type" NOT NULL,
                "enrollment_id" uuid,
                "title" varchar(255),
                "description" varchar(1024),
                "url" varchar(2048),
                "tech_stack" jsonb,
                "order_index" int NOT NULL DEFAULT 0,
                CONSTRAINT "pk_user_pinned_projects_id" PRIMARY KEY ("id")
            );
        `)

        // per-user index — every read filters by user_id and orders by order_index
        await queryRunner.query(`
            CREATE INDEX "idx_user_pinned_projects_user_id"
            ON "user_pinned_projects" ("user_id");
        `)

        // FK to users — deleting a user removes their pins
        await queryRunner.query(`
            ALTER TABLE "user_pinned_projects"
            ADD CONSTRAINT "fk_user_id_user_pinned_projects_users"
            FOREIGN KEY ("user_id") REFERENCES "users" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)

        // FK to enrollments (nullable) — deleting an enrollment removes its course pin
        await queryRunner.query(`
            ALTER TABLE "user_pinned_projects"
            ADD CONSTRAINT "fk_enrollment_id_user_pinned_projects_enrollments"
            FOREIGN KEY ("enrollment_id") REFERENCES "enrollments" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)
    }

    /**
     * Reverse migration: drop FKs, index, table and enum in dependency order.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        // drop FKs before the table so the constraints do not block the drop
        await queryRunner.query(`
            ALTER TABLE "user_pinned_projects"
            DROP CONSTRAINT IF EXISTS "fk_enrollment_id_user_pinned_projects_enrollments";
        `)
        await queryRunner.query(`
            ALTER TABLE "user_pinned_projects"
            DROP CONSTRAINT IF EXISTS "fk_user_id_user_pinned_projects_users";
        `)

        // drop the lookup index
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_user_pinned_projects_user_id";
        `)

        // drop the table, then the now-unreferenced enum type
        await queryRunner.query("DROP TABLE IF EXISTS \"user_pinned_projects\";")
        await queryRunner.query("DROP TYPE IF EXISTS \"project_pin_type\";")
    }
}
