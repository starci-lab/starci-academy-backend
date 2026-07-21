import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds the CHALLENGE anchor to content-AI sessions: `origin_challenge_id`
 * (nullable, FK → challenges) so a challenge-scope conversation persists alongside
 * content / task / foundation / course sessions. Additive + nullable only.
 *
 * Dev + prod run schema via TypeORM `synchronize` (which applies the entity change
 * at boot); this migration exists so the SAME change applies deterministically
 * where `synchronize` is off. Nullable, no PG enum — synchronize-safe. Idempotent.
 */
export class AddChallengeAnchorToContentAiSessions1724300000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddChallengeAnchorToContentAiSessions1724300000000"

    /**
     * Forward migration: add the nullable `origin_challenge_id` column + FK + index.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
                ADD COLUMN IF NOT EXISTS "origin_challenge_id" uuid;
        `)
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "content_ai_sessions"
                ADD CONSTRAINT "fk_origin_challenge_id_content_ai_sessions_challenges"
                FOREIGN KEY ("origin_challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE;
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_content_ai_sessions_origin_challenge_id"
            ON "content_ai_sessions" ("origin_challenge_id");
        `)
    }

    /**
     * Reverse migration: drop the index, FK and column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_content_ai_sessions_origin_challenge_id";`)
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
            DROP CONSTRAINT IF EXISTS "fk_origin_challenge_id_content_ai_sessions_challenges";
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions" DROP COLUMN IF EXISTS "origin_challenge_id";
        `)
    }
}
