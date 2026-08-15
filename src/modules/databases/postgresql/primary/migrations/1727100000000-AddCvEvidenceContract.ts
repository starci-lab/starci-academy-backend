import type {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/** Add the explicit target bar and immutable selected-capstone snapshot to CV runs. */
export class AddCvEvidenceContract1727100000000 implements MigrationInterface {
    name = "AddCvEvidenceContract1727100000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cv_generations"
            ADD COLUMN IF NOT EXISTS "target_level" varchar(16) NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "cv_generations"
            ADD COLUMN IF NOT EXISTS "selected_evidence" jsonb NULL
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cv_generations"
            DROP COLUMN IF EXISTS "selected_evidence"
        `)
        await queryRunner.query(`
            ALTER TABLE "cv_generations"
            DROP COLUMN IF EXISTS "target_level"
        `)
    }
}
