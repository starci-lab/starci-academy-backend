import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    GraphQLTypeSubmissionType,
    SubmissionType,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ChallengeEntity,
} from "./challenge.entity"
import {
    ChallengeSubmissionTranslationEntity,
} from "./challenge-submission-translation.entity"
import {
    UserChallengeSubmissionEntity,
} from "./user-challenge-submission.entity"
import {
    ChallengeSubmissionPromptEntity,
} from "./challenge-submission-prompt.entity"
import {
    ResourceEntity,
} from "./resource.entity"
import {
    JobEntity,
} from "./job.entity"

@ObjectType(
    "Submission",
    {
        description: "A submission requirement attached to a challenge (e.g. Google Docs or GitHub URL).",
    },
)
@Entity("challenge_submissions")
export class ChallengeSubmissionEntity extends UuidAbstractEntity {
    @Field(
        () => GraphQLTypeSubmissionType,
        {
            description: "Submission type (Google Docs / GitHub URL).",
        },
    )
    @Column({
        name: "type",
        type: "enum",
        enum: SubmissionType,
        enumName: "submission_type",
    })
        type: SubmissionType

    @Field(
        () => String,
        {
            description: "Submission title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
    })
        title: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional submission description/instructions.",
        },
    )
    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
        description: string | null

    @Field(
        () => Int,
        {
            description: "Points / weight for this submission requirement (course config).",
        },
    )
    @Column({
        name: "score",
        type: "int",
        default: 0,
    })
        score: number

    @Field(
        () => Int,
        {
            description: "Display order within the challenge submission list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
    })
        orderIndex: number

    @Field(
        () => ChallengeEntity,
        {
            description: "Parent challenge this submission belongs to.",
        },
    )
    @ManyToOne(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.submissions,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
        foreignKeyConstraintName:
            "fk_challenge_id_challenge_submissions_challenges",
    })
        challenge: ChallengeEntity

    @RelationId(
        (s: ChallengeSubmissionEntity) => s.challenge,
    )
        challengeId: string

    @Field(
        () => [ChallengeSubmissionTranslationEntity],
        {
            nullable: true,
            description: "Localized overrides for submission fields (e.g. name, description).",
        },
    )
    @OneToMany(
        () => ChallengeSubmissionTranslationEntity,
        (translation: ChallengeSubmissionTranslationEntity) => translation.challengeSubmission,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengeSubmissionTranslationEntity>

    @Field(
        () => [UserChallengeSubmissionEntity],
        {
            nullable: true,
            description: "User-to-submission join rows.",
        },
    )
    @OneToMany(
        () => UserChallengeSubmissionEntity,
        (userSubmission: UserChallengeSubmissionEntity) => userSubmission.submission,
        {
            cascade: true,
        },
    )
        userSubmissions: Array<UserChallengeSubmissionEntity>

    @OneToMany(
        () => ChallengeSubmissionPromptEntity,
        (prompt: ChallengeSubmissionPromptEntity) => prompt.challengeSubmission,
        {
            cascade: true,
        },
    )
        prompts: Array<ChallengeSubmissionPromptEntity>

    @Field(
        () => [ResourceEntity],
        {
            nullable: true,
            description: "Resources (git URLs or folder paths) attached to this submission requirement.",
        },
    )
    @OneToMany(
        () => ResourceEntity,
        (resource: ResourceEntity) => resource.challengeSubmission,
        {
            cascade: true,
        },
    )
        resources: Array<ResourceEntity>

    @Field(
        () => [JobEntity],
        {
            nullable: true,
            description: "Worker jobs associated with this submission requirement.",
        },
    )
    @OneToMany(
        () => JobEntity,
        (job: JobEntity) => job.challengeSubmission,
    )
        jobs: Array<JobEntity>

    // graphql only fields, not stored in the database
    @Field(
        () => UserChallengeSubmissionEntity,
        {
            nullable: true,
            description: "The last user submission for this challenge submission.",
        },
    )
        userSubmission?: UserChallengeSubmissionEntity
}

