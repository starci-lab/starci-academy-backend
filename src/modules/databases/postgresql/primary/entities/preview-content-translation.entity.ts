import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    PreviewContentEntity,
} from "./preview-content.entity.js"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Translation entity storing localized values for preview content fields.
 *
 * Each row represents:
 * (previewContentId, locale, field) -> translated value
 */
@ObjectType({
    description: "Localized value for a specific preview content field.",
})
@Entity("preview_content_translations")
@Index(
    "uq_preview_content_translation",
    [
        "previewContentId",
        "locale",
        "field",
    ],
    {
        unique: true,
    },
)
export class PreviewContentTranslationEntity extends UuidAbstractEntity {
    /**
     * Target preview content ID.
     */
    @Field(() => String)
    @Column({
        name: "preview_content_id",
        type: "varchar",
        length: 255,
    })
        previewContentId: string

    /**
     * Locale of the translation (e.g., vi, en).
     */
    @Field(() => GraphQLTypeLocale)
    @Column({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    /**
     * Target field name being translated (e.g., data).
     */
    @Field(() => String)
    @Column({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    /**
     * Translated value for the field.
     */
    @Field(() => String)
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    /**
     * Reference to the parent preview content.
     * Cascade delete ensures translations are removed when preview content is deleted.
     */
    @ManyToOne(
        () => PreviewContentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "preview_content_id",
        referencedColumnName: "id",
    })
        previewContent: PreviewContentEntity
}

