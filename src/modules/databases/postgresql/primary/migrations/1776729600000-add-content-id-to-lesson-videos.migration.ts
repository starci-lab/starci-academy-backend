import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

export class AddContentIdToLessonVideos1776729600000 implements MigrationInterface {
    public name = "AddContentIdToLessonVideos1776729600000"

    public async up(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"lesson_videos\" ADD COLUMN \"content_id\" uuid",
        )
        await queryRunner.query(
            "ALTER TABLE \"lesson_videos\" ADD CONSTRAINT \"fk_content_id_lesson_videos_contents\" FOREIGN KEY (\"content_id\") REFERENCES \"contents\"(\"id\") ON DELETE SET NULL ON UPDATE NO ACTION",
        )
    }

    public async down(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"lesson_videos\" DROP CONSTRAINT \"fk_content_id_lesson_videos_contents\"",
        )
        await queryRunner.query(
            "ALTER TABLE \"lesson_videos\" DROP COLUMN \"content_id\"",
        )
    }
}