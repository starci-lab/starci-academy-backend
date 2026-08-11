import type {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/** Adds StarCi-hosted applications while preserving external/email postings. */
export class AddInternalJobApplications1726700000000 implements MigrationInterface {
    name = "AddInternalJobApplications1726700000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TYPE \"job_apply_method\" ADD VALUE IF NOT EXISTS 'internal'")
        await queryRunner.query(`
            CREATE TABLE "job_applications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "job_posting_id" uuid NOT NULL,
                "applicant_user_id" uuid NOT NULL,
                "cover_letter" text,
                "status" varchar(32) NOT NULL DEFAULT 'submitted',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_job_applications" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_job_applications_job_applicant" UNIQUE ("job_posting_id", "applicant_user_id"),
                CONSTRAINT "fk_job_applications_job_posting" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_job_applications_applicant_user" FOREIGN KEY ("applicant_user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `)
        await queryRunner.query("CREATE INDEX \"IDX_job_applications_job_posting\" ON \"job_applications\" (\"job_posting_id\")")
        await queryRunner.query("CREATE INDEX \"IDX_job_applications_applicant\" ON \"job_applications\" (\"applicant_user_id\")")
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE \"job_applications\"")
        // PostgreSQL cannot remove one enum value safely; the additive value remains.
    }
}
