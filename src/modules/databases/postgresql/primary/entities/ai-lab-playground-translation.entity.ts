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
    AiLabPlaygroundEntity,
} from "./ai-lab-playground.entity"

/**
 * Translation for AI Lab playground fields (label, description).
 * Primary key: (aiLabPlaygroundId, locale, field).
 */
@ObjectType({
    description: "Localized value for an AI Lab playground field.",
})
@Entity("ai_lab_playground_translations")
export class AiLabPlaygroundTranslationEntity extends AbstractEntity {
    /**
     * Target AI Lab playground ID.
     */
    @Field(
        () => String,
        {
            description: "Target AI Lab playground ID.",
        },
    )
    @PrimaryColumn({
        name: "ai_lab_playground_id",
        type: "uuid",
    })
        aiLabPlaygroundId: string

    /**
     * Locale of the translation (e.g. vi, en).
     */
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

    /**
     * Target field name being translated.
     */
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

    /**
     * Translated value for the field.
     */
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

    /**
     * Parent AI Lab playground.
     */
    @ManyToOne(
        () => AiLabPlaygroundEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "ai_lab_playground_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_ai_lab_playground_id_ai_lab_playground_translations_ai_lab_playgrounds",
    })
        playground: AiLabPlaygroundEntity
}
