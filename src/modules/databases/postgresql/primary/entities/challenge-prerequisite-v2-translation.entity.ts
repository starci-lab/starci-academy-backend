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
    ChallengePrerequisiteV2Entity,
} from "./challenge-prerequisite-v2.entity"

/**
 * Per-locale title for a SCHEMA V2 prerequisite item (normalized — no jsonb). Usually empty (kept
 * for table uniformity). One row per (prerequisite item × locale).
 */
@ObjectType({
    description: "Per-locale title for a V2 prerequisite item.",
})
@Entity("challenge_prerequisite_v2_translations")
export class ChallengePrerequisiteV2TranslationEntity extends AbstractEntity {
    /**
     * Parent prerequisite item id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_prerequisite_v2_id",
        type: "uuid",
    })
        challengePrerequisiteV2Id: string

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
     * Localized prerequisite title (usually null).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Localized prerequisite title (usually null).",
        },
    )
    @Column({
        name: "title",
        type: "text",
        nullable: true,
    })
        title: string | null

    /**
     * Parent prerequisite item this title belongs to.
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
        prerequisiteV2: ChallengePrerequisiteV2Entity
}
