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
    ContentEngagementProjectionEntity,
} from "./content-engagement-projection.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Localized overrides for {@link ContentEngagementProjectionEntity} fields.
 *
 * Each row: (contentId, locale, field) -> translated value. The projection is
 * numeric-only today so this table starts EMPTY — it exists so any future
 * display text on the projection can be localized without a schema change.
 * Composite primary key (contentId, locale, field).
 */
@ObjectType({
    description: "Localized value for a content-engagement projection field.",
})
@Entity("content_engagement_projection_translations")
export class ContentEngagementProjectionTranslationEntity extends AbstractEntity {
    /** Target projection natural key (content id) — part of the composite PK. */
    @Field(
        () => String,
        {
            description: "Target content id.",
        },
    )
    @PrimaryColumn({
        name: "content_id",
        type: "uuid",
    })
        contentId: string

    /** Locale of the translation (e.g. vi, en). */
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

    /** Target field name being translated. */
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

    /** Translated value for the field. */
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

    /** Parent projection row (cascade-deleted with it). */
    @ManyToOne(
        () => ContentEngagementProjectionEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        referencedColumnName: "contentId",
        foreignKeyConstraintName: "fk_content_id_content_engagement_projection_translations",
    })
        contentEngagementProjection: ContentEngagementProjectionEntity
}
