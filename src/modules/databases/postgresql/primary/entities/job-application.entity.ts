import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    GraphQLTypeJobApplicationStatus,
    JobApplicationStatus,
} from "../enums/job-application-status"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    JobPostingEntity,
} from "./job-posting.entity"
import {
    UserEntity,
} from "./user.entity"

@ObjectType({
    description: "A learner's internal application to one job posting.",
})
@Entity("job_applications")
@Unique("UQ_job_applications_job_applicant",
    [
        "jobPosting",
        "applicant",
    ])
@Index(["jobPosting"])
@Index(["applicant"])
/** Persisted application visible to the applicant and the posting owner. */
export class JobApplicationEntity extends UuidAbstractEntity {
    @ManyToOne(
        () => JobPostingEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "job_posting_id",
        foreignKeyConstraintName: "fk_job_applications_job_posting",
    })
        jobPosting: JobPostingEntity

    @Field(() => ID)
    @RelationId((application: JobApplicationEntity) => application.jobPosting)
        jobPostingId: string

    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "applicant_user_id",
        foreignKeyConstraintName: "fk_job_applications_applicant_user",
    })
    @Field(() => UserEntity)
        applicant: UserEntity

    @Field(() => ID)
    @RelationId((application: JobApplicationEntity) => application.applicant)
        applicantId: string

    @Field(() => String,
        {
            nullable: true,
        })
    @Column({
        name: "cover_letter",
        type: "text",
        nullable: true,
    })
        coverLetter: string | null

    @Field(() => GraphQLTypeJobApplicationStatus)
    @Column({
        name: "status",
        type: "varchar",
        length: 32,
        default: JobApplicationStatus.Submitted,
    })
        status: JobApplicationStatus
}
