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
    ChallengeOutputV2Entity,
} from "./challenge-output-v2.entity"

/**
 * Localized jsonb payload for a SCHEMA V2 output bucket. One row per (bucket × locale);
 * mirrors {@link ChallengeOutputTranslationEntity} but the localized value is the whole output
 * jsonb `data` array instead of a per-field text value.
 */
@ObjectType({
    description: "Localized jsonb payload for a V2 output bucket.",
})
@Entity("challenge_output_v2_translations")
export class ChallengeOutputV2TranslationEntity extends AbstractEntity {
    /**
     * Parent V2 output bucket id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_output_v2_id",
        type: "uuid",
    })
        challengeOutputV2Id: string

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
     * Localized output payload (array of items for this locale) stored as jsonb.
     */
    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "Localized output payload (array of items for this locale) stored as jsonb.",
        },
    )
    @Column({
        name: "data",
        type: "jsonb",
        nullable: true,
    })
        data: Array<Record<string, unknown>> | null

    /**
     * Parent V2 output bucket this translation belongs to.
     */
    @ManyToOne(
        () => ChallengeOutputV2Entity,
        (outputV2: ChallengeOutputV2Entity) => outputV2.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_output_v2_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_output_v2_translation_challenge_outputs_v2",
    })
        challengeOutputV2: ChallengeOutputV2Entity
}
