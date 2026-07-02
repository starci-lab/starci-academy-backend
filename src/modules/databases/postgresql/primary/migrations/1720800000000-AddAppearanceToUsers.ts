import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds the appearance-customization columns on `users`: `accent_color`
 * (nullable hex string; null = default brand accent) and `background_effect`
 * (new `background_effect` enum, default `none`) — the Settings → "Giao diện"
 * picker. Independent of light/dark mode, which stays on `next-themes` client-side.
 *
 * Dev runs schema via `synchronize`; this migration applies the same change
 * where `synchronize` is disabled (prod). Idempotent.
 */
export class AddAppearanceToUsers1720800000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddAppearanceToUsers1720800000000"

    /**
     * Forward migration: create the `background_effect` enum, then add both columns.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'background_effect') THEN
                    CREATE TYPE "background_effect" AS ENUM (
                        'none', 'ember', 'wave', 'snow', 'rain',
                        'bubbles', 'fireflies', 'stars', 'aurora', 'circuit'
                    );
                END IF;
            END
            $$;
        `)

        // default = 'ember' (the pre-existing always-on ember background) so
        // existing users see no change until they opt into something else
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "accent_color" varchar(9),
            ADD COLUMN IF NOT EXISTS "background_effect" "background_effect" NOT NULL DEFAULT 'ember';
        `)
    }

    /**
     * Reverse migration: drop both columns, then the enum type.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "accent_color",
            DROP COLUMN IF EXISTS "background_effect";
        `)
        await queryRunner.query("DROP TYPE IF EXISTS \"background_effect\";")
    }
}
