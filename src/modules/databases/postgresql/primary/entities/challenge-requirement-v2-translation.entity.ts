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
    ChallengeRequirementV2Entity,
} from "./challenge-requirement-v2.entity"

/**
 * Per-locale title for a SCHEMA V2 requirement item (normalized — no jsonb). The requirement title
 * is agnostic across programming languages, so it is localized here at the item level. One row per
 * (requirement item × locale).
 */
@ObjectType({
    description: "Per-locale title for a V2 requirement item.",
})
@Entity("challenge_requirement_v2_translations")
export class ChallengeRequirementV2TranslationEntity extends AbstractEntity {
    /**
     * Parent requirement item id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_requirement_v2_id",
        type: "uuid",
    })
        challengeRequirementV2Id: string

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
     * Localized requirement title.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Localized requirement title.",
        },
    )
    @Column({
        name: "title",
        type: "text",
        nullable: true,
    })
        title: string | null

    /**
     * Parent requirement item this title belongs to.
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
        requirementV2: ChallengeRequirementV2Entity
}
