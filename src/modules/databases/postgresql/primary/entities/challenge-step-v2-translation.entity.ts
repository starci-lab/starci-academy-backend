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
    GraphQLJSON,
} from "graphql-type-json"
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
 * Localized jsonb payload for a SCHEMA V2 step bucket. One row per (bucket × locale);
 * mirrors {@link ChallengeStepTranslationEntity} but the localized value is the whole step
 * jsonb `data` array instead of a per-field text value.
 */
@ObjectType({
    description: "Localized jsonb payload for a V2 step bucket.",
})
@Entity("challenge_step_v2_translations")
export class ChallengeStepV2TranslationEntity extends AbstractEntity {
    /**
     * Parent V2 step bucket id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_step_v2_id",
        type: "uuid",
    })
        challengeStepV2Id: string

    /**
     * Locale of this payload (composite PK part).
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
     * Localized step payload (array of items for this locale) stored as jsonb.
     */
    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "Localized step payload (array of items for this locale) stored as jsonb.",
        },
    )
    @Column({
        name: "data",
        type: "jsonb",
        nullable: true,
    })
        data: Array<Record<string, unknown>> | null

    /**
     * Parent V2 step bucket this translation belongs to.
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
        challengeStepV2: ChallengeStepV2Entity
}
