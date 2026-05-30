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
    ChallengeOutputV2Entity,
} from "./challenge-output-v2.entity"

/**
 * Per-locale title for a SCHEMA V2 output item (normalized — no jsonb). Outputs have no title, so
 * this is usually empty; kept for table uniformity. One row per (output item × locale).
 */
@ObjectType({
    description: "Per-locale title for a V2 output item.",
})
@Entity("challenge_output_v2_translations")
export class ChallengeOutputV2TranslationEntity extends AbstractEntity {
    /**
     * Parent output item id (composite PK part).
     */
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_output_v2_id",
        type: "uuid",
    })
        challengeOutputV2Id: string

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
     * Localized output title (usually null).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Localized output title (usually null).",
        },
    )
    @Column({
        name: "title",
        type: "text",
        nullable: true,
    })
        title: string | null

    /**
     * Parent output item this title belongs to.
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
        outputV2: ChallengeOutputV2Entity
}
