import type {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/** Adds an optional visual preview for each course-owned Playground hub. */
export class AddPlaygroundPreviewImageToCourses1788000000000 implements MigrationInterface {
    name = "AddPlaygroundPreviewImageToCourses1788000000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "courses"
            ADD COLUMN IF NOT EXISTS "playground_preview_image_url" varchar(2048)
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "courses"
            DROP COLUMN IF EXISTS "playground_preview_image_url"
        `)
    }
}
