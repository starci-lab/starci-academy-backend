import type {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/** Adds the persistent per-notification cursor used by the social digest cron. */
export class AddNotificationDigestCursor1726800000000 implements MigrationInterface {
    name = "AddNotificationDigestCursor1726800000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD COLUMN IF NOT EXISTS "digest_sent_at" timestamptz
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_notifications_digest_pending"
            ON "notifications" ("created_at", "user_id")
            WHERE "digest_sent_at" IS NULL
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX IF EXISTS \"idx_notifications_digest_pending\"")
        await queryRunner.query(`
            ALTER TABLE "notifications"
            DROP COLUMN IF EXISTS "digest_sent_at"
        `)
    }
}
