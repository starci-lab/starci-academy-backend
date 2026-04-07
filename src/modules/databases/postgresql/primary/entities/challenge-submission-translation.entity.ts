import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    AbstractEntity,
} from "./abstract"
import {
    ChallengeSubmissionEntity,
} from "./challenge-submission.entity"

/**
 * Translation for challenge submission fields (e.g. name, description). URL is not translated.
 * Primary key: (challengeSubmissionId, locale, field).
 */
@ObjectType({
    description: "Localized value for a challenge submission field (e.g. name, description).",
})
@Entity("challenge_submission_translations")
export class ChallengeSubmissionTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target challenge submission ID.",
        },
    )
    @PrimaryColumn({
        name: "challenge_submission_id",
        type: "uuid",
    })
        challengeSubmissionId: string

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale of the translation (e.g. vi, en).",
        },
    )
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    @Field(
        () => String,
        {
            description: "Target field name being translated.",
        },
    )
    @PrimaryColumn({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    @Field(
        () => String,
        {
            description: "Translated value for the field.",
        },
    )
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    @ManyToOne(
        () => ChallengeSubmissionEntity,
        (submission: ChallengeSubmissionEntity) => submission.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_submission_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_challenge_submission_id_challenge_submission_translations_challenge_submissions",
    })
        challengeSubmission: ChallengeSubmissionEntity
}
