import type {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Add `cv_blocks.tex_source` (text, nullable) -- the user-editable LaTeX source a
 * CV's PDF is compiled from (full-LaTeX pivot 2026-07-18).
 *
 * Dev runs schema via `synchronize`; this migration applies the same change
 * where `synchronize` is disabled (prod). Guarded / idempotent.
 */
export class AddCvBlocksTexSource1725000000000 implements MigrationInterface {
    name = "AddCvBlocksTexSource1725000000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"cv_blocks\" ADD COLUMN IF NOT EXISTS \"tex_source\" text;",
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"cv_blocks\" DROP COLUMN IF EXISTS \"tex_source\";",
        )
    }
}
