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
    ChallengeStepV2Entity,
} from "./challenge-step-v2.entity"

/**
 * Per-locale title for a SCHEMA V2 step item (normalized — no jsonb). One row per (step item × locale).
 */
@ObjectType({
    description: "Per-locale title for a V2 step item.",
})
@Entity("challenge_step_v2_translations")
export class ChallengeStepV2TranslationEntity extends AbstractEntity {
    /**
     * Parent step item id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_step_v2_id",
        type: "uuid",
    })
        challengeStepV2Id: string

    /**
     * Locale of this title (composite PK part).
     */
    @Field(() => GraphQLTypeLocale)
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    /**
     * Localized step title.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Localized step title.",
        },
    )
    @Column({
        name: "title",
        type: "text",
        nullable: true,
    })
        title: string | null

    /**
     * Parent step item this title belongs to.
     */
    @ManyToOne(
        () => ChallengeStepV2Entity,
        (stepV2: ChallengeStepV2Entity) => stepV2.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_step_v2_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_step_v2_translation_challenge_steps_v2",
    })
        stepV2: ChallengeStepV2Entity
}
