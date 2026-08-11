import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/** Adds auditable, idempotent refund state to course-purchase transactions. */
export class AddCourseRefundState1726600000000 implements MigrationInterface {
    name = "AddCourseRefundState1726600000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        // Resolve the generated enum name from the live column instead of
        // assuming TypeORM's default name; older installations may differ.
        await queryRunner.query(`
            DO $$
            DECLARE status_enum regtype;
            BEGIN
                SELECT a.atttypid::regtype INTO status_enum
                FROM pg_attribute a
                WHERE a.attrelid = 'transactions'::regclass
                  AND a.attname = 'status'
                  AND NOT a.attisdropped;
                EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', status_enum, 'refunded');
            END $$;
        `)
        await queryRunner.query(`
            ALTER TABLE "transactions"
            ADD COLUMN IF NOT EXISTS "refund_reference" varchar(128),
            ADD COLUMN IF NOT EXISTS "refund_reason" text,
            ADD COLUMN IF NOT EXISTS "refunded_at" timestamptz;
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "UQ_transactions_refund_reference"
            ON "transactions" ("refund_reference")
            WHERE "refund_reference" IS NOT NULL;
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "UQ_transactions_refund_reference";
        `)
        await queryRunner.query(`
            ALTER TABLE "transactions"
            DROP COLUMN IF EXISTS "refunded_at",
            DROP COLUMN IF EXISTS "refund_reason",
            DROP COLUMN IF EXISTS "refund_reference";
        `)
        // PostgreSQL cannot remove one enum value safely without rebuilding the
        // type and every dependency, so `refunded` intentionally remains.
    }
}
