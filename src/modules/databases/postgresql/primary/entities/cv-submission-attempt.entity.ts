import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    CvSubmissionStatus,
    GraphQLTypeCvSubmissionStatus,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CVSubmissionEntity,
} from "./cv-submission.entity"

@ObjectType({
    description: "A versioned upload attempt for a CV submission.",
})
@Entity("cv_submission_attempts")
export class CVSubmissionAttemptEntity extends UuidAbstractEntity {
    @Field(
        () => String,
        {
            description: "MinIO object key of this uploaded CV version.",
        },
    )
    @Column({
        name: "file_url",
        type: "varchar",
        length: 2048,
    })
        fileUrl: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Extracted plain text from this file version.",
        },
    )
    @Column({
        name: "original_text",
        type: "text",
        nullable: true,
    })
        originalText: string | null

    @Field(
        () => GraphQLTypeCvSubmissionStatus,
        {
            description: "Processing status of this version.",
        },
    )
    @Column({
        name: "status",
        type: "enum",
        enum: CvSubmissionStatus,
        enumName: "cv_submission_status",
        default: CvSubmissionStatus.Pending,
    })
        status: CvSubmissionStatus

    @Field(
        () => Int,
        {
            description: "Version number within one CV submission.",
        },
    )
    @Column({
        name: "attempt_number",
        type: "int",
    })
        attemptNumber: number

    @Field(
        () => Date,
        {
            nullable: true,
            description: "When this attempt finished processing.",
        },
    )
    @Column({
        name: "processed_at",
        type: "timestamptz",
        nullable: true,
    })
        processedAt: Date | null

    @Field(
        () => CVSubmissionEntity,
        {
            description: "Parent CV submission.",
        },
    )
    @ManyToOne(
        () => CVSubmissionEntity,
        (cvSubmission: CVSubmissionEntity) => cvSubmission.attempts,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "cv_submission_id",
        foreignKeyConstraintName: "fk_cv_submission_id_cv_submission_attempts_cv_submissions",
    })
        cvSubmission: CVSubmissionEntity

    @Field(
        () => ID,
        {
            description: "Parent CV submission ID.",
        },
    )
    @RelationId(
        (attempt: CVSubmissionAttemptEntity) => attempt.cvSubmission,
    )
        cvSubmissionId: string

}
