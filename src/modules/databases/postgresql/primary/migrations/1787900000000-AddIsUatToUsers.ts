import type {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/** Adds the internal marker used to isolate and safely clean disposable UAT users. */
export class AddIsUatToUsers1787900000000 implements MigrationInterface {
    name = "AddIsUatToUsers1787900000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "is_uat" boolean NOT NULL DEFAULT false
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_users_is_uat"
            ON "users" ("is_uat")
            WHERE "is_uat" = true
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX IF EXISTS \"idx_users_is_uat\"")
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "is_uat"
        `)
    }
}
