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
    AbstractEntity,
} from "./abstract"
import {
    PreviewContentEntity,
} from "./preview-content.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Translation entity for preview content fields.
 * Primary key: (previewContentId, locale, field).
 */
@ObjectType({
    description: "Localized value for a specific preview content field.",
})
@Entity("preview_content_translations")
export class PreviewContentTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target preview content ID.",
        },
    )
    @PrimaryColumn({
        name: "preview_content_id",
        type: "uuid",
    })
        previewContentId: string

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
        () => PreviewContentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "preview_content_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_preview_content_id_preview_content_translations_preview_contents",
    })
        previewContent: PreviewContentEntity
}
