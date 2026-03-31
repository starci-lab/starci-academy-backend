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
    ContentEntity,
} from "./content.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Translation entity storing localized values for content fields.
 *
 * Each row represents:
 * (contentId, locale, field) -> translated value
 */
@ObjectType({
    description: "Localized value for a specific content field.",
})
@Entity("content_translations")
@Index(
    "uq_content_translation",
    [
        "contentId",
        "locale",
        "field",
    ],
    {
        unique: true,
    },
)
export class ContentTranslationEntity extends UuidAbstractEntity {
    /**
     * Target content ID.
     */
    @Field(
        () => String,
        {
            description: "Target content ID.",
        },
    )
    @Column({
        name: "content_id",
        type: "varchar",
        length: 255,
    })
        contentId: string

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
     * Target field name being translated (e.g., title, body).
     */
    @Field(
        () => String,
        {
            description: "Target field name being translated.",
        },
    )
    @Column({
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
     * Reference to the parent content.
     * Cascade delete ensures translations are removed when content is deleted.
     */
    @ManyToOne(
        () => ContentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        referencedColumnName: "id",
    })
        content: ContentEntity
}

