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
    AiModelEntity,
} from "./ai-model.entity"

/**
 * Translation entity for AI model catalog fields (label, description).
 * Primary key: (aiModelId, locale, field).
 */
@ObjectType({
    description: "Localized value for a specific AI model catalog field.",
})
@Entity("ai_model_translations")
export class AiModelTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target AI model ID.",
        },
    )
    @PrimaryColumn({
        name: "ai_model_id",
        type: "uuid",
    })
        aiModelId: string

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
            description: "Target field name being translated.",
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
        () => AiModelEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "ai_model_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_ai_model_id_ai_model_translations_ai_models",
    })
        aiModel: AiModelEntity
}
