import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/** Creates the course-independent V1 concept lesson tables. */
export class CreateConcepts1788400000000 implements MigrationInterface {
    name = "CreateConcepts1788400000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "concepts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "display_id" varchar(255) NOT NULL,
                "title" varchar(500) NOT NULL,
                "description" text NOT NULL,
                "category" varchar(128) NOT NULL,
                "difficulty" varchar(32) NOT NULL,
                "minutes_read" integer NOT NULL DEFAULT 0,
                "implementation" varchar(64) NOT NULL,
                "order_index" integer NOT NULL DEFAULT 0,
                "sort_index" integer NOT NULL DEFAULT 0,
                "body" text,
                "learning_outcomes" jsonb,
                "prerequisites" jsonb,
                "references" jsonb,
                "workspace" jsonb,
                "activities" jsonb,
                CONSTRAINT "pk_concepts" PRIMARY KEY ("id"),
                CONSTRAINT "uq_concepts_display_id" UNIQUE ("display_id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "concept_translations" (
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "concept_id" uuid NOT NULL,
                "locale" "locale" NOT NULL,
                "title" varchar(500) NOT NULL,
                "description" text NOT NULL,
                "body" text,
                "learning_outcomes" jsonb,
                "prerequisites" jsonb,
                "references" jsonb,
                "activities" jsonb,
                CONSTRAINT "pk_concept_translations" PRIMARY KEY ("concept_id", "locale"),
                CONSTRAINT "fk_concept_id_concept_translations_concepts"
                    FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE
            )
        `)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "concept_sections" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "concept_id" uuid NOT NULL,
                "display_id" varchar(255) NOT NULL,
                "title" varchar(500) NOT NULL,
                "phase" varchar(32) NOT NULL,
                "body" text NOT NULL,
                "order_index" integer NOT NULL DEFAULT 0,
                "sort_index" integer NOT NULL DEFAULT 0,
                "activities" jsonb,
                CONSTRAINT "pk_concept_sections" PRIMARY KEY ("id"),
                CONSTRAINT "fk_concept_id_concept_sections_concepts"
                    FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE,
                CONSTRAINT "uq_concept_sections_concept_display_id"
                    UNIQUE ("concept_id", "display_id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "concept_section_translations" (
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "concept_section_id" uuid NOT NULL,
                "locale" "locale" NOT NULL,
                "title" varchar(500) NOT NULL,
                "body" text NOT NULL,
                "activities" jsonb,
                CONSTRAINT "pk_concept_section_translations"
                    PRIMARY KEY ("concept_section_id", "locale"),
                CONSTRAINT "fk_concept_section_id_concept_section_translations_sections"
                    FOREIGN KEY ("concept_section_id") REFERENCES "concept_sections"("id")
                    ON DELETE CASCADE
            )
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE IF EXISTS \"concept_section_translations\"")
        await queryRunner.query("DROP TABLE IF EXISTS \"concept_sections\"")
        await queryRunner.query("DROP TABLE IF EXISTS \"concept_translations\"")
        await queryRunner.query("DROP TABLE IF EXISTS \"concepts\"")
    }
}
