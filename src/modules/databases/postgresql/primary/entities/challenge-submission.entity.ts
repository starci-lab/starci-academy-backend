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
            description: "Submission name/title.",
        },
    )
    @Column({
        name: "name",
        type: "varchar",
        length: 500,
    })
        name: string

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
    })
        challenge: ChallengeEntity

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

