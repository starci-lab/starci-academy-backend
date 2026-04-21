import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ContentEntity,
} from "./content.entity"
import {
    ContentReferenceTranslationEntity,
} from "./content-reference-translation.entity"

/**
 * External URL reference attached to module content (e.g. docs, repos).
 */
@ObjectType({
    description: "External URL reference attached to module content.",
})
@Entity("content_references")
export class ContentReferenceEntity extends UuidAbstractEntity {
    /**
     * Human-readable link label (default locale); override per locale via `translations` field `alias`.
     */
    @Field(
        () => String,
        {
            description: "Human-readable link label; localized via translations (`field`: alias).",
        },
    )
    @Column({
        name: "alias",
        type: "varchar",
        length: 255,
    })
        alias: string

    /**
     * Target URL (same for all locales; not translated).
     */
    @Field(
        () => String,
        {
            description: "Target URL (not localized).",
        },
    )
    @Column({
        name: "url",
        type: "varchar",
        length: 2048,
    })
        url: string

    /**
     * Display order within the parent content reference list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the parent content reference list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this reference row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this reference row.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /**
     * Parent content this reference belongs to.
     */
    @Field(
        () => ContentEntity,
        {
            description: "Parent content this reference belongs to.",
        },
    )
    @ManyToOne(
        () => ContentEntity,
        (content: ContentEntity) => content.references,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName:
            "fk_content_id_content_references_contents",
    })
        content: ContentEntity

    /**
     * Parent content ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent content ID.",
        },
    )
    @RelationId(
        (ref: ContentReferenceEntity) => ref.content,
    )
        contentId: string

    /**
     */
    @Field(
        () => [ContentReferenceTranslationEntity],
        {
            description: "Localized overrides for the reference alias (`field`: alias).",
        },
    )
    @OneToMany(
        () => ContentReferenceTranslationEntity,
        (translation: ContentReferenceTranslationEntity) => translation.contentReference,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ContentReferenceTranslationEntity>
}
