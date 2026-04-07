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
    ChallengeSubmissionPromptEntity,
} from "./challenge-submission-prompt.entity"

/**
 * Localized title/text for a challenge submission prompt (e.g. for `title` and `text` fields).
 * Primary key: (challengeSubmissionPromptId, locale, field).
 */
@ObjectType({
    description: "Localized value for a challenge submission grading prompt field.",
})
@Entity("challenge_submission_prompt_translations")
export class ChallengeSubmissionPromptTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target challenge submission prompt ID.",
        },
    )
    @PrimaryColumn({
        name: "challenge_submission_prompt_id",
        type: "uuid",
    })
        challengeSubmissionPromptId: string

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
            description: "Target field name being translated (e.g. title, text).",
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
        () => ChallengeSubmissionPromptEntity,
        (prompt: ChallengeSubmissionPromptEntity) => prompt.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_submission_prompt_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_challenge_submission_prompt_id_challenge_submission_prompt_translations_challenge_submission_prompts",
    })
        challengeSubmissionPrompt: ChallengeSubmissionPromptEntity
}
