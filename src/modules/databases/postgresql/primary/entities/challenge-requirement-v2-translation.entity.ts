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
    ChallengeRequirementV2Entity,
} from "./challenge-requirement-v2.entity"

/**
 * Localized jsonb payload for a SCHEMA V2 requirement bucket. One row per (bucket × locale);
 * mirrors {@link ChallengeRequirementTranslationEntity} but the localized value is the whole
 * requirement jsonb `data` array instead of a per-field text value.
 */
@ObjectType({
    description: "Localized jsonb payload for a V2 requirement bucket.",
})
@Entity("challenge_requirement_v2_translations")
export class ChallengeRequirementV2TranslationEntity extends AbstractEntity {
    /**
     * Parent V2 requirement bucket id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_requirement_v2_id",
        type: "uuid",
    })
        challengeRequirementV2Id: string

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
     * Localized requirement payload (array of items for this locale) stored as jsonb.
     */
    @Field(
        () => GraphQLJSON,
        {
            nullable: true,
            description: "Localized requirement payload (array of items for this locale) stored as jsonb.",
        },
    )
    @Column({
        name: "data",
        type: "jsonb",
        nullable: true,
    })
        data: Array<Record<string, unknown>> | null

    /**
     * Parent V2 requirement bucket this translation belongs to.
     */
    @ManyToOne(
        () => ChallengeRequirementV2Entity,
        (requirementV2: ChallengeRequirementV2Entity) => requirementV2.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_requirement_v2_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_req_v2_translation_challenge_requirements_v2",
    })
        challengeRequirementV2: ChallengeRequirementV2Entity
}
