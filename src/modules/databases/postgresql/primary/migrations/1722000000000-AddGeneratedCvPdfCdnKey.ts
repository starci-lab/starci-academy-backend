import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `generated_pdf_cdn_key` to `cv_generations` — the MinIO object key of the
 * PDF produced by compiling a `Generated`-source CV's `.tex` with `tectonic`
 * (server-side). Nullable: rows created before this pass, `Uploaded`-source
 * rows, and `Generated` rows whose compile step failed (degrades gracefully to
 * the raw `.tex` download) all leave it `null`.
 *
 * Dev runs schema via `synchronize`; this migration applies the same change
 * where `synchronize` is disabled (prod). Guarded / idempotent.
 */
export class AddGeneratedCvPdfCdnKey1722000000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddGeneratedCvPdfCdnKey1722000000000"

    /**
     * Forward migration: add the nullable `generated_pdf_cdn_key` column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cv_generations"
                ADD COLUMN IF NOT EXISTS "generated_pdf_cdn_key" varchar(2048);
        `)
    }

    /**
     * Reverse migration: drop the added column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cv_generations"
                DROP COLUMN IF EXISTS "generated_pdf_cdn_key";
        `)
    }
}
