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
    ChallengePrerequisiteV2Entity,
} from "./challenge-prerequisite-v2.entity"

/**
 * Localized jsonb payload for a SCHEMA V2 prerequisite bucket. One row per (bucket × locale);
 * mirrors {@link ChallengePrerequisiteTranslationEntity} but the localized value is the whole
 * prerequisite jsonb `data` array instead of a per-field text value.
 */
@ObjectType({
    description: "Localized jsonb payload for a V2 prerequisite bucket.",
})
@Entity("challenge_prerequisite_v2_translations")
export class ChallengePrerequisiteV2TranslationEntity extends AbstractEntity {
    /**
     * Parent V2 prerequisite bucket id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_prerequisite_v2_id",
        type: "uuid",
    })
        challengePrerequisiteV2Id: string

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
     * Localized prerequisite payload (array of items for this locale) stored as jsonb.
     */
    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "Localized prerequisite payload (array of items for this locale) stored as jsonb.",
        },
    )
    @Column({
        name: "data",
        type: "jsonb",
        nullable: true,
    })
        data: Array<Record<string, unknown>> | null

    /**
     * Parent V2 prerequisite bucket this translation belongs to.
     */
    @ManyToOne(
        () => ChallengePrerequisiteV2Entity,
        (prerequisiteV2: ChallengePrerequisiteV2Entity) => prerequisiteV2.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_prerequisite_v2_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_prereq_v2_translation_challenge_prerequisites_v2",
    })
        challengePrerequisiteV2: ChallengePrerequisiteV2Entity
}
